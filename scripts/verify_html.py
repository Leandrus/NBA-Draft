import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

ids_in_js = set(re.findall(r"getElementById\(['\"]([^'\"]+)['\"]", app_js))
print(f"Total getElementById targets found: {len(ids_in_js)}")

missing = []
for el_id in sorted(ids_in_js):
    if any(el_id.startswith(p) for p in ['stat-row-', 'p-pts-', 'p-reb-', 'p-ast-', 'p-stl-', 'p-blk-']):
        continue
    if f'id="{el_id}"' not in html:
        missing.append(el_id)

if missing:
    print("Missing IDs:", missing)
else:
    print("SUCCESS: All element IDs referenced in app.js exist in index.html!")
