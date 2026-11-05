#!/usr/bin/env python3
"""Check cross-page links of the study guide: every href="page.html#id" must name a page that exists and an id
that exists on that page. Run from the guide folder: python3 tools/check_links.py [page.html ...]
Same-page links (href="#id") are checked by tools/check.js through the a.xref resolver."""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pages = sorted(glob.glob(os.path.join(ROOT, '*.html')))
ids = {os.path.basename(p): set(re.findall(r'\sid="([^"]+)"', open(p, encoding='utf-8').read())) for p in pages}
targets = [os.path.join(ROOT, a) for a in sys.argv[1:]] or pages
bad = 0
for p in targets:
    src = open(p, encoding='utf-8').read()
    name = os.path.basename(p)
    for m in re.finditer(r'href="([a-z0-9_]+\.html)(?:#([^"]+))?"', src):
        page, frag = m.group(1), m.group(2)
        line = src.count('\n', 0, m.start()) + 1
        if page not in ids:
            print(f'{name}:{line}: missing page {page}'); bad += 1
        elif frag and frag not in ids[page]:
            print(f'{name}:{line}: {page}#{frag} has no such id'); bad += 1
print(f'{bad} broken cross-page link(s) in {len(targets)} page(s)')
sys.exit(1 if bad else 0)
