import json
import sys

logf = open("_loader_log.txt", "w", encoding="utf-8", buffering=1)


def log(msg):
    print(msg, flush=True)
    logf.write(msg + "\n")
    logf.flush()


log("import")
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:4173/"


def snapshot(page):
    return page.evaluate(
        """() => {
      function describe(el) {
        if (!el) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          className: String(el.className).slice(0, 160),
          opacity: cs.opacity,
          visibility: cs.visibility,
          display: cs.display,
          zIndex: cs.zIndex,
          bg: cs.backgroundColor,
          animation: cs.animationName,
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
      const cx = Math.floor(innerWidth / 2);
      const cy = Math.floor(innerHeight / 2);
      const top = document.elementFromPoint(cx, cy);
      const chain = [];
      let node = top;
      for (let i = 0; node && i < 5; i++) {
        chain.push(node.tagName + "." + String(node.className || "").slice(0, 70));
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
        website: describe(document.querySelector(".website-loading-screen")),
        coveredInitial: covered(".initial-loading-screen"),
        coveredLoading: covered(".loading-screen"),
        chain,
        hero: hero ? { text: (hero.innerText || "").replace(/\\s+/g, " ").slice(0, 80), opacity: hcs.opacity, top: Math.round(hr.top), h: Math.round(hr.height) } : null
      };
    }"""
    )


def run_path(browser, theme, dest):
    log(f"path {theme} {dest}")
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    logs = []
    page.on("pageerror", lambda err: logs.append("pageerror: " + str(err)[:300]))
    page.on("console", lambda msg: logs.append(msg.type + ": " + msg.text[:180]) if msg.type in ("error", "warning") else None)
    page.goto(URL, wait_until="domcontentloaded", timeout=20000)
    log("goto done")
    page.evaluate(
        """(theme) => {
          localStorage.setItem("astra-theme", theme);
          document.documentElement.setAttribute("data-theme", theme);
        }""",
        theme,
    )
    page.wait_for_timeout(1500)
    first = snapshot(page)
    log("first " + json.dumps(first))
    page.locator(f'.navigation-inside-big a[href="{dest}"]').first.click(timeout=8000)
    page.wait_for_timeout(1500)
    mid = snapshot(page)
    log("mid " + json.dumps(mid))
    page.locator('.navigation-inside-big a[href="/"]').first.click(timeout=8000)
    page.wait_for_timeout(4000)
    back = snapshot(page)
    log("back " + json.dumps(back))
    log("errs " + json.dumps(logs[-8:]))
    page.close()
    return {"theme": theme, "dest": dest, "first": first, "mid": mid, "back": back, "logs": logs[-8:]}


def main():
    log("launch")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        log("launched")
        results = [
            run_path(browser, "light", "/about/"),
            run_path(browser, "dark", "/about/"),
        ]
        browser.close()
    log("RESULT " + json.dumps(results))
    logf.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        log("FAIL " + repr(exc))
        sys.exit(1)
