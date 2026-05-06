# Dossier RGPD minimal

Date: 2026-05-04
Statut: brouillon operationnel, a faire relire juridiquement avant vente.

## Donnees traitees

- Formateurs: nom, email, mot de passe hache, statut du compte.
- Eleves: prenom, nom, identifiant, classe, mot de passe hache.
- Pedagogie: progression, evaluations E4/E6, commentaires, journal, missions, liens WordPress/PrestaShop.
- Preuves: fichiers uploades par les eleves.
- IA: messages de chat, prompts ou contenus envoyes aux services IA selon fonctionnalite.
- Audit: action, acteur, cible, horodatage, adresse IP si disponible.

## Finalites

- Suivi pedagogique NDRC.
- Evaluation et accompagnement des competences.
- Generation d'aides pedagogiques et assistance IA.
- Securite, support et traçabilite administrative.

## Sous-traitants techniques

A confirmer contractuellement avant vente:

- Vercel: hebergement application et Blob.
- Railway: base PostgreSQL.
- Google/Gemini et/ou OpenAI: fonctionnalites IA selon variables activees.

## Durees de conservation proposees

- Comptes prof/admin: duree du contrat + 12 mois.
- Donnees eleves: annee scolaire active + 12 mois, sauf demande contractuelle differente.
- Preuves et journaux: meme duree que le compte eleve.
- Logs d'audit: 12 a 24 mois selon besoin securite.
- Backups: retention courte documentee selon offre Railway.

## Droits utilisateurs

Procedure support demarree dans le produit:

- export JSON des donnees d'un eleve via le professeur, l'admin ou l'eleve lui-meme: `GET /api/students/[id]/export`,
- suppression d'un eleve par le professeur avec suppression en cascade base de donnees et nettoyage best-effort des preuves Vercel Blob referencees,
- suppression d'une classe ou d'un etablissement,
- rectification des donnees d'identite,
- information claire sur l'usage de l'IA.

## Points a implementer

- Export ZIP incluant les fichiers de preuves, si necessaire.
- Suppression complete classe/etablissement.
- Page politique de confidentialite.
- CGU/CGV et DPA pour etablissements.
- Estimation couts IA plus precise si les fournisseurs exposent les tokens/couts reels.
- Passage des preuves Blob en acces prive ou URLs signees.

## Quotas et usages IA

Statut 2026-05-05:

- quotas applicatifs sur 24h par utilisateur, role et fonctionnalite,
- journalisation des appels IA dans `AiUsageLog`,
- consultation admin via `/admin/ai-usage`,
- estimation de volume par caracteres/tokens approximatifs.

## Decision

Commercialisation payante non recommandee sans validation juridique et sans procedure de suppression/export operationnelle. Pilote limite possible avec information explicite, utilisateurs identifies, sauvegardes activees et donnees sensibles reduites.
