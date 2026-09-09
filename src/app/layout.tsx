import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mr.Crazy",
  description: "SaaS premium de aprendizado de ingles com IA conversacional.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
