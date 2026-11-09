/*
 * Moteur de recherche plein texte, 100 % local, sans IA :
 *  - normalisation (minuscules, accents), mots vides FR/EN, racinisation légère FR/EN
 *  - synonymes FR <-> EN (dictionnaire écrit à la main, modifiable ci-dessous)
 *  - tolérance aux fautes de frappe (distance d'édition) et préfixes (recherche pendant la frappe)
 *  - classement BM25 par champ (nom > titre > mots-clés > description > texte > code)
 *  - bonus : tous les mots de la requête présents, expression exacte, nom de fonction exact
 */
window.AdaSearch = (() => {
  "use strict";
  const norm = (s) => (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const STOP = new Set(`a au aux avec ce ces cette cet comme comment dans de des du elle en est et eux il ils je la le les leur lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous c d j l m n s t y
    etre avoir fait faire faut veux veut voudrais peux peut puis quel quelle quels quelles quoi dont ici tout tous toute toutes tres plus moins bien entre chaque selon sans afin donc alors
    the of and or to in on for with by an is are be it this that these those how what which do does can i want get using use from into at as my your we`.split(/\s+/));

  // suffixes retirés (le plus long d'abord) ; on garde toujours au moins 4 lettres
  const SUFFIXES = ["issements", "issement", "ements", "ement", "ations", "ation", "ateurs", "ateur", "atrices", "atrice",
    "ances", "ance", "ences", "ence", "ables", "able", "ibles", "ible", "iques", "ique", "euses", "euse", "eurs", "eur",
    "ions", "ion", "ings", "ing", "ies", "ees", "ee", "es", "er", "ed", "ly", "s", "e", "x"];
  const stemCache = new Map();
  function stem(w) {
    let r = stemCache.get(w);
    if (r !== undefined) return r;
    r = w;
    if (w.length > 4 && !/\d/.test(w)) {
      for (const suf of SUFFIXES) {
        if (w.endsWith(suf) && w.length - suf.length >= 4) { r = w.slice(0, -suf.length); break; }
      }
    }
    stemCache.set(w, r);
    return r;
  }
  // mots composés qu'on garde d'un bloc : p-value, t-test, k-means, t-SNE, one-hot, chi²…
  const COMPOUNDS = [[/\bp[\s_-]?values?\b/g, "pvalue"], [/\bt[\s-]?tests?\b/g, "ttest"], [/\bk[\s-]?means\b/g, "kmeans"],
    [/\bt[\s-]?sne\b/g, "tsne"], [/\bone[\s-]?hot\b/g, "onehot"], [/\bchi\s?[2²]|\bkhi\s?[2²]|χ²?/g, "chi2"], [/\bk[\s-]?nn\b/g, "knn"],
    [/\bk[\s-]?fold\b/g, "kfold"], [/\br[2²]\b|\br\s?carre\b/g, "r2"], [/\bdiff[\s-]in[\s-]diff\b/g, "diffindiff"]];
  const words = (text) => {
    let t = norm(text);
    for (const [re, rep] of COMPOUNDS) t = t.replace(re, " " + rep + " ");
    return t.match(/[a-z0-9]+/g) || [];
  };
  const idents = (text) => (norm(text).match(/[a-z_][a-z0-9_]*_[a-z0-9_]*/g) || []); // read_csv, max_weight_matching
  const tokens = (text) => words(text).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);

  // ------------------------------------------------------------------ synonymes (une ligne = un groupe)
  const SYN_GROUPS = `
    moyenne moyen mean average
    mediane median
    ecart std deviation dispersion variabilite variance
    joindre jointure fusionner fusion merge join combiner relier
    empiler concatener concat append coller
    grouper groupe regrouper groupby group aggreger agreger aggregate agg
    filtrer filtre selectionner selection garder exclure filter select subset
    trier tri ordonner classer sort order classement ordre sort_values
    compter comptage count effectif frequence occurrences combien nombre
    ttest student welch
    onehot dummy dummies indicatrice
    kmeans clustering
    manquant manquante nan null missing vide na isna
    supprimer enlever retirer drop delete remove
    remplacer remplir imputer fill replace impute
    graphique graph plot tracer visualiser visualisation figure chart dessiner afficher viz
    histogramme histogram hist
    distribution repartition loi
    nuage scatter scatterplot
    barre barres bar barplot
    boite moustache boxplot box
    correlation correle correler lien relation association associe corr
    comparer comparaison difference versus compare vs
    test tester significatif significativite hypothese
    pvalue significatif significativite
    regression regresser modele modeliser model
    lineaire linear ols
    logistique logistic logit
    prediction predire predict prevoir forecast
    classification classifier classifieur classify
    probabilite proba probability
    intervalle confiance ic ci confidence
    bootstrap reechantillonnage resample resampling
    normale normal gaussienne gaussian normalite
    log logarithme logarithmique
    date temps temporel time datetime temporelle
    texte text chaine string mot mots word words
    fichier file donnees data dataset jeu
    lire charger importer ouvrir load read open import
    sauvegarder enregistrer exporter save export write
    colonne column variable feature features
    ligne row rows
    nouvelle creer ajouter create new add
    convertir conversion type cast astype
    categorielle categorical qualitative categorie category categories
    numerique numeric quantitative continue
    standardiser normaliser scaler scaling zscore standardisation
    cluster clustering clusters segmenter partitionner kmeans
    reseau graphe network graph networkx
    noeud noeuds node nodes sommet
    arete aretes edge edges
    centralite centrality
    causal causalite effet effect traitement treatment traite
    matching appariement apparier paires pairs match
    propension propensity
    confondant confondants confounder confounding
    entrainer apprendre fit train training entrainement
    evaluer evaluation score metrique metric performance
    erreur error mse rmse
    surapprentissage overfitting overfit
    hyperparametre hyperparameter tuning
    validation croisee cross kfold
    pca acp composante composantes
    reduction dimension dimensionality
    tableau table dataframe
    croise contingence crosstab
    pivot remodeler reshape
    unique distinct differente differentes
    doublon doublons duplicate duplicated duplicates
    aberrant aberrante outlier outliers extreme extremes
    queue tail lourde heavy puissance power
    quantile quartile percentile
    taille shape dimensions
    premieres head apercu preview
    resume summary describe
    coefficient coefficients coef params
    moyennes means
    proportion pourcentage percentage ratio part
    anova variance
    chi2 khi chi
    voisins neighbors knn
    arbre tree trees arbres
    foret forest
    texte nlp tfidf
    communaute communautes community communities louvain
    serie series
    cumul cumulative cumsum cdf ccdf ecdf
    valeur value
    nombre number
    choisir choose choice selectionner
    deux two pair
    plusieurs multiple several many
    resultat result outcome output
    echantillon sample sampling
    aleatoire random hasard
    seuil threshold cutoff
    vrai true
    faux false
    positif positive
    negatif negative
    annee year yearly annuel
    mois month monthly mensuel
    jour day daily journalier
    semaine week weekly hebdomadaire
    heure hour
    pays country countries
    utilisateur user users
    prix price
    poids weight weighted pondere
    age old
    revenu income salary salaire
    reponse response
    question question
    expliquer explain explanatory
    estimer estimate estimation
    ajuster adjust adjusted controler control
    controle control
    population population
    observation observations obs
    individu individual subject
    pourcent percent
    maximum max plus grand largest
    minimum min plus petit smallest
    premier first
    dernier last
    meilleur best top
    pire worst
    total sum somme
    taux rate
    augmenter increase
    diminuer decrease
    croissant ascending
    decroissant descending ascending
    fonction function
    methode method
    graphe graph
    couleur color colour hue
    legende legend
    axe axis axes
    echelle scale
    titre title
    tableau croise pivot
    erreur standard sem
  `.trim().split("\n").map((l) => l.trim().split(/\s+/).map((w) => stem(norm(w))));
  const SYN = new Map();
  for (const g of SYN_GROUPS) for (const w of g) {
    if (!SYN.has(w)) SYN.set(w, new Set());
    for (const o of g) if (o !== w) SYN.get(w).add(o);
  }

  // ------------------------------------------------------------------ distance d'édition (bornée)
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let best = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  // ------------------------------------------------------------------ index
  const FIELDS = [["name", 4], ["title", 3], ["tags", 2.5], ["desc", 1.6], ["body", 1], ["code", 0.6]];
  const K1 = 1.2, B = 0.6;

  function createIndex(docs) {
    const index = new Map();
    const lens = new Float64Array(docs.length);
    docs.forEach((d, i) => {
      const tf = new Map();
      let len = 0;
      for (const [field, boost] of FIELDS) {
        const txt = d.f[field];
        if (!txt) continue;
        const toks = tokens(txt);
        if (field === "name" || field === "code") toks.push(...idents(txt));
        for (const t of toks) { tf.set(t, (tf.get(t) || 0) + boost); len += boost; }
      }
      lens[i] = len || 1;
      for (const [t, w] of tf) {
        let p = index.get(t);
        if (!p) index.set(t, (p = []));
        p.push(i, w);
      }
      d.phrase = " " + words((d.f.name || "") + " " + (d.f.title || "") + " " + (d.f.tags || "")).join(" ") + " ";
    });
    const avg = lens.reduce((a, b) => a + b, 0) / Math.max(1, docs.length);
    const vocab = [...index.keys()];
    return { docs, index, lens, avg, vocab, N: docs.length };
  }

  // ------------------------------------------------------------------ analyse de la requête
  function analyze(IX, q) {
    const raw = words(q).filter((w) => !STOP.has(w));
    const concepts = [];
    raw.forEach((w, idx) => {
      if (w.length < 2 && raw.length > 1) return;
      const s = stem(w);
      const terms = new Map([[s, 1]]);
      if (s !== w && IX.index.has(w)) terms.set(w, 1);
      for (const o of SYN.get(s) || []) if (!terms.has(o)) terms.set(o, 0.7);
      const isLast = idx === raw.length - 1;
      // préfixe : pendant la frappe ("regres" -> "regress") ou mot inconnu
      if ((isLast || !IX.index.has(s)) && w.length >= 3) {
        let n = 0;
        for (const v of IX.vocab) {
          if (v !== s && v.startsWith(w) && !terms.has(v)) { terms.set(v, 0.75); if (++n >= 25) break; }
        }
      }
      // fautes de frappe : mot absent de l'index
      if (!IX.index.has(s) && w.length >= 4) {
        const max = w.length >= 8 ? 2 : 1;
        for (const v of IX.vocab) {
          if (!terms.has(v) && Math.abs(v.length - s.length) <= max && lev(s, v, max) <= max) terms.set(v, 0.55);
        }
      }
      concepts.push({ w, s, terms });
    });
    return { concepts, phrase: " " + raw.join(" ") + " ", nq: norm(q).trim() };
  }

  // ------------------------------------------------------------------ recherche
  /** opts.accept(doc) -> bool ; opts.prior(doc) -> multiplicateur ; opts.exact(doc, nq) -> bool */
  function search(IX, q, opts = {}) {
    const A = analyze(IX, q);
    const nC = A.concepts.length;
    if (!nC) return { results: [], terms: new Set(), A };
    const scores = new Float64Array(IX.N);
    const hits = new Uint32Array(IX.N);
    const allTerms = new Set();
    const weight = new Float64Array(nC); // importance d'un mot de la requête = sa rareté (idf)
    A.concepts.forEach((c, ci) => {
      const best = new Map(); // doc -> meilleur score pour ce concept
      for (const [term, qw] of c.terms) {
        const post = IX.index.get(term);
        if (!post) continue;
        allTerms.add(term);
        const df = post.length / 2;
        const idf = Math.log(1 + (IX.N - df + 0.5) / (df + 0.5));
        if (qw * idf > weight[ci]) weight[ci] = qw * idf;
        for (let k = 0; k < post.length; k += 2) {
          const d = post[k], tf = post[k + 1];
          const s = qw * idf * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * IX.lens[d] / IX.avg));
          if (s > (best.get(d) || 0)) best.set(d, s);
        }
      }
      for (const [d, s] of best) { scores[d] += s; hits[d] |= 1 << Math.min(ci, 31); }
    });
    const totalW = weight.reduce((a, b) => a + b, 0) || 1;
    const results = [];
    for (let d = 0; d < IX.N; d++) {
      if (!scores[d]) continue;
      const doc = IX.docs[d];
      if (opts.accept && !opts.accept(doc)) continue;
      // couverture pondérée : manquer un mot rare/distinctif coûte plus cher que manquer un mot banal
      let got = 0;
      for (let ci = 0; ci < nC; ci++) if (hits[d] & (1 << Math.min(ci, 31))) got += weight[ci];
      const cov = got / totalW;
      let s = scores[d] * Math.pow(cov, 1.5);
      if (nC > 1 && doc.phrase.includes(A.phrase)) s *= 1.6;
      if (opts.exact && opts.exact(doc, A.nq)) s *= 3;
      if (opts.prior) s *= opts.prior(doc);
      results.push({ doc, score: s, cov });
    }
    results.sort((a, b) => b.score - a.score);
    return { results, terms: allTerms, A };
  }

  // ------------------------------------------------------------------ surlignage des mots trouvés
  const escHtml = (s) => (s ?? "").toString().replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function markText(text, terms) {
    if (!terms || !terms.size) return escHtml(text);
    return text.split(/([\p{L}\p{N}_]+)/u).map((part, i) => {
      if (i % 2 === 0) return escHtml(part);
      const n = norm(part);
      return terms.has(stem(n)) || terms.has(n) ? `<mark>${escHtml(part)}</mark>` : escHtml(part);
    }).join("");
  }
  /** extrait ~maxLen caractères autour du premier mot trouvé */
  function snippet(text, terms, maxLen = 220) {
    const t = (text || "").replace(/\s+/g, " ").trim();
    if (t.length <= maxLen) return markText(t, terms);
    let pos = 0;
    const re = /[\p{L}\p{N}_]+/gu;
    let m;
    while ((m = re.exec(t))) {
      const n = norm(m[0]);
      if (terms.has(stem(n)) || terms.has(n)) { pos = m.index; break; }
    }
    const start = Math.max(0, pos - 60);
    const out = t.slice(start, start + maxLen);
    return (start > 0 ? "…" : "") + markText(out, terms) + (start + maxLen < t.length ? "…" : "");
  }

  return { createIndex, search, markText, snippet, norm, words, stem };
})();
