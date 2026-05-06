import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Politique de confidentialité — FullNDRC",
    description: "Politique de confidentialité et protection des données personnelles de la plateforme FullNDRC.",
};

const LAST_UPDATE = "5 mai 2026";
const CONTACT_EMAIL = "jacques.giraudeau@esully.fr";

export default function PrivacyPage() {
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
                        Politique de confidentialité
                    </h1>
                    <p className="text-slate-500 text-sm">Dernière mise à jour : {LAST_UPDATE}</p>
                </div>

                <div className="space-y-10 text-slate-300 leading-relaxed">
                    <Section title="1. Responsable du traitement">
                        <p>
                            Le responsable du traitement des données collectées via la plateforme FullNDRC est :
                        </p>
                        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl text-sm space-y-1">
                            <p><span className="text-white font-semibold">Jacques Giraudeau</span></p>
                            <p>Formateur indépendant — BTS NDRC</p>
                            <p>Email : <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a></p>
                        </div>
                    </Section>

                    <Section title="2. Données collectées">
                        <p>Selon votre rôle sur la plateforme, les données suivantes peuvent être traitées :</p>
                        <ul className="mt-4 space-y-2 list-none">
                            <DataItem label="Formateurs" value="Nom, adresse e-mail, mot de passe chiffré, statut du compte." />
                            <DataItem label="Étudiants" value="Prénom, nom, identifiant de connexion, classe, mot de passe chiffré." />
                            <DataItem label="Données pédagogiques" value="Progression, évaluations E4/E6, commentaires formateur, journal de bord, missions assignées, liens WordPress/PrestaShop, fichiers de preuves téléversés." />
                            <DataItem label="Conversations IA" value="Messages échangés avec le tuteur IA, prompts envoyés aux fonctionnalités de génération." />
                            <DataItem label="Logs de sécurité" value="Actions sensibles (connexion, modification, suppression), adresse IP, horodatage." />
                        </ul>
                    </Section>

                    <Section title="3. Finalités des traitements">
                        <ul className="space-y-2 list-disc list-inside marker:text-indigo-500">
                            <li>Suivi pédagogique et évaluation des compétences NDRC (E4, E5B, E6).</li>
                            <li>Génération d'aides pédagogiques et assistance par intelligence artificielle.</li>
                            <li>Gestion des comptes et authentification sécurisée.</li>
                            <li>Sécurité, traçabilité administrative et détection d'abus.</li>
                        </ul>
                    </Section>

                    <Section title="4. Base légale">
                        <p>
                            Le traitement repose sur l'exécution d'un contrat (accès au service pédagogique) et, pour les mineurs,
                            sur le consentement des représentants légaux ou de l'établissement conformément aux dispositions applicables.
                        </p>
                    </Section>

                    <Section title="5. Sous-traitants techniques">
                        <p>Les données sont hébergées ou traitées par les prestataires suivants :</p>
                        <div className="mt-4 space-y-3">
                            <SubProcessor name="Vercel" location="États-Unis / Europe" role="Hébergement de l'application web et stockage des fichiers (Vercel Blob)." />
                            <SubProcessor name="Railway" location="États-Unis" role="Base de données PostgreSQL." />
                            <SubProcessor name="Google / Gemini" location="États-Unis" role="Modèles d'intelligence artificielle (génération, chat, transcription)." />
                        </div>
                        <p className="mt-4 text-sm text-slate-500">
                            Ces prestataires sont soumis à des clauses contractuelles types conformes au RGPD pour les transferts hors UE.
                        </p>
                    </Section>

                    <Section title="6. Durées de conservation">
                        <div className="space-y-3 mt-2">
                            <RetentionRow label="Comptes formateurs / admin" duration="Durée du contrat + 12 mois" />
                            <RetentionRow label="Données étudiants" duration="Année scolaire active + 12 mois (sauf demande contractuelle différente)" />
                            <RetentionRow label="Fichiers de preuves et journal" duration="Même durée que le compte étudiant" />
                            <RetentionRow label="Logs de sécurité et d'audit" duration="12 à 24 mois" />
                        </div>
                    </Section>

                    <Section title="7. Vos droits">
                        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                        <ul className="mt-4 space-y-2 list-disc list-inside marker:text-indigo-500">
                            <li><strong className="text-white">Accès</strong> — obtenir une copie de vos données.</li>
                            <li><strong className="text-white">Rectification</strong> — corriger des données inexactes.</li>
                            <li><strong className="text-white">Effacement</strong> — demander la suppression de vos données.</li>
                            <li><strong className="text-white">Portabilité</strong> — recevoir vos données dans un format structuré (export JSON disponible via votre formateur ou l'administration).</li>
                            <li><strong className="text-white">Opposition</strong> — vous opposer à un traitement.</li>
                        </ul>
                        <p className="mt-4">
                            Pour exercer ces droits, contactez-nous à{" "}
                            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a>.
                            Vous pouvez également adresser une réclamation à la{" "}
                            <strong className="text-white">CNIL</strong> (www.cnil.fr).
                        </p>
                    </Section>

                    <Section title="8. Intelligence artificielle">
                        <p>
                            Certaines fonctionnalités utilisent des modèles d'IA (Google Gemini). Les contenus que vous soumettez
                            à ces fonctionnalités (messages du chat tuteur, documents pour la génération) sont transmis à Google
                            dans le cadre de l'API. Ces échanges sont soumis à la politique de confidentialité de Google.
                        </p>
                        <p className="mt-3">
                            Des quotas d'utilisation journaliers sont appliqués par rôle pour limiter l'exposition des données
                            et maîtriser les coûts.
                        </p>
                    </Section>

                    <Section title="9. Cookies et stockage local">
                        <p>
                            La plateforme utilise un cookie de session sécurisé (<code className="text-indigo-300 bg-white/5 px-1.5 py-0.5 rounded text-xs">ndrc_token</code>),
                            configuré en <span className="text-white font-semibold">httpOnly</span> et <span className="text-white font-semibold">Secure</span>.
                            Aucun token d'authentification n'est stocké dans le localStorage du navigateur.
                            Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
                        </p>
                    </Section>

                    <Section title="10. Contact">
                        <p>
                            Pour toute question relative à cette politique :{" "}
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

function DataItem({ label, value }: { label: string; value: string }) {
    return (
        <li className="flex gap-3 text-sm">
            <span className="text-indigo-400 font-semibold shrink-0 min-w-[140px]">{label} :</span>
            <span>{value}</span>
        </li>
    );
}

function SubProcessor({ name, location, role }: { name: string; location: string; role: string }) {
    return (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm">
            <div className="flex items-start justify-between gap-4 mb-1">
                <span className="font-semibold text-white">{name}</span>
                <span className="text-slate-500 text-xs shrink-0">{location}</span>
            </div>
            <p className="text-slate-400">{role}</p>
        </div>
    );
}

function RetentionRow({ label, duration }: { label: string; duration: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2 border-b border-white/5 text-sm">
            <span className="text-slate-300">{label}</span>
            <span className="text-indigo-400 font-medium sm:text-right">{duration}</span>
        </div>
    );
}
