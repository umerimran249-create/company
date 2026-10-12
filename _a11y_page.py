import json, sys
from playwright.sync_api import sync_playwright

path = sys.argv[1]
out = sys.argv[2]
BASE = "http://localhost:4173"

STATE = """() => {
  const text = (document.body && document.body.innerText) || "";
  const panel = document.querySelector("#astra-panel");
  const buttons = panel ? [...panel.querySelectorAll("button")] : [];
  return {
    err: text.includes("Application error: a client-side exception has occurred"),
    snippet: text.replace(/\\s+/g, " ").slice(0, 140),
    open: !!document.querySelector("#astra-open"),
    panel: !!panel,
    hidden: panel ? panel.hidden : null,
    buttonTexts: buttons.map((b) => (b.textContent || "").trim()).slice(0, 16),
    theme: document.documentElement.getAttribute("data-theme"),
    className: document.documentElement.className,
    storedTheme: localStorage.getItem("astra-theme"),
    storedA11y: localStorage.getItem("astra-a11y")
  };
}"""

def main():
    row = {"page": path}
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, timeout=15000)
        page = browser.new_page()
        page.set_default_timeout(10000)
        page.goto(BASE + path, wait_until="commit", timeout=15000)
        page.evaluate("() => { localStorage.removeItem('astra-theme'); localStorage.removeItem('astra-a11y'); }")
        page.reload(wait_until="commit", timeout=15000)
        page.wait_for_timeout(500)
        row["t500"] = page.evaluate(STATE)
        page.wait_for_timeout(2000)
        row["t2500"] = page.evaluate(STATE)
        if row["t2500"]["open"]:
            try:
                page.locator("#astra-open").click(timeout=8000)
                row["open_mouse"] = "ok"
            except Exception as exc:
                row["open_mouse"] = str(exc)[-240:]
                page.evaluate("() => { const b = document.querySelector('#astra-open'); if (b) b.click(); }")
            row["opened"] = page.evaluate(STATE)
            row["hit"] = page.evaluate("""() => {
              const light = document.querySelector("[data-theme-choice='light']");
              if (!light) return null;
              const r = light.getBoundingClientRect();
              const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
              const s = getComputedStyle(light);
              const panel = document.querySelector("#astra-panel");
              return {
                same: !!(el && (el === light || light.contains(el))),
                tag: el && el.tagName,
                id: el && el.id,
                y: Math.round(r.top),
                h: Math.round(r.height),
                color: s.color,
                bg: s.backgroundColor,
                panelBg: panel ? getComputedStyle(panel).backgroundColor : null
              };
            }""")
            try:
                page.locator("[data-theme-choice='light']").click(timeout=8000)
                row["light_mouse"] = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
            except Exception as exc:
                row["light_mouse"] = "fail: " + str(exc)[-240:]
            row["clicks"] = page.evaluate("""() => {
              function clickSel(sel) {
                const el = document.querySelector(sel);
                if (!el) return sel + " missing";
                el.click();
                return "ok";
              }
              return {
                readable: clickSel("[data-a11y='readable']"),
                contrast: clickSel("[data-a11y='contrast']"),
                light: clickSel("[data-theme-choice='light']"),
                className: document.documentElement.className,
                theme: document.documentElement.getAttribute("data-theme")
              };
            }""")
            page.reload(wait_until="commit", timeout=15000)
            page.wait_for_timeout(2500)
            row["persisted"] = page.evaluate(STATE)
        browser.close()
    with open(out, "w", encoding="utf-8") as f:
        json.dump(row, f)
    print("ok", path, flush=True)

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        with open(out, "w", encoding="utf-8") as f:
            json.dump({"page": path, "exception": str(exc)[-500:]}, f)
        print("fail", path, flush=True)
        raise
