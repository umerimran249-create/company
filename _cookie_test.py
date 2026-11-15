import json, os, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
OUT = os.path.dirname(os.path.abspath(__file__))
KEY = "astra-cookie-consent"
results = []
errors = []


def check(name, ok, info=""):
    results.append((name, bool(ok), info))
    print(("PASS " if ok else "FAIL ") + name + ("  " + str(info) if info else ""), flush=True)


def new_page(browser, width, height, theme, font=0):
    ctx = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
    init = "if(!localStorage.getItem('astra-theme'))localStorage.setItem('astra-theme','%s');" % theme
    if font:
        init += "if(!localStorage.getItem('astra-a11y'))localStorage.setItem('astra-a11y',JSON.stringify({font:%d}));" % font
    ctx.add_init_script(init)
    page = ctx.new_page()
    tag = "%dx%d/%s" % (width, height, theme)
    page.on("console", lambda m: m.type == "error" and errors.append((tag, page.url, m.text)))
    page.on("pageerror", lambda e: errors.append((tag, page.url, "PAGEERROR " + str(e))))
    return ctx, page


def goto(page, path):
    page.goto(BASE + path, wait_until="domcontentloaded", timeout=90000)
    try:
        page.wait_for_load_state("load", timeout=30000)
    except Exception:
        pass
    page.wait_for_timeout(3000)


def banner_visible(page):
    return page.evaluate("() => { const b = document.getElementById('astra-cookie'); return !!(b && !b.hidden && b.getClientRects().length); }")


def stored(page):
    return page.evaluate("k => JSON.parse(localStorage.getItem(k) || 'null')", KEY)


def layout(page):
    return page.evaluate("""() => {
      const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return {top: b.top, bottom: b.bottom, left: b.left, right: b.right, h: b.height}; };
      const de = document.documentElement;
      return {
        banner: r(document.getElementById('astra-cookie')),
        theme: r(document.getElementById('astra-theme-toggle')),
        open: r(document.getElementById('astra-open')),
        vw: window.innerWidth, vh: window.innerHeight,
        scrollW: Math.max(de.scrollWidth, document.body.scrollWidth), clientW: de.clientWidth,
        bannerBg: document.getElementById('astra-cookie') && getComputedStyle(document.getElementById('astra-cookie')).backgroundColor,
        dataTheme: de.getAttribute('data-theme'),
        role: document.getElementById('astra-cookie') && document.getElementById('astra-cookie').getAttribute('role'),
        label: document.getElementById('astra-cookie') && document.getElementById('astra-cookie').getAttribute('aria-label'),
      };
    }""")


def no_overlap(l):
    b = l["banner"]
    fabs = [l["theme"], l["open"]]
    return all(f and f["bottom"] <= b["top"] + 0.5 for f in fabs)


def active_info(page):
    return page.evaluate("""() => { const a = document.activeElement; const m = document.getElementById('astra-cookie-modal');
      return {inside: !!(m && m.contains(a)), id: a && a.id, text: a && (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 40), tag: a && a.tagName, action: a && a.getAttribute('data-cookie-action')}; }""")


with sync_playwright() as pw:
    browser = pw.chromium.launch()

    # 1. First visit: banner, layout, screenshots for each viewport/theme
    for (w, h, theme, shot) in [
        (1440, 900, "dark", "_cookie_desktop_dark.png"),
        (1440, 900, "light", "_cookie_desktop_light.png"),
        (390, 844, "dark", "_cookie_mobile_dark.png"),
        (390, 844, "light", "_cookie_mobile_light.png"),
    ]:
        ctx, page = new_page(browser, w, h, theme)
        goto(page, "/about/")
        tag = "%d %s" % (w, theme)
        check(tag + " banner visible on first visit", banner_visible(page))
        l = layout(page)
        check(tag + " region role/label", l["role"] == "region" and l["label"] == "Cookie consent")
        check(tag + " theme applied", l["dataTheme"] == theme, l["bannerBg"])
        check(tag + " floating buttons above banner", no_overlap(l), {"banner": l["banner"], "theme": l["theme"], "open": l["open"]})
        check(tag + " no horizontal scroll", l["scrollW"] <= l["clientW"], (l["scrollW"], l["clientW"]))
        if w == 390:
            check(tag + " banner height < 60% viewport", l["banner"]["h"] < 0.6 * h, l["banner"]["h"])
            check(tag + " banner full width", abs(l["banner"]["left"]) < 1 and abs(l["banner"]["right"] - w) < 1)
        page.screenshot(path=os.path.join(OUT, shot))
        ctx.close()

    # 2. Accept All persists across reload and navigation
    ctx, page = new_page(browser, 1440, 900, "dark")
    events = []
    goto(page, "/")
    check("home banner visible", banner_visible(page))
    page.evaluate("() => { window.__ev = []; document.addEventListener('astra:cookie-consent', e => window.__ev.push(e.detail)); }")
    page.click("#astra-cookie [data-cookie-action=accept]")
    page.wait_for_timeout(300)
    s = stored(page)
    check("accept stored", s and s["analytics"] and s["marketing"] and s["necessary"] and s["method"] == "accept-all" and s["version"] == 1 and s["timestamp"], s)
    check("accept hides banner", not banner_visible(page))
    ev = page.evaluate("() => window.__ev")
    check("astra:cookie-consent event fired", len(ev) == 1 and ev[0]["method"] == "accept-all", ev)
    api = page.evaluate("() => ({json: JSON.parse(JSON.stringify(window.astraCookieConsent)), a: window.astraCookieConsent.allows('analytics')})")
    check("window.astraCookieConsent reflects choice", api["json"]["decided"] and api["a"], api)
    check("dock offset cleared", page.evaluate("() => !document.documentElement.classList.contains('astra-cookie-open')"))
    page.reload(); page.wait_for_timeout(3500)
    check("accept persists on reload", not banner_visible(page))
    for path in ["/about/", "/plans/", "/contact/", "/works/casestudy1/"]:
        goto(page, path)
        page.wait_for_timeout(1000)
        check("accept persists on " + path, not banner_visible(page))
    ctx.close()

    # 3. Reject non-essential
    ctx, page = new_page(browser, 390, 844, "dark")
    goto(page, "/plans/")
    page.click("#astra-cookie [data-cookie-action=reject]")
    page.wait_for_timeout(300)
    s = stored(page)
    check("reject stored", s and not s["analytics"] and not s["marketing"] and s["necessary"] and s["method"] == "reject", s)
    goto(page, "/contact/")
    check("reject persists on navigation", not banner_visible(page))
    ctx.close()

    # 4. Manage settings dialog keyboard flow + Save preferences
    ctx, page = new_page(browser, 1440, 900, "dark")
    goto(page, "/contact/")
    manage = page.locator("#astra-cookie [data-cookie-action=manage]")
    manage.focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(200)
    dlg = page.evaluate("""() => { const d = document.querySelector('#astra-cookie-modal [role=dialog]'); return {open: !document.getElementById('astra-cookie-modal').hidden, modal: d.getAttribute('aria-modal'), label: document.getElementById(d.getAttribute('aria-labelledby')).textContent, focused: document.activeElement === d}; }""")
    check("dialog opens, labelled, aria-modal, focus moved in", dlg["open"] and dlg["modal"] == "true" and dlg["label"] == "Cookie settings" and dlg["focused"], dlg)
    toggles = page.evaluate("""() => [...document.querySelectorAll('#astra-cookie-modal input')].map(i => ({id: i.id, role: i.getAttribute('role'), checked: i.checked, disabled: i.disabled, label: i.labels[0] && i.labels[0].textContent}))""")
    check("toggles are labelled switches; necessary locked on; others off by default",
          toggles[0]["disabled"] and toggles[0]["checked"] and not toggles[1]["checked"] and not toggles[2]["checked"] and all(t["role"] == "switch" and t["label"] for t in toggles), toggles)
    seq = []
    for _ in range(14):
        page.keyboard.press("Tab")
        seq.append(active_info(page))
    check("Tab stays trapped in dialog", all(x["inside"] for x in seq), [x["text"] for x in seq[:8]])
    seq_back = []
    for _ in range(8):
        page.keyboard.press("Shift+Tab")
        seq_back.append(active_info(page))
    check("Shift+Tab stays trapped in dialog", all(x["inside"] for x in seq_back))
    page.screenshot(path=os.path.join(OUT, "_cookie_dialog.png"))
    page.keyboard.press("Escape")
    page.wait_for_timeout(200)
    a = active_info(page)
    check("Esc closes dialog, focus returns to Manage settings", page.evaluate("() => document.getElementById('astra-cookie-modal').hidden") and a["action"] == "manage" and not a["inside"], a)
    check("banner still shown after Esc (no choice made)", banner_visible(page) and stored(page) is None)
    page.keyboard.press("Enter")
    page.wait_for_timeout(200)
    page.focus("#astra-cc-analytics")
    page.keyboard.press("Space")
    check("Space toggles analytics switch", page.evaluate("() => document.getElementById('astra-cc-analytics').checked"))
    page.focus("#astra-cookie-modal [data-cookie-action=save]")
    page.keyboard.press("Enter")
    page.wait_for_timeout(300)
    s = stored(page)
    check("save preferences stored custom values", s and s["analytics"] and not s["marketing"] and s["method"] == "custom", s)
    check("save closes dialog + hides banner", page.evaluate("() => document.getElementById('astra-cookie-modal').hidden") and not banner_visible(page))
    check("focus not lost to <body> after save", page.evaluate("() => document.activeElement !== document.body"), active_info(page))
    goto(page, "/about/")
    check("custom choice persists", not banner_visible(page) and stored(page)["method"] == "custom")

    # 5. Footer "Cookie settings" link reopens dialog with saved values
    for path in ["/about/", "/plans/", "/"]:
        if path != "/about/":
            goto(page, path)
        page.wait_for_timeout(1700)
        link = page.locator(".astra-cookie-footer-link")
        n = link.count()
        check("footer Cookie settings link on " + path, n == 1, n)
        if n:
            link.scroll_into_view_if_needed()
            link.focus()
            page.keyboard.press("Enter")
            page.wait_for_timeout(200)
            vals = page.evaluate("() => [document.getElementById('astra-cc-analytics').checked, document.getElementById('astra-cc-marketing').checked]")
            check("dialog reflects saved values from footer on " + path, vals == [True, False], vals)
            page.keyboard.press("Escape")
            page.wait_for_timeout(150)
            check("focus returns to footer link on " + path, page.evaluate("() => document.activeElement.classList.contains('astra-cookie-footer-link')"))
    ctx.close()

    # 6. Cookie settings from accessibility panel (case study page has no footer)
    ctx, page = new_page(browser, 390, 844, "light")
    goto(page, "/works/casestudy1/")
    page.click("#astra-open")
    page.wait_for_timeout(150)
    page.click("#astra-cookie-panel-link")
    page.wait_for_timeout(200)
    check("panel link opens dialog and closes a11y panel", page.evaluate("() => !document.getElementById('astra-cookie-modal').hidden && document.getElementById('astra-panel').hidden"))
    page.screenshot(path=os.path.join(OUT, "_cookie_dialog_mobile_light.png"))
    page.keyboard.press("Escape")
    page.wait_for_timeout(150)
    check("focus returns to accessibility button", page.evaluate("() => document.activeElement.id") == "astra-open")
    l = layout(page)
    check("390 light dialog no horizontal scroll", l["scrollW"] <= l["clientW"], (l["scrollW"], l["clientW"]))
    ctx.close()

    # 7. Switch to light with banner open: no freeze
    ctx, page = new_page(browser, 1440, 900, "dark")
    goto(page, "/")
    check("home dark banner visible", banner_visible(page))
    page.click("#astra-open")
    page.wait_for_timeout(150)
    page.click("[data-theme-choice=light]")
    page.wait_for_timeout(1500)
    t = page.evaluate("() => { const t0 = performance.now(); return new Promise(r => setTimeout(() => r({lag: performance.now() - t0 - 50, theme: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.getElementById('astra-cookie')).backgroundColor}), 50)); }")
    check("light switch with banner open does not freeze", t["lag"] < 500 and t["theme"] == "light" and t["bg"] == "rgb(255, 255, 255)", t)
    l = layout(page)
    check("light: floating buttons still above banner", no_overlap(l))
    ctx.close()

    # 8. Font scaling (Text size 3) keeps dock above banner
    for (w, h) in [(1440, 900), (390, 844)]:
        ctx, page = new_page(browser, w, h, "dark", font=3)
        goto(page, "/about/")
        l = layout(page)
        check("%d text size 3: dock above banner" % w, page.evaluate("() => document.documentElement.classList.contains('astra-font-3')") and no_overlap(l), {"banner": l["banner"], "theme": l["theme"], "open": l["open"]})
        check("%d text size 3: no horizontal scroll" % w, l["scrollW"] <= l["clientW"], (l["scrollW"], l["clientW"]))
        ctx.close()

    # 9. Reduced motion
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    page = ctx.new_page()
    goto(page, "/about/")
    check("reduced motion: no banner animation", page.evaluate("() => getComputedStyle(document.getElementById('astra-cookie')).animationName") == "none")
    ctx.close()

    browser.close()

print("\nCONSOLE ERRORS (%d):" % len(errors))
for e in errors:
    print("  ", e)
fails = [r for r in results if not r[1]]
print("\n%d checks, %d failed" % (len(results), len(fails)))
