import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";
import "./responsive.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mrcrazy.fun"),
  title: {
    default: "Mr.Crazy — Inglês Sem Frescura | Treino de Fala com IA Realtime",
    template: "%s | Mr.Crazy"
  },
  description: "Pare de travar no inglês. Pratique conversação oral com o Mr. Crazy, com correções anatômicas na hora, fases gamificadas e apoio 100% em português.",
  applicationName: "Mr.Crazy",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.mrcrazy.fun",
    siteName: "Mr.Crazy",
    title: "Mr.Crazy — Destrave seu Inglês Falando de Verdade",
    description: "Chega de cursinho chato e 5 anos decorando regra. Treine fala real com o Mr.Crazy: correções imediatas de pronúncia e feedback na hora.",
    images: [
      {
        url: "/assets/email/mrcrazy-fala-ai-email.png",
        width: 1200,
        height: 630,
        alt: "Mr.Crazy - Treinador de Conversação em Inglês"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Mr.Crazy — Inglês Sem Frescura",
    description: "Pratique sua fala com o Mr. Crazy. Pare de travar e comece a falar de verdade.",
    images: ["/assets/email/mrcrazy-fala-ai-email.png"]
  },
  appleWebApp: {
    capable: true,
    title: "Mr.Crazy",
    statusBarStyle: "black"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-touch-fullscreen": "yes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#070809",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
