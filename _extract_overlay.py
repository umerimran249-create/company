import pathlib, re
files = [
    r"site/_next/static/css/8d774c345c4a79ac.css",
    r"site/_next/static/css/329143c93988409b.css",
    r"site/_next/static/css/f1e9f3e19ae68cb9.css",
    r"site/_next/static/css/b81208a286c7bf04.css",
    r"site/_next/static/css/41f1f8648f0f4494.css",
]
keys = ["kpi-item-button", "techstack-item-content-column-bottom-button", "team-member", "skills-", "phone-link", "insights-list", "results-list", "case-study-subtitle", "about-team"]
text = []
for f in files:
    css = pathlib.Path(f).read_text(encoding="utf-8")
    for m in re.finditer(r"([^{}]+)\{([^{}]+)\}", css):
        sel = m.group(1)
        if any(k in sel for k in keys):
            text.append(sel.strip()[:160] + " { " + m.group(2)[:260] + " }")
pathlib.Path("_colors.txt").write_text("\n\n".join(text), encoding="utf-8")
print(len(text))
