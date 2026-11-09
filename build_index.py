#!/usr/bin/env python3
"""
Construit l'index du site à partir des notebooks (.ipynb).

Usage :
    python build_index.py              # scanne le dossier parent (le repo ADA)
    python build_index.py "C:/autre/dossier"

Produit :
    data.js   -> toutes les cellules + l'index des fonctions (lu par index.html)
    img/      -> les graphiques extraits des sorties des notebooks

Aucune dépendance externe : uniquement la librairie standard Python.
"""
import ast
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else TOOL_DIR.parent
IMG_DIR = TOOL_DIR / "img"
SKIP_DIRS = {".git", ".ipynb_checkpoints", ".idea", TOOL_DIR.name}

# Alias "classiques", utilisés si un notebook oublie l'import (ex : import dans un autre notebook)
DEFAULT_ALIASES = {
    "pd": "pandas", "np": "numpy", "plt": "matplotlib.pyplot", "sns": "seaborn",
    "smf": "statsmodels.formula.api", "sm": "statsmodels.api", "nx": "networkx",
}

# Fonctions Python de base qu'on ne veut pas indexer (trop génériques)
SKIP_BUILTINS = {
    "print", "len", "range", "list", "dict", "set", "tuple", "int", "float", "str", "bool",
    "type", "isinstance", "enumerate", "zip", "sorted", "sum", "min", "max", "abs", "round",
    "open", "map", "filter", "display", "any", "all", "iter", "next", "super", "getattr",
    "hasattr", "setattr", "repr", "reversed", "help", "id", "input", "vars", "dir", "object",
}

LIB_GROUPS = {
    "pandas": "pandas", "numpy": "numpy", "matplotlib": "matplotlib", "seaborn": "seaborn",
    "scipy": "scipy", "statsmodels": "statsmodels", "sklearn": "scikit-learn",
    "networkx": "networkx", "math": "math",
}

# Attributs (pas des appels) qu'on veut aussi pouvoir chercher : df.loc[...], res.params, model.coef_...
ATTRS = {
    "loc", "iloc", "at", "iat", "str", "dt", "shape", "columns", "index", "values", "T", "dtypes",
    "params", "pvalues", "rsquared", "rsquared_adj", "bse", "tvalues", "resid", "fittedvalues",
    "coef_", "intercept_", "feature_importances_", "classes_", "empty", "nodes", "edges",
}

MAX_TEXT_OUT = 2500
MAX_HTML_OUT = 40000
MAX_CONTEXT = 1500
ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")


# --------------------------------------------------------------------------- utilitaires
def src(cell):
    s = cell.get("source", "")
    return "".join(s) if isinstance(s, list) else s


def clean_code(code):
    """Commente les lignes magiques (%matplotlib, !pip...) pour que ast puisse parser."""
    out = []
    for line in code.splitlines():
        stripped = line.lstrip()
        if stripped.startswith(("%", "!")) or re.match(r"^[\w.]+\?{1,2}$", stripped):
            out.append(line[: len(line) - len(stripped)] + "pass  # " + stripped)
        else:
            out.append(line)
    return "\n".join(out)


def try_parse(code):
    try:
        return ast.parse(clean_code(code))
    except SyntaxError:
        return None


def dotted(node):
    """Attribute(Attribute(Name('pd'), 'Series'), 'plot') -> ['pd', 'Series', 'plot'] ; None si racine non-Name."""
    parts = []
    while isinstance(node, ast.Attribute):
        parts.append(node.attr)
        node = node.value
    if isinstance(node, ast.Name):
        parts.append(node.id)
        return list(reversed(parts))
    return None


def _base_name(stem):
    """'Becoming a DataVizard exercise' / '..._solution' -> 'becomingadatavizard'"""
    s = re.sub(r"(solution|exercise|exercice)", "", stem.lower())
    return re.sub(r"[^a-z0-9]", "", s)


def notebook_kind(path):
    name = path.stem.lower()
    if "solution" in name:
        return "solution"
    solutions = {_base_name(p.stem) for p in path.parent.glob("*.ipynb") if "solution" in p.stem.lower()}
    if _base_name(path.stem) in solutions or "exercise" in name or "exercice" in name:
        return "exercice"  # il existe une solution du même nom -> c'est ton travail
    return "cours"


def doc_url(full, lib, short):
    if lib == "méthodes":
        return f"https://pandas.pydata.org/docs/search.html?q={short}"
    if full.startswith("pandas."):
        return f"https://pandas.pydata.org/docs/reference/api/{full}.html"
    if full.startswith("numpy."):
        return f"https://numpy.org/doc/stable/reference/generated/{full}.html"
    if full.startswith("matplotlib.pyplot."):
        return f"https://matplotlib.org/stable/api/_as_gen/{full}.html"
    if full.startswith("seaborn."):
        return f"https://seaborn.pydata.org/generated/{full}.html"
    if full.startswith("scipy."):
        return f"https://docs.scipy.org/doc/scipy/reference/generated/{full}.html"
    if full.startswith("statsmodels.formula.api."):
        return f"https://www.statsmodels.org/stable/generated/{full}.html"
    if full.startswith("statsmodels."):
        return f"https://www.statsmodels.org/stable/search.html?q={short}"
    if full.startswith("sklearn."):
        return f"https://scikit-learn.org/stable/modules/generated/{full}.html"
    if full.startswith("networkx."):
        return f"https://networkx.org/documentation/stable/search.html?q={short}"
    if full.startswith("math."):
        return f"https://docs.python.org/3/library/math.html#{full}"
    return None


# --------------------------------------------------------------------------- imports & appels
def collect_aliases(code_cells):
    aliases = dict(DEFAULT_ALIASES)
    for code in code_cells:
        tree = try_parse(code)
        nodes = []
        if tree is not None:
            nodes = list(ast.walk(tree))
        else:  # cellule invalide : on tente les lignes d'import une par une
            for line in code.splitlines():
                if re.match(r"\s*(import|from)\s", line):
                    try:
                        nodes += list(ast.walk(ast.parse(line.strip())))
                    except SyntaxError:
                        pass
        for n in nodes:
            if isinstance(n, ast.Import):
                for a in n.names:
                    if a.asname:
                        aliases[a.asname] = a.name
                    else:
                        aliases[a.name.split(".")[0]] = a.name.split(".")[0]
            elif isinstance(n, ast.ImportFrom) and n.module and n.level == 0:
                for a in n.names:
                    if a.name != "*":
                        aliases[a.asname or a.name] = f"{n.module}.{a.name}"
    return aliases


def find_calls(code, aliases, local_defs):
    """Retourne une liste de (clé, forme_écrite). Clé = nom complet ('pandas.read_csv') ou '.methode'."""
    calls = []
    tree = try_parse(code)
    if tree is not None:
        called = {id(n.func) for n in ast.walk(tree) if isinstance(n, ast.Call)}
        for n in ast.walk(tree):
            if isinstance(n, ast.Attribute) and n.attr in ATTRS and id(n) not in called:
                root = dotted(n)
                if not (root and root[0] in aliases):  # pas np.T / pd.index...
                    calls.append(("." + n.attr, "." + n.attr))
            if not isinstance(n, ast.Call):
                continue
            f = n.func
            if isinstance(f, ast.Name):
                name = f.id
                if name in SKIP_BUILTINS or name in local_defs:
                    continue
                if name in aliases:
                    calls.append((aliases[name], name))
            elif isinstance(f, ast.Attribute):
                parts = dotted(f)
                if parts and parts[0] in aliases:
                    full = aliases[parts[0]] + "." + ".".join(parts[1:])
                    calls.append((full, ".".join(parts)))
                else:
                    calls.append(("." + f.attr, "." + f.attr))
    else:  # repli : regex (code incomplet / erreur de syntaxe)
        for m in re.finditer(r"(?<![\w.])([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*\(", code):
            parts = m.group(1).split(".")
            if parts[0] in aliases:
                full = aliases[parts[0]] + ("." + ".".join(parts[1:]) if len(parts) > 1 else "")
                calls.append((full, m.group(1)))
            elif len(parts) > 1:
                calls.append(("." + parts[-1], "." + parts[-1]))
        for m in re.finditer(r"\)\s*\.([A-Za-z_]\w*)\s*\(", code):
            calls.append(("." + m.group(1), "." + m.group(1)))
        for m in re.finditer(r"\.(\w+)\b(?!\s*\()", code):
            if m.group(1) in ATTRS:
                calls.append(("." + m.group(1), "." + m.group(1)))
    return calls


def local_definitions(code_cells):
    names = set()
    for code in code_cells:
        tree = try_parse(code)
        if tree is None:
            continue
        for n in ast.walk(tree):
            if isinstance(n, (ast.FunctionDef, ast.ClassDef)):
                names.add(n.name)
    return names


# --------------------------------------------------------------------------- sorties
def save_image(b64, ext):
    import base64
    raw = base64.b64decode(b64)
    name = hashlib.sha1(raw).hexdigest()[:16] + "." + ext
    path = IMG_DIR / name
    if not path.exists():
        path.write_bytes(raw)
    return "img/" + name


def extract_outputs(cell):
    outs = []
    for o in cell.get("outputs", [])[:6]:
        t = o.get("output_type")
        if t == "stream":
            if o.get("name") == "stderr":  # avertissements / warnings : du bruit
                continue
            text = ANSI.sub("", "".join(o.get("text", "")))
            if text.strip():
                outs.append({"t": "text", "v": text[:MAX_TEXT_OUT]})
        elif t in ("execute_result", "display_data"):
            data = o.get("data", {})
            join = lambda v: "".join(v) if isinstance(v, list) else v
            if "image/png" in data:
                outs.append({"t": "img", "src": save_image(join(data["image/png"]), "png")})
            elif "image/jpeg" in data:
                outs.append({"t": "img", "src": save_image(join(data["image/jpeg"]), "jpg")})
            elif "text/html" in data and "<table" in join(data["text/html"]) \
                    and "<script" not in join(data["text/html"]) \
                    and len(join(data["text/html"])) < MAX_HTML_OUT:
                html = re.sub(r"<style[\s\S]*?</style>", "", join(data["text/html"]))
                outs.append({"t": "html", "v": html})
            elif "text/plain" in data:
                outs.append({"t": "text", "v": join(data["text/plain"])[:MAX_TEXT_OUT]})
        elif t == "error":
            outs.append({"t": "error", "v": f"{o.get('ename')}: {ANSI.sub('', o.get('evalue', ''))}"[:600]})
    return outs


# --------------------------------------------------------------------------- markdown
HEADING = re.compile(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$", re.M)


def strip_md(s):
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[*_`]", "", s)
    return s.strip()


# --------------------------------------------------------------------------- main
def main():
    IMG_DIR.mkdir(exist_ok=True)
    for old in IMG_DIR.glob("*"):
        if old.suffix in (".png", ".jpg"):
            old.unlink()

    paths = sorted(
        p for p in ROOT.rglob("*.ipynb")
        if not any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts)
    )

    notebooks, cells = [], []
    functions = {}
    forms = defaultdict(Counter)

    for path in paths:
        try:
            nb = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:  # notebook corrompu
            print(f"  ! ignoré {path}: {e}")
            continue
        rel = path.relative_to(ROOT)
        nb_id = len(notebooks)
        notebooks.append({
            "path": str(rel).replace("\\", "/"),
            "title": path.stem,
            "chapter": rel.parts[-2] if len(rel.parts) > 1 else "",
            "kind": notebook_kind(path),
            "cells": [],  # tout le notebook, dans l'ordre : {"m": markdown} ou {"c": id de cellule de code}
        })
        nb_cells = notebooks[-1]["cells"]

        code_cells = [src(c) for c in nb.get("cells", []) if c.get("cell_type") == "code"]
        aliases = collect_aliases(code_cells)
        local_defs = local_definitions(code_cells)

        section, context = "", ""
        for idx, cell in enumerate(nb.get("cells", [])):
            text = src(cell)
            if cell.get("cell_type") == "markdown":
                heads = HEADING.findall(text)
                if heads:
                    section = strip_md(heads[-1])[:120]
                body = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)          # images
                body = re.sub(r"<img[^>]*>", "", body)
                if body.strip():
                    context = body.strip()[:MAX_CONTEXT]
                    nb_cells.append({"m": body.strip()})
                continue
            if cell.get("cell_type") != "code" or not text.strip():
                continue

            calls = find_calls(text, aliases, local_defs)
            keys = []
            for key, form in calls:
                forms[key][form] += 1
                if key not in keys:
                    keys.append(key)
                f = functions.setdefault(key, {"key": key, "cells": [], "count": 0})
                f["count"] += 1
            cell_id = len(cells)
            nb_cells.append({"c": cell_id})
            for key in keys:
                functions[key]["cells"].append(cell_id)

            cells.append({
                "nb": nb_id,
                "i": idx,
                "section": section,
                "ctx": context,
                "code": text.rstrip(),
                "out": extract_outputs(cell),
                "f": keys,
            })

    # métadonnées des fonctions
    for key, f in functions.items():
        if key.startswith("."):
            lib, short, display = "méthodes", key[1:], key
        else:
            root = key.split(".")[0]
            lib = LIB_GROUPS.get(root, "autres")
            short = key.split(".")[-1]
            display = forms[key].most_common(1)[0][0]
        f.update({"lib": lib, "short": short, "display": display, "doc": doc_url(key, lib, short)})

    data = {
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "notebooks": notebooks,
        "cells": cells,
        "functions": sorted(functions.values(), key=lambda f: -f["count"]),
    }
    js = "window.ADA_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (TOOL_DIR / "data.js").write_text(js, encoding="utf-8")

    n_img = len(list(IMG_DIR.glob("*")))
    print(f"OK : {len(notebooks)} notebooks, {len(cells)} cellules, {len(functions)} fonctions, "
          f"{n_img} images -> data.js ({len(js) / 1e6:.1f} Mo)")


if __name__ == "__main__":
    main()
