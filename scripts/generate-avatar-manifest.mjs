// Régénère features/profile/avatar-manifest.ts à partir du contenu réel de
// public/avatars/. Tourne avant chaque `npm run dev`/`build` (cf. package.json
// "predev"/"prebuild") — pas de lecture du dossier au runtime en prod : les
// fonctions serverless de Vercel n'ont pas de garantie d'accès fs complet à
// public/, donc on fige la liste dans un fichier TS importé normalement.
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IMAGE_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarsDir = path.join(__dirname, "..", "public", "avatars");
const outFile = path.join(__dirname, "..", "features", "profile", "avatar-manifest.ts");

function toLabel(filename) {
  const base = path.basename(filename, path.extname(filename)).replace(/^avatar-/, "");
  return base.charAt(0).toUpperCase() + base.slice(1).replace(/[-_]/g, " ");
}

async function main() {
  let files = [];
  try {
    files = await readdir(avatarsDir);
  } catch {
    console.warn(`[avatars] Dossier introuvable : ${avatarsDir} — manifeste vide généré.`);
  }

  const avatars = files
    .filter((f) => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => ({ id: path.basename(f, path.extname(f)), src: `/avatars/${f}`, label: toLabel(f) }));

  const content = `// Généré automatiquement par scripts/generate-avatar-manifest.mjs
// à partir du contenu de public/avatars/ — NE PAS ÉDITER À LA MAIN.
// Pour ajouter un avatar : déposer l'image dans public/avatars/ et relancer
// \`npm run dev\` ou \`npm run build\` (le script tourne automatiquement avant).
import type { AvatarOption } from "./avatars";

export const AVATAR_OPTIONS: AvatarOption[] = ${JSON.stringify(avatars, null, 2)};
`;

  const { writeFile } = await import("node:fs/promises");
  await writeFile(outFile, content, "utf8");
  console.log(`[avatars] ${avatars.length} avatar(s) trouvé(s) dans public/avatars/ → ${path.relative(process.cwd(), outFile)}`);
}

main();
