/*
 * Référence générale des fonctions (écrite à la main, indépendante des séries).
 * F(librairie, catégorie, nom, signature, description, exemple, mots-clés, note/piège)
 *   - nom : comme on l'écrit dans le code ("pd.read_csv", "df.groupby", "sklearn.metrics.roc_curve"...)
 *   - mots-clés : FR + EN, séparés par des espaces (la recherche gère accents, pluriels et synonymes)
 * Tu peux ajouter / corriger librement : recharge la page, c'est tout.
 */
window.ADA_KB = window.ADA_KB || { functions: [], recipes: [] };
(function () {
  const F = (lib, cat, name, sig, d, ex, t, n) => window.ADA_KB.functions.push({ lib, cat, name, sig, d, ex, t, n });

  // ======================================================================================= PANDAS
  let L = "pandas", C = "Lire / écrire";
  F(L, C, "pd.read_csv", "pd.read_csv(path, sep=',', index_col=None, usecols=None, dtype=None, parse_dates=None, na_values=None, compression='infer')",
    "Lire un fichier CSV (ou TSV, .gz…) dans un DataFrame.",
    `df = pd.read_csv('data/file.csv')
df = pd.read_csv('data/file.tsv.gz', sep='\\t', compression='gzip', parse_dates=['date'])`,
    "lire charger importer ouvrir fichier csv tsv load open read data donnees gz",
    "sep=';' ou '\\t' selon le fichier ; index_col=0 si la 1re colonne est l'index ; na_values=['?'] pour les valeurs manquantes codées bizarrement.");
  F(L, C, "pd.read_excel", "pd.read_excel(path, sheet_name=0, header=0, usecols=None)",
    "Lire un fichier Excel (.xls / .xlsx).", `df = pd.read_excel('data/file.xlsx', sheet_name='Feuil1')`,
    "lire charger excel xlsx xls feuille sheet load");
  F(L, C, "pd.read_json", "pd.read_json(path, lines=False, orient=None)",
    "Lire un fichier JSON (lines=True pour un objet JSON par ligne).", `df = pd.read_json('data/file.jsonl', lines=True)`,
    "lire charger json jsonl load api");
  F(L, C, "pd.read_pickle", "pd.read_pickle(path)", "Recharger un objet sauvegardé avec df.to_pickle.",
    `df = pd.read_pickle('data/df.pkl')`, "lire charger pickle pkl load sauvegarde");
  F(L, C, "df.to_csv", "df.to_csv(path, index=False)", "Sauvegarder un DataFrame en CSV.",
    `df.to_csv('resultats.csv', index=False)`, "sauvegarder ecrire exporter enregistrer save write export csv");
  F(L, C, "pd.DataFrame", "pd.DataFrame(data, columns=None, index=None)",
    "Créer un DataFrame à partir d'un dict de listes, d'une liste de dicts, d'un array…",
    `df = pd.DataFrame({'nom': ['a', 'b'], 'age': [21, 35]})
df = pd.DataFrame(liste_de_dicts)`, "creer construire tableau table dataframe create build");
  F(L, C, "pd.Series", "pd.Series(data, index=None, name=None)", "Créer une Series (une colonne avec un index).",
    `s = pd.Series([1, 2, 3], index=['a', 'b', 'c'])`, "creer colonne serie vecteur series");

  C = "Inspecter";
  F(L, C, "df.head", "df.head(n=5)", "Afficher les n premières lignes (df.tail pour les dernières).",
    `df.head(10)`, "apercu premieres lignes afficher voir regarder preview first rows");
  F(L, C, "df.sample", "df.sample(n=None, frac=None, random_state=None, replace=False)",
    "Tirer des lignes au hasard (aperçu, sous-échantillon, mélange avec frac=1, bootstrap avec replace=True).",
    `df.sample(5, random_state=0)
df_melange = df.sample(frac=1, random_state=0)`, "aleatoire hasard echantillon sous echantillon melanger random sample shuffle bootstrap",
    "random_state=... pour un résultat reproductible.");
  F(L, C, "df.info", "df.info()", "Types des colonnes, nombre de valeurs non nulles, mémoire.",
    `df.info()`, "types colonnes manquant structure resume info dtypes memoire");
  F(L, C, "df.describe", "df.describe(include=None, percentiles=None)",
    "Statistiques descriptives de chaque colonne (count, mean, std, min, quartiles, max).",
    `df.describe()
df.describe(include='object')   # colonnes texte : count, unique, top, freq`,
    "statistiques descriptives resume moyenne ecart type quartiles summary describe stats");
  F(L, C, "df.shape", "df.shape", "Dimensions (nb lignes, nb colonnes).", `n_lignes, n_colonnes = df.shape`,
    "taille dimensions nombre lignes colonnes size shape len");
  F(L, C, "df.columns", "df.columns", "Noms des colonnes (modifiable).", `list(df.columns)
df.columns = [c.lower().strip() for c in df.columns]`, "colonnes noms renommer columns names");
  F(L, C, "df.dtypes", "df.dtypes", "Type de chaque colonne.", `df.dtypes`, "types colonnes dtype format");
  F(L, C, "s.value_counts", "s.value_counts(normalize=False, dropna=True, sort=True)",
    "Compter les occurrences de chaque valeur d'une colonne.",
    `df['pays'].value_counts()
df['pays'].value_counts(normalize=True)   # proportions`,
    "compter occurrences frequence combien repartition count frequency distribution categories",
    "normalize=True pour des proportions ; dropna=False pour compter aussi les NaN.");
  F(L, C, "s.unique", "s.unique()", "Valeurs distinctes d'une colonne (s.nunique() pour leur nombre).",
    `df['pays'].unique()
df['pays'].nunique()`, "valeurs distinctes uniques differentes unique distinct");
  F(L, C, "s.nunique", "s.nunique(dropna=True)", "Nombre de valeurs distinctes.", `df.nunique()`, "nombre valeurs distinctes uniques count distinct");
  F(L, C, "df.isna", "df.isna()", "Masque booléen des valeurs manquantes (identique à isnull).",
    `df.isna().sum()            # nb de NaN par colonne
df.isna().mean() * 100     # % de NaN par colonne`, "manquant manquante nan null vide missing na trous");
  F(L, C, "df.isnull", "df.isnull()", "Alias de isna : masque des valeurs manquantes.", `df.isnull().sum()`, "manquant nan null missing");
  F(L, C, "pd.isnull", "pd.isnull(obj)", "Tester si une valeur (ou un tableau) est manquante.", `pd.isnull(x)`, "manquant nan null missing");

  C = "Sélectionner / filtrer";
  F(L, C, "df.loc", "df.loc[lignes, colonnes]", "Sélection par étiquettes ou par masque booléen.",
    `df.loc[df['age'] > 30, ['nom', 'age']]
df.loc[(df.a > 1) & (df.b == 'x')]       # ET : &, OU : |, NON : ~
df.loc[df['age'] > 30, 'groupe'] = 'senior'   # modifier une sélection`,
    "selectionner filtrer condition masque lignes colonnes select filter where indexer",
    "Toujours des parenthèses autour de chaque condition avec & et | ; évite df[df.a > 1]['b'] = ... (SettingWithCopyWarning).");
  F(L, C, "df.iloc", "df.iloc[i_lignes, i_colonnes]", "Sélection par position (numéros).",
    `df.iloc[0]          # 1re ligne
df.iloc[:10, :3]    # 10 premières lignes, 3 premières colonnes`, "position indice numero selectionner premiere ligne select");
  F(L, C, "df.query", "df.query(expr)", "Filtrer avec une condition écrite en texte.",
    `df.query('age > 30 and pays == "CH"')
seuil = 30
df.query('age > @seuil')`, "filtrer condition selectionner requete filter where query",
    "@variable pour utiliser une variable Python ; noms de colonnes avec espaces entre `backticks`.");
  F(L, C, "s.isin", "s.isin(valeurs)", "Tester l'appartenance à une liste.",
    `df[df['pays'].isin(['CH', 'FR'])]
df[~df['pays'].isin(['CH'])]   # exclure`, "appartient dans liste parmi filtrer in exclure");
  F(L, C, "s.between", "s.between(a, b, inclusive='both')", "Valeurs dans un intervalle.",
    `df[df['age'].between(18, 65)]`, "intervalle entre bornes filtrer range between");
  F(L, C, "df.nlargest", "df.nlargest(n, colonne)", "Les n lignes avec les plus grandes valeurs (nsmallest pour les plus petites).",
    `df.nlargest(10, 'revenu')`, "top plus grands meilleurs classement maximum top n largest");

  C = "Nettoyer";
  F(L, C, "df.dropna", "df.dropna(subset=None, how='any', axis=0)", "Supprimer les lignes (ou colonnes) avec des valeurs manquantes.",
    `df = df.dropna(subset=['age', 'revenu'])`, "supprimer enlever manquant nan nettoyer drop missing clean",
    "Regarde combien de lignes tu perds (len avant / après) et si ça biaise l'échantillon.");
  F(L, C, "df.fillna", "df.fillna(value)", "Remplacer les valeurs manquantes.",
    `df['age'] = df['age'].fillna(df['age'].median())
df = df.fillna({'pays': 'inconnu', 'n': 0})`, "remplacer remplir manquant nan imputer impute fill missing");
  F(L, C, "df.drop_duplicates", "df.drop_duplicates(subset=None, keep='first')", "Supprimer les doublons.",
    `df = df.drop_duplicates(subset=['id'])`, "doublons duplicates supprimer unique nettoyer");
  F(L, C, "df.duplicated", "df.duplicated(subset=None, keep='first')", "Masque des lignes dupliquées.",
    `df.duplicated(subset=['id']).sum()`, "doublons duplicates compter verifier");
  F(L, C, "df.drop", "df.drop(columns=None, index=None)", "Supprimer des colonnes ou des lignes.",
    `df = df.drop(columns=['col_inutile'])`, "supprimer enlever retirer colonne delete remove drop");
  F(L, C, "df.rename", "df.rename(columns={ancien: nouveau})", "Renommer des colonnes.",
    `df = df.rename(columns={'Age (years)': 'age'})`, "renommer nom colonne rename");
  F(L, C, "df.astype", "df.astype(type)", "Changer le type d'une ou plusieurs colonnes.",
    `df['annee'] = df['annee'].astype(int)
df = df.astype({'pays': 'category'})`, "convertir type changer cast int float str category");
  F(L, C, "pd.to_numeric", "pd.to_numeric(s, errors='raise')", "Convertir en nombre (errors='coerce' : invalide → NaN).",
    `df['prix'] = pd.to_numeric(df['prix'], errors='coerce')`, "convertir nombre numerique texte coerce numeric");
  F(L, C, "s.replace", "s.replace(ancien, nouveau)", "Remplacer des valeurs.",
    `df['sexe'] = df['sexe'].replace({'M': 0, 'F': 1})
df = df.replace(-1, np.nan)`, "remplacer valeur recoder replace");

  C = "Transformer / créer des colonnes";
  F(L, C, "df.assign", "df.assign(nouvelle=valeur_ou_fonction)", "Créer des colonnes (style chaîné).",
    `df = df.assign(bmi=lambda d: d.poids / d.taille**2)`, "creer nouvelle colonne calculer ajouter assign new column");
  F(L, C, "s.apply", "s.apply(fonction) / df.apply(fonction, axis=1)", "Appliquer une fonction à chaque valeur (ou chaque ligne avec axis=1).",
    `df['n_mots'] = df['texte'].apply(lambda t: len(t.split()))
df['total'] = df.apply(lambda r: r.a + r.b, axis=1)`, "appliquer fonction lambda transformer chaque ligne apply map",
    "Lent sur de gros tableaux : préférer les opérations vectorisées (df.a + df.b) quand c'est possible.");
  F(L, C, "s.map", "s.map(dict_ou_fonction)", "Transformer chaque valeur via un dictionnaire ou une fonction.",
    `df['continent'] = df['pays'].map({'CH': 'Europe', 'US': 'Amérique'})`, "recoder correspondance dictionnaire transformer map");
  F(L, C, "pd.cut", "pd.cut(x, bins, labels=None, right=True)", "Découper une variable continue en intervalles de bornes données.",
    `df['tranche'] = pd.cut(df['age'], bins=[0, 18, 65, 120], labels=['jeune', 'adulte', 'senior'])`,
    "intervalles classes tranches bins discretiser categories groupes age");
  F(L, C, "pd.qcut", "pd.qcut(x, q, labels=None)", "Découper en quantiles (groupes de même effectif).",
    `df['quartile'] = pd.qcut(df['revenu'], 4, labels=['Q1', 'Q2', 'Q3', 'Q4'])`, "quantiles quartiles deciles groupes egaux bins");
  F(L, C, "pd.get_dummies", "pd.get_dummies(df, columns=None, drop_first=False, dtype=int)",
    "Encodage one-hot : une colonne 0/1 par catégorie.",
    `X = pd.get_dummies(df, columns=['pays'], drop_first=True, dtype=int)`,
    "one hot dummy dummies indicatrices encoder categorielle encoding categorical",
    "drop_first=True évite la colinéarité parfaite en régression linéaire.");
  F(L, C, "pd.Categorical", "pd.Categorical(values, categories=None, ordered=False)", "Variable catégorielle avec ordre des catégories.",
    `df['tshirt'] = pd.Categorical(df['tshirt'], categories=['S', 'M', 'L'], ordered=True)`, "categorie ordre ordonnee categorical");
  F(L, C, "df.sort_values", "df.sort_values(by, ascending=True)", "Trier selon une ou plusieurs colonnes.",
    `df.sort_values('score', ascending=False)
df.sort_values(['pays', 'age'], ascending=[True, False])`, "trier ordonner classer tri sort order");
  F(L, C, "df.sort_index", "df.sort_index()", "Trier selon l'index.", `s.value_counts().sort_index()`, "trier index sort");
  F(L, C, "df.reset_index", "df.reset_index(drop=False)", "Remettre l'index en colonne (souvent après un groupby).",
    `res = df.groupby('pays')['age'].mean().reset_index()`, "index colonne remettre reinitialiser reset");
  F(L, C, "df.set_index", "df.set_index(colonne)", "Utiliser une colonne comme index.", `df = df.set_index('date')`, "index definir colonne set");
  F(L, C, "s.rank", "s.rank(ascending=True, pct=False)", "Rang de chaque valeur (pct=True : percentile).",
    `df['rang'] = df['score'].rank(ascending=False)`, "rang classement percentile rank");
  F(L, C, "s.clip", "s.clip(lower=None, upper=None)", "Borner les valeurs (winsoriser les extrêmes).",
    `df['x'] = df['x'].clip(upper=df['x'].quantile(0.99))`, "borner limiter extremes aberrantes outliers clip");
  F(L, C, "df.explode", "df.explode(colonne)", "Une ligne par élément d'une colonne contenant des listes.",
    `df.assign(tag=df['tags'].str.split(',')).explode('tag')`, "liste eclater une ligne par element explode split");
  F(L, C, "df.iterrows", "df.iterrows()", "Boucler sur les lignes (index, ligne). Lent : à éviter si possible.",
    `for i, row in df.head(3).iterrows():
    print(i, row['nom'], row['age'])`, "boucle iterer lignes for loop");

  C = "Grouper / agréger";
  F(L, C, "df.groupby", "df.groupby(colonnes, as_index=True)[col].agg(...)",
    "Grouper les lignes par valeur d'une ou plusieurs colonnes puis agréger.",
    `df.groupby('pays')['revenu'].mean()
df.groupby(['pays', 'sexe']).size()                        # effectifs
df.groupby('pays', as_index=False).agg(moy=('revenu', 'mean'),
                                      med=('revenu', 'median'),
                                      n=('revenu', 'size'))`,
    "grouper regrouper par groupe categorie agreger moyenne par group by aggregate split apply combine",
    "as_index=False ou .reset_index() pour récupérer un DataFrame à plat ; size compte les lignes, count les non-NaN.");
  F(L, C, "df.agg", "df.agg(fonctions)", "Appliquer une ou plusieurs agrégations.",
    `df['revenu'].agg(['mean', 'median', 'std', 'count'])`, "agreger plusieurs statistiques resumer aggregate");
  F(L, C, "df.transform", "df.groupby(g)[col].transform(fonction)", "Résultat par groupe, renvoyé à la taille d'origine (ex. moyenne du groupe sur chaque ligne).",
    `df['moy_pays'] = df.groupby('pays')['revenu'].transform('mean')
df['ecart'] = df['revenu'] - df['moy_pays']`, "moyenne du groupe chaque ligne normaliser par groupe transform");
  F(L, C, "pd.crosstab", "pd.crosstab(index, columns, normalize=False, margins=False)",
    "Tableau croisé (contingence) de deux variables catégorielles.",
    `pd.crosstab(df['traitement'], df['guerison'])
pd.crosstab(df['traitement'], df['guerison'], normalize='index')   # % par ligne`,
    "tableau croise contingence compter combinaisons frequence deux categorielles crosstab contingency chi2");
  F(L, C, "df.pivot_table", "df.pivot_table(index, columns, values, aggfunc='mean')", "Tableau croisé avec agrégation.",
    `df.pivot_table(index='pays', columns='annee', values='revenu', aggfunc='mean')`, "pivot tableau croise remodeler agreger pivot table");
  F(L, C, "df.corr", "df.corr(method='pearson', numeric_only=True)", "Matrice de corrélation entre colonnes numériques.",
    `df.corr(numeric_only=True)
df[['a', 'b']].corr(method='spearman')`, "correlation matrice lien relation pearson spearman correlation matrix",
    "Pas de p-value ici : utiliser stats.pearsonr / spearmanr pour tester.");
  F(L, C, "s.mean", "s.mean() / median() / std() / var() / min() / max() / sum()", "Statistiques de base d'une colonne.",
    `df['age'].mean(), df['age'].median(), df['age'].std()`, "moyenne mediane ecart type variance minimum maximum somme mean average");
  F(L, C, "s.median", "s.median()", "Médiane (robuste aux valeurs extrêmes).", `df['revenu'].median()`, "mediane median robuste milieu");
  F(L, C, "s.std", "s.std(ddof=1)", "Écart-type.", `df['age'].std()`, "ecart type dispersion variabilite standard deviation");
  F(L, C, "s.quantile", "s.quantile(q)", "Quantile(s).", `df['revenu'].quantile([0.25, 0.5, 0.75])`, "quantile quartile percentile mediane");
  F(L, C, "s.cumsum", "s.cumsum()", "Somme cumulée.", `df['cumul'] = df['ventes'].cumsum()`, "cumul somme cumulee cumulative");

  C = "Combiner / remodeler";
  F(L, C, "pd.merge", "pd.merge(left, right, on=None, how='inner', left_on=None, right_on=None, validate=None)",
    "Joindre deux DataFrames sur une ou plusieurs colonnes (JOIN SQL).",
    `df = pd.merge(clients, achats, on='client_id', how='left')
df = pd.merge(clients, achats.rename(columns={'client_id': 'id_client'}), left_on='client_id', right_on='id_client', how='inner')`,
    "joindre jointure fusionner combiner relier deux tables join merge",
    "how : 'inner' (par défaut, garde les correspondances), 'left', 'outer'. Vérifie le nombre de lignes avant/après ; validate='one_to_one' détecte les doublons de clés.");
  F(L, C, "df.merge", "df.merge(autre, on=..., how=...)", "Même chose que pd.merge, en méthode.",
    `df = clients.merge(achats, on='client_id', how='left')`, "joindre jointure fusionner deux tables join merge");
  F(L, C, "pd.concat", "pd.concat(liste, axis=0, ignore_index=False)", "Empiler des DataFrames (lignes) ou les coller côte à côte (axis=1).",
    `df = pd.concat([df2019, df2020], ignore_index=True)
df = pd.concat([X, y], axis=1)`, "empiler concatener coller ajouter lignes combiner append stack concat");
  F(L, C, "pd.melt", "pd.melt(df, id_vars, value_vars, var_name, value_name)", "Format large → format long.",
    `long = pd.melt(large.reset_index(), id_vars=['pays'], var_name='annee', value_name='pib')`, "remodeler long large wide reshape melt");
  F(L, C, "df.pivot", "df.pivot(index, columns, values)", "Format long → format large (sans agrégation).",
    `large = long.pivot(index='pays', columns='annee', values='pib')`, "remodeler large wide pivot reshape");
  F(L, C, "df.unstack", "df.unstack(level=-1)", "Passer un niveau d'index en colonnes (après un groupby à 2 clés).",
    `df.groupby(['pays', 'sexe'])['revenu'].mean().unstack()`, "remodeler pivot colonnes index reshape unstack");
  F(L, C, "df.stack", "df.stack()", "Passer les colonnes en niveau d'index (inverse de unstack).", `large.stack()`, "remodeler reshape stack");

  C = "Dates, texte, temps";
  F(L, C, "pd.to_datetime", "pd.to_datetime(s, format=None, errors='raise', unit=None)", "Convertir en dates.",
    `df['date'] = pd.to_datetime(df['date'], format='%Y-%m-%d', errors='coerce')
df['date'] = pd.to_datetime(df['timestamp'], unit='s')`, "date temps datetime convertir jour heure timestamp time");
  F(L, C, "s.dt", "s.dt.year / .month / .dayofweek / .hour / .date", "Extraire des composantes d'une colonne de dates.",
    `df['annee'] = df['date'].dt.year
df['jour_semaine'] = df['date'].dt.dayofweek   # 0 = lundi`, "date annee mois jour semaine heure extraire year month day");
  F(L, C, "s.str", "s.str.lower() / .contains() / .split() / .replace() / .len() / .strip()", "Opérations texte vectorisées sur une colonne.",
    `df['titre'].str.lower().str.strip()
df[df['titre'].str.contains('data', case=False, na=False)]
df['n_car'] = df['titre'].str.len()`, "texte chaine string mot contient minuscule nettoyer text contains lower split regex",
    "na=False dans str.contains pour éviter les NaN dans le masque ; regex=False pour chercher un texte littéral.");
  F(L, C, "s.str.contains", "s.str.contains(motif, case=True, na=None, regex=True)", "Lignes dont le texte contient un motif.",
    `df[df['texte'].str.contains('covid', case=False, na=False)]`, "texte contient mot chercher filtrer contains");
  F(L, C, "df.resample", "df.resample(frequence).agg()", "Agréger une série temporelle par période (index de dates requis).",
    `df.set_index('date').resample('W')['ventes'].sum()   # 'D', 'W', 'ME' (mois), 'YE'`,
    "temps serie temporelle par semaine mois jour periode time series resample");
  F(L, C, "s.rolling", "s.rolling(window).mean()", "Moyenne mobile (ou autre stat sur fenêtre glissante).",
    `df['moy7'] = df['ventes'].rolling(7).mean()`, "moyenne mobile glissante lisser fenetre rolling smoothing");

  C = "Graphiques rapides";
  F(L, C, "df.plot", "df.plot(kind='line', x=None, y=None, logx=False, logy=False, ax=None)", "Graphique rapide depuis pandas (line, bar, barh, hist, box, scatter…).",
    `df.groupby('annee')['ventes'].sum().plot(kind='bar')
df.plot(kind='scatter', x='a', y='b', alpha=0.3)`, "graphique tracer courbe barres plot rapide");
  F(L, C, "df.hist", "df.hist(column=None, bins=10)", "Histogrammes de colonnes.", `df.hist(column='age', bins=30)`, "histogramme distribution histogram");

  // ======================================================================================= NUMPY
  L = "numpy"; C = "Créer des tableaux";
  F(L, C, "np.array", "np.array(liste)", "Créer un tableau numpy.", `a = np.array([1, 2, 3])`, "tableau vecteur matrice array creer");
  F(L, C, "np.arange", "np.arange(debut, fin, pas)", "Valeurs de début à fin (exclue) avec un pas.", `np.arange(0, 10, 2)`, "suite intervalle pas range sequence");
  F(L, C, "np.linspace", "np.linspace(a, b, n)", "n valeurs régulièrement espacées entre a et b.", `x = np.linspace(0, 1, 100)`, "grille intervalle espaces reguliers valeurs");
  F(L, C, "np.logspace", "np.logspace(a, b, n)", "n valeurs espacées en échelle log (de 10**a à 10**b) : bins d'histogramme log.",
    `bins = np.logspace(0, np.log10(df['x'].max()), 50)
plt.hist(df['x'], bins=bins); plt.xscale('log')`, "log logarithmique bins histogramme echelle log");
  F(L, C, "np.zeros", "np.zeros(forme)", "Tableau de zéros (np.ones pour des 1).", `np.zeros((3, 4))`, "zeros initialiser tableau vide");
  F(L, C, "np.meshgrid", "np.meshgrid(x, y)", "Grille 2D (ex. frontière de décision).", `xx, yy = np.meshgrid(np.linspace(0, 1, 100), np.linspace(0, 1, 100))`, "grille 2d frontiere decision boundary");
  C = "Calculs";
  F(L, C, "np.mean", "np.mean(a, axis=None)", "Moyenne (aussi np.median, np.std, np.var, np.sum).",
    `np.mean(x), np.median(x), np.std(x, ddof=1)`, "moyenne mediane ecart type mean median std");
  F(L, C, "np.percentile", "np.percentile(a, q)", "Percentile(s) : bornes d'un intervalle de confiance bootstrap.",
    `np.percentile(moyennes_boot, [2.5, 97.5])`, "percentile quantile intervalle confiance bootstrap ic");
  F(L, C, "np.log", "np.log(x) / np.log10(x) / np.log1p(x)", "Logarithme (log1p(x) = log(1+x), gère les zéros).",
    `df['log_revenu'] = np.log1p(df['revenu'])`, "log logarithme transformation echelle asymetrique skewed");
  F(L, C, "np.exp", "np.exp(x)", "Exponentielle (ex. coefficient de logit → odds ratio).", `np.exp(res.params)`, "exponentielle odds ratio exp");
  F(L, C, "np.sqrt", "np.sqrt(x)", "Racine carrée (erreur standard : std / sqrt(n)).", `se = x.std() / np.sqrt(len(x))`, "racine carree erreur standard sqrt");
  F(L, C, "np.abs", "np.abs(x)", "Valeur absolue.", `np.abs(a - b)`, "valeur absolue abs distance");
  F(L, C, "np.where", "np.where(condition, si_vrai, si_faux)", "Valeur conditionnelle vectorisée (if/else sur une colonne).",
    `df['majeur'] = np.where(df['age'] >= 18, 1, 0)`, "condition si sinon if else creer colonne binaire where");
  F(L, C, "np.unique", "np.unique(a, return_counts=False)", "Valeurs uniques (et leurs effectifs).", `vals, counts = np.unique(a, return_counts=True)`, "unique distinct compter");
  F(L, C, "np.argsort", "np.argsort(a)", "Indices qui trient le tableau.", `idx = np.argsort(scores)[::-1][:10]`, "trier indices top classement argsort");
  F(L, C, "np.corrcoef", "np.corrcoef(x, y)", "Matrice de corrélation de Pearson.", `np.corrcoef(x, y)[0, 1]`, "correlation pearson coefficient");
  F(L, C, "np.isnan", "np.isnan(x)", "Masque des NaN.", `x[~np.isnan(x)]`, "nan manquant missing");
  F(L, C, "np.concatenate", "np.concatenate([a, b])", "Coller des tableaux.", `np.concatenate([a, b])`, "coller concatener tableaux");
  C = "Aléatoire";
  F(L, C, "np.random.default_rng", "rng = np.random.default_rng(seed)", "Générateur aléatoire moderne (integers, choice, normal…).",
    `rng = np.random.default_rng(42)
echantillon = rng.choice(x, size=len(x), replace=True)`, "aleatoire graine random generateur seed bootstrap tirage");
  F(L, C, "np.random.seed", "np.random.seed(n)", "Fixer la graine (reproductibilité).", `np.random.seed(42)`, "graine seed reproductible aleatoire");
  F(L, C, "np.random.choice", "np.random.choice(a, size, replace=True)", "Tirage aléatoire (avec remise = bootstrap).",
    `boot = np.random.choice(x, size=len(x), replace=True)`, "tirage aleatoire bootstrap reechantillonner resample hasard");
  F(L, C, "np.random.normal", "np.random.normal(mu, sigma, size)", "Échantillon d'une loi normale.", `np.random.normal(0, 1, 1000)`, "normale gaussienne simuler aleatoire");
  F(L, C, "np.random.permutation", "np.random.permutation(a)", "Mélanger (test de permutation).", `np.random.permutation(labels)`, "permutation melanger test shuffle");

  // ======================================================================================= MATPLOTLIB
  L = "matplotlib"; C = "Figures et axes";
  F(L, C, "plt.subplots", "fig, ax = plt.subplots(nrows=1, ncols=1, figsize=(w, h), sharex=False, sharey=False)",
    "Créer une figure avec une grille de sous-graphiques.",
    `fig, axes = plt.subplots(1, 2, figsize=(12, 4), sharey=True)
axes[0].hist(a, bins=30); axes[0].set_title('A')
axes[1].hist(b, bins=30); axes[1].set_title('B')
plt.tight_layout(); plt.show()`, "sous graphiques plusieurs graphiques cote a cote grille figure axes subplot subplots",
    "Avec une grille 2D, boucler sur axes.flat ; passer ax=axes[i] aux fonctions seaborn.");
  F(L, C, "plt.figure", "plt.figure(figsize=(w, h))", "Nouvelle figure (taille en pouces).", `plt.figure(figsize=(8, 3))
plt.plot(df['date'], df['ventes'])`, "figure taille figsize");
  F(L, C, "ax.set", "ax.set(xlabel=, ylabel=, title=, xscale=, yscale=, xlim=)", "Régler titres / échelles d'un sous-graphique en une ligne.",
    `fig, ax = plt.subplots()
ax.hist(df['revenu'], bins=np.logspace(4, 6, 30))
ax.set(xlabel='Revenu', ylabel='Effectif', title='Distribution', xscale='log')`, "titre axe label echelle log sous graphique set");
  F(L, C, "ax.set_title", "ax.set_title(texte)", "Titre d'un sous-graphique.", `fig, axes = plt.subplots(1, 2, figsize=(10, 3.5))
axes[0].hist(df.loc[df.groupe == 'A', 'score']); axes[0].set_title('Groupe A')
axes[1].hist(df.loc[df.groupe == 'B', 'score']); axes[1].set_title('Groupe B')`, "titre sous graphique title");
  F(L, C, "ax.set_xlabel", "ax.set_xlabel(texte)", "Titre de l'axe x d'un sous-graphique (set_ylabel pour y).", `fig, ax = plt.subplots()
ax.hist(df['age'], bins=20)
ax.set_xlabel('Âge')`, "axe label titre");
  F(L, C, "ax.set_ylabel", "ax.set_ylabel(texte)", "Titre de l'axe y d'un sous-graphique.", `fig, ax = plt.subplots()
ax.hist(df['age'], bins=20)
ax.set_ylabel('Effectif')`, "axe label titre");
  F(L, C, "plt.tight_layout", "plt.tight_layout()", "Éviter que les titres se chevauchent.", `fig, axes = plt.subplots(1, 2, figsize=(8, 3))
axes[0].hist(df['age']); axes[0].set_title('Âge')
axes[1].hist(df['score']); axes[1].set_title('Score')
plt.tight_layout()`, "chevauchement espacement layout");
  F(L, C, "plt.savefig", "plt.savefig(path, dpi=150, bbox_inches='tight')", "Sauvegarder la figure.", `plt.hist(df['age'], bins=20)
plt.savefig('figure.png', dpi=150, bbox_inches='tight')`, "sauvegarder image exporter save png");
  F(L, C, "plt.show", "plt.show()", "Afficher la figure.", `plt.hist(df['age'], bins=20)
plt.show()`, "afficher montrer show");
  C = "Types de graphiques";
  F(L, C, "plt.plot", "plt.plot(x, y, fmt, label=None)", "Courbe / ligne.", `xs = np.linspace(0, 10, 20)
plt.plot(xs, np.sqrt(xs), '-o', label='modèle')
plt.legend()`, "courbe ligne tracer evolution line plot");
  F(L, C, "plt.scatter", "plt.scatter(x, y, s=None, c=None, alpha=None)", "Nuage de points.", `plt.scatter(df.x, df.y, alpha=0.3, s=10)`, "nuage points scatter relation deux variables");
  F(L, C, "plt.hist", "plt.hist(x, bins=10, density=False, log=False, histtype='bar', alpha=None)", "Histogramme.",
    `plt.hist(df['age'], bins=30, alpha=0.6, label='A')
plt.hist(df.loc[df.groupe == 'B', 'age'], bins=30, alpha=0.6, label='B')
plt.legend()`, "histogramme distribution frequences histogram",
    "density=True pour comparer des groupes de tailles différentes.");
  F(L, C, "plt.bar", "plt.bar(x, hauteurs, yerr=None)", "Diagramme en barres (barh pour horizontal).", `moy = df.groupby('pays')['revenu'].mean()
err = df.groupby('pays')['revenu'].sem()
plt.bar(moy.index, moy.values, yerr=err, capsize=4)`, "barres diagramme categories bar");
  F(L, C, "plt.barh", "plt.barh(y, largeurs, xerr=None)", "Barres horizontales (pratique pour des noms longs, ex. coefficients triés).",
    `coefs = pd.Series(clf.coef_[0], index=X_train.columns).sort_values()
plt.barh(coefs.index, coefs.values)
plt.axvline(0, color='grey', lw=1)`, "barres horizontales barh coefficients tries classement noms longs");
  F(L, C, "plt.boxplot", "plt.boxplot(donnees)", "Boîte à moustaches.", `plt.boxplot([a, b])
plt.xticks([1, 2], ['A', 'B'])`, "boite moustaches boxplot quartiles");
  F(L, C, "plt.errorbar", "plt.errorbar(x, y, yerr=None, fmt='o', capsize=None)", "Points avec barres d'erreur (IC).",
    `plt.errorbar(groupes, moyennes, yerr=[moyennes - bas, haut - moyennes], fmt='o', capsize=4)`, "barres erreur intervalle confiance ic error bar incertitude");
  F(L, C, "plt.fill_between", "plt.fill_between(x, bas, haut, alpha=0.3)", "Bande colorée (IC autour d'une courbe).", `xs = np.linspace(0, 10, 50)
plt.plot(xs, np.sin(xs))
plt.fill_between(xs, np.sin(xs) - 0.3, np.sin(xs) + 0.3, alpha=0.3)`, "bande zone intervalle confiance remplir");
  F(L, C, "plt.axvline", "plt.axvline(x, color, linestyle='--')", "Ligne verticale (axhline : horizontale), ex. moyenne.",
    `plt.axvline(x.mean(), color='red', linestyle='--', label='moyenne')`, "ligne verticale horizontale seuil moyenne repere");
  F(L, C, "plt.loglog", "plt.loglog(x, y)", "Deux axes en échelle log (lois de puissance).", `plt.loglog(degres, ccdf, '.')`, "log log echelle loi puissance power law heavy tail");
  C = "Habillage";
  F(L, C, "plt.xlabel", "plt.xlabel(texte)", "Titre de l'axe x.", `plt.hist(df['age'], bins=20)
plt.xlabel('Âge (années)')`, "axe titre label x");
  F(L, C, "plt.ylabel", "plt.ylabel(texte)", "Titre de l'axe y.", `plt.hist(df['age'], bins=20)
plt.ylabel('Effectif')`, "axe titre label y");
  F(L, C, "plt.title", "plt.title(texte)", "Titre du graphique.", `plt.hist(df['age'], bins=20)
plt.title('Distribution des âges')`, "titre title");
  F(L, C, "plt.legend", "plt.legend(loc='best')", "Afficher la légende (labels définis via label=...).", `plt.hist(df.loc[df.sexe == 'F', 'age'], alpha=0.6, label='F')
plt.hist(df.loc[df.sexe == 'M', 'age'], alpha=0.6, label='M')
plt.legend()`, "legende legend");
  F(L, C, "plt.xscale", "plt.xscale('log') / plt.yscale('log')", "Échelle log sur un axe.", `plt.hist(df['degre'], bins=30)
plt.yscale('log')`, "echelle log logarithmique axe");
  F(L, C, "plt.xlim", "plt.xlim(a, b) / plt.ylim(a, b)", "Limites des axes.", `plt.scatter(df['x'], df['y'], s=8)
plt.xlim(0, 8)`, "limites zoom axe");
  F(L, C, "plt.xticks", "plt.xticks(rotation=45)", "Graduations de l'axe x (rotation des étiquettes).", `df['categorie'].value_counts().plot(kind='bar')
plt.xticks(rotation=45, ha='right')`, "graduations etiquettes rotation ticks");

  // ======================================================================================= SEABORN
  L = "seaborn"; C = "Distributions";
  F(L, C, "sns.histplot", "sns.histplot(data, x, hue=None, bins='auto', stat='count', common_norm=True, log_scale=False, kde=False, ax=None)",
    "Histogramme, avec hue pour comparer des groupes.",
    `sns.histplot(data=df, x='revenu', hue='groupe', stat='density', common_norm=False, log_scale=True)`,
    "histogramme distribution comparer groupes histogram",
    "stat='density' + common_norm=False pour comparer des groupes de tailles différentes ; log_scale=True pour les queues lourdes.");
  F(L, C, "sns.kdeplot", "sns.kdeplot(data, x, hue=None, fill=False)", "Densité lissée.", `sns.kdeplot(data=df, x='age', hue='groupe', fill=True)`, "densite lissee kde distribution");
  F(L, C, "sns.ecdfplot", "sns.ecdfplot(data, x, hue=None, complementary=False, log_scale=False)", "Fonction de répartition empirique (CDF / CCDF).",
    `sns.ecdfplot(data=df, x='degre', complementary=True, log_scale=(True, True))`, "cdf ccdf repartition cumulative queue lourde heavy tail distribution",
    "complementary=True donne la CCDF : sur axes log-log, une droite suggère une loi de puissance.");
  F(L, C, "sns.boxplot", "sns.boxplot(data, x, y, hue=None)", "Boîtes à moustaches par catégorie.", `sns.boxplot(data=df, x='groupe', y='revenu')`, "boite moustaches boxplot comparer groupes quartiles");
  F(L, C, "sns.violinplot", "sns.violinplot(data, x, y, hue=None)", "Violons : distribution par catégorie.", `sns.violinplot(data=df, x='groupe', y='revenu')`, "violon distribution comparer groupes");
  F(L, C, "sns.stripplot", "sns.stripplot(data, x, y)", "Tous les points par catégorie.", `sns.stripplot(data=df, x='groupe', y='score', alpha=0.5)`, "points categorie");
  C = "Catégories";
  F(L, C, "sns.barplot", "sns.barplot(data, x, y, hue=None, estimator='mean', errorbar=('ci', 95))",
    "Barres = moyenne par catégorie + intervalle de confiance bootstrap.", `sns.barplot(data=df, x='groupe', y='revenu', errorbar=('ci', 95))`,
    "barres moyenne par groupe intervalle confiance comparer categories bar");
  F(L, C, "sns.countplot", "sns.countplot(data, x, hue=None)", "Effectif de chaque catégorie.", `sns.countplot(data=df, x='pays', order=df['pays'].value_counts().index)`, "compter effectifs categories barres count");
  F(L, C, "sns.pointplot", "sns.pointplot(data, x, y, hue=None)", "Moyennes + IC reliées (évolution par catégorie).", `sns.pointplot(data=df, x='annee', y='score', hue='groupe')`, "moyenne intervalle confiance evolution points");
  F(L, C, "sns.catplot", "sns.catplot(data, x, y, kind='bar', col=None)", "Graphique catégoriel en plusieurs panneaux (col=…).", `sns.catplot(data=df, x='groupe', y='score', col='pays', kind='box')`, "plusieurs panneaux categories facettes facet");
  C = "Relations";
  F(L, C, "sns.scatterplot", "sns.scatterplot(data, x, y, hue=None, size=None, alpha=None)", "Nuage de points (couleur par groupe).", `sns.scatterplot(data=df, x='a', y='b', hue='groupe', alpha=0.5)`, "nuage points scatter relation deux variables");
  F(L, C, "sns.lineplot", "sns.lineplot(data, x, y, hue=None)", "Courbe avec IC (agrège les x répétés).", `sns.lineplot(data=df, x='annee', y='ventes', hue='pays')`, "courbe evolution temps ligne line");
  F(L, C, "sns.regplot", "sns.regplot(data, x, y, logistic=False, scatter_kws=None)", "Nuage + droite de régression avec IC.", `sns.regplot(data=df, x='a', y='b', scatter_kws={'alpha': 0.3})`, "regression droite tendance nuage fit");
  F(L, C, "sns.lmplot", "sns.lmplot(data, x, y, hue=None, col=None)", "Comme regplot, par groupes / panneaux.", `sns.lmplot(data=df, x='a', y='b', hue='groupe')`, "regression droite tendance groupes");
  F(L, C, "sns.jointplot", "sns.jointplot(data, x, y, kind='scatter')", "Nuage + distributions marginales (kind='hex' pour beaucoup de points).", `sns.jointplot(data=df, x='a', y='b', kind='hex')`, "nuage marginales relation deux variables hexbin");
  F(L, C, "sns.pairplot", "sns.pairplot(data, vars=None, hue=None)", "Tous les nuages de points 2 à 2.", `sns.pairplot(df[['a', 'b', 'c', 'groupe']], hue='groupe')`, "toutes variables paires relations scatter matrix");
  F(L, C, "sns.heatmap", "sns.heatmap(data, annot=False, fmt='.2g', cmap=None, center=None)", "Carte de chaleur (matrice de corrélation, tableau croisé).",
    `sns.heatmap(df[['age', 'revenu', 'score', 'a', 'b', 'c']].corr(), annot=True, fmt='.2f', cmap='coolwarm', center=0)`, "heatmap carte chaleur matrice correlation tableau");
  C = "Style";
  F(L, C, "sns.set_theme", "sns.set_theme(style='whitegrid', context='notebook')", "Style global des graphiques.", `sns.set_theme(style='whitegrid')
sns.histplot(data=df, x='age')`, "style theme apparence");

  // ======================================================================================= SCIPY
  L = "scipy"; C = "Tests statistiques";
  F(L, C, "stats.ttest_ind", "stats.ttest_ind(a, b, equal_var=True, alternative='two-sided')",
    "Test t : les moyennes de deux groupes indépendants diffèrent-elles ?",
    `t, p = stats.ttest_ind(groupe_a, groupe_b, equal_var=False)   # Welch`, "test t comparer moyennes deux groupes difference significatif hypothese student welch t-test",
    "H0 : moyennes égales. equal_var=False (Welch) si variances différentes. Données très asymétriques → Mann-Whitney.");
  F(L, C, "stats.ttest_rel", "stats.ttest_rel(avant, apres)", "Test t apparié (mêmes individus mesurés deux fois / paires matchées).",
    `stats.ttest_rel(avant, apres)`, "test t apparie paires avant apres matched paired");
  F(L, C, "stats.ttest_1samp", "stats.ttest_1samp(x, popmean)", "La moyenne diffère-t-elle d'une valeur ?", `stats.ttest_1samp(x, 0)`, "test t une moyenne valeur reference");
  F(L, C, "stats.mannwhitneyu", "stats.mannwhitneyu(a, b, alternative='two-sided')", "Test non paramétrique : un groupe a-t-il des valeurs plus grandes ? (rangs)",
    `stats.mannwhitneyu(a, b)`, "mann whitney non parametrique rangs comparer deux groupes mediane");
  F(L, C, "stats.chi2_contingency", "chi2, p, dof, attendu = stats.chi2_contingency(table)", "Test du χ² d'indépendance entre deux variables catégorielles.",
    `table = pd.crosstab(df['traitement'], df['resultat'])
chi2, p, dof, expected = stats.chi2_contingency(table)`, "chi2 khi deux independance categorielles contingence association test",
    "Effectifs attendus ≥ 5 dans chaque case, sinon stats.fisher_exact (tableau 2x2).");
  F(L, C, "stats.f_oneway", "stats.f_oneway(g1, g2, g3, ...)", "ANOVA : plusieurs groupes ont-ils la même moyenne ?", `stats.f_oneway(*[g['score'] for _, g in df.groupby('pays')])`, "anova plusieurs groupes moyennes comparer");
  F(L, C, "stats.kstest", "stats.kstest(x, stats.norm(loc=mu, scale=sigma).cdf)", "Kolmogorov-Smirnov : x suit-il une loi donnée ?", `stats.kstest(x, stats.norm(loc=x.mean(), scale=x.std()).cdf)`, "kolmogorov smirnov ks loi distribution normalite test", "La forme stats.kstest(x, 'norm', args=(mu, sigma)) plante avec scipy 1.18 (TypeError ndtr) : passer une loi figée stats.norm(loc, scale).cdf, qui marche partout.");
  F(L, C, "stats.ks_2samp", "stats.ks_2samp(a, b)", "Deux échantillons viennent-ils de la même distribution ?", `stats.ks_2samp(a, b)`, "kolmogorov smirnov deux echantillons meme distribution comparer");
  F(L, C, "stats.shapiro", "stats.shapiro(x)", "Test de normalité de Shapiro-Wilk (petits échantillons).", `stat, p = stats.shapiro(x)`, "normalite loi normale shapiro test gaussienne");
  F(L, C, "stats.binomtest", "stats.binomtest(k, n, p=0.5)", "Test binomial sur une proportion.", `stats.binomtest(62, 100, p=0.5).pvalue`, "proportion binomial test pile face");
  F(L, C, "stats.bootstrap", "stats.bootstrap((x,), np.mean, confidence_level=0.95, n_resamples=9999)", "Intervalle de confiance par bootstrap (tout fait).",
    `res = stats.bootstrap((x,), np.median, confidence_level=0.95)
res.confidence_interval`, "bootstrap intervalle confiance ic reechantillonnage confidence interval");
  C = "Corrélation";
  F(L, C, "stats.pearsonr", "r, p = stats.pearsonr(x, y)", "Corrélation linéaire de Pearson + p-value.", `r, p = stats.pearsonr(df['a'], df['b'])`, "correlation pearson lineaire lien relation p value significatif",
    "Sensible aux valeurs extrêmes ; NaN interdits (dropna avant).");
  F(L, C, "stats.spearmanr", "rho, p = stats.spearmanr(x, y)", "Corrélation de rangs (monotone, robuste aux extrêmes) + p-value.", `rho, p = stats.spearmanr(df['a'], df['b'])`, "correlation spearman rang monotone robuste");
  C = "Lois et transformations";
  F(L, C, "stats.norm", "stats.norm(loc, scale).pdf / .cdf / .ppf", "Loi normale (densité, répartition, quantiles).", `stats.norm.ppf(0.975)   # 1.96`, "loi normale gaussienne quantile densite");
  F(L, C, "stats.zscore", "stats.zscore(x)", "Standardiser : (x - moyenne) / écart-type.", `df['z'] = stats.zscore(df['x'])`, "standardiser normaliser z score centrer reduire");

  // ======================================================================================= STATSMODELS
  L = "statsmodels"; C = "Régression (formules)";
  F(L, C, "smf.ols", "smf.ols(formula='y ~ x1 + x2 + C(cat)', data=df).fit()", "Régression linéaire (moindres carrés) avec une formule.",
    `mod = smf.ols('prix ~ surface + C(quartier) + surface:age', data=df)
res = mod.fit()
print(res.summary())`, "regression lineaire ols moindres carres modele formule linear regression",
    "C(var) : catégorielle ; a*b = a + b + a:b (interaction) ; np.log(y) autorisé dans la formule.");
  F(L, C, "smf.logit", "smf.logit(formula='y ~ x1 + x2', data=df).fit()", "Régression logistique (y binaire 0/1).",
    `res = smf.logit('achat ~ age + C(sexe)', data=df).fit()
print(res.summary())
df['proba'] = res.predict(df)`, "regression logistique logit binaire probabilite classification propensity score",
    "Coefficient = variation du log-odds ; np.exp(coef) = odds ratio.");
  F(L, C, "smf.glm", "smf.glm(formula, data, family=sm.families.Poisson()).fit()", "Modèle linéaire généralisé (Poisson pour des comptages…).",
    `res = smf.glm('n_visites ~ age', data=df, family=sm.families.Poisson()).fit()`, "glm poisson comptage modele generalise");
  F(L, C, "sm.OLS", "sm.OLS(y, sm.add_constant(X)).fit()", "Régression linéaire sans formule (matrices).",
    `res = sm.OLS(y, sm.add_constant(X)).fit()`, "regression lineaire ols matrice");
  F(L, C, "sm.add_constant", "sm.add_constant(X)", "Ajouter la colonne d'intercept (1) pour sm.OLS / sm.Logit.", `X = sm.add_constant(X)`, "constante intercept");
  C = "Résultats d'un modèle";
  F(L, C, "res.summary", "res.summary()", "Tableau complet : coefficients, erreurs standards, p-values, IC, R²…", `print(res.summary())`, "resume resultats coefficients p value r2 summary tableau");
  F(L, C, "res.params", "res.params", "Coefficients estimés.", `res.params['surface']`, "coefficients parametres beta estimes coef");
  F(L, C, "res.pvalues", "res.pvalues", "p-values des coefficients.", `res.pvalues[res.pvalues < 0.05]`, "p value significatif significativite");
  F(L, C, "res.conf_int", "res.conf_int(alpha=0.05)", "Intervalles de confiance des coefficients.", `res.conf_int()`, "intervalle confiance ic coefficients");
  F(L, C, "res.rsquared", "res.rsquared / res.rsquared_adj", "R² : part de variance expliquée.", `res.rsquared`, "r2 r carre variance expliquee qualite ajustement");
  F(L, C, "res.resid", "res.resid / res.fittedvalues", "Résidus et valeurs ajustées (diagnostic).",
    `plt.scatter(res.fittedvalues, res.resid, alpha=0.3)`, "residus valeurs ajustees diagnostic");
  C = "Tests";
  F(L, C, "statsmodels.stats.diagnostic.kstest_normal", "kstest_normal(x, dist='norm')", "KS (Lilliefors) : normale ('norm') ou exponentielle ('exp') ?",
    `from statsmodels.stats import diagnostic
stat, p = diagnostic.kstest_normal(df['x'], dist='norm')`, "normalite kolmogorov lilliefors loi normale exponentielle test",
    "p < 0.05 → on rejette l'hypothèse que la donnée suit cette loi.");
  F(L, C, "statsmodels.stats.multitest.multipletests", "reject, p_corr, _, _ = multipletests(pvals, alpha=0.05, method='bonferroni')",
    "Correction pour tests multiples (bonferroni, holm, fdr_bh).",
    `from statsmodels.stats.multitest import multipletests
reject, p_corr, _, _ = multipletests(pvals, method='fdr_bh')`, "tests multiples bonferroni correction fdr benjamini comparaisons multiples");
  F(L, C, "statsmodels.stats.proportion.binom_test", "binom_test(k, n, prop=0.5)", "Test binomial sur une proportion.", `from statsmodels.stats.proportion import binom_test
binom_test(62, 100, 0.5)`, "proportion binomial test");

  // ======================================================================================= SCIKIT-LEARN
  L = "scikit-learn"; C = "Préparer les données";
  F(L, C, "sklearn.model_selection.train_test_split", "X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=None, stratify=None)",
    "Séparer les données en entraînement / test.",
    `from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)`,
    "train test separer split jeu test entrainement validation",
    "stratify=y garde la même proportion de classes ; ne jamais regarder le test pendant les choix de modèle.");
  F(L, C, "sklearn.preprocessing.StandardScaler", "StandardScaler().fit_transform(X)", "Standardiser les features (moyenne 0, écart-type 1).",
    `from sklearn.preprocessing import StandardScaler
scaler = StandardScaler().fit(X_train)
X_train_s, X_test_s = scaler.transform(X_train), scaler.transform(X_test)`,
    "standardiser normaliser mettre echelle scaling scaler centrer reduire", "fit sur le train uniquement, puis transform train ET test.");
  F(L, C, "sklearn.preprocessing.OneHotEncoder", "OneHotEncoder(handle_unknown='ignore')", "One-hot dans un pipeline sklearn.",
    `from sklearn.preprocessing import OneHotEncoder
enc = OneHotEncoder(handle_unknown='ignore').fit(df[['pays']])
enc.transform(df[['pays']].head()).toarray()`, "one hot categorielle encoder dummies");
  F(L, C, "sklearn.pipeline.make_pipeline", "make_pipeline(etape1, etape2, ..., modele)", "Enchaîner prétraitement + modèle (évite les fuites de données).",
    `from sklearn.pipeline import make_pipeline
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
model.fit(X_train, y_train)`, "pipeline enchainer pretraitement modele");
  C = "Modèles supervisés";
  F(L, C, "sklearn.linear_model.LinearRegression", "LinearRegression()", "Régression linéaire.",
    `from sklearn.linear_model import LinearRegression
lr = LinearRegression().fit(X_train, y_train)
lr.coef_, lr.intercept_`, "regression lineaire predire valeur continue linear");
  F(L, C, "sklearn.linear_model.LogisticRegression", "LogisticRegression(C=1.0, penalty='l2', max_iter=100)", "Régression logistique (classification).",
    `from sklearn.linear_model import LogisticRegression
clf = LogisticRegression(max_iter=1000).fit(X_train, y_train)
proba = clf.predict_proba(X_test)[:, 1]`, "classification regression logistique classifieur binaire logistic",
    "C = 1/régularisation : petit C = forte régularisation. solver='lbfgs' est déjà le défaut (les vieux notebooks l'écrivent juste pour faire taire un ancien FutureWarning). ConvergenceWarning « lbfgs failed to converge » → max_iter=1000 et/ou standardiser les features (ex. 'fare' bien plus grand que les autres).");
  F(L, C, "sklearn.linear_model.Ridge", "Ridge(alpha=1.0)", "Régression linéaire régularisée L2 : minimise Σ(y − ŷ)² + alpha·Σβⱼ² (l'intercept n'est pas pénalisé).", `from sklearn.linear_model import Ridge
Xr, yr = df[['surface', 'age']], df['prix']
for alpha in [0, 6, 1e6]:
    print(alpha, Ridge(alpha=alpha).fit(Xr, yr).coef_.round(1))`,
    "ridge regularisation l2 penalite overfitting surapprentissage alpha coefficients",
    "alpha = 0 → exactement LinearRegression ; alpha grand → coefficients tirés vers 0 (underfitting, on prédit ~ la moyenne). Utile quand peu de lignes / beaucoup de features (overfitting). La pénalité dépend de l'échelle des features → StandardScaler avant. Choisir alpha par validation croisée (RidgeCV), pas à la main.");
  F(L, C, "sklearn.linear_model.RidgeCV", "RidgeCV(alphas=(0.1, 1.0, 10.0), cv=None)", "Ridge qui choisit lui-même le meilleur alpha par validation croisée (leave-one-out par défaut).",
    `from sklearn.linear_model import RidgeCV, Ridge
from sklearn.model_selection import cross_val_predict
Xr, yr = df[['surface', 'age']], df['prix']
ridge_cv = RidgeCV(alphas=np.logspace(-2, 6, 50)).fit(Xr, yr)
ridge_cv.alpha_                      # le meilleur alpha
ridge = Ridge(alpha=ridge_cv.alpha_) # modèle à alpha FIXE pour l'évaluer ensuite
cross_val_predict(ridge, Xr, yr, cv=5)[:5]`,
    "ridgecv choisir meilleur alpha hyperparametre regularisation validation croisee ridge tuning",
    "Si alpha_ tombe sur le bord de la grille (plus grand ou plus petit alpha testé), élargir la grille. Piège : cross_val_predict(RidgeCV(...)) re-choisit alpha dans CHAQUE fold (nested CV) → MSE différente (plus honnête) que cross_val_predict(Ridge(alpha=alpha_)). Pour un alpha fixe, passer un Ridge. Vérifier X.shape : en notebook, une cellule relancée dans le désordre change X (ex. 200 lignes au lieu de 5) et donc alpha_.");
  F(L, C, "sklearn.linear_model.Lasso", "Lasso(alpha=1.0)", "Régression linéaire régularisée L1 (sélection de variables).", `from sklearn.linear_model import Lasso
Lasso(alpha=0.1).fit(X_train, y_train)`, "lasso regularisation l1 selection variables parcimonie");
  F(L, C, "sklearn.neighbors.KNeighborsClassifier", "KNeighborsClassifier(n_neighbors=5)", "k plus proches voisins.",
    `from sklearn.neighbors import KNeighborsClassifier
knn = KNeighborsClassifier(n_neighbors=5).fit(X_train, y_train)`, "knn voisins plus proches k nearest neighbors classification", "Standardiser les features avant (distances !).");
  F(L, C, "sklearn.tree.DecisionTreeClassifier", "DecisionTreeClassifier(max_depth=None)", "Arbre de décision.",
    `from sklearn.tree import DecisionTreeClassifier
tree = DecisionTreeClassifier(max_depth=4).fit(X_train, y_train)`, "arbre decision tree classification interpretable");
  F(L, C, "sklearn.ensemble.RandomForestClassifier", "RandomForestClassifier(n_estimators=100, max_depth=None, random_state=None)", "Forêt aléatoire (+ importance des variables).",
    `from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=300, random_state=0).fit(X_train, y_train)
pd.Series(rf.feature_importances_, index=X.columns).sort_values()`, "foret aleatoire random forest arbres importance variables classification");
  F(L, C, "sklearn.ensemble.RandomForestRegressor", "RandomForestRegressor(n_estimators=100)", "Forêt aléatoire pour une cible continue.", `from sklearn.ensemble import RandomForestRegressor`, "foret aleatoire regression random forest");
  F(L, C, "sklearn.ensemble.GradientBoostingClassifier", "GradientBoostingClassifier()", "Boosting d'arbres.", `from sklearn.ensemble import GradientBoostingClassifier`, "boosting gradient arbres");
  C = "Méthodes communes des modèles";
  F(L, C, "model.fit", "model.fit(X, y)", "Entraîner / ajuster un modèle (sklearn) — aussi mod.fit() en statsmodels.", `model.fit(X_train, y_train)
LinearRegression().fit(X_train, y_train).predict(X_test)[:3]  # fit renvoie le modèle → on enchaîne`, "entrainer ajuster apprendre fit train",
    "En sklearn, fit() renvoie le modèle lui-même : on peut enchaîner .predict(). En dernière ligne de cellule, Jupyter affiche la boîte du modèle (Parameters / Fitted attributes) ; un ';' final la cache. Les attributs appris finissent par '_' (coef_, intercept_, alpha_…).");
  F(L, C, "model.predict", "model.predict(X)", "Prédire (classes ou valeurs). En statsmodels : res.predict(df).", `y_pred = model.predict(X_test)`, "predire prediction predict");
  F(L, C, "model.predict_proba", "model.predict_proba(X)", "Probabilités par classe ([:, 1] = classe positive).", `proba = clf.predict_proba(X_test)[:, 1]`, "probabilite proba score classification roc");
  F(L, C, "model.coef_", "model.coef_ / model.intercept_", "Coefficients d'un modèle linéaire entraîné.", `pd.Series(lr.coef_, index=X.columns)`, "coefficients poids coef");
  F(L, C, "model.feature_importances_", "model.feature_importances_", "Importance des variables (arbres, forêts).", `pd.Series(rf.feature_importances_, index=X.columns).nlargest(10)`, "importance variables features");
  F(L, C, "model.fit_predict", "model.fit_predict(X)", "Entraîner puis renvoyer directement les étiquettes (clustering : KMeans, DBSCAN…).",
    `labels = KMeans(n_clusters=3, n_init=10, random_state=0).fit_predict(X_s)
pd.Series(labels).value_counts()`, "fit predict clustering etiquettes labels clusters non supervise");
  F(L, C, "model.fit_transform", "model.fit_transform(X)", "Apprendre la transformation puis l'appliquer (StandardScaler, PCA, TfidfVectorizer, TSNE…).",
    `X_s = StandardScaler().fit_transform(X)
X_s[:3].round(2)`, "fit transform transformer standardiser pca reduction tfidf",
    "Sur le jeu de test : seulement .transform() avec l'objet appris sur le train (sinon fuite de données).");
  C = "Évaluer";
  F(L, C, "sklearn.model_selection.cross_val_score", "cross_val_score(model, X, y, cv=5, scoring=None)", "Score moyen en validation croisée k-fold.",
    `from sklearn.model_selection import cross_val_score
scores = cross_val_score(model, X, y, cv=5, scoring='roc_auc')
scores.mean(), scores.std()`, "validation croisee cross validation k fold evaluer score");
  F(L, C, "sklearn.model_selection.cross_val_predict", "cross_val_predict(model, X, y, cv=5, method='predict')", "Prédictions hors-échantillon en validation croisée.",
    `from sklearn.model_selection import cross_val_predict
y_pred = cross_val_predict(model, X, y, cv=10)`, "validation croisee predictions cross validation",
    "Le modèle passé est ré-entraîné de zéro dans chaque fold : un modèle *CV (RidgeCV, GridSearchCV…) y refait sa recherche d'hyperparamètre à chaque fold et n'utilise PAS l'alpha_ trouvé avant.");
  F(L, C, "sklearn.model_selection.GridSearchCV", "GridSearchCV(model, param_grid, cv=5, scoring=None)", "Choisir les hyperparamètres par validation croisée.",
    `from sklearn.model_selection import GridSearchCV
gs = GridSearchCV(KNeighborsClassifier(), {'n_neighbors': [1, 5, 15, 51]}, cv=5).fit(X_train, y_train)
gs.best_params_, gs.best_score_`, "hyperparametres grille recherche tuning choisir k validation croisee grid search");
  F(L, C, "sklearn.metrics.accuracy_score", "accuracy_score(y_true, y_pred)", "Proportion de bonnes prédictions.", `from sklearn.metrics import accuracy_score
accuracy_score(y_test, y_pred)`, "accuracy precision globale taux bonnes predictions exactitude");
  F(L, C, "sklearn.metrics.classification_report", "classification_report(y_true, y_pred)", "Precision, recall, F1 par classe.", `from sklearn.metrics import classification_report
print(classification_report(y_test, y_pred))`, "precision recall rappel f1 rapport classification metriques");
  F(L, C, "sklearn.metrics.precision_score", "precision_score / recall_score / f1_score(y_true, y_pred)", "Précision, rappel, F1.",
    `from sklearn.metrics import precision_score, recall_score, f1_score
precision_score(y_test, y_pred), recall_score(y_test, y_pred), f1_score(y_test, y_pred)`, "precision rappel recall f1 faux positifs negatifs");
  F(L, C, "sklearn.metrics.confusion_matrix", "confusion_matrix(y_true, y_pred)", "Matrice de confusion (lignes = vrai, colonnes = prédit).",
    `from sklearn.metrics import confusion_matrix
confusion_matrix(y_test, y_pred)`, "matrice confusion faux positifs vrais negatifs erreurs");
  F(L, C, "sklearn.metrics.roc_curve", "fpr, tpr, seuils = roc_curve(y_true, scores)", "Courbe ROC.",
    `from sklearn.metrics import roc_curve, roc_auc_score
fpr, tpr, _ = roc_curve(y_test, proba)
plt.plot(fpr, tpr, label=f'AUC = {roc_auc_score(y_test, proba):.2f}')
plt.plot([0, 1], [0, 1], '--')`, "roc courbe faux positifs seuil classification evaluation");
  F(L, C, "sklearn.metrics.roc_auc_score", "roc_auc_score(y_true, scores)", "Aire sous la courbe ROC.", `roc_auc_score(y_test, proba)`, "auc aire roc evaluation");
  F(L, C, "sklearn.metrics.auc", "auc(x, y)", "Aire sous une courbe (ex. auc(fpr, tpr)).", `from sklearn.metrics import auc
auc(fpr, tpr)`, "auc aire courbe roc");
  F(L, C, "sklearn.metrics.mean_squared_error", "mean_squared_error(y_true, y_pred)", "Erreur quadratique moyenne (MSE).", `from sklearn.metrics import mean_squared_error
mse = mean_squared_error(y_test, y_pred)`, "mse erreur quadratique regression evaluation rmse");
  F(L, C, "sklearn.metrics.r2_score", "r2_score(y_true, y_pred)", "R² sur des prédictions.", `from sklearn.metrics import r2_score
r2_score(y_test, y_pred)`, "r2 variance expliquee regression evaluation");
  C = "Non supervisé";
  F(L, C, "sklearn.cluster.KMeans", "KMeans(n_clusters=8, n_init='auto', random_state=None)", "Clustering k-means.",
    `from sklearn.cluster import KMeans
km = KMeans(n_clusters=4, n_init=10, random_state=0).fit(X)
labels, inertie = km.labels_, km.inertia_`, "clustering kmeans k means groupes clusters non supervise partitionner");
  F(L, C, "sklearn.cluster.DBSCAN", "DBSCAN(eps=0.5, min_samples=5)", "Clustering par densité (formes quelconques, bruit = -1).",
    `from sklearn.cluster import DBSCAN
labels = DBSCAN(eps=0.3, min_samples=10).fit_predict(X)`, "dbscan clustering densite bruit outliers");
  F(L, C, "sklearn.metrics.silhouette_score", "silhouette_score(X, labels)", "Qualité d'un clustering (-1 à 1, plus haut = mieux).", `from sklearn.metrics import silhouette_score
silhouette_score(X, km.labels_)`, "silhouette qualite clustering choisir k nombre clusters");
  F(L, C, "sklearn.decomposition.PCA", "PCA(n_components=None)", "Analyse en composantes principales (réduction de dimension).",
    `from sklearn.decomposition import PCA
pca = PCA(n_components=2).fit(X_s)
X2 = pca.transform(X_s); pca.explained_variance_ratio_`, "pca acp composantes principales reduction dimension variance expliquee");
  F(L, C, "sklearn.manifold.TSNE", "TSNE(n_components=2, perplexity=30, random_state=None)", "Projection 2D non linéaire pour visualiser.",
    `from sklearn.manifold import TSNE
X2 = TSNE(n_components=2, random_state=0).fit_transform(X)`, "tsne visualisation projection 2d reduction dimension");
  C = "Texte";
  F(L, C, "sklearn.feature_extraction.text.TfidfVectorizer", "TfidfVectorizer(stop_words=None, max_features=None, min_df=1, ngram_range=(1, 1))",
    "Transformer des textes en vecteurs TF-IDF.",
    `from sklearn.feature_extraction.text import TfidfVectorizer
vec = TfidfVectorizer(stop_words='english', min_df=5)
X = vec.fit_transform(df['texte'])
vec.get_feature_names_out()`, "texte tfidf tf idf vectoriser mots documents nlp bag of words");
  F(L, C, "sklearn.feature_extraction.text.CountVectorizer", "CountVectorizer(stop_words=None, max_features=None)", "Sac de mots (comptages).",
    `from sklearn.feature_extraction.text import CountVectorizer
X = CountVectorizer(stop_words='english').fit_transform(textes)`, "texte sac mots compter bag of words nlp");
  C = "Données jouets";
  F(L, C, "sklearn.datasets.make_moons", "make_moons(n_samples=100, noise=None)", "Jeu de données jouet en deux lunes.", `from sklearn.datasets import make_moons
X, y = make_moons(200, noise=0.2)`, "donnees jouet simuler");
  F(L, C, "sklearn.datasets.make_blobs", "make_blobs(n_samples=100, centers=None, cluster_std=1.0, random_state=None)", "Nuages de points gaussiens (pour tester un clustering).",
    `from sklearn.datasets import make_blobs
Xb, yb = make_blobs(n_samples=300, centers=4, cluster_std=0.8, random_state=0)
plt.scatter(Xb[:, 0], Xb[:, 1], c=yb, s=10)`, "donnees jouet blobs clusters simuler clustering kmeans");

  // ======================================================================================= NETWORKX
  L = "networkx"; C = "Construire un graphe";
  F(L, C, "nx.Graph", "nx.Graph() / nx.DiGraph()", "Créer un graphe (non orienté / orienté).",
    `G = nx.Graph()
G.add_edge('a', 'b', weight=0.5)`, "graphe reseau creer noeuds aretes network graph");
  F(L, C, "nx.from_pandas_edgelist", "nx.from_pandas_edgelist(df, source, target, edge_attr=None, create_using=None)", "Graphe à partir d'un DataFrame d'arêtes.",
    `G = nx.from_pandas_edgelist(aretes, source='from', target='to', edge_attr='weight')`, "graphe reseau dataframe aretes liste edges");
  F(L, C, "G.add_weighted_edges_from", "G.add_weighted_edges_from([(u, v, w), ...])", "Ajouter des arêtes pondérées.", `G.add_weighted_edges_from([(1, 2, 0.9), (1, 3, 0.4)])`, "aretes poids ajouter");
  F(L, C, "G.nodes", "G.nodes / G.edges / G.degree", "Nœuds, arêtes, degrés.", `G.number_of_nodes(), G.number_of_edges()
dict(G.degree())`, "noeuds aretes degre nombre");
  C = "Mesures";
  F(L, C, "nx.degree_centrality", "nx.degree_centrality(G)", "Centralité de degré (dict nœud → valeur).", `pd.Series(nx.degree_centrality(G)).nlargest(10)`, "centralite degre important noeuds");
  F(L, C, "nx.betweenness_centrality", "nx.betweenness_centrality(G)", "Centralité d'intermédiarité (ponts).", `pd.Series(nx.betweenness_centrality(G)).nlargest(10)`, "centralite intermediarite betweenness ponts");
  F(L, C, "nx.pagerank", "nx.pagerank(G, alpha=0.85)", "PageRank.", `pd.Series(nx.pagerank(G)).nlargest(10)`, "pagerank importance centralite");
  F(L, C, "nx.connected_components", "nx.connected_components(G)", "Composantes connexes (ensembles de nœuds).",
    `comps = sorted(nx.connected_components(G), key=len, reverse=True)
G_max = G.subgraph(comps[0])`, "composantes connexes plus grande composante connected");
  F(L, C, "nx.clustering", "nx.clustering(G) / nx.average_clustering(G)", "Coefficient de clustering (triangles).", `nx.average_clustering(G)`, "clustering triangles coefficient");
  F(L, C, "nx.shortest_path_length", "nx.shortest_path_length(G, source, target)", "Distance (plus court chemin).", `nx.shortest_path_length(G, 'a', 'b')`, "plus court chemin distance");
  F(L, C, "nx.density", "nx.density(G)", "Densité du graphe.", `nx.density(G)`, "densite graphe");
  F(L, C, "nx.community.louvain_communities", "nx.community.louvain_communities(G, seed=None)", "Détection de communautés (Louvain).",
    `comms = nx.community.louvain_communities(G, seed=0)`, "communautes louvain modularite groupes detection");
  F(L, C, "nx.max_weight_matching", "nx.max_weight_matching(G, maxcardinality=False)", "Appariement de poids maximal (matching traité / contrôle).",
    `matching = nx.max_weight_matching(G)   # ensemble de paires (u, v)`, "matching appariement paires propensity score causal observationnel");
  F(L, C, "nx.draw", "nx.draw(G, pos=None, with_labels=False, node_size=300)", "Dessiner le graphe.", `nx.draw(G, pos=nx.spring_layout(G, seed=0), node_size=20)`, "dessiner visualiser graphe draw");

  // ======================================================================================= TEXTE (NLP)
  L = "nlp"; C = "Outils Python pour le texte";
  F(L, C, "collections.Counter", "Counter(iterable)", "Compter les éléments d'une liste (ex. mots) ; .most_common(n) donne les plus fréquents.",
    `from collections import Counter
mots = ' '.join(script['ligne']).lower().split()
compte = Counter(mots)
compte.most_common(5)`, "compter mots frequence occurrences counter dictionnaire comptage most common");
  F(L, C, "Counter.most_common", "compte.most_common(n)", "Les n éléments les plus fréquents d'un Counter, avec leur effectif.",
    `from collections import Counter
Counter(script['personnage']).most_common(3)`, "plus frequents top mots counter most common");
  F(L, C, "string.punctuation", "string.punctuation", "Tous les signes de ponctuation ; avec str.maketrans pour les remplacer par des espaces.",
    `import string
table = str.maketrans(string.punctuation, ' ' * len(string.punctuation))
script['ligne'].head(3).str.translate(table).str.lower()`, "ponctuation enlever nettoyer texte minuscules punctuation translate maketrans");
  F(L, C, "np.argpartition", "np.argpartition(a, kth)", "Indices des k plus grandes / petites valeurs, sans tout trier (ex. mots aux plus gros coefficients).",
    `top = np.argpartition(scores, -5)[-5:]   # indices des 5 plus grands scores (pas triés entre eux)
scores[top]`, "top k plus grands indices argpartition coefficients mots");
  F(L, C, "nltk.corpus.PlaintextCorpusReader", "PlaintextCorpusReader(dossier, motif_fichiers)", "Lire un dossier de fichiers texte comme un corpus (fileids, raw, words).",
    `from nltk.corpus import PlaintextCorpusReader
corpus = PlaintextCorpusReader('data/livres', r'.*\\.txt')
corpus.fileids(), corpus.words('sport.txt')[:8]`, "corpus livres fichiers texte dossier nltk lire charger fileids words raw");
  F(L, C, "sklearn.utils.shuffle", "shuffle(*arrays, random_state=None)", "Mélanger plusieurs tableaux en gardant les lignes alignées.",
    `from sklearn.utils import shuffle
X_m, y_m = shuffle(X, y, random_state=0)
X_m.head(3)`, "melanger shuffle aleatoire ordre");

  C = "spaCy (pipeline NLP)";
  F(L, C, "spacy.load", "nlp = spacy.load('en_core_web_sm')", "Charger un modèle de langue spaCy ; nlp(texte) renvoie un Doc annoté (tokens, POS, entités…).",
    `import spacy
nlp = spacy.load('en_core_web_sm')
doc = nlp(livre)
len(doc), nlp.pipe_names`, "spacy nlp charger modele pipeline anglais en_core_web_sm traitement langage",
    "À installer une fois : pip install spacy puis python -m spacy download en_core_web_sm. Pour aller plus vite : spacy.load(..., disable=['parser', 'ner']).");
  F(L, C, "doc.sents", "doc.sents", "Découpage en phrases.",
    `import spacy
doc = spacy.load('en_core_web_sm')(livre)
[s.text for s in doc.sents][:3]`, "phrases decouper sentence splitting segmentation sents");
  F(L, C, "token.pos_", "token.text / .pos_ / .tag_ / .lemma_ / .is_stop / .is_punct", "Attributs de chaque token : mot, catégorie grammaticale, lemme, mot vide, ponctuation.",
    `import spacy
doc = spacy.load('en_core_web_sm')('She worked with Charles Babbage on his engine.')
pd.DataFrame([(t.text, t.pos_, t.tag_, t.lemma_, t.is_stop) for t in doc],
             columns=['texte', 'pos', 'tag', 'lemme', 'stop'])`, "tokens tokenisation pos part of speech categorie grammaticale nom verbe lemme lemmatisation stop words",
    "spacy.explain('ADP') explique une étiquette.");
  F(L, C, "token.lemma_", "token.lemma_", "Lemme (forme de base) : 'worked' → 'work', 'was' → 'be'.",
    `import spacy
doc = spacy.load('en_core_web_sm')(livre)
[(t.text, t.lemma_) for t in doc if t.text != t.lemma_][:8]`, "lemme lemmatisation forme de base racine lemma");
  F(L, C, "token.is_stop", "token.is_stop / token.is_punct", "Mot vide (the, a, of…) / ponctuation : pour les retirer avant de compter.",
    `import spacy
from collections import Counter
doc = spacy.load('en_core_web_sm')(livre)
Counter(t.lemma_.lower() for t in doc if not t.is_stop and not t.is_punct).most_common(5)`, "mots vides stop words stopwords retirer enlever ponctuation nettoyer compter");
  F(L, C, "spacy.lang.en.stop_words.STOP_WORDS", "spacy.lang.en.stop_words.STOP_WORDS", "Ensemble des mots vides anglais de spaCy (modifiable).",
    `from spacy.lang.en.stop_words import STOP_WORDS
len(STOP_WORDS), sorted(STOP_WORDS)[:8]`, "stop words mots vides liste anglais");
  F(L, C, "doc.ents", "doc.ents  (ent.text, ent.label_)", "Entités nommées : personnes, lieux, dates, organisations…",
    `import spacy
doc = spacy.load('en_core_web_sm')(livre)
[(e.text, e.label_) for e in doc.ents]`, "entites nommees ner named entity recognition personnes lieux dates organisations");
  F(L, C, "doc.noun_chunks", "doc.noun_chunks", "Groupes nominaux (« the first published algorithm »).",
    `import spacy
doc = spacy.load('en_core_web_sm')(livre)
[c.text for c in doc.noun_chunks][:8]`, "groupes nominaux chunking noun chunks");
  F(L, C, "spacy.explain", "spacy.explain(etiquette)", "Explication en clair d'une étiquette (POS, tag, entité).",
    `import spacy
spacy.explain('ADP'), spacy.explain('NNP'), spacy.explain('GPE')`, "expliquer etiquette pos tag label signification");
  F(L, C, "nlp.pipe", "nlp.pipe(textes, batch_size=1000, n_process=1)", "Traiter beaucoup de textes d'un coup (bien plus rapide qu'une boucle de nlp()).",
    `import spacy
nlp = spacy.load('en_core_web_sm', disable=['parser', 'ner'])
docs = list(nlp.pipe(script['ligne'].head(50)))
[[t.lemma_ for t in d if not t.is_stop and not t.is_punct] for d in docs[:3]]`, "plusieurs textes rapide batch pipe traitement corpus");
  F(L, C, "doc.vector", "doc.vector / token.vector", "Vecteur (embedding) d'un texte ou d'un mot ; doc1.similarity(doc2) compare deux textes.",
    `import spacy
nlp = spacy.load('en_core_web_sm')
nlp('physics theory').similarity(nlp('quantum experiment')), nlp('cat').vector.shape`, "embedding vecteur word vectors similarite representation",
    "en_core_web_sm n'a pas de vrais vecteurs de mots (similarité approximative) ; en_core_web_md / lg en ont.");

  C = "Sentiment (VADER)";
  F(L, C, "vaderSentiment.vaderSentiment.SentimentIntensityAnalyzer", "SentimentIntensityAnalyzer()", "Analyseur de sentiment VADER (règles + lexique), adapté aux textes courts.",
    `from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
analyzer = SentimentIntensityAnalyzer()
analyzer.polarity_scores('This machine is wonderful, I love it!')`, "sentiment analyse polarite positif negatif vader emotion opinion",
    "compound ∈ [−1, 1] : ≥ 0.05 positif, ≤ −0.05 négatif, sinon neutre. neg + neu + pos = 1.");
  F(L, C, "analyzer.polarity_scores", "analyzer.polarity_scores(texte)", "Scores neg / neu / pos / compound d'un texte.",
    `from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
analyzer = SentimentIntensityAnalyzer()
script['sentiment'] = script['ligne'].apply(lambda l: analyzer.polarity_scores(l)['compound'])
script.groupby('personnage')['sentiment'].mean().round(3)`, "sentiment score compound polarite par phrase par personne");

  C = "Thèmes (topic modeling)";
  F(L, C, "gensim.corpora.Dictionary", "Dictionary(documents_tokenises)", "Vocabulaire mot ↔ identifiant pour gensim.",
    `from gensim.corpora import Dictionary
dictionary = Dictionary(corpus_docs)
len(dictionary), list(dictionary.token2id.items())[:5]`, "dictionnaire vocabulaire gensim tokens identifiants topic");
  F(L, C, "dictionary.filter_extremes", "dictionary.filter_extremes(no_below=5, no_above=0.5)", "Retirer les mots trop rares (< no_below docs) ou trop fréquents (> no_above en proportion).",
    `from gensim.corpora import Dictionary
dictionary = Dictionary(corpus_docs)
dictionary.filter_extremes(no_below=3, no_above=0.5)
len(dictionary)`, "filtrer mots rares frequents vocabulaire extremes");
  F(L, C, "dictionary.doc2bow", "dictionary.doc2bow(document_tokenise)", "Sac de mots d'un document : liste de (id_mot, nombre).",
    `from gensim.corpora import Dictionary
dictionary = Dictionary(corpus_docs)
corpus_bow = [dictionary.doc2bow(d) for d in corpus_docs]
corpus_bow[0]`, "sac de mots bag of words bow document vecteur gensim");
  F(L, C, "gensim.models.LdaModel", "LdaModel(corpus, num_topics, id2word, passes=1, random_state=None)", "Topic modeling LDA : trouve num_topics thèmes (distributions de mots).",
    `from gensim.corpora import Dictionary
from gensim.models import LdaModel
dictionary = Dictionary(corpus_docs)
corpus_bow = [dictionary.doc2bow(d) for d in corpus_docs]
lda = LdaModel(corpus_bow, num_topics=3, id2word=dictionary, passes=10, random_state=0)
lda.show_topics(num_words=5)`, "lda topic modeling themes sujets latent dirichlet allocation gensim",
    "LdaMulticore = même chose en parallèle (paramètre workers). Le nombre de thèmes se choisit : essayer plusieurs valeurs et lire les mots de chaque thème.");
  F(L, C, "gensim.models.LdaMulticore", "LdaMulticore(corpus, num_topics, id2word, passes=1, workers=None, random_state=None)", "LDA parallélisé (plusieurs cœurs) ; même utilisation que LdaModel.",
    `from gensim.models import LdaMulticore   # utilisation : comme LdaModel, avec workers=...`, "lda topic modeling parallele multicore");
  F(L, C, "lda.show_topics", "lda.show_topics(num_topics=10, num_words=10) / lda.show_topic(i, topn)", "Mots les plus probables de chaque thème.",
    `from gensim.corpora import Dictionary
from gensim.models import LdaModel
dictionary = Dictionary(corpus_docs)
corpus_bow = [dictionary.doc2bow(d) for d in corpus_docs]
lda = LdaModel(corpus_bow, num_topics=3, id2word=dictionary, passes=10, random_state=0)
lda.show_topic(0, 6)`, "mots du theme topics afficher");
  F(L, C, "gensim.models.phrases.Phrases", "Phrases(documents, min_count=5, threshold=10)", "Détecter les expressions de 2 mots fréquentes (bigrammes, ex. 'new_york').",
    `from gensim.models.phrases import Phrases
bigram = Phrases(corpus_docs, min_count=3, threshold=1)
[w for w in bigram[corpus_docs[0]] if '_' in w]`, "bigrammes expressions phrases ngram deux mots");
  F(L, C, "sklearn.decomposition.LatentDirichletAllocation", "LatentDirichletAllocation(n_components=10, random_state=None)", "LDA version scikit-learn (sur un CountVectorizer).",
    `from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
cv = CountVectorizer()
Xc = cv.fit_transform(df['texte'])
lda_sk = LatentDirichletAllocation(n_components=3, random_state=0).fit(Xc)
mots = cv.get_feature_names_out()
[[mots[i] for i in comp.argsort()[-5:]] for comp in lda_sk.components_]`, "lda topic modeling themes sklearn latent dirichlet");

  C = "Catégories lexicales (Empath)";
  F(L, C, "empath.Empath", "lexicon = Empath()", "Lexique de ~200 catégories (joy, pain, health…) pour mesurer des thèmes dans un texte.",
    `from empath import Empath
lexicon = Empath()
list(lexicon.cats.keys())[:10], lexicon.cats['health'][:8]`, "empath lexique categories emotions themes semantique");
  F(L, C, "lexicon.analyze", "lexicon.analyze(texte, categories=None, normalize=False)", "Compte les mots de chaque catégorie dans un texte (normalize=True : proportion).",
    `from empath import Empath
lexicon = Empath()
lexicon.analyze(livre, categories=['joy', 'pain', 'money', 'science'], normalize=True)`, "empath analyser categories emotions compter normaliser");
  F(L, C, "lexicon.create_category", "lexicon.create_category(nom, mots_graines, model='fiction')", "Créer une catégorie à partir de mots « graines » (model : 'fiction', 'nytimes', 'reddit').",
    `# Nécessite internet (le serveur d'Empath génère la catégorie) :
# lexicon.create_category('healthy_food', ['healthy_food', 'low_carb', 'kale', 'avocado'], model='nytimes')`, "empath creer categorie personnalisee mots graines");

  C = "scikit-learn pour le texte";
  F(L, C, "vectorizer.get_feature_names_out", "vectorizer.get_feature_names_out()", "Les mots correspondant aux colonnes d'un CountVectorizer / TfidfVectorizer.",
    `from sklearn.feature_extraction.text import CountVectorizer
cv = CountVectorizer(stop_words='english')
cv.fit(script['ligne'])
cv.get_feature_names_out()[:10]`, "mots colonnes vocabulaire feature names vectorizer",
    "Les vieux notebooks écrivent get_feature_names() : supprimé depuis scikit-learn 1.2 → utiliser get_feature_names_out().");
  F(L, C, "vectorizer.get_feature_names", "vectorizer.get_feature_names()  (ancien nom)", "Ancien nom de get_feature_names_out (scikit-learn < 1.2).",
    `from sklearn.feature_extraction.text import CountVectorizer
CountVectorizer().fit(['un petit exemple']).get_feature_names_out()   # nom actuel`, "ancien get feature names erreur attributeerror");
  F(L, C, "sklearn.linear_model.LogisticRegressionCV", "LogisticRegressionCV(Cs=10, cv=None, max_iter=100)", "Régression logistique qui choisit elle-même C (régularisation) par validation croisée.",
    `from sklearn.linear_model import LogisticRegressionCV
from sklearn.feature_extraction.text import TfidfVectorizer
Xt = TfidfVectorizer().fit_transform(script['ligne'])
yt = (script['personnage'] == 'Alice').astype(int)
clf_cv = LogisticRegressionCV(Cs=10, cv=5, max_iter=1000).fit(Xt, yt)
clf_cv.C_, clf_cv.score(Xt, yt)`, "regression logistique validation croisee choisir c regularisation automatique",
    "Évaluer ensuite sur un jeu de test à part (score sur le train = trop optimiste).");
  F(L, C, "sklearn.decomposition.TruncatedSVD", "TruncatedSVD(n_components=2, random_state=None)", "Réduction de dimension pour matrices creuses (TF-IDF) : « LSA ».",
    `from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
Xt = TfidfVectorizer().fit_transform(df['texte'])
X2 = TruncatedSVD(n_components=2, random_state=0).fit_transform(Xt)
plt.scatter(X2[:, 0], X2[:, 1], c=df['sujet'].astype('category').cat.codes, s=10)`, "svd lsa reduction dimension tfidf creux sparse visualiser textes");
})();
