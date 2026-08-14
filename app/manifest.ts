import type { MetadataRoute } from "next";

// Icônes en SVG (vectoriel, une seule source pour toutes les tailles) plutôt
// qu'en PNG rastérisé — aucun outil de rendu d'image (sharp, etc.) n'était
// disponible dans cet environnement pour générer des PNG à partir du logo.
// Fonctionne pour l'installabilité PWA sur les navigateurs modernes (Chrome/
// Edge/Android) ; envisager d'exporter des PNG 192/512 pour une compatibilité
// maximale (anciens Android, certains launchers) si besoin plus tard.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlannIt",
    short_name: "PlannIt",
    description: "Ton planning, enfin clair. Organise ta semaine, colore tes activités, synchronise Google Calendar.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#EFE9DC",
    theme_color: "#6E7B4E",
    lang: "fr",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
