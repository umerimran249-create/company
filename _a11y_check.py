import json
import re
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
PAGES = [
    "/",
    "/about/",
    "/works/",
    "/contact/",
    "/plans/",
    "/works/casestudy1/",
    "/works/casestudy2/",
    "/works/casestudy3/",
    "/works/casestudy4/",
]

INSPECT = """
() => {
  const text = (document.body && document.body.innerText) || "";
  const err = text.includes("Application error: a client-side exception has occurred");
  function vis(el) {
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      hiddenAttr: !!el.hidden,
      display: s.display,
      visibility: s.visibility,
      opacity: s.opacity,
      color: s.color,
      bg: s.backgroundColor,
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  }
  const open = document.querySelector("#astra-open");
  const panel = document.querySelector("#astra-panel");
  const buttons = panel
    ? [...panel.querySelectorAll("button")].map((b) => ({
        text: (b.textContent || "").trim().slice(0, 48),
        ...vis(b),
      }))
    : [];
  const css = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
  return {
    err,
    snippet: text.replace(/\\s+/g, " ").slice(0, 220),
    hasOpen: !!open,
    openVis: vis(open),
    hasPanel: !!panel,
    panelVis: vis(panel),
    buttons,
    theme: document.documentElement.getAttribute("data-theme"),
    themeSource: document.documentElement.getAttribute("data-theme-source"),
    className: document.documentElement.className,
    astraCss: css.some((h) => h.includes("astra.css")),
    script: !!document.querySelector('script[src="/astra.js"]'),
  };
}
"""


def parse_rgb(value):
    if not value:
        return None
    nums = [float(n) for n in re.findall(r"[\d.]+", value)]
    if len(nums) < 3:
        return None
    alpha = nums[3] if len(nums) > 3 else 1
    return nums[0], nums[1], nums[2], alpha


def similar(a, b, tol=18):
    if not a or not b:
        return False
    if a[3] < 0.15 or b[3] < 0.15:
        return False
    return all(abs(a[i] - b[i]) < tol for i in range(3))


def button_contrast_ok(buttons, panel):
    panel_bg = parse_rgb(panel["bg"] if panel else None)
    bad = []
    for b in buttons:
        fg = parse_rgb(b["color"])
        bg = parse_rgb(b["bg"])
        effective_bg = bg if bg and bg[3] >= 0.15 else panel_bg
        if not fg or not effective_bg:
            bad.append({"text": b["text"], "reason": "unparsed", "color": b["color"], "bg": b["bg"]})
            continue
        if similar(fg, effective_bg):
            bad.append({
                "text": b["text"],
                "reason": "same-as-bg",
                "color": b["color"],
                "bg": b["bg"],
                "panelBg": panel["bg"] if panel else None,
            })
        if b["w"] < 8 or b["h"] < 8 or b["display"] == "none" or b["visibility"] == "hidden" or float(b["opacity"]) < 0.2:
            bad.append({"text": b["text"], "reason": "not-visible", **{k: b[k] for k in ("display", "visibility", "opacity", "w", "h")}})
    return bad


def main():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, timeout=30000)
        for path in PAGES:
            context = browser.new_context()
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            row = {"page": path, "console": []}
            try:
                page.goto(BASE + path, wait_until="domcontentloaded", timeout=30000)
                page.evaluate("() => { localStorage.removeItem('astra-theme'); localStorage.removeItem('astra-a11y'); }")
                page.reload(wait_until="domcontentloaded", timeout=30000)
                try:
                    page.wait_for_selector("#astra-open", timeout=8000)
                except Exception as wait_exc:
                    row["open_wait"] = str(wait_exc)
                before = page.evaluate(INSPECT)
                row["before"] = before
                row["errors_before_click"] = errors[-6:]
                if before["hasOpen"]:
                    page.click("#astra-open", timeout=5000)
                    page.wait_for_timeout(300)
                    opened = page.evaluate(INSPECT)
                    row["opened"] = {
                        "panel": opened["panelVis"],
                        "badButtons": button_contrast_ok(opened["buttons"], opened["panelVis"]),
                        "buttonCount": len(opened["buttons"]),
                        "buttonSample": [
                            {"text": b["text"], "color": b["color"], "bg": b["bg"]}
                            for b in opened["buttons"]
                        ],
                    }
                    page.click("[data-a11y='readable']", timeout=5000)
                    page.click("[data-a11y='contrast']", timeout=5000)
                    page.click("[data-theme-choice='light']", timeout=5000)
                    applied = page.evaluate(
                        """() => ({
                          className: document.documentElement.className,
                          theme: document.documentElement.getAttribute('data-theme'),
                          themeSource: document.documentElement.getAttribute('data-theme-source'),
                          storedTheme: localStorage.getItem('astra-theme'),
                          storedA11y: localStorage.getItem('astra-a11y')
                        })"""
                    )
                    row["applied"] = applied
                    page.reload(wait_until="domcontentloaded", timeout=30000)
                    persisted = page.evaluate(
                        """() => ({
                          className: document.documentElement.className,
                          theme: document.documentElement.getAttribute('data-theme'),
                          themeSource: document.documentElement.getAttribute('data-theme-source'),
                          storedTheme: localStorage.getItem('astra-theme'),
                          storedA11y: localStorage.getItem('astra-a11y'),
                          err: ((document.body && document.body.innerText) || '').includes('Application error: a client-side exception has occurred')
                        })"""
                    )
                    row["persisted"] = persisted
                else:
                    row["opened"] = None
            except Exception as exc:
                row["exception"] = str(exc)
            row["pageerrors"] = errors[-8:]
            results.append(row)
            context.close()
            print("DONE", path, flush=True)
        browser.close()
    out = r"C:\Users\Computer House\Desktop\company\_a11y_results.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("WROTE", out)


if __name__ == "__main__":
    main()
