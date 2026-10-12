import json
print("start", flush=True)
from playwright.sync_api import sync_playwright
print("imported", flush=True)

BASE = "http://localhost:4173"
PAGES = ["/", "/about/", "/works/", "/contact/", "/plans/", "/works/casestudy1/", "/works/casestudy2/", "/works/casestudy3/", "/works/casestudy4/"]

PROBE = """
() => {
  const text = (document.body && document.body.innerText) || "";
  const open = document.querySelector("#astra-open");
  const panel = document.querySelector("#astra-panel");
  let hit = null;
  if (panel && !panel.hidden) {
    const btn = panel.querySelector("[data-theme-choice='light']");
    if (btn) {
      const r = btn.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2);
      const y = Math.round(r.top + r.height / 2);
      const el = document.elementFromPoint(x, y);
      hit = {
        x, y, w: Math.round(r.width), h: Math.round(r.height),
        tag: el && el.tagName,
        id: el && el.id,
        cls: el && String(el.className || "").slice(0, 80),
        same: !!(el && (el === btn || btn.contains(el)))
      };
    }
  }
  return {
    err: text.includes("Application error: a client-side exception has occurred"),
    snippet: text.replace(/\\s+/g, " ").slice(0, 140),
    open: !!open,
    theme: document.documentElement.getAttribute("data-theme"),
    className: document.documentElement.className,
    panelHidden: panel ? panel.hidden : null,
    hit
  };
}
"""

def main():
    rows = []
    with sync_playwright() as p:
        print("launch", flush=True)
        browser = p.chromium.launch(channel="chrome", headless=True, timeout=20000)
        print("launched", flush=True)
        for path in PAGES:
            print("PAGE", path, flush=True)
            context = browser.new_context()
            page = context.new_page()
            row = {"page": path}
            try:
                page.goto(BASE + path, wait_until="domcontentloaded", timeout=20000)
                page.evaluate("() => { localStorage.removeItem('astra-theme'); localStorage.removeItem('astra-a11y'); }")
                page.reload(wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(2500)
                row["t0"] = page.evaluate(PROBE)
                if row["t0"]["open"]:
                    page.evaluate("() => document.querySelector('#astra-open').click()")
                    page.wait_for_timeout(200)
                    row["opened"] = page.evaluate(PROBE)
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
                    page.reload(wait_until="domcontentloaded", timeout=20000)
                    page.wait_for_timeout(2500)
                    row["persisted"] = page.evaluate(PROBE)
            except Exception as exc:
                row["exception"] = str(exc)[-400:]
            rows.append(row)
            context.close()
            print("DONE", path, flush=True)
        browser.close()
    path = r"C:\Users\Computer House\Desktop\company\_a11y_debug.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2)
    print("WROTE", path, flush=True)

if __name__ == "__main__":
    main()
