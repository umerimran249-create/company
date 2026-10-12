import os
import re

root = r"C:\Users\Computer House\Desktop\company\site"
for dirpath, dirs, files in os.walk(root):
    for f in files:
        if not f.endswith(".html"):
            continue
        p = os.path.join(dirpath, f)
        text = open(p, encoding="utf-8", errors="replace").read()
        rel = os.path.relpath(p, root)
        print("===", rel, "len", len(text))
        for needle in ["/astra.js", "/astra.css", "astra-theme", "data-theme"]:
            print(" ", needle, text.count(needle))
        # show last 400 chars
        print(" TAIL:", text[-500:].replace("\n", " | "))
        # show head snippet around astra if any
        idx = text.find("astra")
        if idx >= 0:
            print(" FIRST ASTRA:", text[max(0, idx-80):idx+180].replace("\n", " "))
        print()
