# Knowledge RAG

Dépose ici les documents source à indexer dans le store RAG global.

## Usage rapide

1. Copier les fichiers dans ce dossier (et sous-dossiers si besoin).
2. Lancer `npm run rag:sync`.
3. Vérifier la base via `/admin/rag`.

## Formats pris en charge

`.pdf`, `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`, `.htm`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.rtf`, `.odt`, `.ods`, `.odp`

## Bonnes pratiques

- Garder une arborescence claire (ex: `wordpress/`, `prestashop/`, `sujets/`).
- Remplacer un fichier avec le même chemin pour le mettre à jour.
- Supprimer un fichier ici puis relancer la sync pour le retirer du RAG global.
