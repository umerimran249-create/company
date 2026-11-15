from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    pg.add_init_script("localStorage.setItem('astra-theme','dark')")
    pg.goto('http://localhost:4173/', wait_until='networkidle')
    pg.wait_for_timeout(2500)
    for y in range(1000, 3600, 200):
        pg.evaluate(f'window.scrollTo(0,{y})')
        pg.wait_for_timeout(500)
        r = pg.evaluate('''() => {
          const s = document.querySelector('section.projects-desktop');
          const its = [...s.querySelectorAll('.projects-carousel-item')].map(e => (+getComputedStyle(e).opacity).toFixed(2) + ':' + (e.style.cssText||'').slice(0,60));
          return [Math.round(s.getBoundingClientRect().top), s.offsetHeight, its];
        }''')
        print(y, r)
    b.close()
