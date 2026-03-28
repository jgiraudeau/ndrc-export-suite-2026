# Contexte Projet — Plateforme CCF BTS NDRC

> **Ce fichier est la source de vérité BMAD du projet.**  
> Tout agent, toute décision d'implémentation et toute User Story doit y référer.

## Identité du Projet

- **Nom :** CCF BTS NDRC (Integration)
- **Version CPU :** 1.0
- **Dossier :** `/Users/imac2jacques/Desktop/antigravity/integration`
- **Product Owner :** Jacques Giraudeau (`jacques.giraudeau@gmail.com`)

## Documents de Référence

| Document | Rôle | Chemin |
|---|---|---|
| PRD | Fonctionnalités, User Stories, priorités | [`docs/prd.md`](./docs/prd.md) |
| Architecture | Stack, schéma BDD, routage, IA | [`docs/architecture.md`](./docs/architecture.md) |
| Schéma Prisma | Modèle de données officiel | [`prisma/schema.prisma`](./prisma/schema.prisma) |
| Seeder | Init admin + grilles E4/E6 | [`prisma/seed.ts`](./prisma/seed.ts) |

## Origines du Projet (Sources Fusionnées)

| Application | Fonctionnalité clé migrée |
|---|---|
| `profvirtuel` | Générateur pédagogique IA (9 types), Chatbot Tuteur |
| `profvirtuel-v2` | Grilles officielles E4/E6, suivi CCF |
| `applicompdigitndrc` | Missions numériques, Auth JWT, suivi de progression |

## Règles d'Or du Projet

1. **Jamais de migration sans mise à jour du schéma Prisma** d'abord.
2. **Zod** doit valider TOUTES les entrées des API Routes.
3. **JWT** : vérifié au niveau du middleware Next.js, pas dans chaque route.
4. **RGPD** : tout objet `Teacher` ou `Student` doit avoir `onDelete: Cascade` sur ses relations.
5. **Design System** : utiliser EXCLUSIVEMENT le design system "Indigo Scholar" (Stitch) — couleur primaire `#4338CA`, polices Manrope + Inter.
6. **Documents Pédagogiques** : les 9 types de prompts Gemini sont dans `src/lib/ai/prompts/`. Ne jamais inclure les prompts inline dans les routes API.

## État d'Avancement (Phases)

| Phase | Description | Statut |
|---|---|---|
| 1 | Socle Next.js + Prisma + shadcn/ui | ✅ Terminé |
| 2 | Auth JWT, API Routes de base, logique IA | ✅ Terminé |
| 3 | Grilles E4/E6 (schéma + seeder) | ✅ Terminé |
| 4 | Design Stitch (4 écrans) + intégration HTML | ✅ Terminé |
| 5 | Migration générateur pédagogique (profvirtuel → Next.js) | ⬜ À faire |
| 6 | Migration chatbot tuteur IA | ⬜ À faire |
| 7 | Middleware JWT (protection des routes) | ⬜ À faire |
| 8 | Base de données PostgreSQL + migration + seed | ⬜ À faire |
| 9 | Tests + déploiement (Railway ou Vercel) | ⬜ À faire |
