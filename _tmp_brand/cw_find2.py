import re
s = open('site/index.html', encoding='utf-8').read()
for m in re.finditer(r'<div class="projects-carousel-item"[^>]*>.*?</div>', s):
    if '3musafir' in m.group(0):
        print('HOME', m.start(), m.group(0))
w = open('site/works/index.html', encoding='utf-8').read()
a = w.find('<section class="works">')
b = w.find('</section>', a) + len('</section>')
sec = w[a:b]
print('WORKS', a, b, len(sec), '-- count', sec.count('--'), 'nested section', sec.count('<section'))
print('AFTER', w[b:b+400])
print('BEFORE', w[a-60:a])
c = open('site/_next/static/chunks/app/page-af5bc7c15d08ee71.js', encoding='utf-8').read()
for m in re.finditer(r'\(0,i\.jsx\)\("div",\{className:"projects-carousel-item",onClick:\(\)=>\w\(0\),style:\{cursor:"pointer"\},children:\(0,i\.jsx\)\(x\.default,\{src:"/mockups/3musafir\.png"[^}]*\}\)\}\),', c):
    print('CHUNK', m.start(), m.group(0))
import glob
for f in glob.glob('site/**/*.html', recursive=True):
    t = open(f, encoding='utf-8').read()
    if 'class="works"' in t or 'class="works ' in t:
        print('section.works in', f)
