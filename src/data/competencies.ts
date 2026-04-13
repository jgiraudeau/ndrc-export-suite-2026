import { Competency } from "@/types";

export const WORDPRESS_COMPETENCIES: Competency[] = [
    { 
        id: "wp-niv1-identite", 
        level: 1, 
        category: "Apparence", 
        label: "Créer ou modifier l'identité du site (slogan, icône, logo)", 
        platform: "WORDPRESS", 
        isAcquired: false 
    },
    { 
        id: "wp-niv1-header", 
        level: 1, 
        category: "Apparence", 
        label: "Modifier l'en-tête (texte, photo et vidéo)", 
        platform: "WORDPRESS", 
        isAcquired: false 
    },
    { 
        id: "wp-niv1-menu-simple", 
        level: 1, 
        category: "Menu", 
        label: "Créer ou modifier les menus et sous-menus (Emplacement principal)", 
        platform: "WORDPRESS", 
        isAcquired: false 
    },
    { 
        id: "wp-niv1-article-page", 
        level: 1, 
        category: "Contenu", 
        label: "Créer, modifier, publier et supprimer un article, une page et une catégorie", 
        platform: "WORDPRESS", 
        isAcquired: false 
    },
    { 
        id: "wp-niv1-media-add", 
        level: 1, 
        category: "Image et vidéo", 
        label: "Ajouter un média (photo, vidéo, audio)", 
        platform: "WORDPRESS", 
        isAcquired: false 
    },
    { 
        id: "wp-niv4-seo-yoast", 
        level: 4, 
        category: "SEO", 
        label: "Activer et utiliser l'extension Yoast SEO (requête cible, méta description)", 
        platform: "WORDPRESS", 
        isAcquired: false 
    }
];

export const PRESTASHOP_COMPETENCIES: Competency[] = [
    { 
        id: "ps-niv1-product-simple", 
        level: 1, 
        category: "Contenu", 
        label: "Créer et gérer un produit (Simple)", 
        platform: "PRESTASHOP", 
        isAcquired: false 
    },
    { 
        id: "ps-niv1-category", 
        level: 1, 
        category: "Contenu", 
        label: "Créer une catégorie et une sous-catégorie / Rattacher un produit", 
        platform: "PRESTASHOP", 
        isAcquired: false 
    },
    { 
        id: "ps-niv3-order", 
        level: 3, 
        category: "Commandes", 
        label: "Créer et gérer une commande / Retours et Avoirs", 
        platform: "PRESTASHOP", 
        isAcquired: false 
    },
    { 
        id: "ps-niv4-seo", 
        level: 4, 
        category: "SEO", 
        label: "Renseigner un mot-clé, une méta-description et une balise titre", 
        platform: "PRESTASHOP", 
        isAcquired: false 
    }
];

export const E4_COMPETENCIES: Competency[] = [
    { id: "E4.CIBLER_1", label: "Analyser un portefeuille clients", block: "E4", isAcquired: false },
    { id: "E4.CIBLER_2", label: "Identifier des cibles de clientèle", block: "E4", isAcquired: false },
    { id: "E4.CIBLER_3", label: "Mettre en oeuvre une démarche de prospection", block: "E4", isAcquired: false },
    { id: "E4.CIBLER_4", label: "Développer des réseaux professionnels", block: "E4", isAcquired: false },
    { id: "E4.NEGOCIER_1", label: "Négocier et vendre une solution adaptée", block: "E4", isAcquired: false },
    { id: "E4.NEGOCIER_2", label: "Créer et maintenir une relation client durable", block: "E4", isAcquired: false },
    { id: "E4.EVENT_1", label: "Organiser un évènement commercial", block: "E4", isAcquired: false },
    { id: "E4.EVENT_2", label: "Animer un évènement commercial", block: "E4", isAcquired: false },
    { id: "E4.INFO_1", label: "Partager l'information commerciale", block: "E4", isAcquired: false }
];

export const E6_COMPETENCIES: Competency[] = [
    { id: "E6.D_1", label: "Valoriser l’offre sur le lieu de vente", block: "E6", isAcquired: false },
    { id: "E6.D_2", label: "Développer la présence réseau", block: "E6", isAcquired: false },
    { id: "E6.D_3", label: "Proposer une animation commerciale", block: "E6", isAcquired: false },
    { id: "E6.P_1", label: "Participer au développement du réseau", block: "E6", isAcquired: false },
    { id: "E6.P_2", label: "Mobiliser et évaluer le réseau", block: "E6", isAcquired: false },
    { id: "E6.VD_1", label: "Prospecter et vendre en réunion", block: "E6", isAcquired: false },
    { id: "E6.VD_2", label: "Recruter et former des vendeurs", block: "E6", isAcquired: false }
];

export const ALL_COMPETENCIES = [
    ...E4_COMPETENCIES,
    ...E6_COMPETENCIES,
    ...WORDPRESS_COMPETENCIES,
    ...PRESTASHOP_COMPETENCIES
];
