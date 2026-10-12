import json, os, subprocess, sys
pages = ["/", "/about/", "/works/", "/contact/", "/plans/", "/works/casestudy1/", "/works/casestudy2/", "/works/casestudy3/", "/works/casestudy4/"]
root = r"C:\Users\Computer House\Desktop\company"
results = []
for i, path in enumerate(pages):
    out = os.path.join(root, f"_a11y_row_{i}.json")
    if os.path.exists(out):
        os.remove(out)
    print("RUN", path, flush=True)
    try:
        proc = subprocess.run(
            [sys.executable, "-u", os.path.join(root, "_a11y_page.py"), path, out],
            timeout=50,
            cwd=root,
        )
        print(" exit", proc.returncode, flush=True)
    except subprocess.TimeoutExpired:
        print(" TIMEOUT", path, flush=True)
        results.append({"page": path, "exception": "process timeout"})
        continue
    if os.path.exists(out):
        with open(out, encoding="utf-8") as f:
            results.append(json.load(f))
    else:
        results.append({"page": path, "exception": "no output"})
final = os.path.join(root, "_a11y_debug.json")
with open(final, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
print("WROTE", final, flush=True)
