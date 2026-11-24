/*
 * Guide d'interprétation : comment LIRE un résultat et quoi ÉCRIRE dans la réponse.
 * G(catégorie, id, titre, intro, mots-clés, code, lecture [[élément, explication], ...], phrase type, pièges [..], recettes liées [..])
 * Le code est exécuté sur les données d'exemple (run_examples.py) : la sortie affichée et la phrase générée sont réelles.
 */
window.ADA_KB = window.ADA_KB || { functions: [], recipes: [] };
window.ADA_KB.guide = window.ADA_KB.guide || [];
(function () {
  const G = (cat, id, title, intro, t, code, lecture, phrase, pieges, recs) =>
    window.ADA_KB.guide.push({ cat, id, title, intro, t, code, lecture, phrase, pieges, recs });
  let C;

  // =========================================================================================
  C = "Régression";
  G(C, "lire-summary-ols", "Lire le tableau summary() d'une régression linéaire",
    "Ce que veut dire chaque partie du tableau de statsmodels, et ce qu'il faut en retenir.",
    "lire summary tableau regression ols statsmodels r2 coef p value std err intervalle interpreter resultats",
    `res = smf.ols('prix ~ surface + age + C(quartier)', data=df).fit()
print(res.summary())`,
    [["Dep. Variable", "La variable expliquée (y)."],
     ["No. Observations", "Lignes réellement utilisées : les lignes avec un NaN sont retirées. Vérifier que c'est le nombre attendu."],
     ["R-squared", "Part de la variance de y expliquée par le modèle (0 à 1). 0.6 = 60 % de la variabilité du prix est expliquée."],
     ["Adj. R-squared", "R² pénalisé par le nombre de variables : pour comparer des modèles qui n'ont pas le même nombre de variables."],
     ["F-statistic / Prob (F-statistic)", "Test de « tous les coefficients valent 0 ». p très petite → le modèle explique quelque chose."],
     ["coef", "Variation moyenne de y quand la variable augmente de 1, toutes les autres variables fixées."],
     ["std err", "Incertitude sur le coefficient (écart-type de son estimation)."],
     ["t et P>|t|", "Test de « ce coefficient vaut 0 ». P>|t| < 0.05 → coefficient significativement différent de 0 au seuil de 5 %."],
     ["[0.025  0.975]", "Intervalle de confiance à 95 % du coefficient. S'il ne contient pas 0, c'est équivalent à p < 0.05."],
     ["Intercept", "Valeur prédite quand toutes les variables valent 0 et que les catégories sont à leur référence : souvent sans sens concret."],
     ["C(quartier)[T.nord]", "Différence par rapport à la catégorie de référence (la première par ordre alphabétique, ici « centre »)."],
     ["Cond. No.", "Grand nombre (≈ > 1000) : variables très corrélées ou d'échelles très différentes → coefficients instables (ou simple question d'unités)."]],
    "Le modèle explique R² = … de la variance du prix. Toutes choses égales par ailleurs, chaque m² supplémentaire est associé à un prix plus élevé de … CHF (IC 95 % [… ; …], p < 0,001).",
    ["Dire « est associé à », pas « cause » : avec des données observationnelles, la régression ne prouve pas la causalité.",
     "Un coefficient non significatif ne prouve pas qu'il n'y a pas d'effet (peut-être pas assez de données).",
     "Comparer la taille de deux coefficients n'a de sens que si les variables sont sur la même échelle (standardisées)."],
    ["ols", "diagnostic-regression"]);

  G(C, "coef-continu", "Interpréter le coefficient d'une variable continue",
    "« +1 unité de x » ↔ « +coef unités de y », toutes choses égales par ailleurs — avec l'intervalle de confiance.",
    "coefficient variable continue interpreter unite toutes choses egales par ailleurs effet pente",
    `res = smf.ols('prix ~ surface + age + C(quartier)', data=df).fit()
b, p = res.params['surface'], res.pvalues['surface']
lo, hi = res.conf_int().loc['surface']
print(f"Toutes choses égales par ailleurs, +1 m² est associé à un prix plus élevé de {b:.0f} CHF "
      f"(IC 95 % [{lo:.0f} ; {hi:.0f}], p = {p:.2g}).")`,
    [["Signe", "Positif : y augmente quand x augmente ; négatif : y diminue."],
     ["Unités", "Toujours dans les unités de y par unité de x (CHF par m², points par année…). Le dire explicitement."],
     ["Toutes choses égales par ailleurs", "L'effet est celui de x quand les AUTRES variables du modèle restent fixes (pas les variables absentes du modèle)."]],
    "Toutes choses égales par ailleurs, une augmentation de 1 [unité] de [x] est associée à une variation moyenne de … [unités de y] (IC 95 % [… ; …]).",
    ["L'effet est une moyenne sur l'échantillon, valable dans la plage observée des données (pas d'extrapolation)."],
    ["ols"]);

  G(C, "coef-categoriel", "Interpréter une variable catégorielle (C(...))",
    "Chaque coefficient compare une catégorie à la catégorie de référence.",
    "variable categorielle reference dummy indicatrice c() treatment coefficient categorie interpreter",
    `res = smf.ols('prix ~ surface + C(quartier)', data=df).fit()
print(res.params.filter(like='quartier').round(0))
b = res.params['C(quartier)[T.nord]']
print(f"À surface égale, un logement du quartier nord coûte en moyenne {abs(b):.0f} CHF de "
      f"{'plus' if b > 0 else 'moins'} qu'au centre (catégorie de référence).")`,
    [["C(quartier)[T.nord]", "Différence moyenne entre « nord » et la référence (« centre »), les autres variables fixées."],
     ["Référence", "Première catégorie par ordre alphabétique (absente du tableau). La changer : C(quartier, Treatment(reference='sud'))."],
     ["Comparer nord et sud", "Différence de leurs deux coefficients (ou changer de référence pour avoir le test)."]],
    "À [autres variables] égales, [catégorie] est associée à un [y] plus élevé/bas de … en moyenne que [référence] (p = …).",
    ["Ne pas interpréter une catégorie « dans l'absolu » : c'est toujours par rapport à la référence."],
    ["categorielles", "ols"]);

  G(C, "interaction", "Interpréter une interaction (a * b)",
    "L'effet d'une variable dépend de la valeur d'une autre.",
    "interaction terme croise effet depend moderation pente differente groupe a b deux points",
    `res = smf.ols('score ~ age * C(groupe)', data=df).fit()
print(res.params.round(3))
pente_A = res.params['age']
pente_B = pente_A + res.params['age:C(groupe)[T.B]']
print(f"Effet de l'âge : {pente_A:.3f} point/an dans le groupe A, {pente_B:.3f} dans le groupe B.")`,
    [["age", "Pente de l'âge dans la catégorie de référence (groupe A) seulement."],
     ["C(groupe)[T.B]", "Différence B − A quand age = 0 (souvent sans sens : centrer age aide)."],
     ["age:C(groupe)[T.B]", "Différence de pente entre B et A. Significatif → l'effet de l'âge n'est pas le même dans les deux groupes."]],
    "L'effet de [x] sur [y] dépend de [groupe] : il est de … dans [A] et de … dans [B] (interaction p = …).",
    ["Avec une interaction, ne plus interpréter les effets principaux seuls : ils ne valent qu'à la référence / à 0 de l'autre variable."],
    ["interactions"]);

  G(C, "log-transform", "Interpréter des coefficients avec un log",
    "log(y) ~ x : effet en pourcentage ; log(y) ~ log(x) : élasticité.",
    "log logarithme transformation pourcentage elasticite coefficient interpreter log y log x",
    `r1 = smf.ols('np.log(revenu) ~ age', data=df).fit()
b = r1.params['age']
print(f"log(y) ~ x : +1 an ↔ revenu × {np.exp(b):.3f}, soit {100 * (np.exp(b) - 1):.1f} % de plus")
r2 = smf.ols('np.log(prix) ~ np.log(surface)', data=df[df['prix'] > 0]).fit()
print(f"log(y) ~ log(x) : +1 % de surface ↔ {r2.params['np.log(surface)']:+.2f} % de prix (élasticité)")`,
    [["log(y) ~ x", "+1 de x multiplie y par exp(b) ; pour b petit, ≈ +100·b %."],
     ["y ~ log(x)", "+1 % de x ↔ + b/100 unités de y."],
     ["log(y) ~ log(x)", "+1 % de x ↔ + b % de y (élasticité)."]],
    "Chaque année d'âge supplémentaire est associée à un revenu environ …% plus élevé, toutes choses égales par ailleurs.",
    ["log(0) n'existe pas : filtrer ou utiliser np.log1p (et le dire)."],
    ["interactions"]);

  G(C, "coefs-standardises", "Comparer l'importance des variables (coefficients standardisés)",
    "Pour dire quelle variable « compte le plus », il faut les mettre sur la même échelle.",
    "comparer importance variables coefficients standardises ecart type z score laquelle compte le plus",
    `cols = ['surface', 'age', 'prix']
dz = df.copy()
dz[cols] = (df[cols] - df[cols].mean()) / df[cols].std()
smf.ols('prix ~ surface + age', data=dz).fit().params.round(3)`,
    [["Coefficient standardisé", "Variation de y (en écarts-types) pour +1 écart-type de x."],
     ["Comparaison", "|coef| plus grand → variable plus « influente » dans le modèle (association, pas causalité)."]],
    "Une augmentation d'un écart-type de la surface est associée à +… écart-type de prix, contre … pour l'âge : la surface est la variable la plus associée au prix.",
    ["Ne pas standardiser les variables binaires (0/1) : leur coefficient brut est déjà interprétable."],
    ["standardiser"]);

  G(C, "odds-ratio", "Interpréter une régression logistique (odds ratio)",
    "Les coefficients sont des log-odds : on les passe à l'exponentielle.",
    "regression logistique logit odds ratio interpreter coefficient log odds probabilite chance exp",
    `res = smf.logit('deces ~ age + fumeur', data=df).fit(disp=0)
ors, ic = np.exp(res.params), np.exp(res.conf_int())
print(pd.DataFrame({'OR': ors, 'IC bas': ic[0], 'IC haut': ic[1], 'p': res.pvalues}).round(3))
lo, hi, p = ic.loc['fumeur', 0], ic.loc['fumeur', 1], res.pvalues['fumeur']
print(f"À âge égal, fumer multiplie les odds de décès par {ors['fumeur']:.2f} (IC 95 % [{lo:.2f} ; {hi:.2f}], p = {p:.2g})"
      + (" : effet significatif." if p < 0.05 else " : l'IC contient 1, l'effet n'est pas significatif au seuil de 5 %."))`,
    [["coef", "Variation du log-odds pour +1 de x. Signe positif → probabilité qui augmente."],
     ["OR = exp(coef)", "Facteur multiplicatif des odds. OR = 1 : pas d'effet ; 2 : odds doublées ; 0.5 : divisées par 2."],
     ["Odds", "p / (1 − p) : ce n'est PAS la probabilité (OR = 2 ne veut pas dire « deux fois plus probable »)."],
     ["Pseudo R-squ.", "Qualité d'ajustement indicative, pas comparable au R² de l'OLS."]],
    "À [autres variables] égales, [x] multiplie les odds de [événement] par … (IC 95 % [… ; …], p = …).",
    ["« Odds » ≠ « probabilité » : dire « multiplie les odds (les chances) par … », pas « … fois plus probable »."],
    ["logit"]);

  // =========================================================================================
  C = "Tests & incertitude";
  G(C, "p-value", "Interpréter une p-value",
    "Ce qu'elle dit, ce qu'elle ne dit pas, et comment l'écrire.",
    "p value pvalue significatif significativite seuil hypothese nulle interpreter test signifie",
    `t, p = stats.ttest_ind(groupe_b, groupe_a, equal_var=False)
print(f"t = {t:.2f}, p = {p:.2g}")
print("→ significatif au seuil de 5 %" if p < 0.05 else "→ pas significatif au seuil de 5 %")`,
    [["Définition", "Probabilité d'observer un résultat au moins aussi extrême que celui observé SI l'hypothèse nulle (H0) est vraie."],
     ["p < α (souvent 0.05)", "On rejette H0 : le résultat est « statistiquement significatif »."],
     ["p ≥ α", "On ne peut pas rejeter H0. Ça ne prouve pas que H0 est vraie (manque de données possible)."],
     ["Ce n'est pas", "Ni la probabilité que H0 soit vraie, ni la taille ou l'importance de l'effet."]],
    "La différence observée est statistiquement significative (test …, p = …) : un écart aussi grand serait très peu probable si les deux groupes avaient la même moyenne.",
    ["Avec beaucoup de données, des effets minuscules deviennent significatifs : toujours donner la taille de l'effet.",
     "Plusieurs tests → corriger (Bonferroni : seuil 0.05 / nombre de tests)."],
    ["p-value", "comparer-moyennes", "tests-multiples"]);

  G(C, "intervalle-confiance", "Interpréter un intervalle de confiance",
    "Une fourchette pour la vraie valeur, et ce qu'on peut conclure quand deux intervalles se chevauchent.",
    "intervalle de confiance ic 95 fourchette incertitude chevauchement bootstrap interpreter",
    `m = df['revenu'].mean()
boot = [df['revenu'].sample(frac=1, replace=True).mean() for _ in range(1000)]
lo, hi = np.percentile(boot, [2.5, 97.5])
print(f"Revenu moyen : {m:.0f} CHF, IC 95 % (bootstrap) [{lo:.0f} ; {hi:.0f}]")`,
    [["IC 95 %", "Si on répétait l'étude de nombreuses fois, 95 % des intervalles construits ainsi contiendraient la vraie valeur."],
     ["Largeur", "Plus étroit avec plus de données et moins de variabilité."],
     ["Deux IC disjoints", "Différence significative."],
     ["Deux IC qui se chevauchent", "On ne peut pas conclure directement : calculer l'IC de la différence (ou faire un test)."]],
    "Le revenu moyen est de … CHF (IC 95 % [… ; …]).",
    ["Éviter « il y a 95 % de chances que la vraie valeur soit dans cet intervalle » (formulation fréquentiste incorrecte, souvent tolérée mais à éviter)."],
    ["bootstrap"]);

  G(C, "correlation", "Interpréter une corrélation",
    "Force, sens, significativité — et pourquoi corrélation ne veut pas dire causalité.",
    "correlation pearson spearman r rho force lien interpreter causalite r2",
    `r, p = stats.pearsonr(df['x'], df['y'])
rho, p2 = stats.spearmanr(df['age'], df['revenu'])
print(f"Pearson r = {r:.2f} (p = {p:.2g}) ; r² = {r ** 2:.2f} → {100 * r ** 2:.0f} % de variance partagée")
print(f"Spearman rho = {rho:.2f} (p = {p2:.2g})")`,
    [["r (Pearson)", "Lien LINÉAIRE de −1 à 1. Repères indicatifs : |r| < 0.1 négligeable, 0.1–0.3 faible, 0.3–0.5 modéré, > 0.5 fort."],
     ["rho (Spearman)", "Lien MONOTONE (rangs), robuste aux valeurs extrêmes et aux distributions asymétriques."],
     ["r²", "Part de variance « partagée » entre les deux variables."],
     ["p", "Teste r = 0. Avec beaucoup de données, une corrélation faible peut être significative."]],
    "Il existe une corrélation positive [faible/modérée/forte] entre [x] et [y] (r = …, p = …), ce qui ne permet pas de conclure à un lien de cause à effet.",
    ["r ≈ 0 ne veut pas dire « aucun lien » : il peut y avoir un lien non linéaire (toujours regarder le nuage de points).",
     "Une variable confondante peut créer une corrélation entre deux variables sans lien direct."],
    ["correlation-test", "relation"]);

  G(C, "comparer-groupes", "Rédiger la comparaison de deux groupes (taille d'effet)",
    "Donner la différence, sa significativité ET sa taille.",
    "comparer deux groupes difference moyenne taille effet cohen d test t rediger resultat",
    `diff = groupe_b.mean() - groupe_a.mean()
d = diff / np.sqrt((groupe_a.var() + groupe_b.var()) / 2)
t, p = stats.ttest_ind(groupe_b, groupe_a, equal_var=False)
print(f"Le groupe B a un score moyen supérieur de {diff:.1f} points (d de Cohen = {d:.2f}), "
      f"différence significative (test t de Welch, p = {p:.2g}).")`,
    [["Différence de moyennes", "La taille de l'effet dans les unités de la variable : la plus parlante."],
     ["d de Cohen", "Différence en écarts-types : ≈ 0.2 petit, 0.5 moyen, 0.8 grand."],
     ["Mann-Whitney", "Si distributions très asymétriques : comparer plutôt les médianes et utiliser ce test."]],
    "[Groupe B] a un [y] moyen supérieur de … (d = …), différence statistiquement significative (test t de Welch, p = …).",
    ["Significatif ≠ important : une différence de 0.1 point peut être significative avec 1 million de lignes."],
    ["comparer-moyennes"]);

  G(C, "chi2", "Interpréter un test du χ² d'indépendance",
    "Deux variables catégorielles sont-elles liées ?",
    "chi2 khi deux independance association categorielles tableau contingence interpreter",
    `chi2, p, dof, attendu = stats.chi2_contingency(table)
print(table)
print(f"χ² = {chi2:.2f}, ddl = {dof}, p = {p:.2g}")
pd.crosstab(df['traitement'], df['guerison'], normalize='index').round(2)`,
    [["H0", "Les deux variables sont indépendantes."],
     ["p < 0.05", "Association significative : la répartition de l'une dépend de l'autre."],
     ["Tableau en % par ligne", "Indispensable pour dire DANS QUEL SENS va l'association (le test ne le dit pas)."]],
    "Le taux de guérison est de …% avec le médicament contre …% avec le placebo ; cette association est significative (χ² = …, p = …).",
    ["Effectifs attendus < 5 dans des cases : test exact de Fisher."],
    ["chi2", "croiser"]);

  G(C, "normalite", "Interpréter un test de normalité (ou d'ajustement à une loi)",
    "KS, Shapiro… : ce qu'on peut (et ne peut pas) conclure.",
    "normalite loi normale kolmogorov smirnov shapiro ks test ajustement distribution interpreter",
    `from statsmodels.stats import diagnostic
for col in ['taille', 'revenu']:
    stat, p = diagnostic.kstest_normal(df[col], dist='norm')
    print(f"{col} : p = {p:.3g} →", "compatible avec une loi normale" if p >= 0.05 else "on rejette la normalité")`,
    [["H0", "Les données suivent la loi testée."],
     ["p < 0.05", "On rejette : les données ne suivent pas cette loi."],
     ["p ≥ 0.05", "Compatible avec la loi, mais ça ne le PROUVE pas."]],
    "On rejette l'hypothèse de normalité du revenu (test de Kolmogorov-Smirnov, p = …), ce que confirme l'histogramme très asymétrique.",
    ["Avec beaucoup de données, le test rejette pour de toutes petites déviations : regarder aussi l'histogramme / le QQ-plot."],
    ["normalite"]);

  // =========================================================================================
  C = "Causalité";
  G(C, "naif-vs-ajuste", "Effet naïf, confondants et effet ajusté",
    "Pourquoi la simple différence entre traités et non-traités peut tromper.",
    "naif confondant confounder biais ajuste causal traitement effet observationnel simpson",
    `naif = df.groupby('traite')['resultat'].mean()
print(f"Différence naïve (traités − non traités) : {naif[1] - naif[0]:.0f}")
print(df.groupby('traite')[['educ', 'revenu_avant']].mean().round(1))
ajuste = smf.ols('resultat ~ traite + educ + revenu_avant', data=df).fit()
lo, hi = ajuste.conf_int().loc['traite']
print(f"Effet ajusté (régression) : {ajuste.params['traite']:.0f}, IC 95 % [{lo:.0f} ; {hi:.0f}]  (vrai effet simulé : 1500)")`,
    [["Confondant", "Variable qui influence À LA FOIS le traitement et le résultat (ici l'éducation et le revenu d'avant)."],
     ["Différence naïve", "Mélange l'effet du traitement et les différences préexistantes entre groupes."],
     ["Effet ajusté", "Retire l'effet des confondants OBSERVÉS (régression, matching). Les confondants non mesurés restent un problème."]],
    "La comparaison naïve suggère un effet de …, mais les traités diffèrent des non-traités (éducation, revenu antérieur). Après ajustement sur ces variables, l'effet estimé est de ….",
    ["Paradoxe de Simpson : un effet peut changer de signe une fois qu'on contrôle un confondant.",
     "Ne pas contrôler une variable mesurée APRÈS le traitement (elle peut être une conséquence du traitement)."],
    ["naif", "propensity"]);

  G(C, "matching", "Interpréter un matching sur score de propension",
    "Ce que mesure l'effet après matching, comment vérifier l'équilibre, et les limites.",
    "matching appariement propensity score propension equilibre smd balance effet att limites interpreter",
    `ps = smf.logit('traite ~ educ + revenu_avant + C(origine)', data=df).fit(disp=0).predict(df)
d = df.assign(ps=ps)
T, Ctl = d[d['traite'] == 1], d[d['traite'] == 0]
G2 = nx.Graph()
for i, t in T.iterrows():
    for j, c in Ctl.iterrows():
        G2.add_edge(i, j, weight=1 - abs(t['ps'] - c['ps']))
m = d.loc[[k for paire in nx.max_weight_matching(G2) for k in paire]]
def smd(col, data):
    a, b = data.loc[data['traite'] == 1, col], data.loc[data['traite'] == 0, col]
    return (a.mean() - b.mean()) / np.sqrt((a.var() + b.var()) / 2)
print('SMD avant :', {c: round(smd(c, d), 2) for c in ['educ', 'revenu_avant']})
print('SMD après :', {c: round(smd(c, m), 2) for c in ['educ', 'revenu_avant']})
eff = m.groupby('traite')['resultat'].mean()
print(f"Effet estimé après matching : {eff[1] - eff[0]:.0f}  ({len(m) // 2} paires)")`,
    [["Score de propension", "Probabilité d'être traité vu les covariables. Deux individus de même score sont comparables sur ces covariables."],
     ["SMD", "Différence standardisée des moyennes entre groupes. |SMD| < 0.1 → bien équilibré. Comparer avant / après."],
     ["Effet après matching", "Effet moyen du traitement sur les traités appariés (≈ ATT), si tous les confondants sont observés."],
     ["Unités non appariées", "Elles sortent de l'analyse : l'effet ne vaut que pour la population appariée."]],
    "Après appariement sur le score de propension (covariables équilibrées, |SMD| < 0.1), l'effet estimé du programme est de … ; cette estimation suppose qu'aucun confondant important n'a été omis.",
    ["Le matching ne corrige que les confondants observés : toujours discuter les confondants non mesurés (analyse de sensibilité).",
     "Vérifier l'équilibre APRÈS matching, pas seulement le calculer."],
    ["propensity", "matching", "balance", "sensibilite"]);

  G(C, "diff-in-diff", "Interpréter une différence de différences",
    "Le coefficient d'interaction traité × après.",
    "difference de differences diff in diff did interaction tendances paralleles avant apres interpreter",
    `panel = pd.DataFrame({'traite': np.repeat([0, 1], 100), 'apres': np.tile(np.repeat([0, 1], 50), 2)})
panel['y'] = 10 + 2 * panel['traite'] + panel['apres'] + 3 * panel['traite'] * panel['apres'] + np.random.normal(0, 1, 200)
res = smf.ols('y ~ traite * apres', data=panel).fit()
print(res.params.round(2))
print(f"Effet estimé du traitement : {res.params['traite:apres']:.2f} (vrai effet simulé : 3)")`,
    [["traite", "Différence de niveau entre groupes AVANT (différences préexistantes)."],
     ["apres", "Évolution du groupe contrôle (tendance commune)."],
     ["traite:apres", "Évolution en plus pour les traités = effet estimé du traitement."]],
    "Le groupe traité a progressé de … de plus que le groupe contrôle après l'intervention (p = …), ce qui estime l'effet du traitement sous l'hypothèse de tendances parallèles.",
    ["Hypothèse clé : sans traitement, les deux groupes auraient évolué pareil (vérifier les tendances avant)."],
    ["diff-in-diff"]);

  // =========================================================================================
  C = "Machine learning";
  G(C, "metriques", "Lire une matrice de confusion et un classification_report",
    "Précision, rappel, F1, accuracy : lequel regarder et comment l'écrire.",
    "matrice confusion precision rappel recall f1 accuracy classification report support interpreter metriques baseline",
    `from sklearn.metrics import confusion_matrix
cm = confusion_matrix(y_test, y_pred)
print(pd.DataFrame(cm, index=['vrai 0', 'vrai 1'], columns=['prédit 0', 'prédit 1']))
print(classification_report(y_test, y_pred, digits=2))
print('Baseline (toujours la classe majoritaire) :', round(max(y_test.mean(), 1 - y_test.mean()), 2))`,
    [["Matrice", "Lignes = vraie classe, colonnes = prédite. Diagonale = bonnes prédictions."],
     ["precision", "Parmi les prédits positifs, part de vrais positifs (combien de fausses alertes ?)."],
     ["recall", "Parmi les vrais positifs, part retrouvée (combien en rate-t-on ?)."],
     ["f1-score", "Moyenne harmonique précision / rappel."],
     ["support", "Nombre d'exemples réels de chaque classe."],
     ["macro avg / weighted avg", "Moyenne simple des classes / pondérée par leur taille."],
     ["accuracy", "Part de bonnes prédictions. À comparer à la baseline (classe majoritaire)."]],
    "Le modèle atteint une accuracy de … contre … pour la baseline ; il retrouve …% des positifs (rappel) et …% de ses alertes sont correctes (précision).",
    ["Classes déséquilibrées : une accuracy élevée peut être celle de la baseline.",
     "Choisir la métrique selon le coût des erreurs (rater un malade → rappel ; fausse alerte coûteuse → précision)."],
    ["metriques-classif", "seuil"]);

  G(C, "roc-auc", "Interpréter une courbe ROC et l'AUC",
    "Qualité du classement indépendamment du seuil.",
    "roc auc aire courbe seuil classement interpreter classifieur",
    `auc = roc_auc_score(y_test, proba)
plt.plot(fpr, tpr, label=f'AUC = {auc:.2f}')
plt.plot([0, 1], [0, 1], '--', color='grey', label='hasard')
plt.xlabel('Taux de faux positifs'); plt.ylabel('Taux de vrais positifs'); plt.legend()`,
    [["AUC", "Probabilité qu'un positif pris au hasard ait un score plus élevé qu'un négatif pris au hasard."],
     ["0.5 / 1", "0.5 = hasard (diagonale), 1 = parfait."],
     ["Chaque point", "Un seuil de décision : en baissant le seuil, on gagne des vrais positifs et des faux positifs."]],
    "Le modèle obtient une AUC de … : il classe correctement un positif au-dessus d'un négatif dans …% des cas.",
    ["L'AUC ne dit rien du seuil choisi : pour une décision concrète, regarder précision / rappel à ce seuil."],
    ["metriques-classif"]);

  G(C, "overfitting", "Diagnostiquer le sur/sous-apprentissage",
    "Comparer le score d'entraînement et le score en validation croisée.",
    "overfitting surapprentissage underfitting sous apprentissage train test validation croisee cv interpreter",
    `from sklearn.tree import DecisionTreeClassifier
for profondeur in [1, 3, 10, None]:
    arbre = DecisionTreeClassifier(max_depth=profondeur, random_state=0)
    cv = cross_val_score(arbre, X_train, y_train, cv=5)
    train = arbre.fit(X_train, y_train).score(X_train, y_train)
    print(f"profondeur {profondeur}: train {train:.2f} | CV {cv.mean():.2f} ± {cv.std():.2f}")`,
    [["train ≫ CV", "Surapprentissage : le modèle apprend le bruit (trop complexe → régulariser, simplifier)."],
     ["train ≈ CV, les deux bas", "Sous-apprentissage : modèle trop simple."],
     ["± écart-type", "Variabilité entre folds : deux modèles dont les intervalles se recouvrent ne sont pas vraiment différents."],
     ["Test", "Ne l'utiliser qu'une fois, à la fin, sur le modèle choisi."]],
    "Au-delà d'une profondeur de …, le score d'entraînement continue d'augmenter alors que le score de validation croisée baisse : le modèle surapprend.",
    ["Ne jamais choisir les hyperparamètres sur le jeu de test."],
    ["cross-validation", "regularisation"]);

  G(C, "importances", "Interpréter des coefficients / importances de variables",
    "Quelles variables comptent pour la prédiction — et ce qu'on ne peut pas en conclure.",
    "importance variables feature importance coefficients interpreter prediction causal",
    `pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False).round(3)`,
    [["feature_importances_", "Part de la réduction d'impureté due à chaque variable (somme = 1). Ne donne pas le sens de l'effet."],
     ["coef_ (modèle linéaire)", "Sens et force, comparables seulement si les variables sont standardisées."],
     ["Variables corrélées", "Elles se partagent l'importance : chacune peut paraître peu importante."]],
    "Pour prédire …, les variables les plus utiles au modèle sont … et … ; cela ne signifie pas qu'elles causent ….",
    ["Importance pour la PRÉDICTION ≠ effet causal."],
    ["arbres", "coefficients"]);

  // =========================================================================================
  C = "Non supervisé";
  G(C, "kmeans", "Choisir k et décrire des clusters",
    "Silhouette, méthode du coude, et comment présenter les groupes trouvés.",
    "kmeans clustering choisir k silhouette coude elbow inertie decrire clusters interpreter",
    `from sklearn.metrics import silhouette_score
for k in [2, 3, 4, 5, 6]:
    km_k = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X_s)
    print(k, '| silhouette', round(silhouette_score(X_s, km_k.labels_), 3), '| inertie', round(km_k.inertia_, 1))
df.assign(cluster=labels).groupby('cluster')[['age', 'revenu', 'score']].mean().round(0)`,
    [["Silhouette", "De −1 à 1 : proche de 1 = clusters bien séparés ; ≈ 0 = clusters qui se chevauchent. Prendre le k qui la maximise."],
     ["Inertie (coude)", "Diminue toujours avec k : choisir le k où la baisse ralentit nettement."],
     ["Décrire", "Moyenne des variables par cluster (et taille de chaque cluster) pour leur donner un sens."]],
    "La silhouette est maximale pour k = … ; le cluster 1 regroupe des personnes plus âgées et aux revenus plus élevés, le cluster 2 ….",
    ["Standardiser avant k-means (sinon la variable à la plus grande échelle domine).",
     "Un clustering trouve TOUJOURS des groupes : ce ne sont pas forcément de « vrais » groupes."],
    ["kmeans", "dbscan"]);

  G(C, "pca", "Interpréter une PCA",
    "Variance expliquée et composantes.",
    "pca acp composantes principales variance expliquee loadings interpreter tsne",
    `from sklearn.decomposition import PCA
pca = PCA().fit(X_s)
print('variance expliquée :', pca.explained_variance_ratio_.round(3), '| cumulée :', pca.explained_variance_ratio_.cumsum().round(3))
pd.DataFrame(pca.components_[:2], columns=X.columns, index=['PC1', 'PC2']).round(2)`,
    [["explained_variance_ratio_", "Part de la variance totale portée par chaque composante."],
     ["components_ (loadings)", "Poids de chaque variable d'origine dans la composante : sert à lui donner un sens."],
     ["t-SNE", "Bon pour visualiser des groupes, mais les distances entre groupes éloignés et la taille des groupes ne sont pas interprétables."]],
    "Les deux premières composantes expliquent …% de la variance ; la première est surtout liée à … et ….",
    ["Standardiser avant une PCA si les variables n'ont pas les mêmes unités."],
    ["pca"]);

  // =========================================================================================
  C = "Distributions & graphiques";
  G(C, "moyenne-mediane", "Moyenne ou médiane ? Décrire une distribution asymétrique",
    "Quand la moyenne trompe, et quoi rapporter.",
    "moyenne mediane asymetrique skew queue lourde valeurs extremes decrire distribution interpreter",
    `s_ = df['revenu']
print(f"moyenne {s_.mean():.0f} | médiane {s_.median():.0f} | asymétrie (skew) {s_.skew():.2f}")
s_.describe().round(0)`,
    [["Moyenne > médiane", "Distribution étirée vers la droite (quelques très grandes valeurs)."],
     ["skew", "≈ 0 symétrique, > 0 queue à droite, < 0 queue à gauche."],
     ["Quoi rapporter", "Distribution asymétrique : médiane et quartiles (Q1–Q3) plutôt que moyenne ± écart-type."]],
    "Le revenu est très asymétrique (moyenne … > médiane …) : nous rapportons la médiane (…) et l'intervalle interquartile [… ; …].",
    ["Queue lourde : utiliser une échelle log pour les graphiques ; la moyenne peut être dominée par quelques valeurs."],
    ["stats-desc", "distribution", "queue-lourde"]);

  G(C, "lire-graphiques", "Lire une boîte à moustaches et une CCDF log-log",
    "Ce que représente chaque élément.",
    "boxplot boite moustaches quartiles ccdf log log loi puissance lire graphique interpreter",
    `fig, axes = plt.subplots(1, 2, figsize=(10, 3.5))
sns.boxplot(data=df, x='groupe', y='score', ax=axes[0])
sns.ecdfplot(data=df, x='degre', complementary=True, log_scale=(True, True), ax=axes[1])
axes[1].set_ylabel('P(X ≥ x)')
plt.tight_layout()`,
    [["Boîte", "Du 1er au 3e quartile : 50 % des données au milieu. Le trait = médiane."],
     ["Moustaches", "Jusqu'à 1.5 × l'écart interquartile ; les points au-delà = valeurs atypiques."],
     ["CCDF log-log", "P(X ≥ x). Une droite suggère une loi de puissance (queue lourde) ; une chute rapide, une queue légère."]],
    "Le groupe B a une médiane plus élevée que le groupe A, avec une dispersion comparable ; la distribution des degrés est à queue lourde (CCDF quasi linéaire en log-log).",
    ["Toujours nommer les axes, avec les unités, et préciser l'échelle (log)."],
    ["comparer-groupes-viz", "queue-lourde"]);

  // =========================================================================================
  C = "Réseaux & texte";
  G(C, "centralites", "Interpréter des mesures de centralité",
    "Degré, intermédiarité, PageRank : qui est « important » et en quel sens.",
    "centralite degre intermediarite betweenness pagerank importance noeud reseau interpreter",
    `cent = pd.DataFrame({'degré': nx.degree_centrality(G),
                     'intermédiarité': nx.betweenness_centrality(G),
                     'pagerank': nx.pagerank(G)})
cent.sort_values('intermédiarité', ascending=False).head().round(3)`,
    [["Degré", "Nombre de connexions (normalisé) : les nœuds les plus connectés."],
     ["Intermédiarité", "Part des plus courts chemins qui passent par le nœud : les « ponts » entre groupes."],
     ["PageRank", "Important si relié à des nœuds eux-mêmes importants."],
     ["Clustering", "Proportion de voisins connectés entre eux (triangles)."]],
    "Le nœud … a le plus grand nombre de connexions, mais c'est … qui joue le rôle de pont entre les communautés (intermédiarité la plus élevée).",
    ["Les centralités ne sont pas comparables entre réseaux de tailles différentes sans normalisation."],
    ["graphe", "communautes"]);

  G(C, "texte", "Interpréter sentiment, thèmes et classifieurs de texte",
    "Ce que valent ces mesures et comment le dire.",
    "sentiment compound vader lda themes topics tfidf mots caracteristiques interpreter texte",
    `from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
analyzer = SentimentIntensityAnalyzer()
sent = script['ligne'].apply(lambda l: analyzer.polarity_scores(l)['compound'])
sent.groupby(script['personnage']).agg(['mean', 'count']).round(3).sort_values('mean')`,
    [["compound (VADER)", "De −1 à 1 ; ≥ 0.05 positif, ≤ −0.05 négatif. Basé sur un lexique : ironie et contexte mal gérés."],
     ["Thème LDA", "Une liste de mots probables : c'est à nous de lui donner un nom ; les thèmes changent avec num_topics et la graine."],
     ["Coefficients d'un classifieur de texte", "Mots qui poussent vers une classe : utiles pour expliquer, mais dépendent du vocabulaire du corpus."]],
    "Les répliques de … sont en moyenne plus positives (compound moyen …) que celles de … ; cette mesure lexicale ne capte pas l'ironie.",
    ["Toujours lire quelques exemples pour vérifier que la mesure a du sens sur ce corpus."],
    ["sentiment", "topics-lda", "texte-classif-temporel"]);

  // =========================================================================================
  C = "Rédiger la réponse";
  G(C, "rediger", "Rédiger une réponse d'examen",
    "La structure d'une bonne réponse à une question d'analyse de données.",
    "rediger reponse examen conclusion structure ecrire phrase expliquer justifier limites",
    "",
    [["1. Répondre à la question", "Première phrase = la réponse directe (« Oui, les traités gagnent davantage »)."],
     ["2. Le chiffre", "La valeur clé avec son unité (+1 500 CHF, 23 %, r = 0.41…)."],
     ["3. L'incertitude", "IC 95 % ou p-value, et le test utilisé."],
     ["4. La méthode en une phrase", "« Régression linéaire contrôlant pour l'âge et le quartier », « matching sur score de propension »…"],
     ["5. Les limites", "Données observationnelles, confondants non mesurés, échantillon, hypothèses du test."],
     ["Mots à éviter", "« prouve », « cause » (sans design causal), « très significatif » sans chiffre, « aucun effet » quand p > 0.05."]],
    "Oui : les participants au programme gagnent en moyenne … CHF de plus que des non-participants comparables (IC 95 % [… ; …]), d'après un matching sur score de propension. Ce résultat suppose qu'aucun facteur non mesuré n'influence à la fois la participation et le revenu.",
    ["Toujours relier le résultat à la question posée et au contexte des données.",
     "Un graphique bien titré vaut souvent mieux qu'un long paragraphe : le commenter en une phrase."],
    ["checklist", "p-value"]);
})();
