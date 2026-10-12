import pathlib
root = pathlib.Path(r"C:\Users\Computer House\Desktop\company\site")
old = 'var logo=mode==="light"?"/logos/astraea-logo.png":"/logos/astraea-logo-on-dark.png";var fix=function(img){var cur=img.getAttribute("src")||"";if(cur.indexOf("infinitivee")===-1&&cur.indexOf("astraea-logo")===-1)return;if(cur!==logo)img.setAttribute("src",logo);img.alt="Astraea Labs";};'
new = 'var fix=function(img){var cur=img.getAttribute("src")||"";if(cur.indexOf("infinitivee")===-1&&cur.indexOf("astraea-logo")===-1)return;var logo=document.documentElement.getAttribute("data-theme")==="light"?"/logos/astraea-logo.png":"/logos/astraea-logo-on-dark.png";if(cur!==logo)img.setAttribute("src",logo);if(img.alt!=="Astraea Labs")img.alt="Astraea Labs";};'
n = 0
for p in root.rglob("index.html"):
    text = p.read_text(encoding="utf-8")
    c = text.count(old)
    if c != 1:
        print("UNEXPECTED", p, c)
        continue
    p.write_text(text.replace(old, new, 1), encoding="utf-8")
    n += 1
    print("patched", p.relative_to(root))
print("files", n)
