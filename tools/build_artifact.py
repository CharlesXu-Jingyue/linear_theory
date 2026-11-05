"""Build the publishable artifact copy of the guide.

The artifact host wraps the main page in its own <!doctype><html><head><body> skeleton, so the hub page is published
without those tags (title, meta, links and scripts stay at the top). Chapter pages are published as full documents.
Writes dist/artifact_index.html and prints the files map for the Artifact publish call.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
DIST.mkdir(exist_ok=True)

src = (ROOT / 'index.html').read_text()
head = re.search(r'<head>(.*?)</head>', src, re.S).group(1)
body = re.search(r'<body[^>]*>(.*?)</body>', src, re.S).group(1)
head = re.sub(r'\s*<meta charset="utf-8">', '', head)
head = re.sub(r'\s*<meta name="viewport"[^>]*>', '', head)
out = head.strip() + '\n' + body.strip() + '\n'
(DIST / 'artifact_index.html').write_text(out)

pages = sorted(p.name for p in ROOT.glob('ch*.html')) + ['notation.html']
files = {p: str(ROOT / p) for p in pages}
for a in ['lt.css', 'lt.js', 'toc.js']:
    files['assets/' + a] = str(ROOT / 'assets' / a)
print(json.dumps(files, indent=1))
