// ============================================================
// PROMPTS PÉDAGOGIQUES — BTS NDRC
// Migré depuis profvirtuel/backend/app/routers/generate.py
// ============================================================

export type DocumentType =
  | 'dossier_prof'
  | 'dossier_etudiant'
  | 'fiche_deroulement'
  | 'evaluation'
  | 'quiz'
  | 'planning_annuel'
  | 'jeu_de_role'
  | 'jeu_de_role_evenement'
  | 'sujet_e5b_wp'
  | 'sujet_e5b_presta';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  dossier_prof: '📋 Dossier Professeur',
  dossier_etudiant: '📖 Dossier Étudiant',
  fiche_deroulement: '🕐 Fiche de Déroulement',
  evaluation: '📝 Évaluation & Barème',
  quiz: '❓ Quiz / QCM',
  planning_annuel: '📅 Planning Annuel',
  jeu_de_role: '🎭 Sujet E4 — Jeu de rôle Vente',
  jeu_de_role_evenement: '🎪 Sujet E4 — Événement Commercial',
  sujet_e5b_wp: '🔵 Sujet E5B — WordPress',
  sujet_e5b_presta: '🟠 Sujet E5B — PrestaShop',
};

export const PROMPT_TEMPLATES: Record<DocumentType, string> = {
  dossier_prof: `Tu es un expert en création de cours pour le BTS {track}.
Génère un DOSSIER PROFESSEUR complet et structuré pour l'enseignant :

# Dossier Professeur : [Titre du Thème]

## 1. Présentation de la Séquence
- **Bloc de compétences visé** : [Nom du bloc]
- **Compétences à acquérir** : [Lister les compétences exactes du référentiel]
- **Critères de performance** : [Indicateurs de réussite]
- **Savoirs associés** : [Liste des savoirs théoriques]
- **Durée estimée** : [Heures]

## 2. Déroulement de la Séance (Conducteur)
| Phase | Durée | Activité Professeur | Activité Étudiant | Support |
| :--- | :---: | :--- | :--- | :--- |
| **Accroche** | 10' | ... | ... | Vidéo/Image |
| **Activité 1** | 45' | ... | ... | Dossier Étudiant |
| **Synthèse** | 15' | ... | ... | Tableau |

## 3. CORRIGÉ DÉTAILLÉ (ACTIVITÉS)

### Correction Activité 1 : [Titre]
1. **Réponse Q1** : ...
2. **Réponse Q2** : ...

## 4. Points de Vigilance & Prolongements
- ⚠️ **Difficultés fréquentes** : ...
- 🔗 **Lien examen (E4/E5/E6)** : ...`,

  dossier_etudiant: `Tu es un expert en création de supports pédagogiques pour le BTS {track}.
Génère un DOSSIER ÉTUDIANT clair, structuré et aéré, prêt à être distribué :

# Dossier Étudiant : [Titre du Thème]

## Compétences Ciblées (Référentiel)
> **Objectif Pédagogique :** [Être capable de...]

## Contexte Professionnel
> [Mise en situation réaliste dans une entreprise fictive ou réelle.]

## Documents de Travail
- **Document 1** : [Titre] - [Brève description]
- **Document 2** : [Titre] - [Brève description]

---

## TRAVAIL À RÉALISER

### Activité 1 : [Titre]
1. **Question 1** : [Texte de la question]
2. **Question 2** : [Texte de la question]

### Activité 2 : [Titre]
1. **Question 3** : ...
2. **Question 4** : ...

---

## Synthèse Personnelle
- ...`,

  fiche_deroulement: `Tu es un expert en ingénierie pédagogique pour le BTS {track}.
Génère une FICHE DE DÉROULEMENT DE COURS détaillée :

# Fiche de Déroulement : [Titre]

## Informations Pratiques
| Élément | Détail |
|---------|--------|
| Classe | BTS {track} 1ère/2ème année |
| Durée totale | X heures |
| Matériel | ... |

## Chronologie Détaillée

### Phase 1 : Accroche (XX min)
- **Objectif** : Capter l'attention
- **Méthode** : [Brainstorming / Vidéo / Cas réel]
- **Actions prof** : ...
- **Consigne étudiant** : ...

### Phase 2 : Apport de Connaissances (XX min)
...

### Phase 3 : Mise en Application (XX min)
...

### Phase 4 : Synthèse (XX min)
...

## Check-list Préparation
- [ ] Documents photocopiés
- [ ] Vidéoprojecteur testé
- [ ] ...`,

  evaluation: `Tu es un expert en évaluation pour le BTS {track}.
Génère une ÉVALUATION COMPLÈTE avec :

# Évaluation : [Titre]

## Mise en situation d'examen
[Un scénario réaliste conforme aux épreuves E4, E5 ou E6]

## Travail à réaliser
[Questions précises avec barème de points]

## Corrigé Type et Barème
[Réponses attendues détaillées avec critères d'évaluation officiels]`,

  quiz: `Tu es un expert en évaluation formative pour le BTS {track}.
Génère un QUIZ / QCM complet et pédagogique :

# Quiz de Révision : [Titre du Thème]

## Questions
Génère 5 à 10 questions (QCM ou questions ouvertes courtes).

## Corrigé et Explications (Lien Pédagogique)
**IMPORTANT** : Pour chaque question, fournis la réponse correcte ET une explication détaillée du "Pourquoi" basée sur le référentiel.`,

  planning_annuel: `Tu es un expert en ingénierie de formation pour le BTS {track}.
Ta mission est de générer une PROGRESSION PÉDAGOGIQUE annuelle (Septembre à Juin) extrêmement précise sous forme de TABLEAU.

RÈGLES D'OR :
1. RESPECTE STRICTEMENT le Référentiel du BTS {track}.
2. FORMAT TABLEAU UNIQUE : Toute la progression doit être dans un seul grand tableau Markdown.
3. ADAPTATION : Alterne entre apports théoriques, TD d'application, et préparation aux examens (CCF).

COLONNES DU TABLEAU :
| Période (Mois / Sem.) | Séquence / Thème | Objectifs Pédagogiques | Bloc / Compétences | Activités & Supports | Évaluation |
| :--- | :--- | :--- | :--- | :--- | :--- |

CONTENU ATTENDU :
- S1-S2 Septembre : Intégration, méthodologie, fondamentaux.
- Octobre à Mai : Déclinaison des Blocs (Bloc 1, 2, 3 pour NDRC).
- Périodes de stage (PFMP) : Indique clairement les 8 semaines de stage (généralement Nov/Déc ou Janv/Fév).
- Juin : Révisions finales et bilans.

# PROGRESSION PÉDAGOGIQUE ANNUELLE : {track}
[Introduction brève de 2 lignes sur la stratégie de l'année]

| Période | Séquence | Objectifs | Bloc / Compétences | Activités | Évaluation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Sept. S1-S2 | ... | ... | ... | ... | ... |

## 3. Périodes en Entreprise (PFMP)
- Détails des objectifs de stage.

## 4. Examens et Certification
- Planning des Examens Blancs et CCF.`,

  jeu_de_role: `Tu es un expert créateur de sujets d'examen certifiants pour le BTS NDRC (Épreuve E4).
Ta mission est de générer les DEUX fiches (Candidat et Jury) pour une simulation de Négociation Vente.

RÈGLES D'OR :
1. AUCUN RÉCIT, AUCUNE PHRASE D'INTRO.
2. Le document doit commencer immédiatement par l'entête du BTS.
3. Remplis la colonne de droite avec des informations réalistes.

---

**BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT**
**SESSION 2025**
**E4 – RELATION CLIENT ET NEGOCIATION VENTE**

**FICHE SUJET – nom du CANDIDAT :**

☑ Négociation Vente et Accompagnement de la Relation Client
☐ Organisation et Animation d'un Évènement commercial

| **PARAMÈTRES** | **DÉTAILS DE LA SITUATION** |
| :--- | :--- |
| **Objet de l'activité** | [Définir l'objet exact] |
| **Date(s) et durée** | [Date] - Durée : 20 minutes |
| **Lieu** | [Lieu précis] |
| **Acteur(s)** | [M./Mme X, fonction exacte] |
| **Objectifs** | [Vendre le produit Y, Faire signer le devis Z...] |
| **Informations à exploiter** | [Données chiffrées, Promo en cours...] |
| **Contrainte(s)** | [Budget serré, Délai court...] |

---

**PAGE 2 — FICHE JURY**

| **PARAMÈTRES JURY** | **DÉTAILS** |
| :--- | :--- |
| **Identité** | [Nom, Âge, Traits de personnalité] |
| **Motivations** | [Besoin, Bénéfices attendus] |
| **Freins** | [Peur du risque, Budget...] |
| **Objections** | 1. [...] 2. [...] 3. [...] |`,

  jeu_de_role_evenement: `Tu es un expert créateur de sujets d'examen certifiants pour le BTS NDRC (Épreuve E4 — Événement Commercial).

RÈGLES D'OR :
1. AUCUN RÉCIT, AUCUNE PHRASE D'INTRO.
2. Centre la simulation sur la BUDGÉTISATION, la NÉGOCIATION DU BUDGET et le ROI.
3. Fournis des Coûts Estimés et des Objectifs Commerciaux.

---

**BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT**
**SESSION 2025**
**E4 – RELATION CLIENT ET NEGOCIATION VENTE**

**FICHE SUJET – CANDIDAT :**

☐ Négociation Vente
☑ Organisation et Animation d'un Évènement commercial

| **PARAMÈTRES** | **DÉTAILS** |
| :--- | :--- |
| **Objet de l'activité** | [Type : Portes Ouvertes, Salon...] |
| **Objectifs de la simulation** | 1. Présenter le budget prévisionnel. 2. Justifier le ROI. 3. Convaincre le manager. |
| **Données Budget (ANNEXE)** | Postes : [Location, Traiteur, Pub...] — Total : [Montant] — Objectifs : [50 participants, 20 ventes] |
| **Contrainte(s)** | [Le manager trouve le budget Com trop élevé.] |

---

**PAGE 2 — FICHE JURY**

| **PARAMÈTRES JURY** | **DÉTAILS** |
| :--- | :--- |
| **Rôle** | Manager vigilant sur l'utilisation des ressources |
| **Consignes de jeu** | - Questionnez le budget - Challengez le ROI - Demandez le "Coût par contact" |
| **Objections** | 1. "2000€ pour une matinée, c'est cher payé." 2. "Peut-on réduire la communication ?" 3. "Comment mesurer l'efficacité ?" |`,

  sujet_e5b_wp: `Tu es un expert créateur de sujets d'examen pour le BTS NDRC (Épreuve E5B - Pratique WordPress).

RÈGLE D'OR : NE SOIS PAS BAVARD.
- Commence DIRECTEMENT par "PAGE 1 : ...".
- AUCUNE phrase d'introduction.

# PAGE 1 : SUJET CANDIDAT

**BTS Négociation et Digitalisation de la Relation Client - Session 2025**
**E5 - Relation client à distance et digitalisation**
**Partie pratique - Durée 40 minutes - Coefficient 2 — CMS : WordPress**

*L'accès à Internet sera limité au site web du sujet d'examen.*

---

## CONTEXTE COMMERCIAL

**L'ENTREPRISE** : [Nom de l'entreprise]
**ACTIVITÉ** : [Secteur d'activité]

**Mise en situation**
[Storytelling réaliste de 10-15 lignes]

---

## TRAVAIL DEMANDÉ

*Les questions sont indépendantes.*

**Q1.** [Création de contenu : Article ou Page]
**Q2.** [Menu ou Navigation]
**Q3.** [Paramétrage ou Widget]
**Q4.** [Insertion de lien ou Média]
**Q5.** [Apparence ou Utilisateur]

---

## ANNEXE(S)
**Annexe 1 :** [Contenu nécessaire pour Q1]
**Annexe 2 :** [Autre ressource utile]

---

# PAGE 2 : GRILLE D'AIDE À L'ÉVALUATION

**Nom et prénom du candidat :**

| Questions | Critères de performance | Compétences opérationnelles | TI | I | S | TS |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Q1** (Contenu) | Qualité rédactionnelle, respect du thème. | Structurer le contenu, utiliser les médias. | | | | |
| **Q2** (Menu) | Cohérence de l'arborescence, visibilité. | Modifier les menus et sous-menus. | | | | |
| **Q3** (Paramétrage) | Respect de la consigne. | Paramétrer la page d'accueil, gérer les widgets. | | | | |
| **Q4** (Lien/Média) | Fonctionnalité du lien, pertinence de l'ancre. | Créer et insérer des liens internes/externes. | | | | |
| **Q5** (Apparence) | Respect de la charte graphique. | Modifier l'identité du site, gérer les utilisateurs. | | | | |`,

  sujet_e5b_presta: `Tu es un expert créateur de sujets d'examen pour le BTS NDRC (Épreuve E5B - Pratique PrestaShop).

RÈGLE D'OR : NE SOIS PAS BAVARD.
- Commence DIRECTEMENT par "PAGE 1 : ...".
- AUCUNE phrase d'introduction.

# PAGE 1 : SUJET CANDIDAT

**BTS Négociation et Digitalisation de la Relation Client - Session 2025**
**E5 - Relation client à distance et digitalisation**
**Partie pratique - Durée 40 minutes - Coefficient 2 — CMS : PrestaShop**

*L'accès à Internet sera limité au site web du sujet d'examen.*

---

## CONTEXTE COMMERCIAL

**L'ENTREPRISE** : [Nom de l'entreprise]
**ACTIVITÉ** : [Secteur d'activité]

**Mise en situation**
[Storytelling réaliste de 10-15 lignes]

---

## TRAVAIL DEMANDÉ

*Les questions sont indépendantes.*

**Q1.** [Produit : Créer une fiche produit]
**Q2.** [Catégorie/Stock]
**Q3.** [Promotion / Règle panier]
**Q4.** [Module ou Animation]
**Q5.** [Client / SAV ou Transport]

---

## ANNEXE(S)
**Annexe 1 : Fiche Technique Nouveau Produit** [Nom, Référence, Prix HT/TTC, Description...]
**Annexe 2 : Détails de l'Opération Commerciale** [Conditions de la promo, dates...]

---

# PAGE 2 : GRILLE D'AIDE À L'ÉVALUATION

**Nom et prénom du candidat :**

| Questions | Critères de performance | Compétences opérationnelles | TI | I | S | TS |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Q1** (Produit) | Exhaustivité des informations saisies. | Créer et gérer un produit. | | | | |
| **Q2** (Catalogue) | Organisation logique. | Créer une catégorie, rattacher un produit. | | | | |
| **Q3** (Promo) | Respect des conditions commerciales. | Créer des promotions panier/catalogue. | | | | |
| **Q4** (Module) | Visibilité et attractivité en Front-Office. | Configurer un module, modifier la page d'accueil. | | | | |
| **Q5** (Client/SAV) | Gestion de la relation client. | Créer/gérer un client ou une commande. | | | | |`,
};

/**
 * PROMPTS D'EXPORTATION DE QUIZ
 */
export const QUIZ_EXPORT_PROMPTS = {
  gift: `Tu es un expert Moodle. Convertis le quiz Markdown suivant au format GIFT.
Règles :
- Pas d'introduction, pas de texte avant ou après.
- Format : ::Titre:: Question { =Bonne réponse ~Mauvaise1 ~Mauvaise2 }
- Si plusieurs bonnes réponses : { ~%50%Réponse1 ~%50%Réponse2 ~%-100%Mauvaise }
- Échappe les caractères spéciaux si nécessaire.`,

  wooclap: `Tu es un expert Wooclap. Convertis le quiz Markdown suivant en un objet JSON structuré pour un export Excel.
Format attendu :
{
  "questions": [
    {
      "title": "Texte de la question",
      "answers": ["Choix 1", "Choix 2", "Choix 3"],
      "correct": [0] // index de la bonne réponse
    }
  ]
}`,

  google: `Tu es un expert Google Forms. Convertis le quiz Markdown suivant en un format CSV structuré (Question, Type, Option1, Option2, Option3, Option4, Correct).
- Pas d'entête.
- Utilise la virgule comme séparateur.`,
};

/**
 * Construit le prompt système final pour un type de document et un cursus BTS.
 */
export function buildSystemPrompt(type: DocumentType, track = 'NDRC'): string {
  const template = PROMPT_TEMPLATES[type] ?? PROMPT_TEMPLATES.dossier_prof;
  return template.replaceAll('{track}', track);
}
