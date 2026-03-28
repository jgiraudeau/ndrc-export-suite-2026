# PRD — Plateforme Unifiée CCF BTS NDRC
**Version :** 1.0  
**Date :** 2026-03-26  
**Product Owner :** Jacques Giraudeau  
**Statut :** Approuvé  

---

## 1. Vision Produit

**Problème résolu :** Les formateurs BTS NDRC utilisent 3 applications séparées et incompatibles (`profvirtuel`, `profvirtuel-v2`, `applicompdigitndrc`), entraînant une dispersion des données, une friction pédagogique et des risques RGPD.

**Solution :** Une plateforme unique, unifiée et conforme RGPD qui centralise :
- La **création de contenu pédagogique** (cours, sujets d'examen, planning)
- Le **suivi des CCF** (E4, E5B, E6) via les grilles officielles
- La **génération et le suivi de missions numériques IA** (WordPress / PrestaShop)
- Le **tutorat IA** des étudiants (chatbot 24/7 basé sur Gemini)

**Bénéficiaires :**
- Formateurs BTS NDRC
- Étudiants BTS NDRC (1ère et 2ème année)
- Directeurs d'établissement (rôle Admin)

---

## 2. Utilisateurs & Rôles

### 2.1 Administrateur
Directeur ou responsable de la plateforme.
- Gère les comptes Formateurs (activation, désactivation)
- Gère les classes
- Vue transversale sur tous les élèves et résultats
- Accès à la suppression en cascade (droit à l'oubli RGPD)
- Export global des données

### 2.2 Formateur
Enseignant en charge d'une ou plusieurs classes BTS NDRC.
- Gère ses classes et élèves
- Génère des documents pédagogiques via IA (9 types)
- Crée et assigne des missions numériques (WordPress / PrestaShop)
- Évalue les élèves dans les grilles officielles E4 / E5B / E6
- Consulte et valide les soumissions et preuves des élèves
- Planifie les sessions CCF

### 2.3 Étudiant
Apprenant inscrit dans une classe NDRC.
- Consulte ses missions assignées
- Soumet ses preuves (PDF, images, fichiers)
- Suit sa progression E4 / E5B / E6 en temps réel
- Utilise le chatbot Tuteur IA pour ses questions de cours
- Accède à l'historique de ses conversations IA

---

## 3. Fonctionnalités Prioritaires (MVP)

### Epic 1 — Authentification & Gestion des comptes
| ID | User Story | Priorité |
|---|---|---|
| US-01 | En tant que Formateur, je veux m'inscrire et me connecter de manière sécurisée | 🔴 P0 |
| US-02 | En tant qu'Étudiant, je veux me connecter avec mon identifiant + code PIN | 🔴 P0 |
| US-03 | En tant qu'Admin, je veux activer ou désactiver un compte Formateur | 🔴 P0 |
| US-04 | En tant qu'utilisateur, je dois donner mon consentement RGPD à l'inscription | 🔴 P0 |

### Epic 2 — Gestion des classes
| ID | User Story | Priorité |
|---|---|---|
| US-05 | En tant que Formateur, je veux créer une classe (ex: NDRC1-2026) | 🔴 P0 |
| US-06 | En tant que Formateur, je veux ajouter des élèves à ma classe | 🔴 P0 |
| US-07 | En tant que Formateur, je veux voir la liste de mes classes et élèves | 🔴 P0 |

### Epic 3 — Génération Pédagogique IA
| ID | User Story | Priorité | Source |
|---|---|---|---|
| US-08 | En tant que Formateur, je veux générer un **Dossier Professeur** (plan + corrigé) sur un thème via IA | 🔴 P0 | `profvirtuel` |
| US-09 | En tant que Formateur, je veux générer un **Dossier Élève** (activités + questions) | 🔴 P0 | `profvirtuel` |
| US-10 | En tant que Formateur, je veux générer un **Sujet E4 – Jeu de rôle Vente** (fiches candidat + jury) | 🔴 P0 | `profvirtuel` |
| US-11 | En tant que Formateur, je veux générer un **Sujet E4 – Événement Commercial** (fiches candidat + jury) | 🔴 P0 | `profvirtuel` |
| US-12 | En tant que Formateur, je veux générer un **Sujet E5B – WordPress** (sujet + grille officielle) | 🔴 P0 | `profvirtuel` |
| US-13 | En tant que Formateur, je veux générer un **Sujet E5B – PrestaShop** (sujet + grille officielle) | 🔴 P0 | `profvirtuel` |
| US-14 | En tant que Formateur, je veux générer un **Quiz / QCM** (avec corrigé pédagogique) | 🟠 P1 | `profvirtuel` |
| US-15 | En tant que Formateur, je veux générer un **Planning Annuel** de progression | 🟠 P1 | `profvirtuel` |
| US-16 | En tant que Formateur, je veux **affiner** un document généré avec une instruction en langage naturel | 🟠 P1 | `profvirtuel` |
| US-17 | En tant que Formateur, je veux **sauvegarder** un document généré dans ma bibliothèque | 🟠 P1 | `profvirtuel` |
| US-18 | En tant que Formateur, je veux **exporter** un document généré en PDF ou DOCX | 🟠 P1 | `profvirtuel` |

### Epic 4 — Missions Numériques IA (E5B)
| ID | User Story | Priorité | Source |
|---|---|---|---|
| US-19 | En tant que Formateur, je veux générer une **mission numérique IA** (WordPress ou PrestaShop) personnalisée | 🔴 P0 | `applicompdigitndrc` |
| US-20 | En tant que Formateur, je veux configurer la difficulté et les compétences ciblées de la mission | 🔴 P0 | `applicompdigitndrc` |
| US-21 | En tant que Formateur, je veux **assigner** une mission à un ou plusieurs élèves | 🔴 P0 | `applicompdigitndrc` |
| US-22 | En tant qu'Étudiant, je veux **voir le détail** de ma mission assignée | 🔴 P0 | `applicompdigitndrc` |
| US-23 | En tant qu'Étudiant, je veux **soumettre une preuve** (fichier) pour valider ma mission | 🔴 P0 | `applicompdigitndrc` |
| US-24 | En tant que Formateur, je veux **valider ou rejeter** une soumission élève avec commentaire | 🔴 P0 | `applicompdigitndrc` |

### Epic 5 — Évaluations CCF (E4, E5B, E6)
| ID | User Story | Priorité | Source |
|---|---|---|---|
| US-25 | En tant que Formateur, je veux accéder à la **grille officielle E4** pour évaluer un élève | 🔴 P0 | `profvirtuel-v2` |
| US-26 | En tant que Formateur, je veux accéder à la **grille officielle E6** pour évaluer un élève | 🔴 P0 | `profvirtuel-v2` |
| US-27 | En tant que Formateur, je veux saisir des **notes et commentaires** par critère d'évaluation | 🔴 P0 | `profvirtuel-v2` |
| US-28 | En tant que Formateur, je veux **planifier une session CCF** (date, type, élève) | 🟠 P1 | `profvirtuel-v2` |
| US-29 | En tant qu'Étudiant, je veux voir ma **progression E4/E6** (pourcentage de critères validés) | 🔴 P0 | `profvirtuel-v2` |

### Epic 6 — Chatbot Tuteur IA
| ID | User Story | Priorité | Source |
|---|---|---|---|
| US-30 | En tant qu'Étudiant, je veux **poser des questions** à l'IA sur mon cours en langage naturel | 🔴 P0 | `profvirtuel` |
| US-31 | En tant qu'Étudiant, je veux consulter **l'historique** de mes conversations IA | 🟠 P1 | `profvirtuel` |
| US-32 | En tant que Formateur, je veux que le chatbot s'appuie sur **mes documents uploadés** | 🟠 P1 | `profvirtuel` |

### Epic 7 — RGPD
| ID | User Story | Priorité |
|---|---|---|
| US-33 | En tant qu'Admin, je veux **supprimer** un compte élève et toutes ses données associées (droit à l'oubli) | 🔴 P0 |
| US-34 | En tant qu'utilisateur, je veux que la date de mon consentement soit **enregistrée** (`consentGivenAt`) | 🔴 P0 |

---

## 4. Contraintes Techniques

- **Framework :** Next.js 16 (App Router) + TypeScript
- **ORM :** Prisma + PostgreSQL (Railway / Neon)
- **UI :** shadcn/ui + Tailwind V4 — Design System "Indigo Scholar" (Stitch)
- **IA :** `@google/genai` (Gemini Pro / Flash) natif dans Next.js
- **Auth :** JWT avec `jose` (sans framework externe type NextAuth)
- **Stockage :** Vercel Blob pour les fichiers uploadés par les élèves
- **RGPD :** Suppression en cascade (Prisma `onDelete: Cascade`), consentement horodaté

---

## 5. Hors Périmètre (Phase 2 ou Future)

- Intégration Google Drive / Gemini Context Caching (prévu dans l'architecture originale de `profvirtuel`)
- Abonnements Stripe (plans Free / Pro)
- Export vers Moodle / Pronote
- Module Tuteur d'entreprise (livret de stage numérique)
- Multi-établissements (architecture multi-tenant)
- Application mobile

---

## 6. Critères de Succès

| Métrique | Cible MVP |
|---|---|
| Formateurs peuvent se connecter et générer un cours IA | ✅ Fonctionnel |
| Étudiants peuvent consulter et soumettre leurs missions | ✅ Fonctionnel |
| Grilles E4/E6 accessibles et pré-remplies depuis la BDD | ✅ Fonctionnel |
| Chatbot répond en < 5 secondes | < 5s |
| Conformité RGPD : droit à l'oubli opérationnel | ✅ Fonctionnel |
| Aucun mot de passe en clair en base de données | ✅ bcryptjs |
