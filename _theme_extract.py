import pathlib
root = pathlib.Path(r"C:\Users\Computer House\Desktop\company")
out = []
htmls = list((root / "site").rglob("index.html"))
for p in htmls:
    text = p.read_text(encoding="utf-8", errors="replace")
    out.append(f"FILE {p.relative_to(root)} len={len(text)}")
    for key in ("MutationObserver", "astra.js", "astra-theme", "data-theme"):
        idx = 0
        n = 0
        while True:
            i = text.find(key, idx)
            if i < 0:
                break
            n += 1
            if n <= 2:
                start = max(0, i - 80)
                end = min(len(text), i + 400)
                snippet = text[start:end].replace("\n", " ")
                out.append(f"  {key}@{i}: {snippet}")
            idx = i + len(key)
        out.append(f"  count {key}={n}")

css = (root / "site" / "_next" / "static" / "css" / "c3f8eed6a959fb5a.css").read_text(encoding="utf-8", errors="replace")
hero = (root / "site" / "_next" / "static" / "css" / "8d774c345c4a79ac.css").read_text(encoding="utf-8", errors="replace")
for name, blob in (("base", css), ("hero", hero)):
    out.append(f"CSS {name} len={len(blob)}")
    for key in ("blur(", "transition:", "background-gradient", "loading-screen"):
        idx = 0
        n = 0
        while n < 8:
            i = blob.find(key, idx)
            if i < 0:
                break
            n += 1
            start = blob.rfind("}", 0, i)
            end = blob.find("}", i)
            rule = blob[start + 1:end + 1]
            if len(rule) > 500:
                rule = rule[:500] + "..."
            out.append(f"  {key} rule: {rule}")
            idx = i + len(key)

page = (root / "site" / "_next" / "static" / "chunks" / "app" / "page-af5bc7c15d08ee71.js").read_text(encoding="utf-8", errors="replace")
out.append(f"PAGE len={len(page)}")
for key in ("loading-screen", "initial-loading", "fade-out", "setTimeout", "while("):
    idx = 0
    n = 0
    while n < 4:
        i = page.find(key, idx)
        if i < 0:
            break
        n += 1
        out.append(f"  {key}@{i}: {page[max(0,i-120):i+220]}")
        idx = i + len(key)
    out.append(f"  count {key}={page.count(key)}")

(root / "_theme_extract.txt").write_text("\n".join(out), encoding="utf-8")
print("wrote", len(out), "lines")
