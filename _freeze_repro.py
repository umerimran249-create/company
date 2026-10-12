from playwright.sync_api import sync_playwright

LOG = r"C:\Users\Computer House\Desktop\company\_freeze_log.txt"
URL = "http://localhost:4173/"

def log(msg):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def main():
    open(LOG, "w").close()
    log("start")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.set_default_timeout(7000)
        page.add_init_script("""
          window.__srcSets = 0;
          const orig = Element.prototype.setAttribute;
          Element.prototype.setAttribute = function(name, value) {
            if (name === "src" && String(value).indexOf("astraea-logo") !== -1) window.__srcSets++;
            return orig.call(this, name, value);
          };
        """)
        log("goto")
        page.goto(URL, wait_until="domcontentloaded", timeout=20000)
        page.evaluate("() => localStorage.setItem('astra-theme','dark')")
        page.reload(wait_until="domcontentloaded", timeout=20000)
        page.wait_for_function("() => window.__astraSetTheme", timeout=8000)
        info = page.evaluate("""() => ({
          theme: document.documentElement.getAttribute('data-theme'),
          sets: window.__srcSets,
          has: typeof window.__astraSetTheme
        })""")
        log("ready " + str(info))
        page.evaluate("() => { window.__srcSets = 0; }")
        log("calling set light")
        try:
            result = page.evaluate("""() => {
              window.__astraSetTheme('light');
              return new Promise((resolve) => {
                const t = performance.now();
                setTimeout(() => resolve({
                  lag: Math.round(performance.now() - t),
                  sets: window.__srcSets,
                  theme: document.documentElement.getAttribute('data-theme'),
                  src: document.querySelector('img') && document.querySelector('img').getAttribute('src')
                }), 250);
              });
            }""")
            log("result " + str(result))
        except Exception as e:
            log("HUNG " + type(e).__name__ + " " + str(e)[:300])
        log("closing")
        try:
            browser.close()
        except Exception as e:
            log("close err " + str(e)[:160])
    log("done")

if __name__ == "__main__":
    main()
