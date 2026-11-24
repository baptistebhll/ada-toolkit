# Données d'exemple (fictives) utilisées par tous les exemples du site.
# Chaque exemple est exécuté APRÈS ce code : df, X, y, res, G... existent déjà.
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import statsmodels.formula.api as smf
import statsmodels.api as sm
import networkx as nx
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.metrics import roc_curve, roc_auc_score, classification_report

rng = np.random.default_rng(42)
np.random.seed(42)
n = 200

# ---------------------------------------------------------------- df : 200 personnes fictives
df = pd.DataFrame({
    'nom': [f'p{i}' for i in range(n)],
    'age': rng.integers(18, 80, n),
    'sexe': rng.choice(['F', 'M'], n),
    'pays': rng.choice(['CH', 'FR', 'DE', 'IT'], n, p=[.4, .3, .2, .1]),
    'groupe': rng.choice(['A', 'B'], n),
    'taille': rng.normal(1.72, 0.09, n).round(2),
    'tshirt': rng.choice(['S', 'M', 'L'], n),
    'date': pd.Timestamp('2021-01-01') + pd.to_timedelta(rng.integers(0, 4 * 365, n), unit='D'),
})
df = df.sort_values('date').reset_index(drop=True)
df['annee'] = df['date'].dt.year
df['timestamp'] = df['date'].astype('int64') // 10**9
df['poids'] = (22 * df['taille'] ** 2 + rng.normal(0, 8, n)).round(1)
df['revenu'] = np.exp(10.4 + 0.012 * df['age'] + 0.15 * (df['pays'] == 'CH') + rng.normal(0, 0.5, n)).round(-2)
df['score'] = (50 + 8 * (df['groupe'] == 'B') + rng.normal(0, 10, n)).round(1)
df['achat'] = rng.binomial(1, 1 / (1 + np.exp(-(-4 + 0.05 * df['age'] + 0.3 * df['revenu'] / 50000))))
df['ventes'] = rng.poisson(20 + 5 * np.sin(np.arange(n) / 15))
df['a'] = rng.normal(0, 1, n).round(3)
df['b'] = (0.7 * df['a'] + rng.normal(0, 0.7, n)).round(3)
df['c'] = rng.normal(0, 1, n).round(3)
df['x'] = rng.normal(5, 2, n).round(2)
df['y'] = (2 * df['x'] + rng.normal(0, 2, n)).round(2)
df['degre'] = np.minimum(rng.zipf(2.1, n), 500)                    # distribution à queue lourde
df['n_visites'] = rng.poisson(np.exp(0.3 + 0.015 * df['age']))
df['categorie'] = rng.choice(['livres', 'jeux', 'musique'], n)
df['id'] = np.r_[np.arange(n - 5), np.arange(5)]                    # 5 identifiants en double
df['col_inutile'] = 0
df['url'] = 'https://' + rng.choice(['epfl.ch', 'ethz.ch', 'unil.ch'], n) + '/page'
# régression : prix d'un logement
df['quartier'] = rng.choice(['centre', 'nord', 'sud'], n)
df['surface'] = rng.integers(25, 150, n)
df['prix'] = (4000 * df['surface'] + 80000 * (df['quartier'] == 'centre') - 1500 * df['age']
              + rng.normal(0, 40000, n)).round(-3)
df['fumeur'] = rng.binomial(1, 0.3, n)
df['deces'] = rng.binomial(1, 1 / (1 + np.exp(-(-5 + 0.06 * df['age'] + 1.0 * df['fumeur']))))
# tableau croisé / χ² : essai clinique
df['traitement'] = rng.choice(['placebo', 'medicament'], n)
df['guerison'] = rng.binomial(1, np.where(df['traitement'] == 'medicament', 0.65, 0.45))
# causalité : programme de formation (avec confondants)
df['educ'] = rng.integers(8, 17, n)
df['revenu_avant'] = (rng.normal(15000, 5000, n) + 600 * df['educ']).round(-2).clip(0)
df['origine'] = rng.choice(['nord', 'sud', 'est'], n)
df['marie'] = rng.binomial(1, 0.4, n)
p_traite = 1 / (1 + np.exp(-(2 - 0.15 * df['educ'] - df['revenu_avant'] / 15000 + 0.5 * (df['origine'] == 'sud'))))
df['traite'] = rng.binomial(1, p_traite)
df['resultat'] = (0.6 * df['revenu_avant'] + 400 * df['educ'] + 1500 * df['traite'] + rng.normal(0, 3000, n)).round(-1)
# texte : 3 sujets
mots = {'sport': 'match equipe but football joueur victoire saison entraineur stade',
        'tech': 'data python modele algorithme ordinateur logiciel donnees reseau',
        'sante': 'covid patient hopital vaccin medecin traitement maladie sante'}
df['sujet'] = rng.choice(list(mots), n)
df['texte'] = [' '.join(rng.choice(mots[s].split(), 8)) for s in df['sujet']]
df['titre'] = [f'  {s.title()} : ' + ' '.join(rng.choice(mots[s].split(), 3)) for s in df['sujet']]
df['tags'] = [','.join(rng.choice(['ml', 'stats', 'viz', 'web'], 2, replace=False)) for _ in range(n)]
df['label'] = df['sujet']
df['cible'] = df['achat']
features = ['age', 'revenu', 'score', 'pays', 'sexe']

# ---------------------------------------------------------------- petits objets prêts à l'emploi
s = df['revenu']
x = df['taille'].to_numpy()
a = rng.normal(10, 2, 100)
b = rng.normal(11, 2, 100)
groupe_a = df.loc[df['groupe'] == 'A', 'score']
groupe_b = df.loc[df['groupe'] == 'B', 'score']
avant = rng.normal(70, 8, 50).round(1)
apres = (avant - rng.normal(2, 3, 50)).round(1)
moyennes_boot = np.array([rng.choice(s, len(s)).mean() for _ in range(1000)])
scores = df['score'].to_numpy()
textes = df['texte'].head(20).tolist()
pvals = [0.001, 0.01, 0.03, 0.04, 0.2]
table = pd.crosstab(df['traitement'], df['guerison'])
seuil = 30
liste_de_dicts = [{'nom': 'Ana', 'age': 31}, {'nom': 'Bo', 'age': 25}]
clients = pd.DataFrame({'client_id': [1, 2, 3, 4], 'nom': ['Ana', 'Bo', 'Cy', 'Dan']})
achats = pd.DataFrame({'client_id': [1, 1, 2, 4, 5], 'montant': [20, 35, 12, 50, 8]})
df2019 = pd.DataFrame({'pays': ['CH', 'FR'], 'pib': [700, 2600]})
df2020 = pd.DataFrame({'pays': ['CH', 'FR'], 'pib': [690, 2500]})
large = pd.DataFrame({'pays': ['CH', 'FR', 'DE'], '2020': [690, 2500, 3800], '2021': [740, 2650, 4100]}).set_index('pays')
long = large.reset_index().melt(id_vars='pays', var_name='annee', value_name='pib')
# moyenne + IC 95 % (bootstrap) du revenu par pays
groupes = sorted(df['pays'].unique())
moyennes = np.array([df.loc[df['pays'] == p, 'revenu'].mean() for p in groupes])
_boot = [[rng.choice(df.loc[df['pays'] == p, 'revenu'], 50).mean() for _ in range(300)] for p in groupes]
bas, haut = np.percentile(_boot, 2.5, axis=1), np.percentile(_boot, 97.5, axis=1)
# CCDF des degrés
degres = np.sort(df['degre'].to_numpy())
ccdf = 1 - np.arange(len(degres)) / len(degres)

# ---------------------------------------------------------------- modèles déjà entraînés
mod = smf.ols('prix ~ surface + age + C(quartier)', data=df)
res = mod.fit()
X = df[['age', 'revenu', 'score']]
y = df['achat']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0, stratify=y)
scaler = StandardScaler().fit(X_train)
X_train_s, X_test_s = scaler.transform(X_train), scaler.transform(X_test)
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_train, y_train)
clf = LogisticRegression(max_iter=1000).fit(X_train, y_train)
y_pred = model.predict(X_test)
proba = model.predict_proba(X_test)[:, 1]
fpr, tpr, _ = roc_curve(y_test, proba)
lr = LinearRegression().fit(X_train, y_train)
rf = RandomForestClassifier(n_estimators=100, random_state=0).fit(X_train, y_train)
X_s = StandardScaler().fit_transform(X)
km = KMeans(n_clusters=4, n_init=10, random_state=0).fit(X_s)
labels = km.labels_

# ---------------------------------------------------------------- texte : un script de série fictif
# Même format que l'exercice « Handling text 2 » : '>>' = nouvel épisode, '>' = nouvelle scène, 'Nom: réplique'.
common = 'i you we the a is are was to of and it that this what so well really just think know'.split()
vocab = {'Alice': 'physics theory quantum obviously fascinating hypothesis experiment universe equation'.split(),
         'Bob': 'work office meeting boss coffee deadline project report tired'.split(),
         'Chloe': 'restaurant shift customers acting audition rent wine friends party'.split(),
         'David': 'engineer space mother rocket design prototype mars launch'.split(),
         'Emma': 'biology cells lab microscope research science mice samples'.split()}
positifs, negatifs = 'great wonderful love happy amazing'.split(), 'terrible awful hate sad horrible'.split()


def replique(perso):
    autre = vocab[rng.choice(list(vocab))]                     # un mot « emprunté » à quelqu'un d'autre
    mots = list(rng.choice(common, 4)) + list(rng.choice(vocab.get(perso, common), 2)) + [rng.choice(autre)]
    if rng.random() < 0.4:
        mots.append(rng.choice(positifs if rng.random() < 0.5 else negatifs))
    rng.shuffle(mots)
    return ' '.join(mots).capitalize() + rng.choice(['.', '!', '?', ', right?'])


lignes = []
for saison in range(1, 5):
    for ep in range(1, 4):
        lignes.append(f'>> Season {saison} Episode {ep}')
        for sc in ['Living room', 'Office']:
            lignes.append(f'> Scene: {sc}')
            for _ in range(8):
                p = rng.choice(list(vocab), p=[.35, .2, .2, .15, .1])
                lignes.append(f'{p}: {replique(p)}')
            if rng.random() < 0.3:
                lignes.append('All: Cheers!')                      # réplique à plusieurs : à écarter
        if ep == 2:
            lignes.append(f'Waiter{saison}: Here is your order.')   # personnage d'un seul épisode
script_brut = '\n'.join(lignes)

rows, episode, scene = [], None, None
for l in script_brut.splitlines():
    if l.startswith('>>'):
        episode = l[2:].strip()
    elif l.startswith('>'):
        scene = l[1:].strip()
    elif ':' in l:
        perso, ligne = l.split(':', 1)
        rows.append({'episode': episode, 'scene': scene, 'personnage': perso.strip(), 'ligne': ligne.strip()})
script = pd.DataFrame(rows)
script['saison'] = script['episode'].str.extract(r'Season (\d+)', expand=False).astype(int)

# un court texte en prose (anglais, pour spaCy / VADER / Empath)
livre = ("Ada Lovelace wrote the first published algorithm in London in 1843. "
         "She worked with Charles Babbage on his Analytical Engine, a wonderful machine that was never finished. "
         "Many people thought the idea was absurd and the project was a terrible waste of money. "
         "Today, students at EPFL in Lausanne learn about her work and love her bold vision. "
         "The old engine was cold and silent, but her notes were full of hope and joy. "
         "Sadly, she died young, and her pain and illness marked her last years.")
corpus_docs = df['texte'].str.split().tolist()   # 200 petits documents (3 sujets : sport, tech, santé)

# ---------------------------------------------------------------- graphe (20 nœuds 'a'...'t')
G = nx.connected_watts_strogatz_graph(20, 4, 0.3, seed=0)
G = nx.relabel_nodes(G, dict(enumerate('abcdefghijklmnopqrst')))
for u, v in G.edges:
    G[u][v]['weight'] = round(float(rng.uniform(0.1, 1)), 2)
aretes = nx.to_pandas_edgelist(G).rename(columns={'source': 'from', 'target': 'to'})
