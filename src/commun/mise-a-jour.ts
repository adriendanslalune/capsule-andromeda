// Mise à jour automatique : GitHub Pages demande au téléphone de garder la page 10 minutes en mémoire ; sans rien
// faire, on verrait l'ancienne version pendant ce temps. Le jeu relit donc version.json (sans mémoire) à l'ouverture et
// à chaque retour dans l'application ; si une version plus récente est en ligne, il se recharge sur une adresse neuve
// (…?v=abc1234), que le téléphone n'a pas en mémoire.

declare const __VERSION__: string

/** Vérifie la version en ligne ; avant de recharger, appelle avantRechargement (pour sauvegarder la partie). */
export async function verifierMiseAJour(avantRechargement: () => void): Promise<void> {
  if (__VERSION__ === 'locale') return
  try {
    const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!r.ok) return
    const { version } = (await r.json()) as { version?: string }
    if (!version || version === __VERSION__) return
    // Une seule tentative par version : si le serveur sert encore l'ancienne page, on n'insiste pas en boucle.
    const cle = `andromeda-maj-${version}`
    if (sessionStorage.getItem(cle)) return
    sessionStorage.setItem(cle, '1')
    avantRechargement()
    const adresse = new URL(location.href)
    adresse.searchParams.set('v', version)
    location.replace(adresse.toString())
  } catch { /* hors ligne, ou mémoire de session indisponible : on garde la version actuelle */ }
}

/** Vérifie à l'ouverture, à chaque retour dans l'application, et toutes les 5 minutes. */
export function surveillerMisesAJour(avantRechargement: () => void): void {
  const verifier = () => { void verifierMiseAJour(avantRechargement) }
  verifier()
  document.addEventListener('visibilitychange', () => { if (!document.hidden) verifier() })
  setInterval(verifier, 5 * 60_000)
}
