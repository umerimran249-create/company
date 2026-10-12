import json
import traceback

logf = open("_loader_log.txt", "w", encoding="utf-8", buffering=1)


def log(msg):
    print(msg, flush=True)
    logf.write(str(msg) + "\n")
    logf.flush()


log("import")
from playwright.sync_api import sync_playwright

SNAP = r"""() => {
  function describe(el) {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      className: String(el.className).slice(0, 140),
      opacity: cs.opacity,
      visibility: cs.visibility,
      display: cs.display,
      z: cs.zIndex,
      bg: cs.backgroundColor,
      anim: cs.animationName,
      w: Math.round(r.width),
      h: Math.round(r.height)
    };
  }
  function covered(sel) {
    const el = document.querySelector(sel);
    if (!el) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.05 && r.width > innerWidth * 0.8 && r.height > innerHeight * 0.8;
  }
  const cx = Math.floor(innerWidth / 2), cy = Math.floor(innerHeight / 2);
  let node = document.elementFromPoint(cx, cy);
  const chain = [];
  for (let i = 0; node && i < 5; i++) {
    chain.push(node.tagName + "." + String(node.className || "").slice(0, 60));
    node = node.parentElement;
  }
  const hero = document.querySelector(".hero-headline");
  const hcs = hero ? getComputedStyle(hero) : null;
  const hr = hero ? hero.getBoundingClientRect() : null;
  return {
    url: location.pathname,
    theme: document.documentElement.getAttribute("data-theme"),
    initial: describe(document.querySelector(".initial-loading-screen")),
    loading: describe(document.querySelector(".loading-screen")),
    coveredInitial: covered(".initial-loading-screen"),
    coveredLoading: covered(".loading-screen"),
    chain,
    hero: hero ? { text: (hero.innerText || "").replace(/\s+/g, " ").slice(0, 80), opacity: hcs.opacity, top: Math.round(hr.top), h: Math.round(hr.height), vis: hcs.visibility } : null
  };
}"""


def snap(page, label):
    try:
        data = page.evaluate(SNAP)
        log(label + " " + json.dumps(data))
        return data
    except Exception as exc:
        log(label + " SNAPFAIL " + repr(exc)[:300])
        return None


def run_path(browser, theme, dest):
    log("path " + theme + " " + dest)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    context.set_default_timeout(12000)
    context.add_init_script(
        'try { localStorage.setItem("astra-theme", "%s"); } catch (e) {}' % theme
    )
    page = context.new_page()
    page.on("pageerror", lambda err: log("pageerror " + str(err)[:300]))
    page.on("dialog", lambda d: (log("dialog " + d.message[:120]), d.dismiss()))
    page.goto("http://127.0.0.1:4173/", wait_until="domcontentloaded", timeout=20000)
    log("goto " + page.url)
    page.wait_for_timeout(2000)
    snap(page, "first")
    page.locator('.navigation-inside-big a[href="%s"]' % dest).first.click(timeout=8000)
    page.wait_for_timeout(1500)
    snap(page, "mid")
    page.locator('.navigation-inside-big a[href="/"]').first.click(timeout=8000)
    page.wait_for_timeout(4000)
    snap(page, "back")
    context.close()


def main():
    log("launch")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        log("launched")
        run_path(browser, "light", "/about/")
        run_path(browser, "dark", "/about/")
        browser.close()
    log("DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("FAIL\n" + traceback.format_exc())
        raise
