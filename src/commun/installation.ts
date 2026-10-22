// La version installable (étape 12, accord d'Adrien du 22/10/2026) : le service hors ligne, et la rubrique « Installer
// le jeu » de Plus, qui disparaît une fois le jeu installé. Android propose l'installation lui-même (on garde sa
// demande pour la déclencher au toucher) ; sur iPhone, il faut passer par le bouton Partager de Safari.

import { confirmer } from './confirmation'

declare const __VERSION__: string

interface DemandeInstallation extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }

let demande: DemandeInstallation | null = null

/** Le jeu tourne-t-il déjà en application (lancé depuis l'icône) ? */
export const estInstalle = (): boolean =>
  matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true

/** Enregistre le service hors ligne et branche la rubrique d'installation (cachée si le jeu est déjà installé). */
export function preparerInstallation(rubrique: HTMLElement | null): void {
  if ('serviceWorker' in navigator && __VERSION__ !== 'locale') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sans service : le jeu marche quand même, en ligne */ })
  }
  if (!rubrique) return
  rubrique.hidden = estInstalle()
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); demande = e as DemandeInstallation })
  addEventListener('appinstalled', () => { rubrique.hidden = true; demande = null })
  rubrique.addEventListener('click', () => { void installer(rubrique) })
}

async function installer(rubrique: HTMLElement): Promise<void> {
  if (demande) {
    const d = demande
    demande = null
    await d.prompt()
    if ((await d.userChoice).outcome === 'accepted') rubrique.hidden = true
    return
  }
  const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent)
  await confirmer({
    titre: 'Installer le jeu',
    texte: iphone
      ? ['Dans Safari, touche le bouton Partager (le carré avec une flèche vers le haut), puis «\u00a0Sur l\'écran d\'accueil\u00a0».',
        'La capsule t\'attendra sur ton écran d\'accueil, en plein écran.']
      : ['Dans le menu du navigateur (les trois points en haut à droite), choisis «\u00a0Installer l\'application\u00a0» ou «\u00a0Ajouter à l\'écran d\'accueil\u00a0».',
        'La capsule t\'attendra sur ton écran d\'accueil, en plein écran.'],
    oui: 'COMPRIS',
    non: 'FERMER',
  })
}
