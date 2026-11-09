# ADA toolkit — antisèche d'analyse de données pour l'examen

Site 100 % local, **sans IA** : recettes d'analyse, référence des librairies, exemples tirés des
notebooks du cours, lecteur de notebooks, et recherche par mot-clé ou par phrase.

## Utilisation

1. (Re)construire l'index des notebooks après en avoir ajouté / modifié :
   ```
   python build_index.py
   ```
2. Ouvrir `index.html` (double-clic) dans Chrome / Edge / Firefox. Pas besoin d'internet ni de serveur.

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
| `search.js` | Moteur de recherche + dictionnaire de synonymes (`SYN_GROUPS`) |
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
