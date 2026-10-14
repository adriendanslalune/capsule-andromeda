// Mise en forme des nombres, durées et heures pour l'affichage (en français).

/** Nombre avec une virgule décimale. */
export function nombre(x: number, decimales: number): string {
  return x.toFixed(decimales).replace('.', ',')
}

/** Distance en UA, avec assez de chiffres pour les petites distances. */
export function ua(d: number): string {
  return `${nombre(d, d < 0.01 ? 4 : d < 1 ? 3 : 2)} UA`
}

/** Distance en kilomètres, lisible (« 384 400 km », « 1,24 million de km »). */
export function km(x: number): string {
  if (x >= 1e6) return `${nombre(x / 1e6, x >= 1e8 ? 0 : 2)} million${x >= 2e6 ? 's' : ''} de km`
  return `${Math.round(x).toLocaleString('fr-FR')} km`
}

/** Durée lisible : « 3 j 04 h », « 5 h 12 min », « 45 min », « 2 ans 14 j ». */
export function duree(secondes: number): string {
  if (!Number.isFinite(secondes)) return '—'
  const s = Math.max(0, Math.round(secondes))
  const j = Math.floor(s / 86_400)
  const h = Math.floor((s % 86_400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (j >= 365) { const an = Math.floor(j / 365); return `${an} an${an > 1 ? 's' : ''} ${j % 365} j` }
  if (j > 0) return `${j} j ${String(h).padStart(2, '0')} h`
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`
  return `${Math.max(1, m)} min`
}

/** Durée précise pour les compteurs : « 04:12:33 », précédée des jours s'il y en a (« 258 j 04:12:33 »). */
export function dureePrecise(secondes: number): string {
  if (!Number.isFinite(secondes)) return '—'
  const s = Math.max(0, Math.floor(secondes))
  const j = Math.floor(s / 86_400)
  const deux = (n: number) => String(n).padStart(2, '0')
  const hms = `${deux(Math.floor((s % 86_400) / 3600))}:${deux(Math.floor((s % 3600) / 60))}:${deux(s % 60)}`
  return j > 0 ? `${j} j ${hms}` : hms
}

/** Heure locale « HH:MM ». */
export function heureLocale(t: number): string {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Date locale « 31 mai 2027 ». */
export function dateLocale(t: number): string {
  return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Nom d'un astre dans une phrase (« la Lune », « l'ISS », « Titan »). */
export function nomAstre(nom: string): string {
  if (nom === 'Soleil') return 'le Soleil'
  if (nom === 'Lune') return 'la Lune'
  if (nom === 'Terre') return 'la Terre'
  if (nom === 'ISS') return 'l’ISS'
  return nom
}

/**
 * Jour et heure locaux, d'autant plus précis que c'est loin : « 18:39 » aujourd'hui, « demain 18:39 »,
 * « jeu. 30 nov., 18:39 » dans l'année, « 30 nov. 2027, 18:39 » au-delà.
 */
export function jourEtHeure(t: number, maintenant: number): string {
  const d = new Date(t)
  const jour = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const ecart = Math.round((jour(d) - jour(new Date(maintenant))) / 86_400_000)
  if (ecart === 0) return heureLocale(t)
  if (ecart === 1) return `demain ${heureLocale(t)}`
  if (ecart > 1 && ecart < 300) return `${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}, ${heureLocale(t)}`
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}, ${heureLocale(t)}`
}
