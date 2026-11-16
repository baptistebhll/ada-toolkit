#!/usr/bin/env python3
"""
Extrait, pour chaque fiche de kb_functions.js, la liste COMPLÈTE des paramètres de la vraie fonction :
nom, type / valeurs possibles, valeur par défaut, description (doc officielle, en anglais).

Source : les docstrings des librairies installées (format numpydoc) + inspect.signature pour les défauts.

Usage (depuis exam-tool, avec le Python qui a pandas, sklearn, statsmodels, seaborn, networkx) :
    ../.venv/Scripts/python.exe extract_params.py
Produit : params.js -> window.ADA_PARAMS = {nom_de_fiche: {src, sig, params: [{n, t, d, v, x}]}}
"""
import importlib
import inspect
import json
import re
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
TOOL = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOL))
from run_examples import js_calls  # noqa: E402  (même lecteur de kb_functions.js)

import matplotlib  # noqa: E402
matplotlib.use("Agg")
import matplotlib.axes  # noqa: E402
import matplotlib.pyplot as plt  # noqa: E402
import networkx as nx  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import scipy.stats  # noqa: E402
import seaborn as sns  # noqa: E402
import statsmodels.api as sm  # noqa: E402
import statsmodels.formula.api as smf  # noqa: E402
from sklearn.ensemble import RandomForestClassifier  # noqa: E402
from sklearn.linear_model import LogisticRegression  # noqa: E402
from statsmodels.regression.linear_model import RegressionResults  # noqa: E402

MAX_DESC = 900

ROOTS = {
    "pd": pd, "np": np, "plt": plt, "sns": sns, "stats": scipy.stats, "smf": smf, "sm": sm, "nx": nx,
    "df": pd.DataFrame, "s": pd.Series, "ax": matplotlib.axes.Axes, "res": RegressionResults,
    "model": LogisticRegression, "G": nx.Graph,
}
# quelques méthodes « génériques » dont la meilleure doc est ailleurs
OVERRIDE = {
    "model.feature_importances_": (RandomForestClassifier, "feature_importances_"),
    "df.agg": (pd.DataFrame, "agg"),
    "df.transform": ("pandas.core.groupby.generic", "SeriesGroupBy.transform"),
    "model.fit_predict": ("sklearn.cluster", "KMeans.fit_predict"),
    "model.fit_transform": ("sklearn.preprocessing", "StandardScaler.fit_transform"),
    "plt.xlim": ("matplotlib.axes", "Axes.set_xlim"),
    "stats.norm": ("scipy.stats", "norm.pdf"),
}


def resolve(name):
    if name in OVERRIDE:
        base, attr = OVERRIDE[name]
        obj = importlib.import_module(base) if isinstance(base, str) else base
        for a in attr.split("."):
            obj = getattr(obj, a)
        return obj
    parts = name.split(".")
    if parts[0] in ("sklearn", "statsmodels", "scipy"):
        for i in range(len(parts) - 1, 0, -1):  # le plus long préfixe importable
            try:
                obj = importlib.import_module(".".join(parts[:i]))
            except ImportError:
                continue
            for a in parts[i:]:
                obj = getattr(obj, a)
            return obj
        return None
    obj = ROOTS.get(parts[0])
    if obj is None:
        return None
    for a in parts[1:]:
        obj = getattr(obj, a)
    return obj


def full_name(obj, fallback):
    mod = getattr(obj, "__module__", None) or ""
    q = getattr(obj, "__qualname__", None) or getattr(obj, "__name__", None)
    return f"{mod}.{q}" if mod and q else fallback


# ------------------------------------------------------------------------------- docstrings numpydoc
def clean_rst(s):
    s = re.sub(r":[\w:]+:`~?([^`<]+?)(?:\s*<[^>]+>)?`", r"\1", s)   # :class:`pandas.DataFrame` -> pandas.DataFrame
    s = re.sub(r"``([^`]+)``", r"\1", s)
    s = re.sub(r"`([^`]+)`_?", r"\1", s)
    s = re.sub(r"\|([^|]+)\|", r"\1", s)
    return s


SECTION = re.compile(r"^(Parameters|Other Parameters|Arguments|Keyword Arguments|Returns|Yields|Raises|See Also|Notes|"
                     r"Examples|References|Attributes|Methods|Warns|Warnings|Return|Version)\s*$")


def parse_params(doc, sections=("Parameters", "Other Parameters", "Keyword Arguments")):
    if not doc:
        return []
    lines = inspect.cleandoc(doc).splitlines()
    out, i = [], 0
    while i < len(lines) - 1:
        head = lines[i].strip()
        if head in sections and re.match(r"^\s*-{3,}\s*$", lines[i + 1]):
            base_indent = len(lines[i]) - len(lines[i].lstrip())
            i += 2
            cur = None
            while i < len(lines):
                line = lines[i]
                if SECTION.match(line.strip()) and i + 1 < len(lines) and re.match(r"^\s*-{3,}\s*$", lines[i + 1]):
                    break
                indent = len(line) - len(line.lstrip())
                if line.strip() and indent <= base_indent:
                    m = re.match(r"^\s*([*\w][\w*, ]*?)\s*(?::\s*(.*))?$", line)
                    if m:
                        cur = {"n": m.group(1).strip(), "t": clean_rst((m.group(2) or "").strip()), "x": []}
                        out.append(cur)
                elif cur is not None:
                    cur["x"].append(line.strip())
                i += 1
            continue
        i += 1
    for p in out:
        desc = "\n".join(p["x"]).strip()
        desc = re.sub(r"\n(?!\s*[-*•]|\n)", " ", desc)            # recolle les lignes coupées, garde les listes
        p["x"] = clean_rst(re.sub(r"[ \t]+", " ", desc))[:MAX_DESC]
    return out


def choices(t):
    """{'inner', 'left', 'outer'} -> ['inner', 'left', 'outer']"""
    m = re.search(r"\{([^}]*)\}", t)
    if not m:
        return []
    vals = [v.strip() for v in m.group(1).split(",") if v.strip()]
    return vals if 1 < len(vals) <= 25 else []


def bullet_choices(desc):
    """Valeurs listées en puces dans la description :  - 'line' : ...   /   - count: ..."""
    vals = re.findall(r"^\s*[-*•]\s*('[^']+'|\"[^\"]+\"|[\w.]+)\s*:", desc, re.M)
    return vals if 1 < len(vals) <= 25 else []


def describe(name):
    obj = resolve(name)
    if obj is None:
        return None
    target = obj
    params = parse_params(inspect.getdoc(obj) or "")
    if inspect.isclass(obj):  # ex. df.plot (accesseur) : la vraie liste est parfois dans __call__
        cands = [params, parse_params(inspect.getdoc(getattr(obj, "__call__", None)) or "")]
        if len(params) <= 1:  # pandas 3 : la doc de df.plot range x, y, kind... sous « Attributes »
            cands.append(parse_params(inspect.getdoc(obj) or "", ("Parameters", "Attributes")))
        params = max(cands, key=len)
    defaults, sig = {}, None
    try:
        s = inspect.signature(target)
        ps = [p for p in s.parameters.values() if p.name not in ("self", "cls")]
        for p in ps:
            if p.default is not inspect.Parameter.empty:
                defaults[p.name] = repr(p.default)[:80]
        sig = f"({', '.join(str(p) for p in ps)})"
        if len(sig) > 600:
            sig = sig[:600] + " …)"
    except (TypeError, ValueError):
        pass
    if not params and sig is None:
        return None
    if sig and params and sig.count(",") + 1 < 0.5 * len(params):  # ex. df.plot : signature (data) trompeuse
        sig = None
    rows = []
    for p in params:
        names = [n.strip() for n in p["n"].split(",")]
        d = next((defaults[n] for n in names if n in defaults), None)
        if d is None:
            m = re.search(r"default(?:s)?\s*(?:is|=|:)?\s*([^,;]+)", p["t"])
            d = m.group(1).strip() if m else None
        rows.append({"n": p["n"], "t": p["t"], "d": d, "v": choices(p["t"]) or bullet_choices(p["x"]), "x": p["x"]})
    return {"src": full_name(obj, name), "sig": sig, "params": rows}


def main():
    funcs = js_calls(TOOL / "kb_functions.js", "F")
    result, missing = {}, []
    for args in funcs:
        name = args[2]
        try:
            info = describe(name)
        except Exception as e:  # noqa: BLE001
            info = None
            missing.append(f"{name} ({type(e).__name__}: {e})")
            continue
        if info and info["params"]:
            result[name] = info
        else:
            missing.append(name)
    import scipy
    import sklearn
    import statsmodels
    versions = {"pandas": pd.__version__, "numpy": np.__version__, "matplotlib": matplotlib.__version__,
                "seaborn": sns.__version__, "scipy": scipy.__version__, "statsmodels": statsmodels.__version__,
                "scikit-learn": sklearn.__version__, "networkx": nx.__version__}
    result["_versions"] = versions
    js = "window.ADA_PARAMS = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (TOOL / "params.js").write_text(js, encoding="utf-8")
    n_par = sum(len(v["params"]) for k, v in result.items() if k != "_versions")
    print(f"{len(result) - 1} fiches avec paramètres ({n_par} paramètres), {len(missing)} sans -> params.js ({len(js) / 1e6:.1f} Mo)")
    print("sans paramètres :", ", ".join(missing))


if __name__ == "__main__":
    main()
