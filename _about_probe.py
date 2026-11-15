import sys, json
from playwright.sync_api import sync_playwright
w = int(sys.argv[1]) if len(sys.argv) > 1 else 390
tag = sys.argv[2] if len(sys.argv) > 2 else "probe"
theme = sys.argv[3] if len(sys.argv) > 3 else "dark"
JS = r"""
() => {
  const sec=document.querySelector('.about-sticky-container');
  const r0=sec.getBoundingClientRect();
  const out={sw:document.documentElement.scrollWidth, iw:innerWidth, secH:Math.round(r0.height), secTop:Math.round(r0.top+scrollY),
    theme:document.documentElement.className+' '+(document.documentElement.dataset.theme||'')};
  out.els=[sec,...sec.querySelectorAll('*')].filter(e=>!['P','SPAN'].includes(e.tagName)).slice(0,14).map(e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
    return [e.tagName,(e.className||'').slice(0,40),Math.round(r.width)+'x'+Math.round(r.height),e.tagName==='IMG'?e.naturalWidth+'x'+e.naturalHeight:'',
      'of='+cs.objectFit,'h='+cs.height,'mh='+cs.minHeight,'pos='+cs.position,'top='+cs.top,'disp='+cs.display,'fd='+cs.flexDirection,'pad='+cs.padding,'fs='+cs.fontSize].join(' ')});
  return out;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": w, "height": 844})
    pg.add_init_script(f"try{{localStorage.setItem('theme','{theme}');localStorage.setItem('astra-theme','{theme}')}}catch(e){{}}")
    pg.goto("http://localhost:4173/about/", wait_until="networkidle")
    pg.wait_for_timeout(1500)
    r = pg.evaluate(JS)
    print(json.dumps(r, indent=1))
    pg.evaluate(f"scrollTo(0,{r['secTop']})"); pg.wait_for_timeout(800)
    pg.screenshot(path=f"_about_{tag}_{w}_{theme}.png", clip={"x":0,"y":r['secTop'],"width":w,"height":min(r['secH'],8000)}, full_page=True)
    b.close()
