import os, re
root = r"C:\Users\Computer House\Desktop\company\site"
files = []
for dirpath, dirs, names in os.walk(root):
    for n in names:
        if n.endswith(".html"):
            files.append(os.path.join(dirpath, n))
for p in files:
    text = open(p, encoding="utf-8", errors="replace").read()
    rel = os.path.relpath(p, root)
    print("====", rel)
    # boot scripts
    for m in re.finditer(r"<script>(.*?)</script>", text):
        body = m.group(1)
        if "astra-theme" in body or "data-theme" in body:
            print(body[:1200])
            print("---LEN", len(body))
    # which next chunks
    chunks = re.findall(r"/_next/static/chunks/[^\"']+", text)
    interesting = [c for c in chunks if "308-" in c or "about/page" in c or "contact/page" in c or "casestudy" in c]
    print("CHUNKS", interesting)
    print("has astra.js", "/astra.js" in text, "astra.css", "/astra.css" in text)
    print()
