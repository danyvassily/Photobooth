# OPENCODE_TASK — Terminer le projet Photobooth V3

Tu es l'ingénieur en charge de **terminer** le projet. Le cahier des charges de référence est
`MISSION_PHOTOBOOTH_V3.md` (à la racine, 23 sections). Lis-le, mais **ne le recopie pas** :
ton travail est de finir et de prouver, pas de documenter.

Projet : `/Users/danyvassily/dev/photobooth` — Next.js 15 App Router + React 19 + TS strict +
Tailwind + crate Rust `photobooth-core` (wasm-bindgen) + MediaPipe (Face Landmarker / Image
Segmenter) + Dexie/IndexedDB + PWA. Repo `github.com/danyvassily/Photobooth`, branche `main`.
Production Vercel : `https://photobooth-lake-omega.vercel.app` (projet `photobooth`,
compte `danyvassily`).

## AUTORISATIONS (accord explicite de Dany, ce jour)

Tu as **toutes les autorisations** pour terminer ce projet de bout en bout :

- lire/écrire tous les fichiers du dépôt `~/dev/photobooth` ;
- installer des dépendances (`pnpm add/remove`, outils npm, binaires brew si nécessaire) ;
- lancer des serveurs locaux, Playwright, tests unitaires et e2e ;
- committer et **pousser directement sur `main`** (pas de PR obligatoire) ;
- utiliser `gh` (déjà authentifié) et `vercel` (déjà authentifié) sans redemander ;
- **déployer en production sur Vercel** et redéployer autant que nécessaire ;
- annuler des déploiements Vercel bloqués (`INITIALIZING`/`QUEUED`) pour débloquer la file.

Seules limites conservées : jamais de `git push --force` ni de réécriture d'historique, aucun
secret/token dans le code ou les commits, aucune suppression de données utilisateur, aucune
modification de la configuration Hermes ou des autres projets, aucun fichier > 10 Mo ajouté au
dépôt.

## État vérifié à l'instant (ne le re-vérifie pas, pars de là)

- `tsc --noEmit` : 0 erreur. `vitest run` : 15/15 tests OK. `pnpm build` : OK.
- Le build était cassé sur Vercel/CI à cause de `scripts/build-wasm.sh` lancé via `sh`
  (`${BASH_SOURCE[0]}` → `Bad substitution`) : **corrigé**, script POSIX, CI GitHub verte.
- `public/wasm/*` (artefact WASM) et `Cargo.lock` sont désormais versionnés → build reproductible
  depuis un clone propre (vérifié).
- MediaPipe chargeait depuis un CDN en 0.10.22 alors que le paquet installé est 0.10.35 → 404 sur
  `vision_wasm_internal.js`, donc AR/segmentation HS. **Corrigé dans le code** :
  - `public/models/face_landmarker.task` + `selfie_segmenter.tflite` vendorisés,
  - runtime wasm copié de `node_modules` vers `public/mediapipe/wasm` par `pnpm build:wasm`
    (`public/mediapipe/` est gitignoré, généré au build),
  - loaders `lib/face-tracking` et `lib/segmentation` : local d'abord, CDN en secours,
  - service worker v2 qui précache les modèles.
  Vérifié en local : `vision_wasm_internal.js/.wasm` + `face_landmarker.task` servis en 200
  depuis l'origine locale, **zéro appel CDN**.
- **Mais ce correctif n'est PAS en production.** Les déploiements Vercel récents sont restés
  bloqués en file (plan Hobby) puis ont été annulés. Le live tourne donc encore sur l'ancienne
  version : `/models/*` et `/mediapipe/wasm/*` y répondent 404.
- `.github/workflows/deploy.yml` existe (déploiement auto via secrets VERCEL_TOKEN /
  VERCEL_ORG_ID / VERCEL_PROJECT_ID) ; son premier run a échoué à cause du blocage de file.
- L'app GitHub de Vercel **n'est pas autorisée** sur ce dépôt, donc les déploiements pilotés par
  Git ne se déclenchent pas. C'est pourquoi le workflow Actions existe. Ne tente pas d'installer
  l'app GitHub (impossible sans le navigateur de Dany).

## Ce que tu dois faire, dans cet ordre

1. **Débloquer et réussir UN déploiement de production**, proprement :
   - diagnostique le run en échec (`gh run view <id> --log-failed`),
   - vérifie qu'il n'y a pas de déploiement Vercel bloqué en `INITIALIZING`/`QUEUED` avant de
     relancer (`vercel ls photobooth`), annule-les si besoin,
   - **une seule** tentative à la fois, pas de rafale : `vercel deploy --prod --yes` depuis un
     clone propre de `main`, ou relance du workflow Actions.
   - Preuve attendue : statut `READY`, puis `curl` sur `https://photobooth-lake-omega.vercel.app`
     pour `/`, `/manifest.json`, `/sw.js`, `/wasm/photobooth_core_bg.wasm`,
     `/models/face_landmarker.task`, `/models/selfie_segmenter.tflite`,
     `/mediapipe/wasm/vision_wasm_internal.js` → tous **200**.

2. **Vérifier pour de vrai que l'application fonctionne** (pas de déclaration sans preuve) :
   - `pnpm build` puis `next start` sur un port libre, et Playwright (`pnpm test:e2e`) contre
     le serveur local et/ou l'URL de prod,
   - vérifier : les **12 thèmes** s'affichent et se sélectionnent ; les **6 formats** de tirage ;
     l'éditeur (filtres, réglages) ; l'export JPEG (`photobooth-YYYY-MM-DD-HHMMSS.jpg`,
     Blob valide, JPEG décodable) ; la galerie IndexedDB (ajout/lecture/suppression) ;
     le mode kiosque iPad ; le PWA (manifest + service worker enregistré) ; le fallback
     JS/Canvas quand le WASM n'est pas dispo ; le chargement AR + segmentation local.
   - Si un test de la section 20 du cahier des charges manque, **écris-le** (Vitest pour l'unitaire,
     Playwright pour l'e2e) plutôt que de contourner.

3. **Combler les écarts** que la vérification révèle par rapport au cahier des charges. Priorité :
   a) ce qui est cassé ou absent côté fonctionnel (thèmes/formats/accessoires/export/galerie),
   b) les **10 accessoires AR** exigés (aviateur, Wayfarer, rondes, futuristes, cœur, cowboy,
      fête, couronne, moustache, oreilles de chat) — vérifie qu'ils existent tous et se rendent,
   c) l'export à partir des originaux (non destructif), le rendu fidèle à la prévisualisation.

4. **Documenter les limites réelles** (ce qui ne peut pas être vérifié sans appareil physique :
   iPhone/iPad, caméra réelle, plein écran iOS). Ne prétends jamais avoir testé un iPhone si tu
   n'en as pas.

5. **Rapport final court** : ce qui a été corrigé, les preuves (commandes + résultats), l'URL de
   prod et les codes HTTP obtenus, les tests ajoutés, et la liste honnête des limites restantes.

## Règles absolues

- **Aucune preuve fabriquée.** Si une commande échoue, dis-le et propose la suite ; ne déclare
  jamais un test, une URL ou un benchmark sans sortie réelle.
- Commits petits et explicites sur `main` (Dany a autorisé le déploiement). Jamais de
  `git push --force`, jamais de réécriture d'historique.
- Pas de secret, token ou clé dans le code ou les commits. L'authentification Vercel/GitHub passe
  par la session locale déjà configurée.
- Ne touche pas à la configuration Hermes, aux modèles, ni aux autres projets.
- N'ajoute aucun fichier de plus de 10 Mo au dépôt ; les assets générés vont dans un dossier
  gitignoré.
- Ne supprime aucune donnée utilisateur. Pas d'action irréversible.
- Si tu es bloqué par une décision produit ambiguë, choisis l'option la plus conforme au cahier
  des charges et **note-le dans le rapport** au lieu de t'arrêter.
