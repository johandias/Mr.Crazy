import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mr.Crazy - Ingles Americano",
    short_name: "Mr.Crazy",
    description: "Treino conversacional de ingles americano com correcoes em portugues.",
    start_url: "/practice",
    scope: "/",
    display: "standalone",
    background_color: "#070809",
    theme_color: "#070809",
    orientation: "portrait-primary",
    lang: "pt-BR",
    categories: ["education", "productivity"],
    icons: [
      { src: "/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
