from playwright.sync_api import sync_playwright

out = r"C:\Users\Computer House\Desktop\company\_light_report.txt"

def log(msg):
    with open(out, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg, flush=True)

open(out, "w", encoding="utf-8").close()

SCAN = r"""
() => {
  const parse = (c) => {
    const m = String(c || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = (c) => c ? (0.2126*c.r + 0.7152*c.g + 0.0722*c.b) / 255 : null;
  const bad = [];
  for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,li,label,span')) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.3) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 8) continue;
    const c = parse(s.color);
    const L = lum(c);
    if (L === null || L < 0.8 || c.a < 0.55) continue;
    let node = el, onLight = false;
    for (let i = 0; i < 5 && node; i++) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      const bL = lum(bg);
      if (bg && bg.a > 0.6 && bL !== null && bL > 0.75) { onLight = true; break; }
      node = node.parentElement;
    }
    if (!onLight) continue;
    const cls = String(el.className || '');
    if (/astra-fab|button-circle|project-modal-cta/.test(cls)) continue;
    bad.push(cls.slice(0, 64) + ' | ' + s.color + ' | ' + (el.innerText || '').trim().replace(/\s+/g,' ').slice(0, 50));
    if (bad.length > 12) break;
  }
  const h = document.querySelector('h1, .headline, .subheadline');
  const fab = document.querySelector('#astra-theme-toggle');
  const loader = document.querySelector('.initial-loading-screen, .website-loading-screen, .loading-screen');
  return {
    theme: document.documentElement.getAttribute('data-theme'),
    heading: h ? (h.textContent || '').trim().slice(0, 60) + ' ' + getComputedStyle(h).color : null,
    fab: fab ? getComputedStyle(fab).color + ' on ' + getComputedStyle(fab).backgroundColor : null,
    loader: loader ? getComputedStyle(loader).opacity + ' ' + getComputedStyle(loader).display : 'none',
    bad
  };
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.add_init_script("localStorage.setItem('astra-theme','light')")
    page.set_default_navigation_timeout(25000)
    for path in ["/about/", "/contact/", "/plans/", "/"]:
        log("PAGE " + path)
        try:
            page.goto("http://localhost:4173" + path, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(2500)
            info = page.evaluate(SCAN)
            log(str(info["theme"]) + " | " + str(info["heading"]))
            log("fab " + str(info["fab"]) + " loader " + str(info["loader"]))
            for row in info["bad"]:
                log("LIGHT " + row)
            if not info["bad"]:
                log("no light-on-light text")
        except Exception as e:
            log("FAIL " + str(e)[:200])
    browser.close()
log("done")
