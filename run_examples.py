#!/usr/bin/env python3
"""
Exécute pour de vrai tous les exemples des fiches (kb_functions.js) et des recettes (kb_recipes.js)
sur les données fictives de donnees_exemple.py, et enregistre leurs sorties (texte, tableaux, graphiques).

Usage (dans l'environnement qui a pandas, seaborn, statsmodels, sklearn, networkx) :
    ../.venv/Scripts/python.exe run_examples.py            # tout
    ../.venv/Scripts/python.exe run_examples.py groupby    # seulement ce qui contient "groupby" (débogage)

Produit :
    examples.js   -> window.ADA_EX = {preamble, fn: {nom: sorties}, rec: {id: [sorties par étape]}}
    img/ex/       -> les graphiques
"""
import ast
import contextlib
import copy
import hashlib
import io
import json
import os
import re
import shutil
import sys
import tempfile
import time
import traceback
import warnings
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

TOOL = Path(__file__).resolve().parent
IMG = TOOL / "img" / "ex"
ONLY = sys.argv[1] if len(sys.argv) > 1 else None
MAX_TEXT = 2500

warnings.filterwarnings("ignore")
pd.set_option("display.max_rows", 12)
pd.set_option("display.max_columns", 10)
pd.set_option("display.width", 100)
np.set_printoptions(threshold=40, edgeitems=4, linewidth=100, legacy="1.25")  # 0.5 au lieu de np.float64(0.5)
plt.rcParams.update({"figure.figsize": (6, 3.8), "figure.dpi": 90, "savefig.bbox": "tight"})


# =============================================================================== mini-lecteur JS
def _skip(src, i):
    while i < len(src):
        if src[i].isspace():
            i += 1
        elif src.startswith("//", i):
            i = src.index("\n", i) if "\n" in src[i:] else len(src)
        elif src.startswith("/*", i):
            i = src.index("*/", i) + 2
        else:
            break
    return i


_ESC = {"n": "\n", "t": "\t", "r": "\r", "\\": "\\", "'": "'", '"': '"', "`": "`", "$": "$", "0": "\0"}


def _string(src, i):
    q = src[i]
    i += 1
    out = []
    while src[i] != q:
        if src[i] == "\\":
            nxt = src[i + 1]
            if nxt == "u":
                out.append(chr(int(src[i + 2:i + 6], 16)))
                i += 6
                continue
            out.append(_ESC.get(nxt, nxt))
            i += 2
        else:
            out.append(src[i])
            i += 1
    return "".join(out), i + 1


def _value(src, i):
    i = _skip(src, i)
    c = src[i]
    if c in "\"'`":
        return _string(src, i)
    if c == "[":
        arr, i = [], i + 1
        while True:
            i = _skip(src, i)
            if src[i] == "]":
                return arr, i + 1
            v, i = _value(src, i)
            arr.append(v)
            i = _skip(src, i)
            if src[i] == ",":
                i += 1
    m = re.compile(r"[A-Za-z_$][\w$]*").match(src, i)
    if m:
        return ("ident", m.group(0)), m.end()
    raise ValueError(f"valeur JS inattendue à {i}: {src[i:i + 30]!r}")


def js_calls(path, fname):
    src = path.read_text(encoding="utf-8")
    # variables L / C (librairie, catégorie) : valeur = dernière affectation avant l'appel
    assigns = [(m.start(), m.group(1), m.group(2)) for m in re.finditer(r'\b([LC])\s*=\s*"([^"]*)"', src)]

    def resolve(v, pos):
        if isinstance(v, tuple) and v[0] == "ident":
            vals = [val for p, name, val in assigns if name == v[1] and p < pos]
            return vals[-1] if vals else None
        return v

    calls = []
    for m in re.finditer(rf"^\s*{fname}\(", src, re.M):
        i, args = m.end(), []
        while True:
            i = _skip(src, i)
            if src[i] == ")":
                break
            v, i = _value(src, i)
            args.append(resolve(v, m.start()))
            i = _skip(src, i)
            if src[i] == ",":
                i += 1
        calls.append(args)
    return calls


# =============================================================================== exécution
def fmt(v):
    """Comme Jupyter : affiche la valeur de la dernière ligne si c'est une expression."""
    if v is None:
        return None
    mod = type(v).__module__ or ""
    if mod.startswith(("matplotlib", "seaborn")):
        return None
    if isinstance(v, (list, tuple)) and v and (type(v[0]).__module__ or "").startswith("matplotlib"):
        return None
    if isinstance(v, pd.DataFrame):
        return {"t": "html", "v": v.to_html(max_rows=10, max_cols=10, border=0)}
    if hasattr(v, "as_text"):  # résumé statsmodels
        return {"t": "text", "v": v.as_text()[:6000]}
    return {"t": "text", "v": repr(v)[:MAX_TEXT]}


def has_data(fig):
    for ax in fig.axes:
        if ax.lines or ax.patches or ax.collections or ax.images or ax.containers or ax.tables:
            return True
    return False


def save_fig(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    raw = buf.getvalue()
    name = hashlib.sha1(raw).hexdigest()[:16] + ".png"
    (IMG / name).write_bytes(raw)
    return {"t": "img", "src": "img/ex/" + name}


def _root_name(node):
    while isinstance(node, (ast.Subscript, ast.Attribute)):
        node = node.value
    return node.id if isinstance(node, ast.Name) else None


def _short(v):
    if isinstance(v, (pd.DataFrame, pd.Series, np.ndarray)):
        return f"{type(v).__name__} de forme {v.shape}"
    return repr(v)[:300]


def show_assignment(stmt, ns):
    """Si l'exemple finit par une affectation, on montre ce qui vient d'être calculé."""
    targets = stmt.targets if isinstance(stmt, ast.Assign) else [stmt.target]
    t = targets[-1]
    if isinstance(t, ast.Name):
        return fmt(ns.get(t.id))
    if isinstance(t, ast.Tuple):
        names = [e.id for e in t.elts if isinstance(e, ast.Name) and e.id != "_"]
        if len(names) == 1:
            return fmt(ns.get(names[0]))
        return {"t": "text", "v": "\n".join(f"{n} = {_short(ns.get(n))}" for n in names)}
    if isinstance(t, ast.Subscript):  # df['col'] = ...  -> on montre la colonne
        root = _root_name(t)
        obj = ns.get(root)
        key = t.slice.value if isinstance(t.slice, ast.Constant) and isinstance(t.slice.value, str) else None
        if isinstance(obj, pd.DataFrame):
            return fmt(obj[[key]].head(8) if key in obj.columns else obj.head(8))
    return None


def numeric_tuple(stmt, ns):
    """`t, p = stats.ttest_ind(...)` : plusieurs noms, tous des nombres -> ça vaut la peine de l'afficher."""
    t = stmt.targets[-1] if isinstance(stmt, ast.Assign) else None
    if not isinstance(t, ast.Tuple):
        return False
    vals = [ns.get(e.id) for e in t.elts if isinstance(e, ast.Name) and e.id != "_"]
    return bool(vals) and all(isinstance(v, (int, float, np.number)) and not isinstance(v, bool) for v in vals)


NEEDS_AX = re.compile(r"\b(ax|axes|fig)\b")
DEFINES_AX = re.compile(r"\b(fig|ax|axes)\s*(,\s*\w+\s*)?=")


def run_code(code, ns):
    """Exécute `code` dans `ns` ; renvoie la liste des sorties (texte, tableau, graphique, erreur)."""
    plt.close("all")
    if NEEDS_AX.search(code) and not DEFINES_AX.search(code):
        ns["fig"], ns["axes"] = plt.subplots(1, 2, figsize=(10, 3.8))
        ns["ax"] = ns["axes"][0]
    outs, out_buf = [], io.StringIO()
    err = None

    def flush_text():
        text = out_buf.getvalue()
        if text.strip():
            outs.append({"t": "text", "v": text[:MAX_TEXT]})
        out_buf.seek(0)
        out_buf.truncate()

    # Comme Jupyter en mode « toutes les expressions » : chaque ligne qui produit une valeur l'affiche,
    # et si l'exemple finit par une affectation, on montre ce qui vient d'être calculé.
    try:
        tree = ast.parse(code)
        for k, stmt in enumerate(tree.body):
            with contextlib.redirect_stdout(out_buf):
                if isinstance(stmt, ast.Expr):
                    val = eval(compile(ast.Expression(stmt.value), "<exemple>", "eval"), ns)
                else:
                    exec(compile(ast.Module(body=[stmt], type_ignores=[]), "<exemple>", "exec"), ns)
                    val = None
            flush_text()
            shown = fmt(val) if isinstance(stmt, ast.Expr) else None
            if shown is None and isinstance(stmt, (ast.Assign, ast.AugAssign, ast.AnnAssign)):
                if k == len(tree.body) - 1 or numeric_tuple(stmt, ns):  # dernière ligne, ou « t, p = test(...) »
                    shown = show_assignment(stmt, ns)
            if shown:
                outs.append(shown)
    except Exception as e:  # noqa: BLE001
        flush_text()
        err = f"{type(e).__name__}: {e}"
    for num in plt.get_fignums():
        fig = plt.figure(num)
        if has_data(fig):
            outs.append(save_fig(fig))
    plt.close("all")
    if err:
        outs.append({"t": "error", "v": err[:600]})
    return outs, err


def fresh(base):
    """Copie de l'espace de noms des données, pour qu'un exemple ne modifie pas les suivants."""
    ns = {}
    for k, v in base.items():
        if isinstance(v, (pd.DataFrame, pd.Series, np.ndarray, list, dict)) and k != "__builtins__":
            ns[k] = v.copy()
        elif k == "G":
            ns[k] = v.copy()
        else:
            ns[k] = v
    return ns


def make_data_files(base):
    """Fichiers lus par les exemples « charger un fichier »."""
    os.makedirs("data", exist_ok=True)
    d = base["df"].head(50)
    for stem in ("file", "fichier"):
        d.to_csv(f"data/{stem}.csv", index=False)
        d.to_csv(f"data/{stem}.tsv", sep="\t", index=False)
        d.to_csv(f"data/{stem}.tsv.gz", sep="\t", index=False, compression="gzip")
        d.to_csv(f"data/{stem}.csv.gz", index=False, compression="gzip")
        d.to_json(f"data/{stem}.jsonl", orient="records", lines=True, date_format="iso")
        d.to_excel(f"data/{stem}.xlsx", sheet_name="Feuil1", index=False)
    d.to_pickle("data/df.pkl")
    Path("data/script.txt").write_text(base["script_brut"], encoding="utf-8")
    os.makedirs("data/livres", exist_ok=True)
    full = base["df"]
    for sujet in sorted(full["sujet"].unique()):
        txt = ". ".join(full.loc[full["sujet"] == sujet, "texte"]) + "."
        Path(f"data/livres/{sujet}.txt").write_text(txt, encoding="utf-8")


def main():
    preamble = (TOOL / "donnees_exemple.py").read_text(encoding="utf-8")
    funcs = js_calls(TOOL / "kb_functions.js", "F")
    recs = js_calls(TOOL / "kb_recipes.js", "R")

    shutil.rmtree(IMG, ignore_errors=True)
    IMG.mkdir(parents=True)
    work = tempfile.mkdtemp(prefix="ada_ex_")
    old_cwd = os.getcwd()
    os.chdir(work)
    t0 = time.time()
    base = {}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(preamble, "donnees_exemple.py", "exec"), base)
    make_data_files(base)

    dfx = base["df"]
    result = {"preamble": preamble, "fn": {}, "rec": {},
              "df": dfx.head(8).to_html(max_cols=40, border=0),
              "cols": [[c, str(dfx[c].dtype), repr(dfx[c].iloc[0])[:40]] for c in dfx.columns]}
    errors = []
    for args in funcs:
        name, code = args[2], args[5]
        if ONLY and ONLY not in name and ONLY not in code:
            continue
        outs, err = run_code(code, fresh(base))
        result["fn"][name] = outs
        if err:
            errors.append(f"[fiche] {name}: {err}")
    # les recettes d'une même catégorie s'enchaînent (ex. score de propension -> matching -> équilibre)
    cur_cat, ns = None, None
    for args in recs:
        cat, rid, steps = args[0], args[1], args[5]
        if ONLY and ONLY not in rid and not any(ONLY in s[1] for s in steps):
            continue
        if cat != cur_cat:
            cur_cat, ns = cat, fresh(base)
        step_outs = []
        for k, (txt, code) in enumerate(steps):
            if not code.strip() or code.lstrip().startswith("# \""):  # étape de texte / rédaction
                step_outs.append([])
                continue
            outs, err = run_code(code, ns)
            step_outs.append(outs)
            if err:
                errors.append(f"[recette] {rid} étape {k + 1}: {err}")
        result["rec"][rid] = step_outs

    # guide d'interprétation : chaque fiche est indépendante
    result["guide"] = {}
    for args in js_calls(TOOL / "kb_interpret.js", "G"):
        gid, code = args[1], args[5]
        if not code.strip() or (ONLY and ONLY not in gid and ONLY not in code):
            continue
        outs, err = run_code(code, fresh(base))
        result["guide"][gid] = outs
        if err:
            errors.append(f"[guide] {gid}: {err}")

    os.chdir(old_cwd)
    shutil.rmtree(work, ignore_errors=True)
    js = "window.ADA_EX = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n"
    if not ONLY:
        (TOOL / "examples.js").write_text(js, encoding="utf-8")
    n_img = len(list(IMG.glob("*.png")))
    print(f"{len(result['fn'])} fiches, {len(result['rec'])} recettes, {len(result['guide'])} fiches guide, {n_img} graphiques, "
          f"{len(errors)} erreurs, {time.time() - t0:.0f} s -> examples.js ({len(js) / 1e6:.1f} Mo)")
    for e in errors:
        print("  ✗", e)


if __name__ == "__main__":
    main()
