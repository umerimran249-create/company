import pathlib
root = pathlib.Path(r"C:\Users\Computer House\Desktop\company")
page = (root / "site" / "_next" / "static" / "chunks" / "app" / "page-af5bc7c15d08ee71.js").read_text(encoding="utf-8", errors="replace")
i = page.find("initial-loading-screen")
chunk = page[max(0, i - 2500): i + 400]
(root / "_loader_chunk.txt").write_text(chunk, encoding="utf-8")
print("chunk", len(chunk))

# also search all app chunks for website-loading-screen and progress counters
out = []
for p in (root / "site" / "_next" / "static" / "chunks").rglob("*.js"):
    text = p.read_text(encoding="utf-8", errors="replace")
    for key in ("website-loading-screen", "initial-loading-screen", "loading-screen"):
        c = text.count(key)
        if c:
            out.append(f"{p.name} {key}={c}")
            idx = text.find(key)
            out.append(text[max(0, idx - 300): idx + 200])
            out.append("---")
(root / "_loader_hits.txt").write_text("\n".join(out), encoding="utf-8")
print("hits", len(out))
