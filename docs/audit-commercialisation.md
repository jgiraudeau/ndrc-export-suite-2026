# Audit commercialisation FullNDRC Integration

Date: 2026-05-01
Statut: audit initial, a transformer en backlog avant mise en vente.

## Verdict

L'application est fonctionnelle et deja deployable, mais elle n'est pas encore prete pour une commercialisation sereine. Les principaux blocages concernent la securite applicative, la conformite donnees personnelles/RGPD, la robustesse d'exploitation, et la dette produit liee a des fonctionnalites experimentales IA.

Priorite recommandee: stabiliser et securiser le socle avant toute vente a des etablissements externes.

## Points bloquants avant commercialisation

### P0 - Securite dependances

`npm audit` remonte 19 vulnerabilites:

- 1 critique: `protobufjs`
- 11 high, dont `next`, `prisma`, `xlsx`
- 7 moderate

Statut 2026-05-04: corrige dans le code local. `npm audit --json` remonte 0 vulnerabilite apres mise a jour de `next`/Prisma, overrides transitifs cibles, et retrait de `xlsx`.

Actions:

- Mettre a jour `next` vers la version corrigee indiquee par npm audit.
- Mettre a jour `prisma` et `@prisma/client` ensemble.
- Remplacer ou isoler `xlsx`, car npm n'indique pas de correctif disponible pour la version utilisee.
- Relancer `npm audit` puis `npm run build` apres chaque lot.

### P0 - Authentification et sessions

Constats:

- Les JWT ont une duree de 7 jours.
- Le token est stocke a la fois en cookie httpOnly et dans `localStorage`.
- De nombreuses pages relisent `localStorage` pour construire un header `Authorization`.
- Pas de rate limiting visible sur login, IA, upload ou endpoints sensibles.

Risques:

- Vol de token via XSS si une faille front apparait.
- Brute force login plus facile.
- Sessions longues sans rotation ni invalidation serveur.

Actions:

- Supprimer le stockage du JWT dans `localStorage`; garder le cookie httpOnly.
- Ajouter rate limiting par IP/utilisateur sur login, IA, upload, RAG.
- Ajouter une politique de session: expiration plus courte, logout robuste, rotation si necessaire.
- Ajouter logs d'audit admin/prof sur actions sensibles.

### P0 - Cloisonnement donnees

Constat positif:

- Plusieurs routes verifient bien que l'etudiant appartient au professeur connecte.

Point critique trouve:

- `GET /api/students/[id]/evaluations` accepte un `studentId` parametre et retourne des donnees de progression sans verifier que le professeur possede cet etudiant ou que l'etudiant demande ses propres donnees.

Actions:

- Auditer toutes les routes dynamiques avec parametre `id`.
- Ajouter des tests d'autorisation inter-prof/inter-eleve.
- Centraliser les helpers `requireTeacherOwnsStudent`, `requireStudentSelf`, `requireMissionAccess`.

### P0 - RGPD et donnees eleves

Donnees traitees:

- Identite eleve, classe, progression, commentaires, evaluations, journal, liens WordPress/PrestaShop, preuves upload, conversations IA.

Manques avant commercialisation:

- Politique de confidentialite.
- CGU/CGV.
- DPA/sous-traitance pour etablissements.
- Registre des traitements.
- Duree de conservation.
- Procedure suppression/export donnees.
- Consentement mineurs/representants selon contexte.
- Information sur IA et sous-traitants: Vercel, Railway, Google/OpenAI si utilises, Vercel Blob.

Actions:

- Produire un dossier RGPD minimal.
- Ajouter export/suppression compte et purge etablissement.
- Documenter les sous-traitants et lieux d'hebergement.

### P1 - Uploads et stockage

Constats:

- Upload limite a 5 MB.
- MIME + extension controles.
- Les fichiers sont stockes en acces public Vercel Blob.

Risques:

- Les preuves eleves peuvent contenir des donnees personnelles.
- Une URL publique partagee donne acces au document.
- Pas d'antivirus ni scan de contenu.

Actions:

- Passer les preuves en acces prive ou URLs signees a duree limitee.
- Ajouter scan antivirus ou restriction encore plus forte.
- Ajouter suppression blob lors de suppression eleve/journal.
- Ajouter quotas par eleve/prof/etablissement.

### P1 - IA et couts

Constats:

- Gemini/RAG pour chat, generation cours, missions.
- Pas de quotas metier visibles par etablissement/prof/eleve.
- Pas de tableau de couts par usage.

Actions:

- Ajouter quotas par role et par periode.
- Journaliser appels IA: utilisateur, type, tokens/estimation cout, statut.
- Ajouter mode degrade si quota/cout depasse.
- Revoir prompts et garde-fous pour eviter hallucinations dans contexte certificatif.

### P1 - Exploitation et fiabilite

Constats:

- Vercel pour l'app, Railway PostgreSQL pour la base.
- `prisma migrate deploy` est execute au build.
- Presence d'un `.env` local, Vercel signale qu'il vaut mieux utiliser les variables Vercel.

Actions:

- Documenter environnements dev/staging/prod.
- Creer un staging separe avec base Railway separee.
- Verifier backups Railway, retention, restauration testee.
- Ajouter monitoring erreurs et uptime.
- Ajouter procedure incident.

### P1 - Qualite produit

Constats:

- L'application couvre beaucoup de workflows: prof, eleve, admin, E4/E6, E5B, journal, portfolio, IA, exports.
- Certaines fonctionnalites ont ete experimentees puis abandonnees, comme la dictee integree.

Actions:

- Retirer les endpoints et dependances non utilises.
- Ecrire un parcours commercial stable: creer prof, importer classe, evaluer E4/E6, consulter eleve, exporter.
- Ajouter une page aide/onboarding.
- Harmoniser les messages d'erreur.

### P2 - Tests et qualite code

Manques:

- Pas de suite de tests visible.
- Pas de tests d'autorisation API.
- Pas de tests e2e sur parcours critiques.

Actions:

- Ajouter tests unitaires auth/helpers.
- Ajouter tests API sur cloisonnement donnees.
- Ajouter e2e Playwright: login prof, import eleves, evaluation E4/E6, login eleve, consultation.
- Ajouter CI build + lint + tests + audit.

## Backlog recommande

### Lot 1 - Securisation courte

Statut 2026-05-04: traite dans le code local.

- [x] Supprimer JWT du `localStorage`.
- [x] Corriger `GET /api/students/[id]/evaluations`.
- [x] Mettre a jour `next` et `prisma`.
- [x] Decider quoi faire de `xlsx`: dependance retiree, import eleves limite au CSV, export Wooclap bascule en CSV.
- [x] Ajouter rate limiting login et IA.
- [x] Ajouter headers securite de base.

Verification:

- `npm audit --json`: 0 vulnerabilite.
- `npm run lint`: OK.
- `npm run build`: OK.

### Lot 2 - Commercialisation minimale

Statut 2026-05-05: en cours, socle audit deploye et export/suppression RGPD demarres dans le code local.

- [ ] Staging separe.
- [ ] Backups Railway documentes et testes.
- [ ] Politique confidentialite + CGU.
- [x] Export donnees eleve en JSON: `GET /api/students/[id]/export`.
- [x] Bouton professeur "Exporter RGPD" dans la liste eleves.
- [x] Suppression eleve enrichie avec nettoyage best-effort des preuves Vercel Blob referencees.
- [x] Quotas IA par role/fonctionnalite sur 24h.
- [x] Journalisation usages IA: table `AiUsageLog`, API `GET /api/admin/ai-usage`, page `/admin/ai-usage`.
- [x] Logs d'audit admin/prof/eleve sur actions sensibles.
- [x] API admin de consultation des logs d'audit: `GET /api/admin/audit-logs`.
- [x] Page admin de consultation: `/admin/audit`.
- [x] Documentation exploitation/staging/backups initiale.
- [x] Dossier RGPD minimal initial.

Notes:

- Le CLI Railway n'est pas disponible localement; la creation effective du staging Railway doit etre faite depuis Railway/Vercel ou apres installation du CLI.
- Une migration Prisma ajoute la table `AuditLog`; elle sera appliquee par `prisma migrate deploy` au prochain deploiement.
- L'export eleve exclut volontairement les `passwordHash`; ces secrets techniques ne doivent pas sortir dans un export support standard.
- Une migration Prisma ajoute la table `AiUsageLog` pour piloter les quotas et l'estimation de volume IA.

### Lot 3 - Industrialisation

- Tests e2e.
- Monitoring erreurs.
- Tableau admin usage/couts.
- Multi-etablissement si cible commerciale large.
- Process support et incident.

## Decision go/no-go

No-go commercialisation payante tant que les P0 ne sont pas traites.

Go pilote limite possible uniquement si:

- acces restreint a un petit nombre d'utilisateurs connus,
- donnees de test ou consentement explicite,
- sauvegardes verifiees,
- information claire que le produit est en pilote.
