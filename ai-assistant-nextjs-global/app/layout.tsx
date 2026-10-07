import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const SITE_URL = "https://ai-assistant-nextjs-global.thiernooury89.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Assistant Production Vidéo — ATA SUARL × Swiss Umef",
  description:
    "Assistant IA de production vidéo pour les étudiants de Swiss Umef University Campus de Dakar : cadrages, lumière, prompts de génération.",
  applicationName: "Assistant Production Vidéo",
  openGraph: {
    title: "Assistant Production Vidéo — ATA SUARL × Swiss Umef",
    description:
      "Cadrages, lumière et prompts de génération pour les étudiants de Swiss Umef University Campus de Dakar.",
    siteName: "Assistant Production Vidéo",
    locale: "fr_FR",
    type: "website",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Assistant Production Vidéo — ATA SUARL × Swiss Umef" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1418",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
