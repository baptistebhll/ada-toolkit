/*
 * Recettes : "comment faire X" pour une analyse de données complète (écrites à la main).
 * R(catégorie, id, titre, intro, mots-clés, étapes [[texte, code], ...], à retenir [..], fonctions [..])
 */
window.ADA_KB = window.ADA_KB || { functions: [], recipes: [] };
(function () {
  const R = (cat, id, title, intro, t, steps, tips, fns) => window.ADA_KB.recipes.push({ cat, id, title, intro, t, steps, tips, fns });
  let C;

  // =========================================================================================
  C = "0 · Vue d'ensemble";
  R(C, "checklist", "Checklist d'une analyse de données complète",
    "Le squelette d'un examen d'analyse : de la lecture du fichier à la conclusion. Chaque étape renvoie à une recette.",
    "plan methode etapes analyse complete examen workflow pipeline checklist demarche",
    [["Imports standards (à coller en haut du notebook).",
`import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import statsmodels.formula.api as smf
import networkx as nx`],
     ["1. Charger, regarder la taille, les types, les manquants.",
`df = pd.read_csv('data/fichier.csv')
print(df.shape); df.info(); df.head()
df.isna().mean().sort_values(ascending=False)`],
     ["2. Nettoyer : types, dates, doublons, valeurs aberrantes ; noter combien de lignes on enlève.",
`n0 = len(df)
df = df.drop_duplicates().dropna(subset=['col_cle'])
print(f'{n0 - len(df)} lignes supprimées')`],
     ["3. Décrire et visualiser (distribution de chaque variable clé, relations entre variables).",
`df.describe()
sns.histplot(data=df, x='variable', log_scale=True)`],
     ["4. Répondre à la question : comparer des groupes (test), modéliser (régression), prédire (ML) ou corriger un biais (matching).", ""],
     ["5. Quantifier l'incertitude (IC bootstrap, p-values) et conclure en une phrase claire, avec les limites.", ""]],
    ["Toujours un titre, des axes nommés (avec unités) et une échelle log si la distribution est très asymétrique.",
     "Corrélation ≠ causalité : mentionner les variables confondantes possibles.",
     "Répondre explicitement à la question posée, chiffres à l'appui (« 12 % plus élevé, IC 95 % [8 %, 16 %] »)."],
    ["pd.read_csv", "df.info", "df.describe", "df.isna", "sns.histplot"]);

  // =========================================================================================
  C = "1 · Charger & inspecter";
  R(C, "charger", "Charger un fichier de données",
    "CSV, TSV, Excel, JSON, fichiers compressés : lire le fichier dans un DataFrame.",
    "charger lire importer ouvrir fichier donnees load read csv excel json gz",
    [["CSV / TSV / compressé.",
`df = pd.read_csv('data/fichier.csv')
df = pd.read_csv('data/fichier.tsv', sep='\\t')
df = pd.read_csv('data/fichier.csv.gz', compression='gzip')`],
     ["Excel et JSON.",
`df = pd.read_excel('data/fichier.xlsx', sheet_name=0)
df = pd.read_json('data/fichier.jsonl', lines=True)`],
     ["Plusieurs fichiers d'un dossier → un seul DataFrame.",
`import glob
df = pd.concat([pd.read_csv(f) for f in glob.glob('data/*.csv')], ignore_index=True)`]],
    ["Si les colonnes sont mal séparées : vérifier sep. Si les accents sont cassés : encoding='latin-1'.",
     "parse_dates=['date'] convertit directement les dates."],
    ["pd.read_csv", "pd.read_excel", "pd.read_json", "pd.concat"]);

  R(C, "inspecter", "Premier coup d'œil sur un DataFrame",
    "Taille, types, aperçu, statistiques, valeurs distinctes et manquantes.",
    "inspecter explorer apercu regarder comprendre structure taille types colonnes overview",
    [["",
`df.shape
df.head()
df.info()                         # types + non-nuls
df.describe()                     # stats des colonnes numériques
df.describe(include='object')     # colonnes texte
df['categorie'].value_counts()
df.nunique()
df.isna().sum()`]],
    ["Vérifier que les colonnes numériques ne sont pas lues comme texte (dtype object)."],
    ["df.shape", "df.head", "df.info", "df.describe", "s.value_counts", "s.nunique", "df.isna"]);

  R(C, "qualite", "Vérifier la qualité des données",
    "Manquants, doublons, valeurs impossibles ou aberrantes, incohérences.",
    "qualite verifier nettoyer aberrantes outliers doublons incoherences erreurs manquantes",
    [["Manquants et doublons.",
`df.isna().mean().sort_values(ascending=False)    # % de manquants par colonne
df.duplicated().sum(), df.duplicated(subset=['id']).sum()`],
     ["Valeurs impossibles / extrêmes.",
`df[(df['age'] < 0) | (df['age'] > 120)]
df['revenu'].describe(percentiles=[.01, .5, .99])
sns.boxplot(x=df['revenu'])`]],
    ["Une valeur extrême n'est pas forcément une erreur (distributions à queue lourde) : justifier toute suppression."],
    ["df.isna", "df.duplicated", "df.describe", "sns.boxplot"]);

  // =========================================================================================
  C = "2 · Nettoyer & préparer";
  R(C, "manquants", "Gérer les valeurs manquantes",
    "Repérer, supprimer ou imputer les NaN.",
    "valeurs manquantes nan null vide missing imputer remplacer supprimer trous",
    [["Repérer.", `df.isna().sum()
df[df['age'].isna()].head()`],
     ["Supprimer les lignes concernées (sur les colonnes utiles seulement).", `df = df.dropna(subset=['age', 'revenu'])`],
     ["Imputer (médiane, valeur fixe, par groupe).",
`df['age'] = df['age'].fillna(df['age'].median())
df['revenu'] = df['revenu'].fillna(df.groupby('pays')['revenu'].transform('median'))`],
     ["Valeurs manquantes codées autrement (-1, '?', 'N/A').", `df = df.replace({-1: np.nan, '?': np.nan})`]],
    ["Les NaN ne sont pas aléatoires en général : regarder si les lignes manquantes diffèrent des autres.",
     "Imputer modifie la variance : le dire dans la conclusion."],
    ["df.isna", "df.dropna", "df.fillna", "df.transform", "s.replace"]);

  R(C, "types-dates", "Convertir les types et les dates",
    "Texte → nombre, texte → date, extraire année / mois / jour de la semaine.",
    "convertir type date temps datetime nombre numerique annee mois jour",
    [["", `df['prix'] = pd.to_numeric(df['prix'], errors='coerce')
df['date'] = pd.to_datetime(df['date'], errors='coerce')
df['annee'] = df['date'].dt.year
df['mois'] = df['date'].dt.month
df['jour_semaine'] = df['date'].dt.dayofweek
df['pays'] = df['pays'].astype('category')`],
     ["Timestamps Unix.", `df['date'] = pd.to_datetime(df['ts'], unit='s')`]],
    ["errors='coerce' transforme les valeurs invalides en NaN : compter combien ensuite."],
    ["pd.to_numeric", "pd.to_datetime", "s.dt", "df.astype"]);

  R(C, "texte-nettoyer", "Nettoyer et filtrer du texte",
    "Minuscules, espaces, recherche de mots, découpage.",
    "texte chaine string nettoyer minuscules mot contient chercher split",
    [["", `df['titre'] = df['titre'].str.lower().str.strip()
df[df['titre'].str.contains('climat|climate', case=False, na=False)]
df['n_mots'] = df['titre'].str.split().str.len()
df['domaine'] = df['url'].str.extract(r'https?://([^/]+)')`]],
    ["na=False dans str.contains, sinon le masque contient des NaN."],
    ["s.str", "s.str.contains"]);

  R(C, "filtrer", "Filtrer des lignes selon des conditions",
    "Masques booléens, query, isin, between.",
    "filtrer selectionner conditions lignes garder exclure where filter subset",
    [["", `df[df['age'] > 30]
df[(df['age'] > 30) & (df['pays'] == 'CH')]     # ET
df[(df['pays'] == 'CH') | (df['pays'] == 'FR')]  # OU
df[df['pays'].isin(['CH', 'FR'])]
df[~df['pays'].isin(['CH'])]                     # NON
df[df['age'].between(18, 65)]
df.query('age > 30 and pays == "CH"')`]],
    ["Parenthèses obligatoires autour de chaque condition avec & et |."],
    ["df.loc", "df.query", "s.isin", "s.between"]);

  R(C, "colonnes", "Créer de nouvelles colonnes",
    "Calculs vectorisés, conditions, fonctions, tranches.",
    "creer nouvelle colonne calculer variable feature transformer ajouter",
    [["", `df['bmi'] = df['poids'] / df['taille'] ** 2
df['majeur'] = np.where(df['age'] >= 18, 1, 0)
df['tranche'] = pd.cut(df['age'], [0, 18, 65, 120], labels=['jeune', 'adulte', 'senior'])
df['quartile'] = pd.qcut(df['revenu'], 4, labels=False)
df['log_revenu'] = np.log1p(df['revenu'])
df['n_mots'] = df['texte'].apply(lambda t: len(str(t).split()))`]],
    ["Préférer les opérations vectorisées à apply quand c'est possible (beaucoup plus rapide)."],
    ["np.where", "pd.cut", "pd.qcut", "np.log", "s.apply"]);

  R(C, "categorielles", "Encoder des variables catégorielles",
    "One-hot (get_dummies) pour sklearn, C() dans les formules statsmodels.",
    "categorielle encoder one hot dummy dummies indicatrices categorical variable",
    [["Pour sklearn.", `X = pd.get_dummies(df[['age', 'pays', 'sexe']], columns=['pays', 'sexe'], drop_first=True, dtype=int)`],
     ["Pour statsmodels : directement dans la formule.", `smf.ols('revenu ~ age + C(pays)', data=df).fit()
smf.ols("revenu ~ C(pays, Treatment(reference='CH'))", data=df).fit()   # choisir la référence`]],
    ["Le coefficient d'une catégorie s'interprète par rapport à la catégorie de référence."],
    ["pd.get_dummies", "smf.ols"]);

  // =========================================================================================
  C = "3 · Combiner & agréger";
  R(C, "joindre", "Joindre deux tables",
    "Associer les lignes de deux DataFrames via une clé commune (comme un JOIN SQL).",
    "joindre jointure fusionner combiner relier deux tables merge join cle",
    [["", `df = pd.merge(clients, achats, on='client_id', how='left')
df = pd.merge(a, b, left_on='id', right_on='user_id', how='inner')`],
     ["Vérifier la jointure.", `print(len(clients), len(achats), len(df))
df = pd.merge(a, b, on='id', how='outer', indicator=True)
df['_merge'].value_counts()     # left_only / right_only / both`]],
    ["inner : seulement les correspondances ; left : garde tout à gauche ; outer : tout.",
     "Si le nombre de lignes explose : clé dupliquée (validate='one_to_one' pour le détecter)."],
    ["pd.merge", "df.merge"]);

  R(C, "empiler", "Empiler ou coller des tables",
    "Ajouter des lignes (même colonnes) ou des colonnes (même index).",
    "empiler concatener coller ajouter lignes append concat stack",
    [["", `df = pd.concat([df_2019, df_2020], ignore_index=True)
df = pd.concat([df_2019.assign(annee=2019), df_2020.assign(annee=2020)])
X = pd.concat([X_num, X_cat], axis=1)`]],
    [], ["pd.concat", "df.assign"]);

  R(C, "grouper", "Grouper et agréger (statistiques par groupe)",
    "Moyenne, médiane, effectif… par catégorie : le split-apply-combine.",
    "grouper par groupe categorie agreger moyenne par somme par compter par groupby aggregate statistiques",
    [["", `df.groupby('pays')['revenu'].mean()
df.groupby(['pays', 'sexe'])['revenu'].median().unstack()
res = (df.groupby('pays', as_index=False)
         .agg(moy=('revenu', 'mean'), med=('revenu', 'median'), n=('revenu', 'size'))
         .sort_values('moy', ascending=False))`],
     ["Ramener une stat de groupe sur chaque ligne.", `df['part_du_pays'] = df['revenu'] / df.groupby('pays')['revenu'].transform('sum')`]],
    ["Toujours afficher l'effectif n par groupe : une moyenne sur 3 lignes ne vaut rien."],
    ["df.groupby", "df.agg", "df.transform", "df.unstack", "df.sort_values"]);

  R(C, "croiser", "Tableau croisé et pivot",
    "Compter les combinaisons de deux variables, ou mettre une variable en colonnes.",
    "tableau croise contingence pivot remodeler large long croiser deux variables",
    [["", `pd.crosstab(df['traitement'], df['resultat'])
pd.crosstab(df['traitement'], df['resultat'], normalize='index')
df.pivot_table(index='pays', columns='annee', values='pib', aggfunc='mean')
long = pd.melt(large, id_vars='pays', var_name='annee', value_name='pib')`]],
    [], ["pd.crosstab", "df.pivot_table", "pd.melt", "df.pivot"]);

  R(C, "temps", "Séries temporelles : agréger par période, moyenne mobile",
    "Évolution dans le temps, par jour / semaine / mois.",
    "temps temporel serie temporelle evolution par mois semaine jour tendance time series",
    [["", `ts = df.set_index('date').sort_index()
par_mois = ts['ventes'].resample('ME').sum()       # 'D', 'W', 'ME', 'YE' ('M' sur pandas < 2.2)
lisse = par_mois.rolling(3).mean()
par_mois.plot(label='mensuel'); lisse.plot(label='moyenne mobile 3 mois'); plt.legend()`],
     ["Sans index de dates : grouper sur une colonne dérivée.", `df.groupby(df['date'].dt.to_period('M'))['ventes'].sum()`]],
    [], ["df.resample", "s.rolling", "pd.to_datetime", "df.set_index"]);

  // =========================================================================================
  C = "4 · Décrire & visualiser";
  R(C, "stats-desc", "Statistiques descriptives",
    "Tendance centrale, dispersion, quantiles, globalement et par groupe.",
    "statistiques descriptives moyenne mediane ecart type quantiles resume decrire summary",
    [["", `df['revenu'].agg(['mean', 'median', 'std', 'min', 'max', 'count'])
df['revenu'].quantile([0.25, 0.5, 0.75])
df.groupby('groupe')['revenu'].describe()`]],
    ["Distribution asymétrique : la médiane est plus représentative que la moyenne."],
    ["s.mean", "s.median", "s.quantile", "df.describe", "df.groupby"]);

  R(C, "distribution", "Visualiser une distribution",
    "Histogramme, densité, boîte à moustaches ; échelle log si asymétrique.",
    "distribution histogramme visualiser repartition densite graphique une variable",
    [["", `fig, axes = plt.subplots(1, 3, figsize=(15, 4))
sns.histplot(data=df, x='revenu', bins=50, ax=axes[0])
sns.histplot(data=df, x='revenu', log_scale=True, ax=axes[1])
sns.boxplot(data=df, x='revenu', ax=axes[2])
axes[0].set(title='Échelle linéaire'); axes[1].set(title='Échelle log')
plt.tight_layout()`]],
    ["Si l'histogramme est écrasé à gauche avec une longue queue → passer en échelle log."],
    ["sns.histplot", "plt.hist", "sns.boxplot", "plt.subplots", "np.logspace"]);

  R(C, "queue-lourde", "Distributions à queue lourde (loi de puissance)",
    "Repérer une distribution très asymétrique : CCDF sur axes log-log.",
    "queue lourde heavy tail loi puissance power law log log ccdf asymetrique pareto",
    [["", `sns.ecdfplot(data=df, x='degre', complementary=True, log_scale=(True, True))
plt.ylabel('P(X ≥ x)')`],
     ["Histogramme avec bins logarithmiques.", `bins = np.logspace(0, np.log10(df['x'].max()), 40)
plt.hist(df['x'], bins=bins, density=True); plt.xscale('log'); plt.yscale('log')`]],
    ["Une CCDF à peu près droite en log-log suggère une loi de puissance ; la moyenne y est peu informative."],
    ["sns.ecdfplot", "plt.loglog", "np.logspace", "plt.xscale"]);

  R(C, "comparer-groupes-viz", "Comparer des groupes visuellement",
    "Moyennes avec IC, distributions côte à côte.",
    "comparer groupes visualiser categories difference moyenne par groupe barres boites",
    [["", `sns.barplot(data=df, x='groupe', y='revenu', errorbar=('ci', 95))     # moyenne + IC 95 %
sns.boxplot(data=df, x='groupe', y='revenu')
sns.histplot(data=df, x='revenu', hue='groupe', stat='density', common_norm=False, element='step')`]],
    ["stat='density' + common_norm=False quand les groupes n'ont pas la même taille."],
    ["sns.barplot", "sns.boxplot", "sns.violinplot", "sns.histplot"]);

  R(C, "relation", "Relation entre deux variables numériques",
    "Nuage de points, tendance, corrélation.",
    "relation lien deux variables nuage points correlation scatter tendance associer",
    [["", `sns.scatterplot(data=df, x='a', y='b', alpha=0.3)
sns.regplot(data=df, x='a', y='b', scatter_kws={'alpha': 0.2})
sns.jointplot(data=df, x='a', y='b', kind='hex')       # beaucoup de points
r, p = stats.pearsonr(df['a'], df['b'])
rho, p_s = stats.spearmanr(df['a'], df['b'])`]],
    ["Beaucoup de points : alpha faible ou hexbin. Échelles log si les variables sont asymétriques."],
    ["sns.scatterplot", "sns.regplot", "sns.jointplot", "stats.pearsonr", "stats.spearmanr"]);

  R(C, "matrice-correlation", "Matrice de corrélation",
    "Corrélations entre toutes les variables numériques, en carte de chaleur.",
    "matrice correlation heatmap toutes variables correlations carte chaleur",
    [["", `corr = df.corr(numeric_only=True)
sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', center=0, vmin=-1, vmax=1)`]],
    ["method='spearman' si relations non linéaires ou valeurs extrêmes."],
    ["df.corr", "sns.heatmap"]);

  R(C, "beau-graphique", "Faire un graphique propre (plusieurs panneaux, titres, échelles)",
    "Ce qui est attendu à l'examen : axes nommés, unités, titre, légende.",
    "graphique propre titre axes legende sous graphiques plusieurs subplots figure presentation",
    [["", `fig, axes = plt.subplots(2, 2, figsize=(12, 8))
for ax, col in zip(axes.flat, ['a', 'b', 'c', 'd']):
    sns.histplot(data=df, x=col, ax=ax)
    ax.set(title=f'Distribution de {col}', xlabel=col, ylabel='Effectif')
plt.suptitle('Titre général')
plt.tight_layout()
plt.show()`]],
    ["Un graphique = un message : le dire dans le titre ou juste en dessous."],
    ["plt.subplots", "ax.set", "plt.tight_layout", "plt.legend"]);

  // =========================================================================================
  C = "5 · Tests & incertitude";
  R(C, "bootstrap", "Intervalle de confiance par bootstrap",
    "Rééchantillonner avec remise pour estimer l'incertitude de n'importe quelle statistique.",
    "bootstrap intervalle confiance ic incertitude reechantillonnage confidence interval erreur",
    [["À la main (fonctionne pour toute statistique).",
`def bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05):
    x = np.asarray(x)
    boots = [stat(np.random.choice(x, size=len(x), replace=True)) for _ in range(n_boot)]
    return np.percentile(boots, [100 * alpha / 2, 100 * (1 - alpha / 2)])

bas, haut = bootstrap_ci(df['revenu'], np.median)`],
     ["Avec scipy.", `res = stats.bootstrap((df['revenu'].values,), np.median, confidence_level=0.95)
res.confidence_interval`],
     ["Afficher : barres d'erreur.", `plt.errorbar(x=groupes, y=moyennes, yerr=[moyennes - bas, haut - moyennes], fmt='o', capsize=4)`]],
    ["Deux IC qui ne se chevauchent pas → différence significative ; s'ils se chevauchent, on ne peut pas conclure directement."],
    ["np.random.choice", "np.percentile", "stats.bootstrap", "plt.errorbar"]);

  R(C, "comparer-moyennes", "Comparer deux groupes (test t, Mann-Whitney)",
    "La différence de moyenne entre deux groupes est-elle significative ?",
    "comparer deux groupes moyenne de deux groupes moyennes difference significatif test t student mann whitney hypothese p value",
    [["", `a = df.loc[df['groupe'] == 'A', 'revenu']
b = df.loc[df['groupe'] == 'B', 'revenu']
print(a.mean(), b.mean())
t, p = stats.ttest_ind(a, b, equal_var=False)    # Welch
u, p_mw = stats.mannwhitneyu(a, b)               # non paramétrique`],
     ["Mesures appariées (avant / après, paires matchées).", `stats.ttest_rel(avant, apres)`]],
    ["p < 0.05 : on rejette H0 (moyennes égales). Donner aussi la taille de l'effet (différence de moyennes, IC).",
     "Avec de très grands échantillons, tout devient significatif : regarder si la différence est importante en pratique."],
    ["stats.ttest_ind", "stats.mannwhitneyu", "stats.ttest_rel"]);

  R(C, "plusieurs-groupes", "Comparer plus de deux groupes (ANOVA)",
    "Les moyennes de k groupes sont-elles toutes égales ?",
    "anova plusieurs groupes comparer moyennes k groupes",
    [["", `groupes = [g['revenu'].values for _, g in df.groupby('pays')]
F, p = stats.f_oneway(*groupes)
stats.kruskal(*groupes)       # version non paramétrique`]],
    ["Si significatif, comparer les paires avec correction pour tests multiples."],
    ["stats.f_oneway", "df.groupby"]);

  R(C, "chi2", "Tester l'indépendance de deux variables catégorielles (χ²)",
    "Y a-t-il une association entre deux variables catégorielles ?",
    "chi2 khi deux independance association categorielles tableau contingence test",
    [["", `table = pd.crosstab(df['traitement'], df['guerison'])
chi2, p, dof, expected = stats.chi2_contingency(table)
print(p)`]],
    ["Effectifs attendus < 5 → stats.fisher_exact (tableau 2×2)."],
    ["pd.crosstab", "stats.chi2_contingency"]);

  R(C, "normalite", "Tester si une variable suit une loi (normale, exponentielle…)",
    "Tests de Kolmogorov-Smirnov, Shapiro, et QQ-plot.",
    "normalite loi normale gaussienne exponentielle distribution suit kolmogorov smirnov shapiro qq plot",
    [["", `from statsmodels.stats import diagnostic
stat, p = diagnostic.kstest_normal(df['x'], dist='norm')    # ou dist='exp'
stats.shapiro(df['x'].sample(500, random_state=0))
stats.kstest(df['x'], 'norm', args=(df['x'].mean(), df['x'].std()))
stats.ks_2samp(a, b)     # deux échantillons ont-ils la même distribution ?`],
     ["QQ-plot.", `import statsmodels.api as sm
sm.qqplot(df['x'], line='s')`]],
    ["p < 0.05 → on rejette l'hypothèse que la donnée suit cette loi (on ne « prouve » jamais qu'elle la suit)."],
    ["statsmodels.stats.diagnostic.kstest_normal", "stats.shapiro", "stats.kstest", "stats.ks_2samp"]);

  R(C, "correlation-test", "Corrélation et sa significativité",
    "Mesurer et tester le lien entre deux variables.",
    "correlation significatif lien pearson spearman tester coefficient p value",
    [["", `sous = df[['a', 'b']].dropna()
r, p = stats.pearsonr(sous['a'], sous['b'])        # lien linéaire
rho, p2 = stats.spearmanr(sous['a'], sous['b'])    # lien monotone, robuste`]],
    ["Pearson sur données très asymétriques → valeurs extrêmes dominent : préférer Spearman ou passer en log.",
     "Corrélation ≠ causalité."],
    ["stats.pearsonr", "stats.spearmanr", "df.corr"]);

  R(C, "tests-multiples", "Corriger pour les tests multiples",
    "Quand on fait beaucoup de tests, certains sont significatifs par hasard.",
    "tests multiples bonferroni correction fdr benjamini hochberg comparaisons multiples",
    [["", `from statsmodels.stats.multitest import multipletests
reject, p_corr, _, _ = multipletests(pvals, alpha=0.05, method='bonferroni')   # ou 'fdr_bh'
# Bonferroni à la main : seuil = 0.05 / nombre_de_tests`]],
    ["Avec 20 tests au seuil 5 %, on attend ~1 faux positif."],
    ["statsmodels.stats.multitest.multipletests"]);

  R(C, "p-value", "Interpréter une p-value et un intervalle de confiance",
    "Ce qu'il faut écrire (et ne pas écrire) dans la conclusion.",
    "interpreter p value significatif hypothese nulle intervalle confiance conclusion signification",
    [["Rédaction type.", `# "Le revenu moyen du groupe A est supérieur de 1 200 CHF à celui du groupe B
#  (IC 95 % : [800, 1 600] ; test t de Welch, p < 0.001). La différence est
#  statistiquement significative au seuil de 5 %."`]],
    ["p-value = probabilité d'observer un effet au moins aussi extrême SI H0 est vraie ; ce n'est pas la probabilité que H0 soit vraie.",
     "Non significatif ≠ pas d'effet (manque de puissance possible).",
     "IC 95 % : la procédure contient la vraie valeur dans 95 % des répétitions."],
    []);

  // =========================================================================================
  C = "6 · Régression";
  R(C, "ols", "Régression linéaire (statsmodels, formules)",
    "Modéliser une variable continue en fonction de prédicteurs et interpréter les coefficients.",
    "regression lineaire ols modele coefficients interpreter predire variable continue moindres carres linear",
    [["", `mod = smf.ols('prix ~ surface + age + C(quartier)', data=df)
res = mod.fit()
print(res.summary())`],
     ["Lire les résultats.", `res.params          # coefficients
res.pvalues         # significativité
res.conf_int()      # IC 95 %
res.rsquared        # part de variance expliquée`]],
    ["Coefficient = variation moyenne de y quand x augmente d'une unité, toutes choses égales par ailleurs.",
     "Pour une catégorie C(x)[T.b] : différence par rapport à la catégorie de référence.",
     "R² faible ≠ modèle inutile si l'objectif est d'estimer un effet."],
    ["smf.ols", "res.summary", "res.params", "res.pvalues", "res.conf_int", "res.rsquared"]);

  R(C, "interactions", "Interactions et transformations dans une formule",
    "L'effet d'une variable dépend-il d'une autre ? Log, carré, catégories.",
    "interaction formule effet depend log carre polynome terme croise moderation",
    [["", `smf.ols('y ~ a * b', data=df)              # = a + b + a:b
smf.ols('y ~ a + b + a:b', data=df)
smf.ols('np.log(y) ~ np.log(x)', data=df)     # élasticité
smf.ols('y ~ x + I(x**2)', data=df)           # terme quadratique
smf.ols('y ~ C(groupe) * x', data=df)         # pente différente par groupe`]],
    ["Avec une interaction a:b, l'effet de a dépend de la valeur de b : interpréter les deux ensemble.",
     "log(y) ~ log(x) : coefficient = % de variation de y pour 1 % de x."],
    ["smf.ols", "np.log"]);

  R(C, "standardiser", "Standardiser les prédicteurs pour comparer les coefficients",
    "Mettre les variables continues à moyenne 0, écart-type 1.",
    "standardiser normaliser comparer coefficients z score centrer reduire importance",
    [["", `cols = ['age', 'revenu', 'surface']
df_s = df.copy()
df_s[cols] = (df[cols] - df[cols].mean()) / df[cols].std()
res = smf.ols('prix ~ age + revenu + surface', data=df_s).fit()`]],
    ["Coefficient standardisé = effet d'un écart-type de x ; on ne standardise pas les variables binaires."],
    ["stats.zscore", "smf.ols"]);

  R(C, "logit", "Régression logistique et odds ratios",
    "Variable à expliquer binaire (0/1) : probabilité d'un événement.",
    "regression logistique logit binaire probabilite odds ratio classification evenement 0 1",
    [["", `res = smf.logit('deces ~ age + C(sexe) + fumeur', data=df).fit()
print(res.summary())
np.exp(res.params)          # odds ratios
np.exp(res.conf_int())      # IC des odds ratios
df['proba'] = res.predict(df)`]],
    ["Odds ratio > 1 : la variable augmente la probabilité de l'événement ; < 1 : la diminue.",
     "y doit être 0/1 numérique (pas 'oui'/'non')."],
    ["smf.logit", "np.exp", "res.params", "res.conf_int", "model.predict"]);

  R(C, "diagnostic-regression", "Vérifier une régression (résidus, prédictions)",
    "Résidus, valeurs ajustées, colinéarité.",
    "residus diagnostic verifier regression hypotheses colinearite valeurs ajustees",
    [["", `plt.scatter(res.fittedvalues, res.resid, alpha=0.3)
plt.axhline(0, color='red'); plt.xlabel('Valeurs ajustées'); plt.ylabel('Résidus')
sns.histplot(res.resid)
df[['x1', 'x2', 'x3']].corr()     # prédicteurs très corrélés → coefficients instables`]],
    ["Un motif dans les résidus (entonnoir, courbe) → transformer y ou ajouter un terme."],
    ["res.resid", "plt.scatter", "df.corr"]);

  // =========================================================================================
  C = "7 · Causalité (données observationnelles)";
  R(C, "naif", "Analyse naïve vs effet causal : identifier les confondants",
    "Comparer traités / non traités puis vérifier si les groupes sont comparables.",
    "causal causalite effet traitement confondant biais observationnel naif comparer traites controle",
    [["Comparaison naïve.", `df.groupby('traite')['resultat'].describe()
sns.histplot(data=df, x='resultat', hue='traite', stat='density', common_norm=False)`],
     ["Les groupes sont-ils comparables ? (covariables par groupe)", `df.groupby('traite')[['age', 'educ', 'revenu_avant']].mean()`]],
    ["Si les covariables diffèrent entre groupes → la différence naïve mélange effet du traitement et effet des confondants."],
    ["df.groupby", "sns.histplot"]);

  R(C, "propensity", "Score de propension",
    "Probabilité d'être traité étant données les covariables (régression logistique).",
    "score propension propensity score probabilite traitement logit causal observationnel",
    [["", `df_s = df.copy()
for c in ['age', 'educ', 'revenu_avant']:                         # standardiser les continues
    df_s[c] = (df[c] - df[c].mean()) / df[c].std()
mod = smf.logit('traite ~ age + educ + revenu_avant + C(origine) + marie', data=df_s)
res = mod.fit()
df['propensity_score'] = res.predict(df_s)`]],
    ["Ne mettre que des variables mesurées AVANT le traitement."],
    ["smf.logit", "model.predict"]);

  R(C, "matching", "Matching sur le score de propension",
    "Apparier chaque traité à un contrôle de score proche, puis comparer les paires.",
    "matching appariement paires propension propensity score causal traite controle networkx",
    [["Construire le graphe biparti traité–contrôle pondéré par la similarité.",
`def similarite(p1, p2):
    return 1 - abs(p1 - p2)

traites = df[df['traite'] == 1]
controles = df[df['traite'] == 0]
G = nx.Graph()
for i, t in traites.iterrows():
    for j, c in controles.iterrows():
        G.add_weighted_edges_from([(i, j, similarite(t['propensity_score'], c['propensity_score']))])
matching = nx.max_weight_matching(G)`],
     ["Comparer les groupes appariés.", `idx = [i for paire in matching for i in paire]
df_match = df.loc[idx]
df_match.groupby('traite')['resultat'].mean()
stats.ttest_ind(df_match.loc[df_match.traite == 1, 'resultat'], df_match.loc[df_match.traite == 0, 'resultat'])`],
     ["Matching exact sur une variable en plus : ne créer une arête que si la variable est identique.",
`if t['origine'] == c['origine']:
    G.add_weighted_edges_from([(i, j, similarite(t['propensity_score'], c['propensity_score']))])`]],
    ["Vérifier l'équilibre des covariables après matching (recette suivante).",
     "Le matching ne corrige que les confondants observés."],
    ["nx.Graph", "G.add_weighted_edges_from", "nx.max_weight_matching", "stats.ttest_ind"]);

  R(C, "balance", "Vérifier l'équilibre des covariables (SMD)",
    "Après matching, traités et contrôles doivent avoir les mêmes distributions de covariables.",
    "equilibre balance covariables smd difference standardisee verifier matching",
    [["", `def smd(a, b):
    return (a.mean() - b.mean()) / np.sqrt((a.var() + b.var()) / 2)

for c in ['age', 'educ', 'revenu_avant']:
    print(c, smd(df_match.loc[df_match.traite == 1, c], df_match.loc[df_match.traite == 0, c]))
sns.boxplot(data=df_match, x='traite', y='age')`]],
    ["|SMD| < 0.1 : covariable bien équilibrée."],
    ["sns.boxplot", "np.sqrt"]);

  R(C, "sensibilite", "Analyse de sensibilité et confondants non observés",
    "Que pourrait changer un confondant non mesuré ? Comment le discuter.",
    "sensibilite confondant non observe biais cache robustesse limites causal",
    [["Idée.", `# Matcher en plus sur une variable supplémentaire / retirer une variable,
# et regarder si l'effet estimé change beaucoup.
# Discuter : quel confondant non mesuré pourrait expliquer le résultat ?`]],
    ["Formulation : « L'effet persiste après matching sur X, Y, Z ; un confondant non observé pourrait néanmoins … »."],
    []);

  R(C, "diff-in-diff", "Différence de différences",
    "Comparer l'évolution avant/après d'un groupe traité à celle d'un groupe contrôle.",
    "difference de differences diff in diff did avant apres evolution traitement politique",
    [["", `res = smf.ols('y ~ traite * apres', data=df).fit()
res.params['traite:apres']     # effet estimé`]],
    ["Hypothèse clé : tendances parallèles sans traitement (vérifier visuellement avant la date)."],
    ["smf.ols"]);

  // =========================================================================================
  C = "8 · Machine learning supervisé";
  R(C, "ml-pipeline", "Pipeline complet : entraîner et évaluer un classifieur",
    "Séparer train/test, entraîner, prédire, évaluer.",
    "machine learning classification entrainer evaluer predire modele classifieur pipeline complet train test",
    [["", `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score

X = pd.get_dummies(df[features], drop_first=True, dtype=int)
y = df['cible']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
proba = model.predict_proba(X_test)[:, 1]
print(classification_report(y_test, y_pred))
print('AUC', roc_auc_score(y_test, proba))`]],
    ["Comparer à une baseline (prédire toujours la classe majoritaire).",
     "Classes déséquilibrées : l'accuracy est trompeuse → precision, recall, F1, AUC."],
    ["sklearn.model_selection.train_test_split", "sklearn.preprocessing.StandardScaler", "sklearn.pipeline.make_pipeline", "sklearn.linear_model.LogisticRegression", "sklearn.metrics.classification_report", "sklearn.metrics.roc_auc_score"]);

  R(C, "regression-ml", "Prédire une valeur continue (régression ML)",
    "Entraîner un modèle de régression et mesurer son erreur.",
    "predire valeur continue regression machine learning erreur mse r2",
    [["", `from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error, r2_score
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)
lr = LinearRegression().fit(X_train, y_train)
y_pred = lr.predict(X_test)
print('RMSE', np.sqrt(mean_squared_error(y_test, y_pred)), 'R2', r2_score(y_test, y_pred))`]],
    [], ["sklearn.linear_model.LinearRegression", "sklearn.metrics.mean_squared_error", "sklearn.metrics.r2_score"]);

  R(C, "cross-validation", "Validation croisée et choix des hyperparamètres",
    "Évaluer de façon robuste et choisir k, alpha, profondeur… sans toucher au test.",
    "validation croisee cross validation k fold hyperparametres choisir grid search tuning overfitting",
    [["", `from sklearn.model_selection import cross_val_score, GridSearchCV
scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
print(scores.mean(), scores.std())

gs = GridSearchCV(KNeighborsClassifier(), {'n_neighbors': [1, 3, 5, 11, 21, 51]}, cv=5, scoring='accuracy')
gs.fit(X_train, y_train)
gs.best_params_, gs.best_score_
gs.score(X_test, y_test)     # évaluation finale, une seule fois`]],
    ["Tracer le score en fonction de l'hyperparamètre montre sur/sous-apprentissage."],
    ["sklearn.model_selection.cross_val_score", "sklearn.model_selection.GridSearchCV", "sklearn.model_selection.cross_val_predict"]);

  R(C, "metriques-classif", "Métriques de classification (confusion, précision, rappel, ROC)",
    "Comprendre les erreurs d'un classifieur.",
    "metriques evaluation classification matrice confusion precision rappel recall f1 roc auc faux positifs",
    [["", `from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, roc_curve, roc_auc_score
confusion_matrix(y_test, y_pred)        # [[VN, FP], [FN, VP]]
precision_score(y_test, y_pred)          # VP / (VP + FP)
recall_score(y_test, y_pred)             # VP / (VP + FN)
f1_score(y_test, y_pred)
fpr, tpr, seuils = roc_curve(y_test, proba)
plt.plot(fpr, tpr, label=f'AUC = {roc_auc_score(y_test, proba):.2f}')
plt.plot([0, 1], [0, 1], '--', color='grey')
plt.xlabel('Taux de faux positifs'); plt.ylabel('Taux de vrais positifs'); plt.legend()`]],
    ["AUC = 0.5 : hasard ; 1 : parfait.", "Précision : parmi les prédits positifs, combien le sont vraiment ; rappel : parmi les vrais positifs, combien sont trouvés."],
    ["sklearn.metrics.confusion_matrix", "sklearn.metrics.precision_score", "sklearn.metrics.roc_curve", "sklearn.metrics.roc_auc_score", "sklearn.metrics.accuracy_score"]);

  R(C, "regularisation", "Régularisation (Ridge, Lasso) et surapprentissage",
    "Pénaliser les gros coefficients pour mieux généraliser.",
    "regularisation ridge lasso overfitting surapprentissage penalite biais variance generaliser",
    [["", `from sklearn.linear_model import Ridge, Lasso
for alpha in [0.01, 0.1, 1, 10, 100]:
    s = cross_val_score(Ridge(alpha=alpha), X_train, y_train, cv=5, scoring='neg_mean_squared_error')
    print(alpha, -s.mean())
lasso = Lasso(alpha=0.1).fit(X_train_s, y_train)
pd.Series(lasso.coef_, index=X.columns)    # coefficients à 0 = variables écartées`]],
    ["Standardiser avant de régulariser.", "Train bien meilleur que test → surapprentissage → plus de régularisation / modèle plus simple."],
    ["sklearn.linear_model.Ridge", "sklearn.linear_model.Lasso", "sklearn.model_selection.cross_val_score"]);

  R(C, "arbres", "Arbres, forêts aléatoires et importance des variables",
    "Modèles non linéaires et quelles variables comptent.",
    "arbre decision foret aleatoire random forest importance variables non lineaire",
    [["", `from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=300, max_depth=None, random_state=0)
rf.fit(X_train, y_train)
print(rf.score(X_test, y_test))
imp = pd.Series(rf.feature_importances_, index=X_train.columns).sort_values()
imp.tail(15).plot(kind='barh')`]],
    ["L'importance ne dit pas le sens de l'effet ; elle est biaisée vers les variables avec beaucoup de valeurs."],
    ["sklearn.ensemble.RandomForestClassifier", "sklearn.tree.DecisionTreeClassifier", "model.feature_importances_"]);

  R(C, "knn", "k plus proches voisins",
    "Classifier selon les voisins les plus proches ; choisir k.",
    "knn voisins plus proches k nearest neighbors choisir k distance",
    [["", `from sklearn.neighbors import KNeighborsClassifier
for k in [1, 5, 15, 51]:
    knn = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=k))
    print(k, cross_val_score(knn, X_train, y_train, cv=5).mean())`]],
    ["k petit : surapprentissage ; k grand : sous-apprentissage."],
    ["sklearn.neighbors.KNeighborsClassifier", "sklearn.model_selection.cross_val_score"]);

  // =========================================================================================
  C = "9 · Non supervisé";
  R(C, "kmeans", "Clustering k-means et choix du nombre de clusters",
    "Regrouper des observations similaires ; méthode du coude et silhouette.",
    "clustering kmeans k means groupes clusters choisir k coude silhouette segmentation non supervise",
    [["", `from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
X_s = StandardScaler().fit_transform(X)
inerties, silhouettes = [], []
for k in range(2, 11):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X_s)
    inerties.append(km.inertia_)
    silhouettes.append(silhouette_score(X_s, km.labels_))
plt.plot(range(2, 11), silhouettes, '-o'); plt.xlabel('k'); plt.ylabel('Silhouette')`],
     ["Décrire les clusters.", `df['cluster'] = KMeans(n_clusters=4, n_init=10, random_state=0).fit_predict(X_s)
df.groupby('cluster')[features].mean()`]],
    ["Standardiser avant (k-means utilise des distances).", "k-means suppose des clusters « ronds » de taille similaire ; sinon DBSCAN."],
    ["sklearn.cluster.KMeans", "sklearn.metrics.silhouette_score", "sklearn.preprocessing.StandardScaler"]);

  R(C, "dbscan", "Clustering par densité (DBSCAN)",
    "Clusters de forme quelconque, points isolés étiquetés comme bruit.",
    "dbscan densite clustering bruit outliers forme quelconque",
    [["", `from sklearn.cluster import DBSCAN
labels = DBSCAN(eps=0.3, min_samples=10).fit_predict(X_s)
pd.Series(labels).value_counts()     # -1 = bruit`]],
    ["eps trop petit : tout est du bruit ; trop grand : un seul cluster."],
    ["sklearn.cluster.DBSCAN"]);

  R(C, "pca", "Réduction de dimension et visualisation (PCA, t-SNE)",
    "Projeter des données en 2D pour les visualiser.",
    "pca acp reduction dimension visualiser 2d composantes principales tsne projection",
    [["", `from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
pca = PCA(n_components=2).fit(X_s)
X2 = pca.transform(X_s)
print(pca.explained_variance_ratio_)
plt.scatter(X2[:, 0], X2[:, 1], c=labels, s=5, cmap='tab10')
X_tsne = TSNE(n_components=2, random_state=0).fit_transform(X_s)`]],
    ["Les distances en t-SNE entre clusters éloignés ne sont pas interprétables."],
    ["sklearn.decomposition.PCA", "sklearn.manifold.TSNE"]);

  // =========================================================================================
  C = "10 · Texte";
  R(C, "tfidf", "Représenter des textes (sac de mots, TF-IDF)",
    "Transformer des documents en vecteurs pour les comparer ou les classifier.",
    "texte nlp tfidf tf idf sac mots documents vectoriser bag of words",
    [["", `from sklearn.feature_extraction.text import TfidfVectorizer
vec = TfidfVectorizer(stop_words='english', min_df=5, max_df=0.8)
X = vec.fit_transform(df['texte'])         # matrice creuse documents × mots
mots = vec.get_feature_names_out()`],
     ["Mots les plus caractéristiques d'un document.", `ligne = X[0].toarray().ravel()
[mots[i] for i in ligne.argsort()[::-1][:10]]`]],
    [], ["sklearn.feature_extraction.text.TfidfVectorizer", "sklearn.feature_extraction.text.CountVectorizer"]);

  R(C, "texte-classif", "Classifier des textes",
    "TF-IDF + régression logistique : pipeline classique.",
    "classifier texte classification documents sentiment spam nlp",
    [["", `model = make_pipeline(TfidfVectorizer(stop_words='english', min_df=3), LogisticRegression(max_iter=1000))
X_train, X_test, y_train, y_test = train_test_split(df['texte'], df['label'], test_size=0.2, random_state=0)
model.fit(X_train, y_train)
print(classification_report(y_test, model.predict(X_test)))`]],
    [], ["sklearn.feature_extraction.text.TfidfVectorizer", "sklearn.linear_model.LogisticRegression", "sklearn.pipeline.make_pipeline"]);

  R(C, "frequences-mots", "Fréquences de mots",
    "Mots les plus fréquents d'un corpus.",
    "frequence mots plus frequents compter vocabulaire corpus",
    [["", `from collections import Counter
mots = df['texte'].str.lower().str.findall(r'\\w+').explode()
mots.value_counts().head(20)
Counter(' '.join(df['texte']).lower().split()).most_common(20)`]],
    ["Retirer les mots vides (stop words) pour un résultat utile."],
    ["s.str", "s.value_counts", "df.explode"]);

  // =========================================================================================
  C = "11 · Réseaux";
  R(C, "graphe", "Construire un graphe et calculer des mesures",
    "Nœuds, arêtes, degrés, centralités, composantes.",
    "graphe reseau network noeuds aretes degre centralite composantes connexes mesures",
    [["", `G = nx.from_pandas_edgelist(df, source='a', target='b', edge_attr='poids')
print(G.number_of_nodes(), G.number_of_edges(), nx.density(G))
degres = pd.Series(dict(G.degree()))
degres.nlargest(10)
pd.Series(nx.betweenness_centrality(G)).nlargest(10)
pd.Series(nx.pagerank(G)).nlargest(10)
comps = sorted(nx.connected_components(G), key=len, reverse=True)
G_max = G.subgraph(comps[0])`]],
    ["Distribution des degrés souvent à queue lourde → CCDF log-log."],
    ["nx.from_pandas_edgelist", "nx.Graph", "nx.degree_centrality", "nx.betweenness_centrality", "nx.pagerank", "nx.connected_components"]);

  R(C, "communautes", "Détecter des communautés",
    "Groupes de nœuds fortement connectés entre eux.",
    "communautes louvain modularite groupes reseau clusters graphe",
    [["", `comms = nx.community.louvain_communities(G, seed=0)
print(len(comms), nx.community.modularity(G, comms))
noeud2comm = {n: i for i, c in enumerate(comms) for n in c}`]],
    [], ["nx.community.louvain_communities", "nx.draw"]);
})();
