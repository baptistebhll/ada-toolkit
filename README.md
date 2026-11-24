# ADA toolkit — antisèche d'analyse de données pour l'examen

Site 100 % local, **sans IA** : recettes d'analyse, référence des librairies, exemples tirés des
notebooks du cours, lecteur de notebooks, et recherche par mot-clé ou par phrase.

## Utilisation

1. (Re)construire l'index des notebooks après en avoir ajouté / modifié :
   ```
   python build_index.py
   ```
2. (Re)générer les résultats des exemples après avoir modifié des fiches ou des recettes
   (environnement `.venv` à la racine d'`ADA 2026` : pandas, seaborn, statsmodels, scikit-learn, networkx).
   Depuis le dossier `exam-tool`, dans Git Bash :
   ```
   ../.venv/Scripts/python.exe run_examples.py
   ```
   (L'ancien env conda `ada` a un numpy cassé — MKL — qui fait planter les graphiques : ne plus l'utiliser.)
   Pour les exemples « Texte (NLP) », le `.venv` contient aussi spaCy, VADER, gensim, nltk et Empath :
   `../.venv/Scripts/python.exe -m pip install spacy vaderSentiment gensim nltk empath`
   puis `../.venv/Scripts/python.exe -m spacy download en_core_web_sm`.
   Chaque exemple est exécuté sur les données fictives de `donnees_exemple.py` ; ses vraies sorties
   (valeurs, tableaux, graphiques) vont dans `examples.js` et `img/ex/`. Le script liste les exemples en erreur.
3. (Re)générer la liste complète des paramètres de chaque fiche (lue dans la doc officielle des librairies
   installées : types, valeurs possibles, défauts) :
   ```
   ../.venv/Scripts/python.exe extract_params.py
   ```
4. Avant de publier : `python bump_version.py` (ajoute `?v=…` aux fichiers pour éviter les vieux caches).
5. Ouvrir `index.html` (double-clic) dans Chrome / Edge / Firefox. Pas besoin d'internet ni de serveur.

Raccourcis : `/` ou `Ctrl+K` pour chercher, `↑` `↓` pour choisir un résultat, `Entrée` pour l'ouvrir, `Échap` pour effacer.

## Ce qu'il y a dedans

- **Recettes** (`kb_recipes.js`) : ~55 « comment faire » rangés dans l'ordre d'une analyse
  (charger → nettoyer → combiner → visualiser → tester → régression → causalité → ML → clustering → texte → réseaux),
  chacune avec le code, les pièges, et les exemples correspondants de tes notebooks.
- **Librairies** (`kb_functions.js`) : ~220 fiches (pandas, numpy, matplotlib, seaborn, scipy, statsmodels,
  scikit-learn, networkx) avec signature, exemple général, piège, lien vers la doc, et tes exemples.
- **Notebooks** : tous les cours / solutions / exos lisibles en entier, avec sommaire.
- **Recherche** (`search.js`) : classement BM25, synonymes FR↔EN, pluriels, fautes de frappe,
  mots composés (p-value, t-test, k-means…). Aucune IA : uniquement de la correspondance de texte.

## Fichiers

| Fichier | Rôle |
|---|---|
| `build_index.py` | Lit les `.ipynb` → `data.js` + `img/` (généré, ne pas modifier à la main) |
| `kb_functions.js` | Fiches de fonctions — **à enrichir toi-même** |
| `kb_recipes.js` | Recettes — **à enrichir toi-même** |
| `kb_interpret.js` | Guide d'interprétation (comment lire un résultat, phrase type, pièges) ; son code est exécuté par `run_examples.py` |
| `search.js` | Moteur de recherche + dictionnaire de synonymes (`SYN_GROUPS`) |
| `donnees_exemple.py`, `run_examples.py` | Données fictives + exécution des exemples → `examples.js`, `img/ex/` |
| `extract_params.py` | Tous les paramètres de chaque fonction (doc officielle) → `params.js` |
| `app.js`, `style.css`, `index.html` | Interface |

## Ajouter du contenu

Fonction (dans `kb_functions.js`) :
```js
F("pandas", "Nettoyer", "df.dropna", "df.dropna(subset=None)", "Description courte.",
  `code d'exemple`, "mots cles francais english", "piège à retenir");
```

Recette (dans `kb_recipes.js`) :
```js
R("2 · Nettoyer & préparer", "mon-id", "Titre", "Intro.", "mots cles",
  [["Texte de l'étape.", `code`]], ["À retenir 1"], ["df.dropna", "pd.merge"]);
```

Synonyme (dans `search.js`, `SYN_GROUPS`) : ajoute une ligne de mots équivalents.
