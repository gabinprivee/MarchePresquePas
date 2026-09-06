<<<<<<< HEAD
# Labo d'évolution — IA qui apprend à se déplacer

Un corps articulé complet (bassin, ventre, torse, tête, 2 bras, 2 jambes —
13 articulations motorisées par un petit réseau de neurones) apprend, par
sélection génétique, à accomplir une tâche que tu choisis : marcher, courir,
ramper, sauter ou s'accroupir. L'entraînement tourne automatiquement sur
GitHub Actions, 100% gratuit. La page affiche la progression et permet de
rejouer n'importe quelle génération passée.

## Mise en place (une seule fois)

1. Crée un dépôt **public** sur GitHub.
2. Mets tous les fichiers de ce dossier à la racine (y compris le dossier
   caché `.github/`).
=======
# Labo d'évolution — premiers pas

Un corps articulé complet (bassin, ventre, torse, tête, 2 bras, 2 jambes —
13 articulations motorisées par un petit réseau de neurones) apprend, par
sélection génétique, à aller d'un point A à un point B sans que la partie
du corps choisie touche le sol. L'entraînement tourne automatiquement sur
GitHub Actions, 100% gratuit. La page montre le meneur actuel en vue 3ᵉ
personne, comme dans les vidéos d'IA qui apprennent à marcher.

## Mise en place (nouveau dépôt, une seule fois)

1. Crée un nouveau dépôt **public** sur GitHub (nécessaire pour que les
   minutes GitHub Actions restent gratuites et illimitées).
2. Mets tous les fichiers de ce dossier à la racine du dépôt, **y compris
   le dossier caché `.github/`**.
>>>>>>> 949b17b (premier envoie)
3. **Settings → Pages** : Source = *Deploy from a branch*, branche `main`,
   dossier `/ (root)` → **Save**. Tu obtiens une adresse du type
   `https://tonpseudo.github.io/nom-du-depot/`.
4. **Settings → Actions → General → Workflow permissions** : coche
   **"Read and write permissions"** → **Save**.
5. Onglet **Actions** → "Entraînement de l'IA" → **Run workflow** pour
<<<<<<< HEAD
   lancer le tout premier entraînement immédiatement.

## Choisir et ajuster l'objectif — directement sur le site

Les 5 comportements (marcher, courir, ramper, sauter, s'accroupir)
s'entraînent **tout seuls, en parallèle, à chaque cycle** — aucun n'est
"choisi" par toi. Le menu déroulant en haut de la page ne fait que changer
lequel tu regardes.

Le panneau **"Objectif de la tâche sélectionnée"** permet d'ajuster
l'objectif chiffré de la tâche affichée (distance à parcourir, hauteur
visée, partie du corps qui ne doit jamais toucher le sol). Le bouton
**"Enregistrer sur GitHub"** met à jour `rule.json` pour cette tâche
précise, sans toucher aux 4 autres.

Pour que ça marche, il faut connecter le site à ton dépôt une seule fois
(dans la section dépliable "Connexion GitHub" du même panneau) :

1. GitHub → ta photo de profil → **Settings** → **Developer settings**
   → **Personal access tokens** → **Fine-grained tokens** →
   **Generate new token**.
2. **Repository access** → *Only select repositories* → choisis ce dépôt.
3. **Permissions → Repository permissions → Contents** → *Read and write*.
4. Génère, copie le token, colle-le dans le panneau du site avec le nom du
   dépôt (`tonpseudo/nom-du-depot`) → **Mémoriser**.
=======
   lancer le tout premier entraînement immédiatement (sinon il faut
   attendre jusqu'à 20 minutes).

## Changer l'objectif — directement sur le site

Le panneau **"Objectif"** en bas de page permet d'ajuster la partie du
corps interdite au sol et la distance à parcourir. Le bouton
**"Enregistrer sur GitHub"** écrit `rule.json` dans le dépôt directement
depuis le navigateur.

Pour que ça marche, connecte le site à ton dépôt une seule fois (section
dépliable "Connexion GitHub") :

1. GitHub → photo de profil → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** →
   **Generate new token**.
2. **Repository access** → *Only select repositories* → choisis ce dépôt.
3. **Permissions → Repository permissions → Contents** → *Read and write*.
4. Génère, copie le token, colle-le sur le site avec le nom du dépôt
   (`tonpseudo/nom-du-depot`) → **Mémoriser**.
>>>>>>> 949b17b (premier envoie)

Ce token n'est stocké que dans le navigateur utilisé (`localStorage`) et
n'est envoyé qu'à l'API GitHub — jamais ailleurs.

## Comment ça marche

<<<<<<< HEAD
- `train.js` fait avancer **les 5 comportements automatiquement**, à
  chaque déclenchement (2 générations chacun, ~10 générations au total par
  cycle) — aucune sélection manuelle n'est nécessaire.
- Chaque comportement garde **sa propre progression indépendante**
  (génération, historique, records) dans `state.json`.
- `.github/workflows/train.yml` déclenche `train.js` toutes les
  ~20 minutes et commite `state.json` avec la nouvelle progression.
- `index.html` lit `state.json`, affiche une grille avec une box par IA de
  la population actuelle du comportement sélectionné (déplacement libre à
  la souris/WASD), et peut rejouer n'importe quelle génération passée à
  l'identique — c'est déterministe, donc pas besoin de vidéo enregistrée.
=======
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
>>>>>>> 949b17b (premier envoie)
- Si un bonhomme s'effondre complètement (torse ET tête au sol), il
  réapparaît automatiquement au point de départ.

## Limites à connaître

- Ce n'est pas un serveur qui tourne "en direct" à chaque seconde : c'est
  un entraînement par sessions courtes toutes les ~20 minutes. GitHub ne
  garantit pas l'exactitude de l'horaire à la minute près.
<<<<<<< HEAD
- L'historique de chaque tâche grossit avec le temps (quelques Ko par
  génération) ; sur plusieurs mois d'usage quotidien ça reste gérable.
=======
- L'historique grossit avec le temps (environ 1 à 2 Ko par génération) ;
  sur plusieurs mois d'usage quotidien ça reste largement gérable.
>>>>>>> 949b17b (premier envoie)
