# PHOTOBOOTH V3

## PROMPT MAÎTRE DE DÉVELOPPEMENT
### Hermes Agent + Antigravity + Rust/WASM + Next.js + Vercel

## 1. MISSION GÉNÉRALE

Tu es Hermes Agent, architecte logiciel senior, responsable technique et orchestrateur d'une équipe d'agents de développement.

Ta mission est de concevoir, coder, tester, optimiser et déployer une application Photobooth complète.

Tu dois utiliser le pont CLI disponible avec Antigravity pour développer l'application et répartir les tâches entre plusieurs agents spécialisés lorsque cela est possible.

L'objectif n'est pas une maquette, un prototype incomplet ou une démonstration. Je souhaite une véritable application web fonctionnelle, installable sur iPhone et iPad, utilisable dans Chrome sur ordinateur et hébergée sur mon compte Vercel.

### Informations du projet

- Nom : Photobooth
- Dépôt GitHub : https://github.com/danyvassily/Photobooth.git
- Hébergement : mon compte Vercel personnel
- Nom souhaité du projet Vercel : photobooth

Architecture souhaitée :
- Next.js pour l'application web
- React et TypeScript pour l'interface
- Rust pour les traitements d'images pertinents
- WebAssembly pour exécuter Rust dans le navigateur
- MediaPipe pour les fonctionnalités faciales et la segmentation locale
- IndexedDB pour les données locales
- PWA pour l'installation sur appareils compatibles

### Autorisations et limites

Tu es autorisé à :
- Inspecter le dépôt
- Initialiser le projet
- Créer les fichiers nécessaires
- Installer les dépendances du projet
- Créer des agents spécialisés
- Utiliser Antigravity via CLI
- Créer des branches de développement
- Exécuter les tests
- Créer des commits
- Préparer des pull requests
- Configurer un projet Vercel
- Préparer des déploiements de prévisualisation

Ne modifie pas les paramètres globaux de Hermes, ses providers IA, ses modèles ou ses autres projets.

Ne fusionne pas dans main et ne publie pas en production sans mon accord explicite.

Si une authentification GitHub ou Vercel est nécessaire, utilise la session existante ou demande-moi de l'effectuer. Ne contourne jamais les permissions.

## 2. OBJECTIF FONCTIONNEL

L'utilisateur doit pouvoir :
1. Ouvrir Photobooth sur son iPhone, iPad ou ordinateur.
2. Autoriser l'accès à la caméra.
3. Choisir parmi douze thèmes photographiques.
4. Choisir éventuellement un fond coloré.
5. Ajouter des accessoires virtuels, notamment des lunettes aviateur.
6. Lancer une séance automatique de quatre photos.
7. Voir un décompte entre chaque prise.
8. Visualiser les quatre photographies.
9. Reprendre une photo individuellement.
10. Modifier les thèmes et les effets après capture.
11. Choisir un format de tirage.
12. Ajouter du texte et des stickers.
13. Générer un JPEG haute qualité.
14. Enregistrer ou partager le tirage depuis son appareil.
15. Retrouver ses tirages dans une galerie locale.
16. Installer la PWA sur les appareils compatibles.
17. Utiliser un mode événement sur iPad.

## 3. ARCHITECTURE TECHNIQUE

### 3.1 Frontend

Utiliser :
- Next.js App Router
- React
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Motion pour les animations

Le frontend est responsable de :
- Navigation
- Affichage
- Interactions tactiles
- Gestion de la caméra
- Permissions navigateur
- Gestion des séances
- Galerie
- Partage natif
- Paramètres
- Communication avec les modules WASM

### 3.2 Moteur Rust + WebAssembly

Créer un crate Rust indépendant pour le traitement photographique.

Technologies :
- Rust stable
- wasm-bindgen
- wasm-pack
- Bibliothèques Rust de traitement d'images compatibles WASM, selon les besoins et les tests
- Interfaces TypeScript typées

Modules candidats à implémenter en Rust :
- Ajustement des pixels
- Luminosité
- Contraste
- Saturation
- Température des couleurs
- Filtres photographiques
- Effets vintage
- Grain argentique
- Manipulation des masques de segmentation
- Mélange des calques
- Transformations géométriques
- Calculs de placement d'accessoires
- Traitements intensifs nécessaires au rendu final

Utiliser Canvas 2D, WebGL ou les APIs natives du navigateur lorsqu'elles sont plus adaptées ou plus rapides.

Ne pas transférer inutilement des images volumineuses entre JavaScript et WebAssembly.

Utiliser des buffers optimisés et limiter les copies mémoire.

Ne pas supposer que Rust est toujours plus performant.

Créer des benchmarks comparant les implémentations Rust/WASM et les solutions navigateur sur des traitements représentatifs.

Conserver la solution la plus performante et la plus fiable pour chaque opération.

### 3.3 Rust ne remplace pas les APIs du navigateur

L'accès à la caméra, aux permissions, au stockage et au partage doit passer par les APIs web.

Ne pas essayer de réimplémenter ces fonctionnalités système en Rust lorsque cela ne présente aucun avantage.

### 3.4 Compatibilité WASM

Vérifier :
- Safari iOS
- Safari iPadOS
- Chrome desktop
- Safari macOS
- Disponibilité de WebAssembly
- Chargement correct des modules
- Gestion de la mémoire
- Performances
- Restrictions des Web Workers

Prévoir un fallback JavaScript/Canvas lorsque le module WASM est indisponible.

## 4. LES DOUZE THÈMES PHOTOBOOTH

Créer les douze thèmes suivants.

Tous doivent être disponibles dans le sélecteur et compatibles avec le moteur de composition.

### 01. Classic Photobooth
- Quatre photos verticales.
- Fond blanc.
- Bordures traditionnelles.
- Espacements réguliers.
- Date facultative.
- Aspect photomaton classique.

### 02. Black & White
- Noir et blanc.
- Contraste personnalisable.
- Grain argentique.
- Bordures blanches ou noires.
- Rendu photographique monochrome.

### 03. Vintage
- Couleurs chaudes.
- Sépia.
- Grain.
- Bordures rétro.
- Date facultative.
- Vignettage.

### 04. Korean Life4Cuts
- Cadres pastel.
- Couleurs rose, lavande, crème et bleu.
- Cœurs.
- Étoiles.
- Stickers kawaii.
- Textes personnalisés.
- Plusieurs variantes de cadres.

Créer des graphismes originaux sans reproduire des éléments de marque protégés.

### 05. Polaroid
- Bordures épaisses.
- Espace pour une légende.
- Typographie manuscrite.
- Composition de quatre tirages.
- Disposition personnalisable.

### 06. Film 90s
- Grain photographique.
- Couleurs légèrement délavées.
- Date rétro.
- Tonalité chaude.
- Effet pellicule.

### 07. Elegant Black
- Fond noir.
- Typographie élégante.
- Bordures fines.
- Texte blanc ou doré.
- Présentation éditoriale.

### 08. Romantic
- Tons roses et rouges.
- Cœurs.
- Messages personnalisables.
- Dates.
- Stickers romantiques.

### 09. Party
- Confettis.
- Couleurs vives.
- Étoiles.
- Nom de soirée.
- Date.
- Décorations festives.

### 10. Minimal
- Fond blanc, beige, gris ou noir.
- Typographie discrète.
- Bordures fines.
- Composition épurée.

### 11. Color Studio

Créer un thème studio avec arrière-plans personnalisables.

Fonctionnalités :
- Couleur unie.
- Sélecteur HEX.
- Dégradé linéaire.
- Dégradé radial.
- Palettes prédéfinies.
- Une couleur différente pour chaque photo.
- Couleurs personnalisées enregistrables.

Intégrer une segmentation locale permettant de remplacer l'arrière-plan réel.

Utiliser MediaPipe Image Segmenter ou une solution compatible avec les appareils ciblés.

Prévoir :
- Détourage de la personne.
- Masque de segmentation.
- Adoucissement des contours.
- Composition avec le fond choisi.
- Prévisualisation si les performances le permettent.
- Rendu haute qualité après capture.

Si la segmentation n'est pas disponible, conserver un mode de cadre coloré sans détourage.

### 12. Fun AR

Créer un système d'accessoires virtuels.

Accessoires obligatoires :
- Lunettes de soleil aviateur.
- Lunettes Wayfarer.
- Lunettes rondes rétro.
- Lunettes futuristes.
- Lunettes en cœur.
- Chapeau de cowboy.
- Chapeau de fête.
- Couronne.
- Moustache.
- Oreilles de chat.

Les lunettes aviateur doivent avoir une monture réaliste et des verres teintés.

Utiliser MediaPipe Face Landmarker pour détecter les points du visage.

Fonctionnalités :
- Suivi des yeux.
- Positionnement des lunettes.
- Ajustement de l'échelle.
- Rotation selon l'inclinaison du visage.
- Prévisualisation en direct.
- Ajustement manuel après capture.
- Gestion de plusieurs visages si possible.
- Export avec accessoires intégrés.

Tous les traitements faciaux doivent être locaux.

## 5. COMBINAISON DES THÈMES

Les thèmes et les effets doivent être indépendants.

L'utilisateur peut combiner :
- Un modèle de tirage.
- Un filtre.
- Un arrière-plan.
- Des accessoires AR.
- Des stickers.
- Des textes.
- Une couleur de bordure.

Exemples :
- Vintage + lunettes aviateur.
- Black & White + lunettes rondes.
- Korean + fond rose + lunettes cœur.
- Party + chapeau + confettis.
- Classic + fond bleu.
- Elegant Black + effet argentique.

Conserver les photographies originales.

Toutes les modifications doivent être non destructives.

## 6. CAMÉRA

Utiliser MediaDevices.getUserMedia().

Prendre en charge :
- Caméra avant iPhone.
- Caméra arrière iPhone.
- Caméra iPad.
- Webcam Mac.
- Webcam Windows.
- Caméra externe compatible.

Fonctionnalités :
- Autorisation caméra.
- Prévisualisation.
- Changement de caméra.
- Mode miroir.
- Capture haute résolution si disponible.
- Gestion portrait/paysage.
- Import de photos.
- Arrêt des flux.
- Gestion des erreurs.

Ne jamais demander l'accès au microphone.

## 7. SÉANCE DE QUATRE PHOTOS

Développer une machine à états fiable.

États :
- idle
- preparing
- countdown
- capturing
- reviewing
- editing
- exporting
- completed
- error

Séquence :
1. Sélection du thème.
2. Ouverture caméra.
3. Démarrage.
4. Décompte.
5. Photo 1.
6. Flash.
7. Décompte.
8. Photo 2.
9. Flash.
10. Décompte.
11. Photo 3.
12. Flash.
13. Décompte.
14. Photo 4.
15. Flash final.
16. Éditeur.

Minuteur :
- 3 secondes.
- 5 secondes.
- 10 secondes.

Fonctions :
- Pause.
- Reprise.
- Annulation.
- Recommencer.
- Reprendre une photo individuelle.

Afficher la progression 1/4 à 4/4.

Ajouter des sons facultatifs et une animation de flash.

## 8. ÉDITEUR COMPLET

Créer un éditeur tactile et responsive.

Fonctionnalités :
- Prévisualisation du tirage.
- Changement de thème.
- Réorganisation des photos.
- Recadrage.
- Zoom.
- Rotation.
- Luminosité.
- Contraste.
- Saturation.
- Température.
- Filtres.
- Arrière-plans.
- Accessoires AR.
- Stickers.
- Texte.
- Bordures.
- Annuler/rétablir.

Filtres :
- Natural.
- Black & White.
- Sepia.
- Vintage.
- Film Grain.
- Warm.
- Cool.
- Soft.
- High Contrast.
- Faded.
- Cinematic.

Le moteur Rust/WASM peut calculer les transformations lourdes.

Le rendu final doit être fidèle à la prévisualisation.

## 9. FORMATS DE TIRAGE

Créer six formats :
- A. Bande verticale classique.
- B. Grille 2 × 2.
- C. Double bande identique.
- D. Polaroid Collage.
- E. Carte postale horizontale.
- F. Social Square.

Chaque format doit être défini par une configuration typée.

Paramètres :
- Dimensions.
- Marges.
- Espacements.
- Positions des photos.
- Fond.
- Bordures.
- Décorations.
- Textes.
- Résolution.

## 10. EXPORT JPEG

Créer un moteur d'export fiable.

Options :
- Standard.
- Haute qualité.
- Qualité maximale compatible avec l'appareil.

Utiliser Canvas API, éventuellement assistée par Rust/WASM pour les traitements de pixels.

Générer un Blob JPEG valide.

Inclure :
- Quatre photos.
- Filtres.
- Fonds.
- Accessoires.
- Stickers.
- Textes.
- Bordures.

Nom : photobooth-YYYY-MM-DD-HHMMSS.jpg

Sur ordinateur :
- Téléchargement direct.

Sur iPhone/iPad :
- Partage natif lorsque disponible.
- Téléchargement JPEG.
- Aperçu permettant un enregistrement manuel dans Photos.

Ne jamais affirmer qu'un fichier a été enregistré dans Photos sans confirmation fiable.

## 11. GALERIE LOCALE

Utiliser IndexedDB avec Dexie.js si pertinent.

Stocker :
- JPEG.
- Miniature.
- Originaux.
- Thème.
- Paramètres.
- Accessoires.
- Textes.
- Date.

Fonctionnalités :
- Consulter.
- Télécharger.
- Partager.
- Rééditer.
- Supprimer.
- Trier.
- Effacer les données locales.

Prévoir la gestion des quotas et erreurs de stockage.

Ne pas utiliser de stockage cloud dans cette version.

## 12. MODE ÉVÉNEMENT IPAD

Créer un mode borne photo.

Fonctionnalités :
- Interface plein écran lorsque possible.
- Gros bouton de démarrage.
- Décompte visible.
- Quatre captures.
- Prévisualisation.
- Export.
- Nouvelle séance.
- Retour automatique après inactivité lorsque possible.

Personnalisation :
- Nom de l'événement.
- Date.
- Logo.
- Couleurs.
- Message.
- Thèmes autorisés.

Respecter les limitations du navigateur concernant le plein écran et le verrouillage de l'appareil.

## 13. PWA

Créer une application installable.

Prévoir :
- Manifest.
- Icônes.
- Service worker.
- Cache hors ligne.
- Gestion des mises à jour.
- Safe areas iOS.
- Splash screen lorsque pris en charge.
- Interface adaptée au tactile.

L'application doit fonctionner hors ligne après mise en cache des ressources nécessaires, dans les limites des APIs disponibles.

Les modules WASM et les modèles MediaPipe doivent être correctement mis en cache si le mode hors ligne en dépend.

## 14. CRÉATION ET DÉPLOIEMENT SUR MON COMPTE VERCEL

Cette section est obligatoire.

Je veux que tu crées et configures le projet Photobooth directement dans mon compte Vercel.

### 14.1 Vérification de l'accès

Commencer par vérifier :
- La disponibilité de Vercel CLI.
- La session Vercel active.
- Le compte ou l'équipe sélectionné.
- Les permissions nécessaires.
- L'accès au dépôt GitHub.
- L'existence éventuelle d'un projet Photobooth.

Ne jamais créer un doublon si un projet approprié existe déjà.

Ne jamais choisir arbitrairement un autre compte Vercel.

Si la session n'est pas authentifiée, me demander d'effectuer la connexion.

Ne pas demander de coller un token dans le code source ou dans le chat.

### 14.2 Création du projet

Si le projet n'existe pas, créer un projet Vercel nommé : photobooth

Le connecter au dépôt : danyvassily/Photobooth

Utiliser le compte Vercel personnel autorisé.

Configurer :
- Framework Next.js.
- Répertoire racine approprié.
- Commande de build.
- Installation des dépendances.
- Fichiers statiques.
- Variables d'environnement si nécessaires.
- Environnements Preview et Production.

### 14.3 Build Rust/WASM

Prévoir une stratégie reproductible pour compiler Rust vers WebAssembly.

Le build ne doit pas dépendre de fichiers générés uniquement sur la machine locale.

Deux stratégies acceptables :
- A. Compiler les modules WASM dans un workflow GitHub Actions et intégrer les artefacts nécessaires au build.
- B. Configurer une étape de build compatible avec l'environnement Vercel, incluant les outils Rust nécessaires.

Choisir la stratégie la plus simple, fiable et maintenable.

Vérifier les versions des outils et les dépendances.

Le résultat doit permettre un déploiement depuis un clone propre du dépôt.

Ne pas committer des fichiers volumineux inutiles.

### 14.4 Prévisualisation

Créer un déploiement Preview.

Vérifier :
- La page d'accueil.
- Le chargement des ressources.
- Le chargement du WASM.
- Les routes.
- Le manifest.
- Le service worker.
- Les assets AR.
- Les modèles de segmentation.
- Les erreurs JavaScript.
- Les erreurs réseau.

Tester le HTTPS.

Vérifier que l'application ne dépend pas d'un serveur local pour fonctionner.

### 14.5 Production

Après validation des tests et mon autorisation explicite :
- Fusionner la branche validée si nécessaire.
- Déployer en production.
- Vérifier le statut du déploiement.
- Vérifier le domaine attribué par Vercel.
- Tester l'application publique.
- Vérifier la caméra sous HTTPS.
- Vérifier les exports.
- Vérifier la PWA.

Me fournir l'URL réelle de production retournée par Vercel.

Ne pas inventer une URL.

### 14.6 Déploiements automatiques

Configurer la liaison GitHub/Vercel afin que :
- Les branches de développement disposent de déploiements Preview lorsque la configuration le permet.
- La branche de production déclenche un déploiement après fusion.
- Les erreurs de build soient visibles.
- Les changements soient traçables.

Prévoir une procédure de rollback documentée.

### 14.7 Domaine personnalisé

Ne pas acheter de domaine.

Si aucun domaine personnalisé n'est fourni, conserver le domaine Vercel attribué.

Préparer l'architecture pour permettre ultérieurement l'ajout d'un domaine personnalisé.

## 15. PERFORMANCES ET OPTIMISATION

Créer des benchmarks réels.

Comparer :
- JavaScript.
- Canvas.
- Rust/WASM.

Mesurer :
- Temps de traitement des filtres.
- Temps de composition.
- Temps d'export.
- Mémoire utilisée.
- Temps de chargement du WASM.
- Temps de chargement des modèles AR.
- Fluidité de prévisualisation.

Tester plusieurs résolutions.

Optimisations :
- Chargement différé.
- Web Workers si adaptés.
- Réutilisation des buffers.
- Réduction des copies mémoire.
- Libération des ressources.
- Limitation de la fréquence de détection faciale.
- Export à partir des originaux.
- Fallback sans AR.

Ne pas sacrifier la stabilité pour une optimisation théorique.

## 16. SÉCURITÉ ET CONFIDENTIALITÉ

- Photos traitées localement.
- Pas d'upload automatique.
- Pas de reconnaissance d'identité.
- Pas de stockage serveur.
- Pas de tracking publicitaire.
- Pas d'accès au microphone.
- Pas d'API IA distante obligatoire.
- Permissions explicites.
- Suppression locale possible.

Vercel doit servir l'application et ses ressources, sans recevoir les photographies utilisées par le moteur local.

Ne jamais exposer les secrets Vercel ou GitHub dans le frontend.

## 17. STRUCTURE DU DÉPÔT

Architecture indicative :

```
photobooth/
  app/
  components/
    camera/
    countdown/
    themes/
    editor/
    gallery/
    accessories/
    backgrounds/
    layouts/
    ui/
  hooks/
  lib/
    camera/
    storage/
    export/
    wasm/
    face-tracking/
    segmentation/
  rust/
    photobooth-core/
      Cargo.toml
      src/
        lib.rs
        filters.rs
        pixels.rs
        compositing.rs
        transforms.rs
        masks.rs
        accessories.rs
  public/
    icons/
    frames/
    accessories/
    models/
  tests/
  scripts/
  .github/
    workflows/
  package.json
  Cargo.lock
  README.md
```

Adapter la structure aux conventions du framework et au système de build retenu.

Séparer clairement le code Rust, les bindings WASM et l'interface TypeScript.

## 18. AGENTS SPÉCIALISÉS

Hermes coordonne les agents.

- Agent 1 : Architecture — Initialisation, Next.js, TypeScript, structure, contrats partagés.
- Agent 2 : Rust/WASM — Crate Rust, wasm-bindgen, filtres, transformations, benchmarks, optimisations.
- Agent 3 : Interface — Design system, accueil, navigation, responsive, accessibilité.
- Agent 4 : Caméra — getUserMedia, décompte, capture, machine à états, gestion des erreurs.
- Agent 5 : Thèmes — Douze thèmes, templates, cadres, formats, composition.
- Agent 6 : AR — MediaPipe, lunettes aviateur, autres accessoires, détection faciale, segmentation, fonds colorés.
- Agent 7 : Éditeur et galerie — Édition, filtres, IndexedDB, export, partage.
- Agent 8 : PWA et Vercel — Manifest, service worker, build WASM, configuration Vercel, preview, production après autorisation, déploiements GitHub.
- Agent 9 : QA — Tests, performance, régressions, compatibilité, documentation.

Les agents doivent se répartir les fichiers et définir leurs interfaces avant de coder en parallèle.

Éviter les conflits Git.

Utiliser des branches isolées ou worktrees lorsque pertinent.

Si l'environnement ne permet pas plusieurs agents simultanés, travailler séquentiellement.

## 19. PHASES DE DÉVELOPPEMENT

- Phase 1 : Initialisation — Inspection GitHub, architecture, Next.js, Rust, WASM, design system.
- Phase 2 : Caméra — Permissions, prévisualisation, quatre captures, décompte, reprise.
- Phase 3 : Thèmes — Douze thèmes, six formats, composition, export JPEG.
- Phase 4 : Traitement Rust — Filtres, transformations, masques, benchmarks, intégration WASM.
- Phase 5 : AR et fonds — MediaPipe, lunettes aviateur, autres accessoires, segmentation, fonds colorés.
- Phase 6 : Éditeur et galerie — Édition non destructive, filtres, IndexedDB, historique, partage.
- Phase 7 : PWA et mode événement — Installation, cache, mode iPad, optimisations tactiles.
- Phase 8 : Vercel — Vérification du compte, création du projet, liaison GitHub, build Rust/WASM, preview, tests HTTPS.
- Phase 9 : Validation et production — Tests complets, corrections, revue de code, rapport, demande d'autorisation, déploiement production, vérification finale.

## 20. TESTS OBLIGATOIRES

Utiliser Vitest et Playwright.

Tester :
- Capture de quatre photos.
- Décompte.
- Pause.
- Annulation.
- Reprise individuelle.
- Changement de caméra.
- Tous les thèmes.
- Toutes les compositions.
- Tous les filtres.
- Accessoires AR.
- Lunettes aviateur.
- Segmentation.
- Fonds colorés.
- Export JPEG.
- Galerie.
- Stockage.
- PWA.
- Chargement WASM.
- Fallback JavaScript.
- Build Vercel.

Effectuer des tests visuels du rendu.

Vérifier les performances sur appareil mobile.

Ne pas prétendre avoir testé un iPhone physique si aucun appareil n'est accessible.

## 21. CRITÈRES DE LIVRAISON

Le projet doit être considéré comme terminé uniquement lorsque :
- L'application démarre.
- La caméra fonctionne.
- Les quatre photos sont capturées.
- Les douze thèmes fonctionnent.
- Les accessoires sont utilisables.
- Les fonds colorés fonctionnent.
- L'éditeur fonctionne.
- Le JPEG est généré.
- La galerie fonctionne.
- La PWA est configurée.
- Le moteur Rust/WASM fonctionne.
- Le fallback est opérationnel.
- Le build de production réussit.
- Le projet Vercel est configuré.
- La prévisualisation est accessible.
- Les tests requis sont exécutés.
- Les limitations sont documentées.

Les critères nécessitant des tests manuels doivent être signalés comme non vérifiés tant qu'ils ne sont pas réellement validés.

## 22. RAPPORT FINAL

À la fin, fournir :
1. Résumé du projet.
2. Architecture Next.js + Rust/WASM.
3. Liste des fonctionnalités développées.
4. Liste des douze thèmes.
5. Résultats des benchmarks.
6. Résultats des tests.
7. Compatibilité vérifiée.
8. Limitations connues.
9. Lien GitHub.
10. Lien de la pull request.
11. Lien Preview Vercel.
12. Lien Production Vercel après autorisation et déploiement.
13. Instructions d'installation iPhone/iPad.
14. Instructions de développement local.
15. Instructions de maintenance.

## 23. INSTRUCTION FINALE

Commence immédiatement par analyser l'environnement, le dépôt GitHub et les outils disponibles.

Prépare l'architecture et les contrats entre modules.

Lance les agents spécialisés via Hermes et Antigravity lorsque cela est possible.

Développe l'application complète par phases vérifiables.

Corrige les erreurs détectées.

Configure mon projet Vercel et crée un déploiement Preview.

Demande mon accord avant la mise en production.

Ne t'arrête pas à une maquette.

Ne déclare aucune fonctionnalité terminée sans vérification.

Ne fabrique aucun résultat de test, benchmark ou déploiement.

L'objectif final est de livrer Photobooth : une application web/PWA complète, avec douze thèmes, accessoires AR, arrière-plans colorés, quatre captures automatiques, traitement Rust/WASM, éditeur, galerie, export JPEG et hébergement Vercel.
