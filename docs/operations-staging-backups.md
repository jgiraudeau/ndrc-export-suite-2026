# Operations, staging et sauvegardes

Date: 2026-05-04
Statut: procedure initiale avant commercialisation.

## Objectif

Separer les essais de la production et pouvoir restaurer les donnees apres incident.

## Environnements

### Production

- Application: Vercel, domaine `fullndrc.fr`.
- Base: Railway PostgreSQL production.
- Variables critiques: `DATABASE_URL`, `DATABASE_PUBLIC_URL`, `JWT_SECRET`, cles IA, Vercel Blob.
- Les migrations sont appliquees par `prisma migrate deploy` pendant le build Vercel.

### Staging

Creer un environnement staging distinct avant toute vente:

- Projet ou service Vercel separe, ou environnement Preview dedie.
- Base Railway PostgreSQL separee, jamais la base production.
- Secrets separes: `JWT_SECRET`, cles IA limitees, bucket/blob separe si possible.
- Domaine recommande: `staging.fullndrc.fr`.

Le CLI Railway n'est pas installe localement au 2026-05-04. Creation a faire depuis l'interface Railway, ou installer le CLI puis relier explicitement le projet staging.

## Procedure de deploiement recommandee

1. Developper et verifier en local.
2. Deployer en staging.
3. Tester les parcours critiques:
   - connexion admin/prof/eleve,
   - import CSV eleves,
   - evaluation E4/E6,
   - upload preuve,
   - generation IA,
   - consultation logs d'audit.
4. Verifier `npm run build`, `npm run lint`, `npm audit`.
5. Deployer en production uniquement apres validation.

## Backups Railway

Actions obligatoires avant commercialisation:

- Activer les backups automatiques Railway sur la base production.
- Verifier la retention exacte dans l'offre Railway utilisee.
- Documenter ou exporter les identifiants projet/service Railway.
- Realiser un test de restauration sur une base staging au moins une fois par trimestre.

## Test de restauration

1. Creer une base Railway temporaire ou staging.
2. Restaurer le dernier backup production dans cette base.
3. Relier une instance Vercel staging a cette base.
4. Lancer `prisma migrate deploy` si necessaire.
5. Tester login, liste eleves, evaluations et logs d'audit.
6. Detruire la base temporaire si elle contient des donnees personnelles.

## Incidents

En cas d'incident securite ou perte de donnees:

- Geler les deploiements non urgents.
- Noter l'heure de detection, l'impact, les utilisateurs touches.
- Exporter les logs Vercel/Railway utiles.
- Restaurer en staging avant toute restauration production.
- Si donnees personnelles exposees: analyser la notification CNIL sous 72h.
