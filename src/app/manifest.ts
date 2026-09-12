import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mr.Crazy - Inglês Americano",
    short_name: "Mr.Crazy",
    description: "Treino conversacional de inglês americano com correções em tempo real.",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "window-controls-overlay", "minimal-ui"],
    background_color: "#070809",
    theme_color: "#070809",
    orientation: "portrait",
    lang: "pt-BR",
    categories: ["education", "productivity"],
    icons: [
      { src: "/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
