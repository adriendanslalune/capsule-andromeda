// Le volet Profil (dans « Plus » ; étape 8, écrans d'abord, d'après la maquette validée le 18/10/2026) : le pseudo du
// joueur (son nom dans les Messages), la toile d'araignée de son affinité avec les trois Maisons, son carnet de bord
// et les zones à libérer. L'appartenance à une Maison (proposée selon l'affinité) viendra à l'étape 8.

import { MAISONS, titreMaison } from '../donnees/maisons'
import type { Jeu } from '../moteur/jeu'
import { affinites, maisonPreferee } from '../moteur/profil'
import { NOMBRE_MONOLITHES, PALIERS } from '../donnees/monolithes'
import { palierSuivant, statut } from '../moteur/monolithes'

const TEINTES: Record<string, string> = { nettoyeurs: '#bfe0c8', commercants: '#f5d38a', mercenaires: '#f3c2b0' }
/** Les zones de la campagne (acte 1). */
const ZONES = ['Lune', 'Mars', 'Lunes de Jupiter', 'Saturne', 'Uranus', 'Triton']

/** La toile d'araignée : un axe par Maison ; la forme dit où penche le joueur. */
function toile(jeu: Jeu): string {
  const a = affinites(jeu), max = Math.max(...Object.values(a)) || 1
  const cx = 130, cy = 122, R = 78
  const angle = (k: number) => ((-90 + k * 120) * Math.PI) / 180
  const pt = (k: number, r: number) => `${(cx + r * Math.cos(angle(k))).toFixed(1)} ${(cy + r * Math.sin(angle(k))).toFixed(1)}`
  let s = '<svg class="toile" viewBox="0 0 260 236" role="img" aria-label="Affinité avec les Maisons">'
  for (const f of [1 / 3, 2 / 3, 1]) s += `<path d="M${[0, 1, 2].map((k) => pt(k, R * f)).join(' L')}Z" class="anneau"/>`
  for (let k = 0; k < 3; k++) s += `<path d="M${cx} ${cy} L${pt(k, R)}" class="axe"/>`
  const forme = MAISONS.map((m, k) => pt(k, R * Math.max(0.08, a[m.maison] / max))).join(' L')
  const pref = maisonPreferee(jeu)
  s += `<path d="M${forme}Z" class="forme" style="fill:${pref ? TEINTES[pref] : '#d7cdee'}"/>`
  const places: [number, number, string][] = [[cx, 16, 'middle'], [cx + 96, cy + 70, 'middle'], [cx - 96, cy + 70, 'middle']]
  MAISONS.forEach((m, k) => {
    const [x, y, ancre] = places[k]
    s += `<text x="${x}" y="${y}" text-anchor="${ancre}" class="nom-maison">${m.titre}</text>`
      + `<text x="${x}" y="${y + 13}" text-anchor="${ancre}" class="part">${Math.round(a[m.maison] * 100)} %</text>`
  })
  return s + '</svg>'
}

/** La collection de monolithes : le statut dans les Messages, et le chemin jusqu'au palier suivant. */
function htmlCollection(jeu: Jeu): string {
  const n = jeu.monolithes.trouves.length, s = statut(n), suivant = palierSuivant(n)
  return `<h3>Monolithes</h3><div class="bloc"><div class="rang"><span>Trouvés</span><b>${n} / ${NOMBRE_MONOLITHES}</b></div>`
    + `<div class="rang"><span>Statut dans les Messages</span><b>${s ?? 'aucun'}</b></div>`
    + `<div class="paliers">${PALIERS.map((p) => `<span class="${n >= p.seuil ? 'atteint' : ''}"><b>${p.titre}</b><small>${p.seuil}</small></span>`).join('')}</div>`
    + `<p class="petit">${suivant ? `Encore ${suivant.seuil - n} monolithe${suivant.seuil - n > 1 ? 's' : ''} pour devenir <b>${suivant.titre}</b>. Le bouton PING de la carte les cherche à la radio.` : 'Tu as tout trouvé : Oracle !'}</p></div>`
}

export function htmlProfil(jeu: Jeu): string {
  const pref = maisonPreferee(jeu), c = jeu.carnet
  const total = MAISONS.reduce((s, m) => s + c.missions[m.maison], 0)
  return `<button type="button" class="retour" data-page="plus">‹ Plus</button>`
    + `<h3>Capitaine</h3><div class="bloc pseudo"><label for="pseudo">Ton nom dans les Messages</label>`
    + `<div class="ligne-pseudo"><input id="pseudo" type="text" maxlength="16" autocomplete="off" spellcheck="false" value="${jeu.pseudo}"/>`
    + `<button type="button" data-pseudo>OK</button></div><small>Capsule n° ${jeu.numeroSerie} · 3 à 16 lettres ou chiffres</small></div>`
    + htmlCollection(jeu)
    + `<h3>Maisons</h3><div class="bloc centre">${toile(jeu)}`
    + `<p>Maison : <b>${jeu.maison ? titreMaison(jeu.maison) : 'aucune (neutre)'}</b></p>`
    + `<p class="petit">${!total ? 'Fais des missions : ta toile se dessinera selon ce que tu préfères faire.'
      : pref ? `Tu penches vers les <b>${titreMaison(pref).toLowerCase()}</b>. Quand ton affinité sera assez forte, ils te proposeront de les rejoindre (bientôt).`
        : 'Tu n\'as pas encore de préférence nette.'}</p></div>`
    + '<h3>Carnet de bord</h3><div class="bloc">'
    + MAISONS.map((m) => `<div class="rang"><span><span class="maison maison-${m.maison}">${m.titre}</span> missions</span><b>${c.missions[m.maison]}</b></div>`).join('')
    + `<div class="rang"><span>Crédits gagnés</span><b>${c.credits.toLocaleString('fr-FR')}</b></div>`
    + `<div class="rang"><span>Objets triés dans les épaves</span><b>${c.objetsTries}</b></div></div>`
    + '<h3>Zones à libérer</h3><div class="bloc">'
    + ZONES.map((z) => `<div class="rang"><span>${z}</span><small>occupée</small></div>`).join('')
    + '<p class="petit">La campagne viendra plus tard : chaque activité dans une zone aidera à la libérer.</p></div>'
}
