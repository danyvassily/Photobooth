# Déploiement — Photobooth V3

## Vue d'ensemble

| Élément | Valeur |
|---|---|
| Projet Vercel | `danyvassilys-projects/photobooth` |
| Repo GitHub | `danyvassily/Photobooth` |
| Branche de production | `main` |
| Branche de développement | `feat/photobooth-v3` |
| Preview (alias stable) | https://photobooth-lake-omega.vercel.app |
| Domaine Vercel prod | https://photobooth-danyvassilys-projects.vercel.app |

## Comment le build fonctionne

`pnpm build` = `pnpm build:wasm && next build`.

`scripts/build-wasm.sh` est écrit en **POSIX sh** (compatible `dash`, donc CI Ubuntu et Vercel) et applique cette logique :

1. `wasm-pack` présent → compilation du crate `rust/photobooth-core` vers `public/wasm/`, puis suppression du `.gitignore` généré par wasm-pack.
2. `wasm-pack` absent mais `public/wasm/photobooth_core_bg.wasm` présent → **utilisation du module précompilé versionné**.
3. Ni l'un ni l'autre → build sans WASM, l'application bascule automatiquement sur le moteur JS/Canvas 2D.

**Pourquoi les artefacts WASM sont versionnés** : l'environnement de build Vercel n'a pas de toolchain Rust. Committer `public/wasm/*` (~23 Ko) et `Cargo.lock` garantit qu'un clone propre du dépôt produit un build identique, sans dépendre d'un fichier généré uniquement en local.

La compilation Rust réelle reste vérifiée à chaque push par GitHub Actions (`.github/workflows/ci.yml` : rustup + wasm32-unknown-unknown + wasm-pack + typecheck + vitest + `next build`).

## Flux de travail

```bash
# développement
git checkout feat/photobooth-v3
pnpm install
pnpm dev                # http://localhost:3000

# vérifications locales avant push
pnpm typecheck
pnpm test               # vitest : 15 tests
pnpm build              # inclut le build WASM
```

- Push sur une branche avec PR ouverte ou push direct → **déploiement Preview** automatique.
- Merge dans `main` → **déploiement Production** automatique.
- Chaque déploiement est visible dans `vercel ls photobooth` et dans le dashboard.

## Rollback

```bash
# 1. lister les déploiements de production
vercel ls photobooth

# 2. promouvoir immédiatement un déploiement antérieur sain
vercel promote <deployment-url>

# 3. ou revenir en arrière sur le code puis redéployer
git revert <sha> && git push origin main
```

`vercel promote` bascule les alias de production en quelques secondes, sans rebuild : c'est la procédure à privilégier en cas d'incident.

## Variables d'environnement

Aucune variable d'environnement n'est requise : l'application est 100 % statique côté client (photos traitées localement, aucun upload serveur).

## Notes

- Ne jamais committer de token Vercel/GitHub dans le dépôt : l'authentification passe par la session locale (`~/.vercel`, `gh auth`).
- Le déploiement Vercel depuis Git doit rester activé (`gitProviderOptions.createDeployments = enabled`), sinon les pushes ne créent plus de déploiement : c'est précisément ce qui bloquait le pipeline.
