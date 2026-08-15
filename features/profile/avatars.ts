// La liste des avatars disponibles est générée automatiquement depuis
// public/avatars/ (cf. scripts/generate-avatar-manifest.mjs, ré-exécuté avant
// chaque dev/build) — ce fichier ne définit que le type, avatar-manifest.ts
// contient les données réelles.
export type AvatarOption = {
  id: string;
  src: string;
  label: string;
};

export { AVATAR_OPTIONS } from "./avatar-manifest";
