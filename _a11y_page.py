import json, sys
from playwright.sync_api import sync_playwright

path = sys.argv[1]
out = sys.argv[2]
BASE = "http://localhost:4173"

def main():
    row = {"page": path}
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, timeout=15000)
        page = browser.new_page()
        page.set_default_timeout(12000)
        page.goto(BASE + path, wait_until="domcontentloaded", timeout=15000)
        page.evaluate("() => { localStorage.removeItem('astra-theme'); localStorage.removeItem('astra-a11y'); }")
        page.reload(wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(2200)
        row["before"] = page.evaluate("""() => {
          const text = (document.body && document.body.innerText) || "";
          return {
            err: text.includes("Application error: a client-side exception has occurred"),
            snippet: text.replace(/\\s+/g, " ").slice(0, 160),
            open: !!document.querySelector("#astra-open"),
            theme: document.documentElement.getAttribute("data-theme"),
            className: document.documentElement.className
          };
        }""")
        if row["before"]["open"]:
            page.evaluate("() => document.querySelector('#astra-open').click()")
            row["opened"] = page.evaluate("""() => {
              const panel = document.querySelector("#astra-panel");
              const buttons = panel ? [...panel.querySelectorAll(".astra-options button, .astra-group button")] : [];
              const panelBg = panel ? getComputedStyle(panel).backgroundColor : null;
              const sample = buttons.map((b) => {
                const s = getComputedStyle(b);
                const r = b.getBoundingClientRect();
                return { text: (b.textContent||"").trim(), color: s.color, bg: s.backgroundColor, w: Math.round(r.width), h: Math.round(r.height) };
              });
              const light = panel && panel.querySelector("[data-theme-choice='light']");
              let hit = null;
              if (light) {
                const r = light.getBoundingClientRect();
                const el = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
                hit = { same: !!(el && (el === light || light.contains(el))), id: el && el.id, tag: el && el.tagName, y: Math.round(r.top), h: Math.round(r.height) };
              }
              return { hidden: panel ? panel.hidden : null, panelBg, count: buttons.length, sample, hit };
            }""")
            row["applied"] = page.evaluate("""() => {
              document.querySelector("[data-a11y='readable']").click();
              document.querySelector("[data-a11y='contrast']").click();
              document.querySelector("[data-theme-choice='light']").click();
              return {
                className: document.documentElement.className,
                theme: document.documentElement.getAttribute("data-theme"),
                storedTheme: localStorage.getItem("astra-theme"),
                storedA11y: localStorage.getItem("astra-a11y")
              };
            }""")
            page.reload(wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(2200)
            row["persisted"] = page.evaluate("""() => ({
              className: document.documentElement.className,
              theme: document.documentElement.getAttribute("data-theme"),
              storedTheme: localStorage.getItem("astra-theme"),
              storedA11y: localStorage.getItem("astra-a11y"),
              open: !!document.querySelector("#astra-open"),
              err: ((document.body && document.body.innerText) || "").includes("Application error: a client-side exception has occurred")
            })""")
        browser.close()
    with open(out, "w", encoding="utf-8") as f:
        json.dump(row, f)
    print("ok", path, flush=True)

if __name__ == "__main__":
    main()
