# GCP Cost Isolation (integration)

Objectif: isoler les coûts IA de `integration` dans un projet GCP dédié.

## 1. Projet GCP dédié

Créer un projet (exemple):

- Nom: `integration-prod`
- Project ID: `agv-integration-prod`

Puis:

1. Lier le projet au compte de facturation principal.
2. Activer les APIs nécessaires pour Gemini API key.

## 2. Clé API dédiée

Créer une clé Gemini dans le projet `integration` uniquement.

Variables supportées par l'app:

- `GEMINI_API_KEY` (préféré)
- ou `GOOGLE_API_KEY` (fallback)

Important: ne pas réutiliser la même clé que `ndrc-atelier`.

## 3. Budget et alertes

## Budget mensuel (20 EUR)

1. Ouvrir `Billing -> Budgets & alerts`.
2. Créer un budget filtré sur le projet `agv-integration-prod`.
3. Montant: `20 EUR / mois`.
4. Notifications recommandées:
   - Seuils: `50%`, `80%`, `100%`
   - Sur coût réel et prévisionnel.

## Garde-fou journalier (2 EUR/jour)

Le budget GCP est mensuel/trimestriel/annuel par nature.  
Pour une alerte journalière, mettre en place une policy Monitoring ou une règle via export BigQuery.

## 4. Point critique: RAG sync nocturne

`integration` peut installer un cron local de synchro RAG:

- Vérifier: `npm run rag:cron:status`
- Désactiver si non voulu: `npm run rag:cron:remove`

Le script de sync appelle l'API Gemini/File Search, donc peut générer des coûts.

## 5. Variables attendues

Voir `.env.example` dans ce dossier:

- `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`)
- `RAG_GLOBAL_STORE_NAME` (optionnel)
- `RAG_KNOWLEDGE_DIR` (optionnel)
