import sys
print("stage import", flush=True)
from playwright.sync_api import sync_playwright
print("stage start", flush=True)
p = sync_playwright().start()
print("stage launch", flush=True)
browser = p.chromium.launch(channel="chrome", headless=True, timeout=20000)
print("stage page", flush=True)
page = browser.new_page()
page.goto("http://localhost:4173/", wait_until="domcontentloaded", timeout=20000)
print("stage loaded", page.title(), flush=True)
page.wait_for_timeout(2500)
info = page.evaluate("""() => ({
  err: ((document.body && document.body.innerText) || '').includes('Application error: a client-side exception has occurred'),
  open: !!document.querySelector('#astra-open'),
  snippet: ((document.body && document.body.innerText) || '').replace(/\\s+/g,' ').slice(0,160)
})""")
print("INFO", info, flush=True)
browser.close()
p.stop()
print("done", flush=True)
