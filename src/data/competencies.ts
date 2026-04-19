import { Competency } from "@/types";
import E4_REFERENTIAL from "../../prisma/referentiel_e4.json";
import E6_REFERENTIAL from "../../prisma/referentiel_e6.json";

export const WORDPRESS_COMPETENCIES: Competency[] = [
    // Apparence
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
        label: "Modifier l'en tête (texte, photo et vidéo)",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-menu-position",
        level: 2,
        category: "Apparence",
        label: "Modifier l'emplacement du menu principal",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-social-links",
        level: 2,
        category: "Apparence",
        label: "Activer les réseaux sociaux",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-widgets",
        level: 2,
        category: "Apparence",
        label: "Gérer les widgets en pied de page et en colonne latérale de blog",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-sidebar-layout",
        level: 2,
        category: "Apparence",
        label: "Personnaliser la structure des pages ou des articles avec une colonne latérale",
        platform: "WORDPRESS",
        isAcquired: false
    },

    // Contenu
    {
        id: "wp-niv1-article-page",
        level: 1,
        category: "Contenu",
        label: "Créer, modifier, publier et supprimer un article, une page et une catégorie",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-blocks-base",
        level: 2,
        category: "Contenu",
        label: "Utiliser les blocs : titre, paragraphe, bouton, bannière, image, galerie, tableau, flux RSS, calendrier, audio, fichier",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-spectra-base",
        level: 2,
        category: "Contenu",
        label: "Utiliser des blocs Spectra (slider, form, FAQ, testimonials, team, Google Map, countdown)",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv1-media-add",
        level: 1,
        category: "Contenu",
        label: "Ajouter un média (photo, vidéo, audio)",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-gallery",
        level: 2,
        category: "Contenu",
        label: "Insérer et modifier une galerie",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-links",
        level: 2,
        category: "Contenu",
        label: "Créer et insérer des liens internes et externes",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv3-popup",
        level: 3,
        category: "Contenu",
        label: "Créer un pop up ou une info bar via Spectra Pop Up Builder",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv3-pin-post",
        level: 3,
        category: "Contenu",
        label: "Epingler un article",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv3-comments",
        level: 3,
        category: "Contenu",
        label: "Modérer et répondre à un commentaire",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv3-privacy",
        level: 3,
        category: "Contenu",
        label: "Générer et compléter une page de politique de confidentialité",
        platform: "WORDPRESS",
        isAcquired: false
    },

    // Image et vidéo
    {
        id: "wp-niv2-media-library",
        level: 2,
        category: "Image et vidéo",
        label: "Utiliser une bibliothèque média",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-media-adjust",
        level: 2,
        category: "Image et vidéo",
        label: "Ajuster et positionner un média",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv2-media-seo",
        level: 2,
        category: "Image et vidéo",
        label: "Renseigner les textes alternatifs, le titre, la légende et la description d'une image",
        platform: "WORDPRESS",
        isAcquired: false
    },

    // Menu
    {
        id: "wp-niv1-menu-simple",
        level: 1,
        category: "Menu",
        label: "Créer ou modifier les menus et sous-menus",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv4-menu-offcanvas",
        level: 4,
        category: "Menu",
        label: "Créer un menu hors champ",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv3-menu-items",
        level: 3,
        category: "Menu",
        label: "Ajouter un élément à un menu (catégorie, page, lien personnalisé)",
        platform: "WORDPRESS",
        isAcquired: false
    },

    // Navigation
    {
        id: "wp-niv1-front-back-office",
        level: 1,
        category: "Navigation",
        label: "Utiliser les onglets backoffice et frontoffice",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv3-home-settings",
        level: 3,
        category: "Navigation",
        label: "Paramétrer la page d'accueil (page statique ou affichage des derniers articles)",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv3-reading-comments-settings",
        level: 3,
        category: "Navigation",
        label: "Modifier les réglages de lecture et de commentaires",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv4-ariane",
        level: 4,
        category: "Navigation",
        label: "Insérer un fil d'Ariane",
        platform: "WORDPRESS",
        isAcquired: false
    },

    // Référencement naturel (SEO)
    {
        id: "wp-niv4-seo-structure",
        level: 4,
        category: "SEO",
        label: "Structurer le texte (titres, sous-titres)",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv4-seo-keywords",
        level: 4,
        category: "SEO",
        label: "Utiliser des mots clés",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv4-seo-links",
        level: 4,
        category: "SEO",
        label: "Utiliser des liens internes et externes",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv4-seo-tags",
        level: 4,
        category: "SEO",
        label: "Renseigner les étiquettes, balises et les descriptions",
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
    },

    // Utilisateurs
    {
        id: "wp-niv3-users",
        level: 3,
        category: "Utilisateurs",
        label: "Créer, modifier ou supprimer un compte",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv3-roles",
        level: 3,
        category: "Utilisateurs",
        label: "Attribuer un rôle",
        platform: "WORDPRESS",
        isAcquired: false
    },
    {
        id: "wp-niv3-change-author",
        level: 3,
        category: "Utilisateurs",
        label: "Changer l'auteur d'un article ou d'une page",
        platform: "WORDPRESS",
        isAcquired: false
    }
];

export const PRESTASHOP_COMPETENCIES: Competency[] = [
    // Apparence
    {
        id: "ps-niv1-home-blocks",
        level: 1,
        category: "Apparence",
        label: "Modifier la position d'affichage des blocs sur la page d'accueil",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-home-popular-position",
        level: 2,
        category: "Apparence",
        label: "Modifier la position d'affichage des produits populaires",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-home-new-products-duration",
        level: 2,
        category: "Apparence",
        label: "Configurer la durée d'affichage des nouveaux produits",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-footer-link-widgets",
        level: 2,
        category: "Apparence",
        label: "Gérer la liste de liens (link widgets) du pied de page",
        platform: "PRESTASHOP",
        isAcquired: false
    },

    // Contenu
    {
        id: "ps-niv1-product-simple",
        level: 1,
        category: "Contenu",
        label: "Créer et gérer un produit",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv1-product-fields",
        level: 1,
        category: "Contenu",
        label: "Renseigner les champs d'une fiche produit (prix, stock, catégorie, mise en ligne)",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-personalization",
        level: 2,
        category: "Contenu",
        label: "Gérer la personnalisation du produit par le client",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv1-category",
        level: 1,
        category: "Contenu",
        label: "Créer une catégorie et une sous-catégorie",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv1-category-attach-product",
        level: 1,
        category: "Contenu",
        label: "Rattacher un produit à une catégorie",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-combinations",
        level: 2,
        category: "Contenu",
        label: "Créer les déclinaisons d'un produit",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-price-impact-ttc-ht",
        level: 2,
        category: "Contenu",
        label: "Gérer les impacts prix TTC/HT",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-attributes-features",
        level: 2,
        category: "Contenu",
        label: "Créer et modifier un attribut/une caractéristique et leurs valeurs",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-pack",
        level: 2,
        category: "Contenu",
        label: "Créer un pack de produits",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-product-association",
        level: 2,
        category: "Contenu",
        label: "Associer deux produits",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv1-online",
        level: 1,
        category: "Contenu",
        label: "Mettre en ligne un produit",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-brand",
        level: 2,
        category: "Contenu",
        label: "Créer une marque",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv3-customer",
        level: 3,
        category: "Contenu",
        label: "Créer et gérer un client et un groupe de clients",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-carrier",
        level: 2,
        category: "Contenu",
        label: "Créer et gérer un transporteur",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-stock",
        level: 2,
        category: "Contenu",
        label: "Gérer les stocks",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv3-handle-messages-orders",
        level: 3,
        category: "Contenu",
        label: "Traiter les messages, les réclamations, les commandes",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv3-sav",
        level: 3,
        category: "Contenu",
        label: "Rédiger des messages prédéfinis dans le SAV",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-links",
        level: 2,
        category: "Contenu",
        label: "Créer et insérer des liens",
        platform: "PRESTASHOP",
        isAcquired: false
    },

    // Commandes et promotions
    {
        id: "ps-niv3-order",
        level: 3,
        category: "Commandes et promotions",
        label: "Créer et gérer une commande",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv3-returns-credit",
        level: 3,
        category: "Commandes et promotions",
        label: "Gérer les retours et les avoirs (remboursement total et partiel)",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv3-return-conditions",
        level: 3,
        category: "Commandes et promotions",
        label: "Paramétrer les conditions de retour produits",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv3-promo-catalog",
        level: 3,
        category: "Commandes et promotions",
        label: "Créer des promotions catalogue, panier et prix spécifique",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv3-promo-cart",
        level: 3,
        category: "Commandes et promotions",
        label: "Créer une promotion panier (code promo, conditions, durée)",
        platform: "PRESTASHOP",
        isAcquired: false
    },

    // Image
    {
        id: "ps-niv2-image-legend-description",
        level: 2,
        category: "Image",
        label: "Modifier la légende et la description",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv2-image-cover",
        level: 2,
        category: "Image",
        label: "Modifier l'image de couverture d'un produit",
        platform: "PRESTASHOP",
        isAcquired: false
    },

    // Module
    {
        id: "ps-niv2-home-featured",
        level: 2,
        category: "Module",
        label: "Activer/désactiver et configurer les produits phares",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-module-carousel",
        level: 4,
        category: "Module",
        label: "Activer/désactiver et configurer le module Carrousel",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-module-main-menu",
        level: 4,
        category: "Module",
        label: "Activer/désactiver et configurer le module Menu Principal",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-module-text-block",
        level: 4,
        category: "Module",
        label: "Activer/désactiver et configurer le module Bloc Texte",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-module-reassurance",
        level: 4,
        category: "Module",
        label: "Activer/désactiver et configurer le module Réassurance",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-module-social-share",
        level: 4,
        category: "Module",
        label: "Activer/désactiver et configurer le module Bouton de partage des réseaux sociaux",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv3-comments-module",
        level: 3,
        category: "Module",
        label: "Activer/désactiver et configurer le module Commentaires Produits",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-module-check",
        level: 4,
        category: "Module",
        label: "Activer/désactiver et configurer le module Chèque",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-modules",
        level: 4,
        category: "Module",
        label: "Configurer les modules de la boutique (carrousel, menu, texte, réassurance, partage, commentaires, chèque)",
        platform: "PRESTASHOP",
        isAcquired: false
    },

    // Navigation
    {
        id: "ps-niv1-front-back-office",
        level: 1,
        category: "Navigation",
        label: "Utiliser les onglets backoffice et frontoffice",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv1-menu-main",
        level: 1,
        category: "Navigation",
        label: "Gérer le menu principal de la boutique",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-alias",
        level: 4,
        category: "Navigation",
        label: "Créer des alias",
        platform: "PRESTASHOP",
        isAcquired: false
    },

    // Référencement naturel (SEO)
    {
        id: "ps-niv4-seo",
        level: 4,
        category: "SEO",
        label: "Renseigner un mot-clé, une méta-description et une balise titre",
        platform: "PRESTASHOP",
        isAcquired: false
    },

    // Utilisateurs
    {
        id: "ps-niv4-user-create",
        level: 4,
        category: "Utilisateurs",
        label: "Créer un nouveau collaborateur",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-users",
        level: 4,
        category: "Utilisateurs",
        label: "Attribuer les permissions",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-user-profile-assign",
        level: 4,
        category: "Utilisateurs",
        label: "Affecter un profil à un employé",
        platform: "PRESTASHOP",
        isAcquired: false
    },
    {
        id: "ps-niv4-user-profile-update",
        level: 4,
        category: "Utilisateurs",
        label: "Modifier un profil existant",
        platform: "PRESTASHOP",
        isAcquired: false
    }
];

type ReferentialChild = { description: string };
type ReferentialBlock = { code: string; block: string; children?: ReferentialChild[] };

function buildExamCompetencies(data: ReferentialBlock[]): Competency[] {
    return data.flatMap((item) =>
        (item.children || []).map((child, idx) => ({
            id: `${item.code}_${idx}`,
            label: child.description,
            block: item.block,
            isAcquired: false,
        }))
    );
}

export const E4_COMPETENCIES: Competency[] = buildExamCompetencies(E4_REFERENTIAL as ReferentialBlock[]);
export const E6_COMPETENCIES: Competency[] = buildExamCompetencies(E6_REFERENTIAL as ReferentialBlock[]);

export const ALL_COMPETENCIES = [
    ...E4_COMPETENCIES,
    ...E6_COMPETENCIES,
    ...WORDPRESS_COMPETENCIES,
    ...PRESTASHOP_COMPETENCIES
];
