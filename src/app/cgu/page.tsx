import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Conditions Générales d'Utilisation — FullNDRC",
    description: "Conditions Générales d'Utilisation de la plateforme pédagogique FullNDRC.",
};

const LAST_UPDATE = "5 mai 2026";
const CONTACT_EMAIL = "jacques.giraudeau@esully.fr";

export default function CguPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <nav className="relative z-10 max-w-4xl mx-auto px-6 h-20 flex items-center">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Retour à l'accueil
                </Link>
            </nav>

            <main className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
                <div className="mb-12">
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Légal</p>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        Conditions Générales d'Utilisation
                    </h1>
                    <p className="text-slate-500 text-sm">Dernière mise à jour : {LAST_UPDATE}</p>
                </div>

                <div className="space-y-10 text-slate-300 leading-relaxed">
                    <Section title="1. Présentation du service">
                        <p>
                            FullNDRC est une plateforme pédagogique dédiée au suivi des compétences et aux évaluations
                            E4, E5B et E6 du BTS Négociation et Digitalisation de la Relation Client (NDRC).
                            Elle est éditée et exploitée par Jacques Giraudeau, formateur indépendant
                            (<a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a>).
                        </p>
                        <p className="mt-3">
                            Le service est accessible sur abonnement ou dans le cadre d'un accord avec un établissement
                            de formation. L'accès est soumis à la création d'un compte par un formateur habilité ou par l'administration.
                        </p>
                    </Section>

                    <Section title="2. Accès et comptes utilisateurs">
                        <p>Trois rôles sont définis sur la plateforme :</p>
                        <div className="mt-4 space-y-3">
                            <RoleCard role="Administrateur" description="Gère les formateurs, les établissements et surveille l'ensemble de la plateforme." color="text-red-400" />
                            <RoleCard role="Formateur" description="Importe et gère ses classes d'étudiants, attribue des missions, évalue les compétences, consulte les journaux et portfolios." color="text-amber-400" />
                            <RoleCard role="Étudiant" description="Consulte ses évaluations, complète son journal de bord, accède aux missions et au tuteur IA." color="text-emerald-400" />
                        </div>
                        <p className="mt-4">
                            Chaque utilisateur est responsable de la confidentialité de ses identifiants.
                            Toute utilisation du compte est réputée effectuée par son titulaire.
                            En cas de compromission, l'utilisateur doit immédiatement modifier son mot de passe
                            et prévenir l'administrateur.
                        </p>
                    </Section>

                    <Section title="3. Utilisation acceptable">
                        <p>L'utilisation de la plateforme est strictement limitée à un cadre pédagogique légal. Il est interdit de :</p>
                        <ul className="mt-4 space-y-2 list-disc list-inside marker:text-red-500">
                            <li>Accéder aux données d'un autre utilisateur sans autorisation.</li>
                            <li>Téléverser des fichiers contenant des logiciels malveillants ou des contenus illicites.</li>
                            <li>Tenter de contourner les mécanismes d'authentification ou les quotas.</li>
                            <li>Utiliser les fonctionnalités IA pour produire des contenus contraires à la loi ou à l'éthique professionnelle.</li>
                            <li>Partager son compte avec des tiers non autorisés.</li>
                            <li>Automatiser des requêtes de manière abusive (scraping, flood).</li>
                        </ul>
                        <p className="mt-4">
                            Tout manquement à ces règles peut entraîner la suspension immédiate du compte concerné,
                            sans préjudice d'éventuelles suites judiciaires.
                        </p>
                    </Section>

                    <Section title="4. Fonctionnalités d'intelligence artificielle">
                        <p>
                            La plateforme intègre des fonctionnalités basées sur des modèles d'IA (Google Gemini) pour
                            la génération de contenus pédagogiques, l'assistance au chat et la transcription audio.
                        </p>
                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-sm">
                            <p className="font-semibold text-amber-300 mb-2">Points d'attention :</p>
                            <ul className="space-y-1 list-disc list-inside text-slate-300">
                                <li>Les contenus générés par l'IA doivent être vérifiés par le formateur avant tout usage certificatif.</li>
                                <li>L'IA peut produire des erreurs ou imprécisions — elle ne remplace pas le jugement professionnel.</li>
                                <li>Des quotas d'utilisation journaliers sont appliqués par rôle.</li>
                                <li>Les échanges avec l'IA sont journalisés à des fins de sécurité et de pilotage des coûts.</li>
                            </ul>
                        </div>
                    </Section>

                    <Section title="5. Fichiers téléversés">
                        <p>
                            Les étudiants peuvent déposer des fichiers de preuves (images, PDF, documents) dans la limite
                            de 5 Mo par fichier. Les formats acceptés sont contrôlés à l'envoi (images, PDF, documents courants).
                        </p>
                        <p className="mt-3">
                            L'utilisateur garantit disposer des droits nécessaires sur tout fichier téléversé.
                            L'éditeur se réserve le droit de supprimer tout contenu contraire aux présentes CGU.
                        </p>
                    </Section>

                    <Section title="6. Disponibilité du service">
                        <p>
                            Le service est fourni en l'état, dans le cadre d'une offre en cours de commercialisation.
                            L'éditeur s'engage à maintenir une disponibilité raisonnable mais ne garantit pas
                            une disponibilité ininterrompue (maintenance, incidents infrastructure, mises à jour).
                        </p>
                        <p className="mt-3">
                            En cas d'indisponibilité prolongée affectant un usage pédagogique critique,
                            l'éditeur informera les établissements dans les meilleurs délais.
                        </p>
                    </Section>

                    <Section title="7. Données personnelles">
                        <p>
                            Le traitement des données personnelles est décrit dans la{" "}
                            <Link href="/privacy" className="text-indigo-400 hover:underline">Politique de confidentialité</Link>.
                            En utilisant la plateforme, vous reconnaissez en avoir pris connaissance.
                        </p>
                        <p className="mt-3">
                            Les établissements contractants sont considérés comme responsables de traitement conjoints
                            pour les données de leurs étudiants. Un accord de traitement des données (DPA) peut être
                            établi sur demande.
                        </p>
                    </Section>

                    <Section title="8. Propriété intellectuelle">
                        <p>
                            La plateforme, son code, son design et ses contenus originaux (hors contenus produits par les utilisateurs)
                            sont la propriété exclusive de Jacques Giraudeau. Toute reproduction ou exploitation sans autorisation
                            écrite est interdite.
                        </p>
                        <p className="mt-3">
                            Les contenus pédagogiques produits par les formateurs via la plateforme leur appartiennent.
                            Les évaluations et journaux des étudiants leur appartiennent.
                        </p>
                    </Section>

                    <Section title="9. Modification des CGU">
                        <p>
                            L'éditeur se réserve le droit de modifier les présentes CGU à tout moment.
                            Les utilisateurs seront informés par e-mail ou par notification dans l'application
                            en cas de modification substantielle.
                            La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions.
                        </p>
                    </Section>

                    <Section title="10. Droit applicable et litiges">
                        <p>
                            Les présentes CGU sont soumises au droit français.
                            En cas de litige, les parties s'efforceront de trouver une solution amiable.
                            À défaut, les tribunaux compétents du ressort de l'éditeur seront seuls compétents.
                        </p>
                        <p className="mt-3">
                            Contact :{" "}
                            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a>
                        </p>
                    </Section>
                </div>
            </main>

            <footer className="border-t border-white/5 py-8 text-center text-slate-600 text-sm relative z-10">
                <p>© {new Date().getFullYear()} FullNDRC —{" "}
                    <Link href="/cgu" className="hover:text-slate-400 transition-colors">CGU</Link>
                    {" · "}
                    <Link href="/privacy" className="hover:text-slate-400 transition-colors">Confidentialité</Link>
                </p>
            </footer>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-white/10">{title}</h2>
            {children}
        </section>
    );
}

function RoleCard({ role, description, color }: { role: string; description: string; color: string }) {
    return (
        <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl text-sm">
            <span className={`font-bold shrink-0 w-28 ${color}`}>{role}</span>
            <span className="text-slate-400">{description}</span>
        </div>
    );
}
