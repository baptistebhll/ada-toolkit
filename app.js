/* ADA toolkit — antisèche d'analyse de données : recettes, référence des librairies,
 * exemples tirés des notebooks du cours, lecteur de notebooks. 100 % local, aucune IA. */
(() => {
  "use strict";
  const D = window.ADA_DATA;
  const KB = window.ADA_KB || { functions: [], recipes: [] };
  const S = window.AdaSearch;
  const $ = (s) => document.querySelector(s);
  const main = $("#main"), side = $("#side"), qInput = $("#q");

  if (!D || !S) {
    main.innerHTML = `<div class="empty"><h2>Index introuvable</h2>
      <p>Lance d'abord <code>python build_index.py</code> dans le dossier <code>exam-tool</code>, puis recharge la page.</p></div>`;
    return;
  }

  // ================================================================== constantes
  const LIB_ORDER = ["pandas", "numpy", "matplotlib", "seaborn", "scipy", "statsmodels", "scikit-learn", "networkx", "math", "autres", "méthodes"];
  const LIB_INFO = {
    pandas: { c: "#7c5cff", d: "Tableaux de données : lire, nettoyer, filtrer, grouper, joindre.", imp: "import pandas as pd" },
    numpy: { c: "#3fa7d6", d: "Calcul numérique, tableaux, tirages aléatoires.", imp: "import numpy as np" },
    matplotlib: { c: "#f08a24", d: "Graphiques de base : figures, axes, titres, échelles.", imp: "import matplotlib.pyplot as plt" },
    seaborn: { c: "#4c9a9a", d: "Graphiques statistiques en une ligne (distributions, groupes, relations).", imp: "import seaborn as sns" },
    scipy: { c: "#2b6cb0", d: "Tests statistiques, corrélations, lois de probabilité.", imp: "from scipy import stats" },
    statsmodels: { c: "#b0457d", d: "Régressions avec formules et résultats détaillés (p-values, IC).", imp: "import statsmodels.formula.api as smf\nimport statsmodels.api as sm" },
    "scikit-learn": { c: "#e0a100", d: "Machine learning : modèles, validation croisée, métriques, clustering, texte.", imp: "from sklearn.<module> import <Classe>" },
    networkx: { c: "#3c9a50", d: "Graphes et réseaux : construction, centralités, communautés, matching.", imp: "import networkx as nx" },
    math: { c: "#8a8f98", d: "Fonctions mathématiques de base.", imp: "import math" },
    autres: { c: "#8a8f98", label: "Autres librairies", d: "Autres librairies rencontrées dans les séries." },
    "méthodes": { c: "#8a8f98", label: "Autres méthodes", d: "Méthodes et attributs vus dans les séries, sans fiche détaillée." },
  };
  const libLabel = (lib) => (LIB_INFO[lib] && LIB_INFO[lib].label) || lib;
  const libColor = (lib) => (LIB_INFO[lib] && LIB_INFO[lib].c) || "#8a8f98";
  const KIND_LABEL = { solution: "Solution", exercice: "Mon exo", cours: "Cours" };
  const KIND_RANK = { solution: 3, cours: 2.6, exercice: 1 };
  const GENERIC = new Set(["matplotlib.pyplot.show", "matplotlib.pyplot.xlabel", "matplotlib.pyplot.ylabel", "matplotlib.pyplot.title",
    ".head", ".format", ".set_xlabel", ".set_ylabel", ".set_title", "matplotlib.pyplot.legend"]);
  const EXAMPLES = ["comparer la moyenne de deux groupes", "joindre deux tables", "valeurs manquantes", "régression logistique odds ratio",
    "intervalle de confiance bootstrap", "matching propensity score", "distribution queue lourde", "choisir k clustering",
    "courbe roc", "groupby", "p-value", "tester normalité", "variable catégorielle régression", "séries temporelles par mois"];
  const ALIAS = { pd: "pandas", np: "numpy", plt: "matplotlib.pyplot", sns: "seaborn", stats: "scipy.stats",
    smf: "statsmodels.formula.api", sm: "statsmodels.api", nx: "networkx", math: "math" };

  // ================================================================== utilitaires
  const esc = (s) => (s ?? "").toString().replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = S.norm;
  const store = {
    get(k, d) { try { const v = localStorage.getItem("ada." + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("ada." + k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
  };
  const enc = encodeURIComponent;
  const fnHref = (key) => "#f=" + enc(key);
  const recHref = (id) => "#r=" + enc(id);
  const libHref = (lib) => "#lib=" + enc(lib);
  const nbHref = (nb, cell) => "#nb=" + nb + (cell !== undefined ? "&c=" + cell : "");
  const plural = (n, s, p) => `${n} ${n > 1 ? (p || s + "s") : s}`;
  const codeMatch = (c, text) => (/[A-Z]/.test(text) ? c.code.includes(text) : c._code.includes(text.toLowerCase()));

  let COPY = [];
  const reg = (text) => { COPY.push(text); return COPY.length - 1; };

  // ================================================================== état
  const state = {
    src: store.get("src", "all"),
    chap: store.get("chap", "all"),
    open: store.get("open2", {}),
    tab: store.get("tab", "recettes"),
    route: { type: "home" },
    sel: 0,
    toc: [],
  };

  // ================================================================== données : fonctions
  function kbKey(name) {
    if (/^(sklearn|statsmodels|scipy)\./.test(name)) return name;
    const parts = name.split(".");
    if (ALIAS[parts[0]]) return ALIAS[parts[0]] + "." + parts.slice(1).join(".");
    if (parts.length > 1) return "." + parts[parts.length - 1];
    return name;
  }
  const kbDisplay = (name) => (/^(sklearn|statsmodels|scipy)\./.test(name) ? name.split(".").pop() : name);

  function docUrl(key, lib, short) {
    if (key.startsWith(".")) {
      if (lib === "scikit-learn") return `https://scikit-learn.org/stable/search.html?q=${short}`;
      if (lib === "statsmodels") return `https://www.statsmodels.org/stable/search.html?q=${short}`;
      if (lib === "networkx") return `https://networkx.org/documentation/stable/search.html?q=${short}`;
      if (lib === "matplotlib") return `https://matplotlib.org/stable/search.html?q=${short}`;
      return `https://pandas.pydata.org/docs/search.html?q=${short}`;
    }
    if (key.startsWith("pandas.")) return `https://pandas.pydata.org/docs/reference/api/${key}.html`;
    if (key.startsWith("numpy.")) return `https://numpy.org/doc/stable/reference/generated/${key}.html`;
    if (key.startsWith("matplotlib.pyplot.")) return `https://matplotlib.org/stable/api/_as_gen/${key}.html`;
    if (key.startsWith("seaborn.")) return `https://seaborn.pydata.org/generated/${key}.html`;
    if (key.startsWith("scipy.")) return `https://docs.scipy.org/doc/scipy/reference/generated/${key}.html`;
    if (key.startsWith("statsmodels.formula.api.")) return `https://www.statsmodels.org/stable/generated/${key}.html`;
    if (key.startsWith("statsmodels.")) return `https://www.statsmodels.org/stable/search.html?q=${short}`;
    if (key.startsWith("sklearn.")) return `https://scikit-learn.org/stable/modules/generated/${key}.html`;
    if (key.startsWith("networkx.")) return `https://networkx.org/documentation/stable/search.html?q=${short}`;
    if (key.startsWith("math.")) return `https://docs.python.org/3/library/math.html#${key}`;
    return null;
  }

  const FN = {};
  D.functions.forEach((f) => {
    FN[f.key] = { key: f.key, display: f.display, short: f.short, lib: f.lib, cat: null, cells: f.cells, count: f.count, doc: f.doc };
  });
  KB.functions.forEach((k, idx) => {
    const key = kbKey(k.name);
    const f = FN[key] || (FN[key] = { key, cells: [], count: 0, short: key.split(".").pop() });
    Object.assign(f, { display: kbDisplay(k.name), lib: k.lib, cat: k.cat, sig: k.sig, desc: k.d, ex: k.ex, tags: k.t || "", note: k.n || "", kb: true, kbIdx: idx });
    if (!f.doc) f.doc = docUrl(key, f.lib, f.short);
  });
  // ordre : fiches dans l'ordre du fichier kb_functions.js, puis les fonctions vues seulement en série
  const FNS = Object.values(FN).sort((a, b) => {
    if (a.kb && b.kb) return a.kbIdx - b.kbIdx;
    if (a.kb !== b.kb) return a.kb ? -1 : 1;
    return (b.count || 0) - (a.count || 0);
  });
  FNS.forEach((f) => { if (!f.doc) f.doc = docUrl(f.key, f.lib, f.short); });

  // ================================================================== données : recettes, cellules
  const RECIPES = KB.recipes.map((r) => ({ ...r, keys: (r.fns || []).map(kbKey).filter((k) => FN[k]) }));
  const REC = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
  const RCATS = [...new Set(RECIPES.map((r) => r.cat))];
  const recipesUsing = (key) => RECIPES.filter((r) => r.keys.includes(key));

  D.cells.forEach((c, i) => { c.id = i; c._code = c.code.toLowerCase(); });
  const chapters = [...new Set(D.notebooks.map((n) => n.chapter))].sort();

  function cellVisible(c) {
    const nb = D.notebooks[c.nb];
    if (state.chap !== "all" && nb.chapter !== state.chap) return false;
    if (state.src === "ref" && nb.kind === "exercice") return false;
    if (state.src === "mine" && nb.kind !== "exercice") return false;
    return true;
  }
  const visibleCells = (f) => (f.cells || []).map((i) => D.cells[i]).filter(cellVisible);

  // ================================================================== index de recherche
  const DOCS = [];
  RECIPES.forEach((r) => DOCS.push({ type: "recipe", ref: r, f: {
    title: r.title, tags: r.t, desc: r.intro + " " + (r.tips || []).join(" "),
    body: r.cat + " " + r.steps.map((s) => s[0]).join(" "), code: r.steps.map((s) => s[1]).join("\n") } }));
  FNS.forEach((f) => DOCS.push({ type: "fn", ref: f, f: {
    name: f.display + " " + f.key, tags: f.tags || "", desc: (f.desc || "") + " " + (f.note || ""),
    body: (f.cat || "") + " " + libLabel(f.lib), code: (f.sig || "") + "\n" + (f.ex || "") } }));
  D.cells.forEach((c) => DOCS.push({ type: "cell", ref: c, f: { title: c.section, body: c.ctx, code: c.code } }));
  const IX = S.createIndex(DOCS);

  function runSearch(q) {
    const nq = norm(q).replace(/[()]/g, "").trim();
    return S.search(IX, q, {
      accept: (d) => d.type !== "cell" || cellVisible(d.ref),
      prior: (d) => (d.type === "recipe" ? 1.25 : d.type === "fn" ? (d.ref.kb ? 1.15 : 0.85) : 0.7),
      exact: (d) => d.type === "fn" && [d.ref.display, d.ref.short, d.ref.key].some((x) => norm(x) === nq),
    });
  }

  // ================================================================== coloration Python
  const KW = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "));
  const BI = new Set("print len range list dict set tuple int float str bool type isinstance enumerate zip sorted sum min max abs round open map filter display any all super".split(" "));
  const TOK = /(#[^\n]*)|((?:\b[rRbBuUfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))|(\b\d[\d_]*(?:\.\d*)?(?:[eE][+-]?\d+)?j?\b)|([A-Za-z_]\w*)|(\s+|[\s\S])/g;

  function wrap(text, cls, start, ranges) {
    let html = "";
    if (!ranges.length) html = esc(text);
    else {
      let pos = 0;
      for (const [a, b] of ranges) {
        const s = Math.max(a - start, 0), e = Math.min(b - start, text.length);
        if (e <= s || s < pos) continue;
        html += esc(text.slice(pos, s)) + `<mark class="hit">${esc(text.slice(s, e))}</mark>`;
        pos = e;
      }
      html += esc(text.slice(pos));
    }
    return cls ? `<span class="${cls}">${html}</span>` : html;
  }

  /** opt.fn : nom à surligner ; opt.text : sous-chaîne à surligner */
  function highlight(code, opt = {}) {
    const ranges = [];
    if (opt.text) {
      const cs = /[A-Z]/.test(opt.text);
      const lc = cs ? code : code.toLowerCase(), t = cs ? opt.text : opt.text.toLowerCase();
      for (let i = lc.indexOf(t); i >= 0 && t; i = lc.indexOf(t, i + t.length)) ranges.push([i, i + t.length]);
    }
    let out = "", m;
    TOK.lastIndex = 0;
    while ((m = TOK.exec(code))) {
      const s = m[0], start = m.index;
      let cls = "";
      if (m[1]) cls = "com";
      else if (m[2]) cls = "str";
      else if (m[3]) cls = "num";
      else if (m[4]) {
        const prev = code[start - 1];
        const after = code.slice(start + s.length, start + s.length + 40).match(/^\s*([(\[])?/)[1];
        if (KW.has(s)) cls = "kw";
        else if (after === "(") cls = BI.has(s) ? "bi" : "fn";
        else if (prev === ".") cls = "attr";
        if (opt.fn && s === opt.fn && (after || prev === ".")) { out += `<mark class="hit">${wrap(s, cls, start, [])}</mark>`; continue; }
      }
      out += wrap(s, cls, start, ranges);
    }
    return out;
  }

  // ================================================================== markdown
  function inline(t) {
    return esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/__([^_]+)__/g, "<b>$1</b>")
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<i>$2</i>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  }

  /** opt.shift : décaler les niveaux de titres ; opt.onHeading(niveau, texte) -> id */
  function mdToHtml(src, opt = {}) {
    const s = (src || "").replace(/\r/g, "").replace(/<br\s*\/?>/gi, "\n").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/<[^>]+>/g, "");
    const out = [];
    let para = [], list = null, code = null, table = null;
    const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
    const flushList = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.t}>`); list = null; } };
    const flushTable = () => {
      if (table) {
        const [head, ...rows] = table;
        out.push(`<div class="md-table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${
          rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
        table = null;
      }
    };
    const flushAll = () => { flushPara(); flushList(); flushTable(); };
    for (const line of s.split("\n")) {
      if (code) {
        if (/^\s*```/.test(line)) { out.push(`<pre class="code"><code>${highlight(code.join("\n"))}</code></pre>`); code = null; }
        else code.push(line);
        continue;
      }
      if (/^\s*```/.test(line)) { flushAll(); code = []; continue; }
      const h = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (h) {
        flushAll();
        const lvl = Math.min(6, h[1].length + (opt.shift || 0));
        const id = opt.onHeading ? opt.onHeading(h[1].length, h[2]) : null;
        out.push(`<h${lvl}${id ? ` id="${id}"` : ""}>${inline(h[2])}</h${lvl}>`);
        continue;
      }
      const li = line.match(/^\s*([-*+]|\d+[.)])\s+(.*)$/);
      if (li) {
        flushPara(); flushTable();
        const t = /\d/.test(li[1]) ? "ol" : "ul";
        if (!list || list.t !== t) { flushList(); list = { t, items: [] }; }
        list.items.push(li[2]);
        continue;
      }
      if (/^\s*\|.*\|\s*$/.test(line)) {
        flushPara(); flushList();
        if (!table) table = [];
        if (!/^\s*\|[\s:|-]+\|\s*$/.test(line)) table.push(line.trim().slice(1, -1).split("|").map((c) => c.trim()));
        continue;
      }
      if (!line.trim()) { flushAll(); continue; }
      if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) { flushAll(); out.push("<hr>"); continue; }
      if (list && /^\s{2,}\S/.test(line)) { list.items[list.items.length - 1] += " " + line.trim(); continue; }
      flushList(); flushTable();
      para.push(line.trim());
    }
    flushAll();
    if (code) out.push(`<pre class="code"><code>${highlight(code.join("\n"))}</code></pre>`);
    return out.join("");
  }

  // ================================================================== briques d'affichage
  function rank(c) {
    const nb = D.notebooks[c.nb];
    let s = KIND_RANK[nb.kind] || 1;
    if (c.ctx) s += 0.4;
    if (c.out.length) s += 0.6;
    return s - Math.max(0, c.code.split("\n").length - 6) / 12;
  }

  /** même code dans l'exo et la solution -> une seule carte ; score(c) décide de l'ordre */
  function dedupe(cells, score = rank) {
    const m = new Map();
    for (const c of cells) {
      const k = c.code.replace(/\s+/g, " ").trim();
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(c);
    }
    return [...m.values()].map((list) => {
      list.sort((a, b) => rank(b) - rank(a));
      return { cell: list[0], others: list.slice(1), score: Math.max(...list.map(score)) };
    }).sort((a, b) => b.score - a.score);
  }

  function outputsHtml(outs) {
    const hasImg = outs.some((o) => o.t === "img");
    const label = [...new Set(outs.map((o) => ({ img: "graphique", html: "tableau", text: "texte", error: "erreur" }[o.t])))].join(" + ");
    const order = { img: 0, html: 1, text: 2, error: 3 };
    const body = [...outs].sort((a, b) => order[a.t] - order[b.t]).map((o) => {
      if (o.t === "img") return `<img loading="lazy" src="${esc(o.src)}" alt="Graphique produit par la cellule">`;
      if (o.t === "html") return `<div class="out-html">${o.v}</div>`;
      return `<pre class="out-text${o.t === "error" ? " err" : ""}">${esc(o.v)}</pre>`;
    }).join("");
    return `<details class="out"${hasImg ? " open" : ""}><summary>Sortie · ${label}</summary><div class="out-body">${body}</div></details>`;
  }

  const copyBtn = (code) => `<button class="copy" data-copy="${reg(code)}">Copier</button>`;
  const codeBlock = (code, title) => `<div class="card code-card">${title ? `<header class="card-head"><span class="crumb">${title}</span>${copyBtn(code)}</header>` : ""}
    <div class="code-wrap">${title ? "" : copyBtn(code)}<pre class="code"><code>${highlight(code)}</code></pre></div></div>`;

  function courseCard(g, opt = {}, hidden = false) {
    const c = g.cell, nb = D.notebooks[c.nb];
    const also = [...new Set(g.others.map((o) => `${KIND_LABEL[D.notebooks[o.nb].kind]} · ${D.notebooks[o.nb].title}`))];
    return `<article class="card${hidden ? " more-hidden" : ""}">
      <header class="card-head">
        <span class="kind k-${nb.kind}">${KIND_LABEL[nb.kind]}</span>
        <span class="crumb" title="${esc(nb.path)}">${esc(nb.chapter)} › ${esc(nb.title)}${c.section ? ` › <b>${esc(c.section)}</b>` : ""}</span>
        <a class="mini-btn" href="${nbHref(c.nb, c.id)}" title="Voir la cellule dans le notebook complet">Ouvrir dans le notebook</a>
        ${copyBtn(c.code)}
      </header>
      ${c.ctx ? `<div class="ctx md">${mdToHtml(c.ctx, { shift: 3 })}</div>` : ""}
      <pre class="code"><code>${highlight(c.code, opt)}</code></pre>
      ${c.out.length ? outputsHtml(c.out) : ""}
      ${also.length ? `<div class="also">Même code aussi dans : ${also.map(esc).join(", ")}</div>` : ""}
    </article>`;
  }

  function cardsHtml(groups, opt, shown = 3) {
    let h = groups.map((g, i) => courseCard(g, opt, i >= shown)).join("");
    if (groups.length > shown) h += `<button class="more">Voir les ${groups.length - shown} autres exemples</button>`;
    return h;
  }

  const noCourse = () => `<div class="empty small">Aucun exemple dans tes notebooks avec les filtres actuels.
    <button class="chip" id="reset-filters">Réinitialiser les filtres</button></div>`;
  const fnChip = (key, extra = "") => {
    const f = FN[key];
    return f ? `<a class="chip" href="${fnHref(key)}" title="${esc(f.desc || f.key)}"><span class="lib-dot" style="--c:${libColor(f.lib)}"></span><code>${esc(f.display)}</code>${extra}</a>` : "";
  };
  const recChip = (r) => `<a class="chip rec-chip" href="${recHref(r.id)}">📘 ${esc(r.title)}</a>`;

  // ================================================================== pages
  function viewHome() {
    const libs = LIB_ORDER.filter((l) => LIB_INFO[l] && !["math", "autres", "méthodes"].includes(l)).map((lib) => {
      const n = FNS.filter((f) => f.lib === lib && f.kb).length;
      return `<a class="libcard" href="${libHref(lib)}"><h3><span class="lib-dot" style="--c:${libColor(lib)}"></span>${esc(lib)}<span class="cnt">${n}</span></h3>
        <p>${esc(LIB_INFO[lib].d)}</p></a>`;
    }).join("");
    const pipeline = RCATS.map((cat) => `<div class="stage"><h3>${esc(cat)}</h3>
      ${RECIPES.filter((r) => r.cat === cat).map((r) => `<a href="${recHref(r.id)}">${esc(r.title)}</a>`).join("")}</div>`).join("");
    const nbs = chapters.map((ch) => `<div class="nbline"><span class="nbch">${esc(ch)}</span>
      ${D.notebooks.map((n, i) => [n, i]).filter(([n]) => n.chapter === ch).map(([n, i]) =>
        `<a class="nbchip" href="${nbHref(i)}"><span class="kind k-${n.kind}">${KIND_LABEL[n.kind]}</span>${esc(n.title)}</a>`).join("")}</div>`).join("");
    return `<div class="home">
      <h1>Ton antisèche d'analyse de données</h1>
      <p class="sub">${plural(RECIPES.length, "recette")} · ${plural(FNS.filter((f) => f.kb).length, "fiche")} de fonctions · ${D.notebooks.length} notebooks du cours (${D.cells.length} cellules) — tout est cherchable.</p>
      <div class="keys"><span><kbd>/</kbd> chercher</span><span><kbd>↑</kbd> <kbd>↓</kbd> choisir</span><span><kbd>Entrée</kbd> ouvrir</span><span><kbd>Échap</kbd> effacer</span></div>
      <h2 class="sec">Essaie une phrase ou un mot-clé</h2>
      <div class="chips">${EXAMPLES.map((t) => `<button class="chip" data-q="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <h2 class="sec">Le déroulé d'une analyse — recettes</h2>
      <div class="pipeline">${pipeline}</div>
      <h2 class="sec">Librairies</h2>
      <div class="libgrid">${libs}</div>
      <h2 class="sec">Cours & solutions</h2>
      <div class="nblist">${nbs}</div>
    </div>`;
  }

  function viewSearch(q) {
    const { results, terms, A } = runSearch(q);
    // on écarte les résultats très faibles par rapport au meilleur (évite le bruit hors sujet)
    const best = results.length ? results[0].score : 0;
    const keep = (type, ratio) => results.filter((r) => r.doc.type === type && r.score >= ratio * best);
    const recs = keep("recipe", 0.08).slice(0, 15);
    const fns = keep("fn", 0.08).slice(0, 30);
    // notebooks : comparés entre eux (pas aux recettes) + doivent couvrir l'essentiel de la requête
    const allCells = results.filter((r) => r.doc.type === "cell" && r.cov >= 0.6);
    const bestCell = allCells.length ? allCells[0].score : 0;
    const cellRes = allCells.filter((r) => r.score >= 0.3 * bestCell).slice(0, 120);
    const nq = norm(q).replace(/[()]/g, "").trim();
    const exactFn = fns.length && [fns[0].doc.ref.display, fns[0].doc.ref.short, fns[0].doc.ref.key].some((x) => norm(x) === nq);
    const scoreOf = new Map(cellRes.map((r) => [r.doc.ref.id, r.score]));
    const cellGroups = dedupe(cellRes.map((r) => r.doc.ref), (c) => scoreOf.get(c.id) || 0).slice(0, 30);
    const looksLikeCode = /[()[\]=~'"<>+*.]/.test(q);
    const nCode = q.trim().length >= 2 ? D.cells.filter((c) => cellVisible(c) && codeMatch(c, q.trim())).length : 0;
    const codeLink = nCode ? `<a class="hit codehit" href="#code=${enc(q.trim())}"><div class="hit-title">🔎 Recherche exacte de « <code>${esc(q.trim())}</code> » dans le code</div>
      <div class="hit-meta">${plural(nCode, "cellule")} contiennent exactement ce texte</div></a>` : "";

    const recHits = recs.map((r, i) => `<a class="hit${i >= 4 ? " more-hidden" : ""}" href="${recHref(r.doc.ref.id)}">
        <div class="hit-title">📘 ${S.markText(r.doc.ref.title, terms)}</div>
        <div class="hit-meta">Recette · ${esc(r.doc.ref.cat)}</div>
        <div class="hit-snip">${S.snippet(r.doc.ref.intro, terms)}</div></a>`).join("");
    const fnHits = fns.map((r, i) => {
      const f = r.doc.ref;
      const vis = visibleCells(f).length;
      return `<a class="hit${i >= 6 ? " more-hidden" : ""}" href="${fnHref(f.key)}">
        <div class="hit-title"><span class="lib-dot" style="--c:${libColor(f.lib)}"></span><code>${esc(f.display)}</code>
          <span class="hit-lib">${esc(libLabel(f.lib))}${f.cat ? " · " + esc(f.cat) : ""}</span>${vis ? `<span class="cnt" title="exemples dans tes notebooks">${vis} ex.</span>` : ""}</div>
        ${f.desc ? `<div class="hit-snip">${S.markText(f.desc, terms)}</div>` : ""}</a>`;
    }).join("");
    const cellHits = cellGroups.map((g, i) => {
      const c = g.cell, nb = D.notebooks[c.nb];
      const lines = c.code.split("\n");
      let pick = lines.filter((l) => S.words(l).some((w) => terms.has(S.stem(w)) || terms.has(w))).slice(0, 3);
      if (!pick.length) pick = lines.slice(0, 3);
      return `<a class="hit${i >= 5 ? " more-hidden" : ""}" href="${nbHref(c.nb, c.id)}">
        <div class="hit-title"><span class="kind k-${nb.kind}">${KIND_LABEL[nb.kind]}</span>
          <span class="hit-crumb">${esc(nb.chapter)} › ${esc(nb.title)}${c.section ? ` › <b>${esc(c.section)}</b>` : ""}</span></div>
        ${c.ctx ? `<div class="hit-snip">${S.snippet(c.ctx, terms, 200)}</div>` : ""}
        <pre class="hit-code">${pick.map((l) => S.markText(l, terms)).join("\n")}</pre></a>`;
    }).join("");

    const group = (title, n, shown, html, extra = "") => (n ? `<section class="rgroup"><h2 class="sec">${title} <span class="cnt">${n}</span></h2>
      <div class="hits">${html}</div>${n > shown ? `<button class="more">Voir ${n - shown} de plus</button>` : ""}${extra}</section>` : "");
    // ordre : recettes d'abord pour une phrase ; fonctions d'abord si on a tapé un nom de fonction exact
    const gRec = group("Recettes", recs.length, 4, recHits);
    const gFn = group("Fonctions", fns.length, 6, fnHits);
    const gCell = group("Dans tes notebooks (cours, solutions, exos)", cellGroups.length, 5, cellHits);
    const fnFirst = exactFn || (fns.length && (!recs.length || fns[0].score > 1.5 * recs[0].score));
    const groups = (fnFirst ? [gFn, gRec, gCell] : [gRec, gFn, gCell]).join("");

    const words = A.concepts.map((c) => c.w).join(", ");
    return `<div class="fhead"><div class="crumbs">Recherche</div><h1>« ${esc(q)} »</h1>
      <p class="sub">${words ? `Mots pris en compte : <b>${esc(words)}</b> (+ synonymes FR/EN, pluriels, fautes de frappe)` : "Tape au moins un mot significatif."}</p></div>
      ${looksLikeCode ? codeLink : ""}
      ${groups || `<div class="empty">Aucun résultat. Essaie d'autres mots (français ou anglais), ou parcours les recettes à gauche.</div>`}
      ${!looksLikeCode && codeLink ? `<div class="rgroup">${codeLink}</div>` : ""}`;
  }

  function viewFn(key) {
    const f = FN[key];
    if (!f) return `<div class="empty">Fonction inconnue : <code>${esc(key)}</code></div>`;
    const groups = dedupe(visibleCells(f));
    const chaps = [...new Set((f.cells || []).map((i) => D.notebooks[D.cells[i].nb].chapter.split(" - ")[0]))].sort();
    const recs = recipesUsing(key);
    const cnt = new Map();
    for (const c of visibleCells(f)) for (const k of c.f) if (k !== key && !GENERIC.has(k)) cnt.set(k, (cnt.get(k) || 0) + 1);
    const rel = [...cnt].sort((a, b) => b[1] - a[1]).slice(0, 12);
    const sameCat = f.cat ? FNS.filter((g) => g.kb && g.lib === f.lib && g.cat === f.cat && g.key !== key) : [];
    const fullName = f.key.startsWith(".") ? "méthode / attribut (df.…, s.…, model.…, ax.…)" : f.key;
    return `<div class="fhead">
        <div class="crumbs"><span class="lib-dot" style="--c:${libColor(f.lib)}"></span><a href="${libHref(f.lib)}">${esc(libLabel(f.lib))}</a>${f.cat ? ` › ${esc(f.cat)}` : ""}</div>
        <h1><code>${esc(f.display)}</code></h1>
        <div class="full">${esc(fullName)}</div>
        ${f.desc ? `<p class="desc">${esc(f.desc)}</p>` : `<p class="desc muted">Pas encore de fiche détaillée pour cette fonction — exemples tirés de tes notebooks ci-dessous.</p>`}
        <div class="meta">
          ${f.count ? `<span>${plural(f.count, "utilisation")} dans tes notebooks</span>` : `<span>Pas utilisée dans tes notebooks</span>`}
          ${chaps.map((c) => `<span class="tag">ch. ${esc(c)}</span>`).join("")}
          ${f.doc ? `<a class="doc" href="${esc(f.doc)}" target="_blank" rel="noopener">Documentation officielle ↗</a>` : ""}
        </div>
      </div>
      ${f.sig ? `<h2 class="sec">Signature</h2><pre class="code sig"><code>${highlight(f.sig)}</code></pre>` : ""}
      ${f.note ? `<div class="note">💡 ${esc(f.note)}</div>` : ""}
      ${f.ex ? `<h2 class="sec">Exemple général</h2>${codeBlock(f.ex)}` : ""}
      ${recs.length ? `<h2 class="sec">Recettes qui l'utilisent</h2><div class="chips">${recs.map(recChip).join("")}</div>` : ""}
      <h2 class="sec">Dans tes notebooks <span class="cnt">${groups.length}</span></h2>
      ${groups.length ? cardsHtml(groups, { fn: f.short }) : noCourse()}
      ${rel.length ? `<h2 class="sec">Souvent utilisée avec (dans tes notebooks)</h2><div class="chips">${rel.map(([k, n]) => fnChip(k, `<span class="cnt">${n}</span>`)).join("")}</div>` : ""}
      ${sameCat.length ? `<h2 class="sec">Même catégorie : ${esc(f.cat)}</h2><div class="chips">${sameCat.map((g) => fnChip(g.key)).join("")}</div>` : ""}`;
  }

  function relatedCells(r) {
    const score = new Map();
    for (const k of r.keys) for (const id of (FN[k] && FN[k].cells) || []) {
      if (!GENERIC.has(k) && cellVisible(D.cells[id])) score.set(id, (score.get(id) || 0) + 1);
    }
    const s = runSearch(r.title + " " + r.t).results.filter((x) => x.doc.type === "cell").slice(0, 40);
    s.forEach((x, i) => score.set(x.doc.ref.id, (score.get(x.doc.ref.id) || 0) + 2.5 * (1 - i / 40)));
    const ids = [...score.keys()];
    return dedupe(ids.map((i) => D.cells[i]), (c) => (score.get(c.id) || 0) + rank(c) * 0.2).slice(0, 12);
  }

  function viewRecipe(id) {
    const r = REC[id];
    if (!r) return `<div class="empty">Recette inconnue.</div>`;
    const same = RECIPES.filter((x) => x.cat === r.cat && x.id !== r.id);
    const groups = relatedCells(r);
    const steps = r.steps.map(([txt, code]) => `<div class="step">${txt ? `<p>${inline(txt)}</p>` : ""}${code ? codeBlock(code) : ""}</div>`).join("");
    return `<div class="fhead">
        <div class="crumbs"><a href="#recettes">Recettes</a> › ${esc(r.cat)}</div>
        <h1>${esc(r.title)}</h1>
        <p class="desc">${esc(r.intro)}</p>
      </div>
      <div class="steps">${steps}</div>
      ${r.tips && r.tips.length ? `<div class="note"><b>À retenir</b><ul>${r.tips.map((t) => `<li>${inline(t)}</li>`).join("")}</ul></div>` : ""}
      ${r.keys.length ? `<h2 class="sec">Fonctions utilisées</h2><div class="chips">${r.keys.map((k) => fnChip(k)).join("")}</div>` : ""}
      <h2 class="sec">Vu dans tes notebooks <span class="cnt">${groups.length}</span></h2>
      ${groups.length ? cardsHtml(groups, {}, 2) : noCourse()}
      ${same.length ? `<h2 class="sec">Autres recettes : ${esc(r.cat)}</h2><div class="chips">${same.map(recChip).join("")}</div>` : ""}`;
  }

  function viewRecipes() {
    return `<div class="fhead"><div class="crumbs">Recettes</div><h1>Toutes les recettes</h1>
      <p class="sub">Classées dans l'ordre d'une analyse de données complète.</p></div>
      ${RCATS.map((cat) => `<h2 class="sec">${esc(cat)}</h2><div class="hits">${RECIPES.filter((r) => r.cat === cat).map((r) =>
        `<a class="hit" href="${recHref(r.id)}"><div class="hit-title">📘 ${esc(r.title)}</div><div class="hit-snip">${esc(r.intro)}</div></a>`).join("")}</div>`).join("")}`;
  }

  function fnsOfLib(lib) {
    return FNS.filter((f) => f.lib === lib);
  }

  function viewLib(lib) {
    const all = fnsOfLib(lib);
    if (!all.length) return `<div class="empty">Librairie inconnue.</div>`;
    const info = LIB_INFO[lib] || {};
    const cats = [...new Set(all.filter((f) => f.kb).map((f) => f.cat))];
    const row = (f) => {
      const n = visibleCells(f).length;
      return `<a class="fnrow" href="${fnHref(f.key)}"><code>${esc(f.display)}</code><span class="fnrow-d">${esc(f.desc || "")}</span>${n ? `<span class="cnt" title="exemples dans tes notebooks">${n} ex.</span>` : ""}</a>`;
    };
    const extra = all.filter((f) => !f.kb && visibleCells(f).length).sort((a, b) => visibleCells(b).length - visibleCells(a).length);
    return `<div class="fhead"><div class="crumbs"><span class="lib-dot" style="--c:${libColor(lib)}"></span>Librairie</div>
        <h1>${esc(libLabel(lib))}</h1>${info.d ? `<p class="desc">${esc(info.d)}</p>` : ""}</div>
      ${info.imp ? codeBlock(info.imp) : ""}
      ${cats.map((cat) => `<h2 class="sec">${esc(cat)}</h2><div class="fnrows">${all.filter((f) => f.kb && f.cat === cat).map(row).join("")}</div>`).join("")}
      ${extra.length ? `<h2 class="sec">${cats.length ? "Aussi vu dans tes notebooks" : "Vu dans tes notebooks"}</h2><div class="fnrows">${extra.map(row).join("")}</div>` : ""}`;
  }

  function viewNotebooks() {
    return `<div class="fhead"><div class="crumbs">Notebooks</div><h1>Cours & solutions</h1>
      <p class="sub">Les notebooks complets, lisibles ici (texte, code, sorties).</p></div>
      ${chapters.map((ch) => `<h2 class="sec">${esc(ch)}</h2><div class="hits">${D.notebooks.map((n, i) => [n, i]).filter(([n]) => n.chapter === ch).map(([n, i]) =>
        `<a class="hit" href="${nbHref(i)}"><div class="hit-title"><span class="kind k-${n.kind}">${KIND_LABEL[n.kind]}</span>${esc(n.title)}</div>
          <div class="hit-meta">${esc(n.path)} · ${plural(n.cells.filter((x) => "c" in x).length, "cellule")} de code</div></a>`).join("")}</div>`).join("")}`;
  }

  function viewNotebook(i) {
    const nb = D.notebooks[i];
    state.toc = [];
    if (!nb) return `<div class="empty">Notebook introuvable.</div>`;
    let hid = 0;
    const onHeading = (lvl, text) => {
      const id = "h-" + hid++;
      if (lvl <= 3) state.toc.push({ id, lvl, text: text.replace(/[*_`#]/g, "").replace(/<[^>]+>/g, "") });
      return id;
    };
    const cells = nb.cells.map((x) => {
      if ("m" in x) return `<div class="nb-md md">${mdToHtml(x.m, { onHeading })}</div>`;
      const c = D.cells[x.c];
      return `<div class="nb-code card" id="cell-${c.id}">
        <div class="code-wrap">${copyBtn(c.code)}<pre class="code"><code>${highlight(c.code)}</code></pre></div>
        ${c.out.length ? outputsHtml(c.out) : ""}</div>`;
    }).join("");
    return `<div class="fhead"><div class="crumbs"><a href="#notebooks">Notebooks</a> › ${esc(nb.chapter)}</div>
        <h1>${esc(nb.title)} <span class="kind k-${nb.kind}">${KIND_LABEL[nb.kind]}</span></h1>
        <p class="sub">${esc(nb.path)}</p></div>
      <div class="notebook">${cells}</div>`;
  }

  function viewCode(text) {
    const cells = D.cells.filter((c) => cellVisible(c) && codeMatch(c, text));
    const groups = dedupe(cells);
    return `<div class="fhead"><div class="crumbs">Recherche exacte dans le code</div><h1>« <code>${esc(text)}</code> »</h1>
      <p class="sub">${plural(cells.length, "cellule")} · ${groups.length} distinctes · sensible à la casse si le texte contient une majuscule</p></div>
      ${groups.length ? cardsHtml(groups, { text }, 15) : noCourse()}`;
  }

  // ================================================================== barre latérale
  const TABS = [["recettes", "Recettes"], ["libs", "Librairies"], ["nbs", "Notebooks"]];
  function sideTabFor(route) {
    if (route.type === "recipe" || route.type === "recipes") return "recettes";
    if (route.type === "fn" || route.type === "lib") return "libs";
    if (route.type === "nb" || route.type === "notebooks") return "nbs";
    return state.tab;
  }
  const isOpen = (k, dflt) => (k in state.open ? state.open[k] : dflt);

  function renderSide() {
    const r = state.route;
    const tabs = `<div class="side-tabs">${TABS.map(([k, l]) => `<button data-tab="${k}" class="${state.tab === k ? "on" : ""}">${l}</button>`).join("")}</div>`;
    let body = "";
    if (state.tab === "recettes") {
      body = RCATS.map((cat) => `<details data-k="r:${esc(cat)}"${isOpen("r:" + cat, true) ? " open" : ""}>
        <summary>${esc(cat)}</summary><ul>${RECIPES.filter((x) => x.cat === cat).map((x) =>
          `<li><a href="${recHref(x.id)}" class="${r.type === "recipe" && r.id === x.id ? "active" : ""}">${esc(x.title)}</a></li>`).join("")}</ul></details>`).join("");
    } else if (state.tab === "libs") {
      const curLib = r.type === "fn" && FN[r.key] ? FN[r.key].lib : r.type === "lib" ? r.lib : null;
      body = LIB_ORDER.map((lib) => {
        const fs = fnsOfLib(lib).filter((f) => f.kb || visibleCells(f).length);
        if (!fs.length) return "";
        const cats = [...new Set(fs.filter((f) => f.kb).map((f) => f.cat))];
        const extra = fs.filter((f) => !f.kb);
        const link = (f) => `<li><a href="${fnHref(f.key)}" class="${r.type === "fn" && r.key === f.key ? "active" : ""}" title="${esc(f.desc || f.key)}"><code>${esc(f.display)}</code></a></li>`;
        return `<details data-k="l:${esc(lib)}"${isOpen("l:" + lib, lib === curLib) ? " open" : ""}>
          <summary><span class="lib-dot" style="--c:${libColor(lib)}"></span>${esc(libLabel(lib))}<span class="cnt">${fs.length}</span></summary>
          <ul><li><a class="overview${r.type === "lib" && r.lib === lib ? " active" : ""}" href="${libHref(lib)}">Vue d'ensemble →</a></li></ul>
          ${cats.map((cat) => `<div class="side-cat">${esc(cat)}</div><ul>${fs.filter((f) => f.kb && f.cat === cat).map(link).join("")}</ul>`).join("")}
          ${extra.length ? `<div class="side-cat">${cats.length ? "Vu en série" : "Fonctions"}</div><ul>${extra.map(link).join("")}</ul>` : ""}
        </details>`;
      }).join("");
    } else {
      const cur = r.type === "nb" ? r.nb : -1;
      body = chapters.map((ch) => `<details data-k="n:${esc(ch)}"${isOpen("n:" + ch, true) ? " open" : ""}><summary>${esc(ch)}</summary><ul>${
        D.notebooks.map((n, i) => [n, i]).filter(([n]) => n.chapter === ch).map(([n, i]) => `<li><a href="${nbHref(i)}" class="${i === cur ? "active" : ""}">
          <span class="kind k-${n.kind}">${KIND_LABEL[n.kind][0]}</span>${esc(n.title)}</a>
          ${i === cur && state.toc.length ? `<ul class="toc">${state.toc.map((t) => `<li class="lvl${t.lvl}"><a data-scroll="${t.id}">${esc(t.text)}</a></li>`).join("")}</ul>` : ""}</li>`).join("")}</ul></details>`).join("");
    }
    side.innerHTML = tabs + `<div class="tree">${body}</div>`;
    side.querySelector("a.active")?.scrollIntoView({ block: "nearest" });
  }

  // ================================================================== routage
  function parseHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.has("q")) return { type: "search", q: p.get("q") };
    if (p.has("f")) return { type: "fn", key: p.get("f") };
    if (p.has("r")) return { type: "recipe", id: p.get("r") };
    if (p.has("lib")) return { type: "lib", lib: p.get("lib") };
    if (p.has("nb")) return { type: "nb", nb: +p.get("nb"), cell: p.has("c") ? +p.get("c") : null };
    if (p.has("code")) return { type: "code", text: p.get("code") };
    if (p.has("recettes")) return { type: "recipes" };
    if (p.has("notebooks")) return { type: "notebooks" };
    return { type: "home" };
  }

  function render(keepScroll = false) {
    const r = (state.route = parseHash());
    COPY = [];
    let html, title = "ADA toolkit";
    switch (r.type) {
      case "search": html = viewSearch(r.q); title = r.q; break;
      case "fn": html = viewFn(r.key); title = FN[r.key] ? FN[r.key].display : title; break;
      case "recipe": html = viewRecipe(r.id); title = REC[r.id] ? REC[r.id].title : title; break;
      case "recipes": html = viewRecipes(); title = "Recettes"; break;
      case "lib": html = viewLib(r.lib); title = r.lib; break;
      case "nb": html = viewNotebook(r.nb); title = D.notebooks[r.nb] ? D.notebooks[r.nb].title : title; break;
      case "notebooks": html = viewNotebooks(); title = "Notebooks"; break;
      case "code": html = viewCode(r.text); break;
      default: html = viewHome();
    }
    document.title = title === "ADA toolkit" ? title : `${title} — ADA toolkit`;
    const prevScroll = main.scrollTop;
    main.innerHTML = `<div class="main-inner">${html}</div>`;
    main.scrollTop = keepScroll ? prevScroll : 0;
    if (!keepScroll && main.scrollHeight <= main.clientHeight + 1) window.scrollTo(0, 0); // mobile : c'est la page qui défile
    if (r.type === "search" && qInput.value !== r.q && document.activeElement !== qInput) qInput.value = r.q;
    state.sel = 0;
    paintSel();
    const t = sideTabFor(r);
    if (t !== state.tab) { state.tab = t; store.set("tab", t); }
    renderSide();
    if (r.type === "nb" && r.cell !== null) {
      const el = document.getElementById("cell-" + r.cell);
      if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); }
    }
  }

  // sélection clavier dans les résultats
  const hitEls = () => [...main.querySelectorAll(".hit")].filter((e) => !e.classList.contains("more-hidden"));
  function paintSel() {
    const hits = hitEls();
    hits.forEach((h, i) => h.classList.toggle("sel", i === state.sel && state.route.type === "search"));
  }

  // ================================================================== recherche (saisie)
  let typingTimer;
  qInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      const v = qInput.value;
      const target = v.trim() ? "#q=" + enc(v) : "#";
      if (state.route.type === "search") history.replaceState(null, "", target);
      else if (v.trim()) history.pushState(null, "", target);
      else return;
      render();
    }, 110);
  });

  function setQuery(v) {
    qInput.value = v;
    qInput.focus();
    location.hash = "#q=" + enc(v);
  }

  // ================================================================== filtres
  const srcSeg = $("#src"), chapSel = $("#chap");
  chapSel.innerHTML = `<option value="all">Tous les chapitres</option>` + chapters.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  if (state.chap !== "all" && !chapters.includes(state.chap)) state.chap = "all";
  chapSel.value = state.chap;
  const paintSeg = () => srcSeg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.v === state.src));
  paintSeg();
  function setFilters(src, chap) {
    state.src = src; state.chap = chap;
    store.set("src", src); store.set("chap", chap);
    chapSel.value = chap;
    paintSeg();
    render(true);
  }
  srcSeg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setFilters(b.dataset.v, state.chap); });
  chapSel.addEventListener("change", () => setFilters(state.src, chapSel.value));

  // ================================================================== thème
  const savedTheme = store.get("theme", null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $("#theme").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme;
    const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("theme", next);
  });

  // ================================================================== clics
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
    btn.textContent = "Copié ✓";
    setTimeout(() => { btn.textContent = "Copier"; }, 1200);
  }

  main.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.dataset.copy !== undefined) copy(COPY[+el.dataset.copy], el);
    else if (el.classList.contains("more")) {
      const scope = el.closest(".rgroup") || main;
      scope.querySelectorAll(".more-hidden").forEach((x) => x.classList.remove("more-hidden"));
      el.remove();
    } else if (el.id === "reset-filters") setFilters("all", "all");
    else if (el.dataset.q !== undefined) setQuery(el.dataset.q);
  });

  side.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) { state.tab = tab.dataset.tab; store.set("tab", state.tab); renderSide(); return; }
    const sc = e.target.closest("[data-scroll]");
    if (sc) { document.getElementById(sc.dataset.scroll)?.scrollIntoView({ block: "start" }); }
  });
  side.addEventListener("toggle", (e) => {
    const d = e.target;
    if (d.dataset && d.dataset.k) { state.open[d.dataset.k] = d.open; store.set("open2", state.open); }
  }, true);

  $(".brand").addEventListener("click", () => { qInput.value = ""; location.hash = "#"; });
  // téléphone : la colonne de gauche est repliée derrière le bouton Menu
  $("#menu").addEventListener("click", () => document.body.classList.toggle("side-open"));
  side.addEventListener("click", (e) => { if (e.target.closest("a[href]")) document.body.classList.remove("side-open"); });

  // ================================================================== clavier
  document.addEventListener("keydown", (e) => {
    const inInput = e.target === qInput;
    const typing = /INPUT|SELECT|TEXTAREA/.test(e.target.tagName);
    if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault(); qInput.focus(); qInput.select(); return;
    }
    if (!inInput) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (state.route.type !== "search") return;
      const hits = hitEls();
      if (!hits.length) return;
      e.preventDefault();
      state.sel = (state.sel + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length;
      paintSel();
      hits[state.sel].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(typingTimer);
      const v = qInput.value.trim();
      if (!v) return;
      if (state.route.type !== "search" || state.route.q !== qInput.value) {
        history.pushState(null, "", "#q=" + enc(qInput.value));
        render();
      }
      const hit = hitEls()[state.sel];
      if (hit) location.hash = hit.getAttribute("href");
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (qInput.value) {
        qInput.value = "";
        if (state.route.type === "search") location.hash = "#";
      } else qInput.blur();
    }
  });

  window.addEventListener("hashchange", () => render());

  // ================================================================== démarrage
  render();
})();
