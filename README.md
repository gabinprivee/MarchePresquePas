# Labo d'évolution — premiers pas

Un corps articulé complet (bassin, ventre, torse, tête, 2 bras, 2 jambes —
13 articulations motorisées par un petit réseau de neurones) apprend, par
sélection génétique, à aller d'un point A à un point B sans que son torse
touche le sol. L'objectif est fixe, codé une fois pour toutes dans
`train.js` — il n'y a rien à configurer, rien à régler : le dépôt une fois
en place, tout tourne en autonomie. L'entraînement tourne automatiquement
sur GitHub Actions, 100% gratuit. La page montre le meneur actuel en vue
3ᵉ personne, comme dans les vidéos d'IA qui apprennent à marcher.

## Mise en place (nouveau dépôt, une seule fois)

1. Crée un nouveau dépôt **public** sur GitHub (nécessaire pour que les
   minutes GitHub Actions restent gratuites et illimitées).
2. Mets tous les fichiers de ce dossier à la racine du dépôt, **y compris
   le dossier caché `.github/`**.
3. **Settings → Pages** : Source = *Deploy from a branch*, branche `main`,
   dossier `/ (root)` → **Save**. Tu obtiens une adresse du type
   `https://tonpseudo.github.io/nom-du-depot/`.
4. **Settings → Actions → General → Workflow permissions** : coche
   **"Read and write permissions"** → **Save**.
5. Onglet **Actions** → "Entraînement de l'IA" → **Run workflow** pour
   lancer le tout premier entraînement immédiatement (sinon il faut
   attendre jusqu'à 20 minutes).

C'est tout — il n'y a pas d'étape 6. Aucun compte à connecter, aucun
réglage à faire sur le site : une fois lancé, ça progresse tout seul.

## Comment ça marche

- `train.js` fait tourner 6 générations à chaque exécution (aucun
  affichage, juste du calcul physique — quelques secondes).
- `.github/workflows/train.yml` déclenche `train.js` toutes les
  ~20 minutes et commite `state.json` avec la nouvelle progression.
- `index.html` affiche le meneur actuel de la population en vue 3ᵉ
  personne (les autres restent visibles mais transparents), avec une
  caméra que tu peux faire tourner (glisser) et zoomer (molette).
- Chaque génération est sauvegardée dans l'historique — rien n'est perdu,
  et n'importe quelle génération passée peut être rejouée à l'identique
  (c'est déterministe : pas besoin de vidéo enregistrée).
- Les "grands moments" (il rampe, il tient debout, premiers pas, arrivée)
  sont détectés automatiquement et rejouables en un clic.
- Si un bonhomme s'effondre complètement (torse ET tête au sol), il
  réapparaît automatiquement au point de départ.

## Limites à connaître

- Ce n'est pas un serveur qui tourne "en direct" à chaque seconde : c'est
  un entraînement par sessions courtes toutes les ~20 minutes. GitHub ne
  garantit pas l'exactitude de l'horaire à la minute près.
- L'historique grossit avec le temps (environ 1 à 2 Ko par génération) ;
  sur plusieurs mois d'usage quotidien ça reste largement gérable.
