# Architecture Technique — Plateforme CCF BTS NDRC
**Version :** 1.0  
**Date :** 2026-03-26  
**Architecte :** Antigravity (IA)  
**Statut :** Approuvé  

---

## 1. Vue d'ensemble

Application **monolithique Next.js 16 full-stack** qui unifie 3 applications préexistantes.  
L'App Router de Next.js est utilisé comme unique backend (Server Actions + API Routes) et frontend.

```
┌─────────────────────────────────────────────┐
│              Next.js 16 App Router           │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  /admin  │  │ /teacher │  │ /student │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│         ↓              ↓            ↓        │
│  ┌──────────────────────────────────────┐   │
│  │         API Routes (src/app/api/)    │   │
│  │  auth/ missions/ progress/ eval/ ... │   │
│  └──────────────────────────────────────┘   │
│         ↓              ↓            ↓        │
│  ┌───────────┐  ┌────────────┐  ┌────────┐  │
│  │   Prisma  │  │ Google AI  │  │  Blob  │  │
│  │   ORM     │  │  (Gemini)  │  │Storage │  │
│  └───────────┘  └────────────┘  └────────┘  │
│        ↓                                     │
│  ┌────────────────┐                          │
│  │  PostgreSQL DB │                          │
│  └────────────────┘                          │
└─────────────────────────────────────────────┘
```

---

## 2. Stack Technique

| Couche | Technologie | Justification |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR, Server Actions, unification front+back |
| Langage | TypeScript | Typage fort, sécurité |
| Base de données | PostgreSQL | Relationnel, robuste, RGPD-ready |
| ORM | Prisma | Sécurité des migrations, typage auto |
| UI | shadcn/ui + Tailwind V4 | Composants accessibles, cohérence Stitch |
| Design System | "Indigo Scholar" (Stitch) | Indigo + Slate, Manrope/Inter |
| Authentification | jose (JWT manuel) | Léger, pas de dépendance NextAuth |
| Hashage mdp | bcryptjs | Standard sécurité |
| IA (génération) | @google/genai (Gemini Pro) | Génération pédagogique, multimodale |
| Stockage fichiers | Vercel Blob | Preuves élèves (PDF, images) |
| Validation | zod | Sécurité des inputs API |

---

## 3. Structure des Dossiers

```
integration/
├── src/
│   ├── app/                     # Next.js App Router (pages + API)
│   │   ├── (public)/
│   │   │   └── login/           # Page de connexion
│   │   ├── admin/               # Espace Administrateur
│   │   │   ├── page.tsx         # Dashboard admin
│   │   │   └── teachers/        # Gestion formateurs
│   │   ├── teacher/             # Espace Formateur
│   │   │   ├── dashboard/       # Vue d'ensemble élèves + E4/E6
│   │   │   ├── generate/        # Générateur IA (9 types de docs)
│   │   │   ├── missions/        
│   │   │   │   └── generate/    # Création mission numérique
│   │   │   ├── evaluations/     
│   │   │   │   ├── e4/          # Grille E4 officielle
│   │   │   │   └── e6/          # Grille E6 officielle
│   │   │   └── students/        # Détail élève + suivi
│   │   ├── student/             # Espace Étudiant
│   │   │   ├── dashboard/       # Progression E4/E6 + missions
│   │   │   ├── missions/        # Liste et détail missions
│   │   │   └── chat/            # Chatbot Tuteur IA
│   │   └── api/                 # Routes API Next.js
│   │       ├── auth/
│   │       │   ├── teacher/     # Login formateur
│   │       │   ├── student/     # Login élève
│   │       │   └── admin/       # Login admin
│   │       ├── generate/        # Génération IA (cours, sujets)
│   │       ├── chat/            # Chatbot IA
│   │       ├── missions/        # CRUD missions
│   │       ├── progress/        # Suivi compétences
│   │       ├── evaluations/     # CCF E4/E5B/E6
│   │       ├── students/        # CRUD élèves
│   │       ├── classes/         # CRUD classes
│   │       └── upload/          # Soumissions fichiers
│   ├── components/              # Composants React réutilisables
│   │   ├── ui/                  # shadcn/ui (boutons, inputs...)
│   │   ├── dashboard/           # Composants dashboard
│   │   ├── evaluation/          # Grilles E4/E6
│   │   ├── generate/            # Formulaire de génération
│   │   └── chat/                # Interface chatbot
│   └── lib/
│       ├── prisma.ts            # Client Prisma singleton
│       ├── jwt.ts               # Helpers jose (sign/verify)
│       ├── validations.ts       # Schémas Zod
│       └── ai/
│           ├── gemini.ts        # Client Gemini
│           ├── prompts/         # Templates de prompts (9 types)
│           └── chat.ts          # Logique chatbot
├── prisma/
│   ├── schema.prisma            # Schéma BDD (voir section 4)
│   ├── seed.ts                  # Seeder admin + grilles E4/E6
│   ├── referentiel_e4.json      # Référentiel officiel E4
│   └── referentiel_e6.json      # Référentiel officiel E6
├── docs/                        # Documentation BMAD
│   ├── prd.md                   # Ce fichier PRD
│   ├── architecture.md          # Ce fichier
│   └── epics/                   # User Stories détaillées
├── public/                      # Assets statiques
└── .env                         # Variables d'environnement
```

---

## 4. Modèle de Données (Prisma)

### Entités principales

```
Teacher (Formateur)
  ├── email, passwordHash, name, status, consentGivenAt
  ├── Class[] → Student[]
  ├── Mission[]
  └── Evaluation[] → EvaluationScore[]

Student (Élève)
  ├── firstName, lastName, email, pinHash, consentGivenAt
  ├── Class (classId)
  ├── Progress[] (compétences)
  ├── MissionAssignment[] → Mission
  └── Evaluation[] (résultats CCF)

Class (Classe)
  ├── name (NDRC1, NDRC2)
  ├── Teacher
  └── Student[]

Mission (Mission Numérique)
  ├── title, content, platform (WP/PS), difficulty
  └── MissionAssignment[] → Student

Competency (Compétence E4/E6)
  ├── code, description, block (E4/E5/E6)
  └── AssessmentCriterion[]

Evaluation (Acte d'évaluation CCF)
  ├── Student, Teacher, EvaluationSession
  ├── date, type (formative/certificative)
  ├── situation (situation_a/b, oral_e6)
  └── EvaluationScore[] (score par critère)

ChatSession + ChatMessage (Historique Tuteur IA)
SavedDocument (Documents générés par le formateur)
```

---

## 5. Authentification & Sécurité

### Flux d'authentification
```
POST /api/auth/teacher/login
  → Vérifier email (Prisma)
  → bcrypt.verify(password, hash)
  → jose.signJWT({ role: 'teacher', id, ... }, JWT_SECRET)
  → Cookie httpOnly 'token'
  → Redirect /teacher/dashboard
```

### Protection des routes
- **Middleware Next.js** : vérifie le JWT dans le cookie sur toutes les routes `/teacher/*`, `/student/*`, `/admin/*`
- **Rôles** : `teacher`, `student`, `admin` vérifiés dans le payload JWT
- **RGPD** : aucune donnée personnelle dans les logs serveur

### Variables d'environnement requises
```env
DATABASE_URL=       # PostgreSQL (Railway/Neon/Supabase)
JWT_SECRET=         # openssl rand -base64 32
GOOGLE_API_KEY=     # Clé API Gemini
BLOB_READ_WRITE_TOKEN=  # Vercel Blob
NEXT_PUBLIC_APP_URL=    # URL de l'application
```

---

## 6. Architecture IA (Gemini)

### Génération pédagogique (Formateur)
```
POST /api/generate/course
  → Lire le type de document (dossier_prof, quiz, jeu_de_role...)
  → Charger le template de prompt correspondant (src/lib/ai/prompts/)
  → Appeler Gemini Pro avec le prompt système + le topic
  → Retourner le markdown généré
  → Optionnel: sauvegarder dans SavedDocument
```

### Chatbot Tuteur (Étudiant)
```
POST /api/chat
  → Créer ou reprendre une ChatSession
  → Construire l'historique des ChatMessage
  → Appeler Gemini avec le contexte BTS NDRC
  → Sauvegarder la réponse dans ChatMessage
  → Retourner en streaming
```

---

## 7. Migrations et Déploiement

### Commandes de lancement
```bash
# 1. Migration base de données
npx prisma migrate dev --name init

# 2. Seeder (Admin + Grilles E4/E6)
npx prisma db seed

# 3. Développement local
npm run dev

# 4. Production
npm run build && npm start
```

### Recommandations d'hébergement
| Service | Usage |
|---|---|
| **Railway** | App Next.js + PostgreSQL (même plateforme que profvirtuel-v2) |
| **Neon** | Alternative PostgreSQL serverless (gratuit) |
| **Vercel** | Alternative hébergement Next.js + Vercel Blob natif |

---

## 8. Roadmap Technique

| Phase | Périmètre | Statut |
|---|---|---|
| **Phase 1** | Socle Next.js + Prisma + shadcn/ui | ✅ Terminé |
| **Phase 2** | Migration auth, API routes, logique IA basique | ✅ Terminé |
| **Phase 3** | Grilles E4/E6 (modèles + seeder) | ✅ Terminé |
| **Phase 4** | Design System Stitch (4 écrans) + intégration HTML | ✅ Terminé |
| **Phase 5** | Migration générateur pédagogique (`profvirtuel`) | ⬜ À faire |
| **Phase 6** | Migration chatbot tuteur IA | ⬜ À faire |
| **Phase 7** | Middleware JWT + protection des routes | ⬜ À faire |
| **Phase 8** | Connexion base de données PostgreSQL + migration | ⬜ À faire |
| **Phase 9** | Tests de bout en bout + déploiement | ⬜ À faire |
