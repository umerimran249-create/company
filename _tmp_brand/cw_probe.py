import json, sys
from playwright.sync_api import sync_playwright

URL = 'http://localhost:4173/'
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(1440, 900), (390, 844)]:
        pg = b.new_page(viewport={'width': w, 'height': h})
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.add_init_script("localStorage.setItem('theme','dark')")
        pg.goto(URL, wait_until='networkidle')
        pg.wait_for_timeout(2500)
        info = pg.evaluate('''() => {
          const out = [];
          document.querySelectorAll('section.projects, section.projects *').forEach(el => {
            const d = el.className && typeof el.className === 'string' ? el.className : el.tagName;
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (r.height > 150 || /carousel|wrapper|content|pin/.test(d))
              out.push([el.tagName, d.slice(0,60), Math.round(r.top + scrollY), Math.round(r.height), Math.round(r.width), cs.display, cs.position, cs.opacity, el.children.length]);
          });
          const pin = [...document.querySelectorAll('.pin-spacer')].map(e => [e.className, e.firstElementChild && e.firstElementChild.className, e.offsetHeight]);
          const items = [...document.querySelectorAll('.projects-carousel-item')].map(e => [getComputedStyle(e).display, e.querySelector('img') && e.querySelector('img').getAttribute('src')]);
          return {out: out.slice(0, 60), pin, items, sections: [...document.querySelectorAll('body section, body > div > section')].map(s => [s.className, s.offsetHeight])};
        }''')
        print('====', w, json.dumps(info, indent=0)[:6000])
        print('errors', errs[:5])
        pg.close()
    b.close()
