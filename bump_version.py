#!/usr/bin/env python3
"""
Ajoute ?v=<date-heure> aux fichiers chargés par index.html (style.css, data.js, app.js…),
pour que les navigateurs (et le cache de GitHub Pages) prennent bien la nouvelle version après une mise à jour.
À lancer juste avant de publier :  python bump_version.py
"""
import re
from datetime import datetime
from pathlib import Path

page = Path(__file__).resolve().parent / "index.html"
v = datetime.now().strftime("%Y%m%d%H%M")
html = page.read_text(encoding="utf-8")
html, n = re.subn(r'((?:src|href)="(?!https?:)[\w./-]+\.(?:js|css))(?:\?v=\w+)?"', rf'\1?v={v}"', html)
page.write_text(html, encoding="utf-8")
print(f"{n} fichiers -> ?v={v}")
