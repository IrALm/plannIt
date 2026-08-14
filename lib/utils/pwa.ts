export function isIOSDevice(): boolean {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Instructions manuelles quand beforeinstallprompt n'est pas (encore) disponible. */
export function getPlatformInstallHint(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  const isAndroid = /android/i.test(ua);
  const isChromium = /chrome|chromium|edg/i.test(ua) && !/firefox/i.test(ua);

  if (isIOSDevice()) {
    return "Bouton Partager (le carré avec la flèche) → « Sur l'écran d'accueil ».";
  }
  if (isAndroid && isChromium) {
    return "Menu ⋮ en haut à droite → « Installer l'application ».";
  }
  if (isChromium) {
    return "Icône ⊕ dans la barre d'adresse, ou menu ⋮ → « Installer PlannIt… ».";
  }
  return "Cherche « Installer » ou « Ajouter à l'écran d'accueil » dans le menu de ton navigateur.";
}
