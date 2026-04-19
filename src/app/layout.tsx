import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "FullNDRC - Passeport Pro BTS NDRC",
  description: "Plateforme de suivi des compétences et évaluations E4, E5B et E6 pour le BTS NDRC.",
  applicationName: "FullNDRC",
  icons: {
    icon: [
      { url: "/fullndrc-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: [{ url: "/fullndrc-icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${nunito.variable} antialiased bg-slate-50`}>
        {children}
      </body>
    </html>
  );
}
