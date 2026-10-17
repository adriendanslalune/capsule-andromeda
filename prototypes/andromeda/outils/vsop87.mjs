// Génère src/donnees/vsop87.ts : séries VSOP87B (Bretagnon et Francou, 1988) des huit planètes, tronquées.
//
// VSOP87B donne la position héliocentrique de chaque planète (longitude, latitude, distance) dans l'écliptique J2000,
// sous forme de sommes de termes A·cos(B + C·τ), τ en millénaires juliens depuis J2000 (temps TDB).
// Les séries complètes viennent de la bibliothèque astronomia (licence MIT) ; on ne garde que les termes dont l'effet
// dépasse un seuil, choisi par planète pour que la troncature ajoute moins de quelques centaines de km d'erreur.
//
// Usage : node prototypes/andromeda/outils/vsop87.mjs

import fs from 'node:fs'
import data from 'astronomia/data'

const UA_KM = 149_597_870.7
// Seuil (sans dimension : radians pour L et B, UA pour R, multiplié par la distance pour L et B) en km.
const SEUILS_KM = { mercury: 3, venus: 3, earth: 3, mars: 4, jupiter: 20, saturn: 30, uranus: 60, neptune: 100 }
const NOMS = { mercury: 'Mercure', venus: 'Vénus', earth: 'Terre', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturne',
  uranus: 'Uranus', neptune: 'Neptune' }
const DEMI_GRAND_AXE = { mercury: 0.387, venus: 0.723, earth: 1, mars: 1.524, jupiter: 5.203, saturn: 9.537,
  uranus: 19.19, neptune: 30.07 }

// Somme d'une série (tableau par puissance de τ de termes [A, B, C]).
function somme(series, tau) {
  let s = 0, p = 1
  for (const n of Object.keys(series).sort()) {
    let t = 0
    for (const [A, B, C] of series[n]) t += A * Math.cos(B + C * tau)
    s += t * p
    p *= tau
  }
  return s
}

function cartesien(serie, tau) {
  const l = somme(serie.L, tau), b = somme(serie.B, tau), r = somme(serie.R, tau)
  return [r * Math.cos(b) * Math.cos(l), r * Math.cos(b) * Math.sin(l), r * Math.sin(b)].map((v) => v * UA_KM)
}

// Garde un terme si son amplitude (en km, sur ±0,1 millénaire) dépasse le seuil.
function tronquer(series, echelleKm, seuilKm) {
  const sortie = {}
  for (const n of Object.keys(series).sort()) {
    const facteur = echelleKm * 0.1 ** Number(n)
    sortie[n] = series[n].filter(([A], k) => k === 0 || Math.abs(A) * facteur >= seuilKm)
  }
  return sortie
}

let lignes = []
let total = 0
for (const nom of Object.keys(NOMS)) {
  const complet = data[`vsop87B${nom}`]
  const a = DEMI_GRAND_AXE[nom] * UA_KM
  const tronque = { L: tronquer(complet.L, a, SEUILS_KM[nom]), B: tronquer(complet.B, a, SEUILS_KM[nom]),
    R: tronquer(complet.R, UA_KM, SEUILS_KM[nom]) }
  // Erreur ajoutée par la troncature, de 2020 à 2040, tous les 7 jours.
  let pire = 0
  for (let j = 7305; j <= 14610; j += 7) {
    const tau = j / 365250
    const p = cartesien(complet, tau), q = cartesien(tronque, tau)
    pire = Math.max(pire, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]))
  }
  let n = 0
  const serie = (s) => '[' + Object.keys(s).sort().map((k) => {
    n += s[k].length
    return '[' + s[k].map((t) => t.map((v) => +v.toPrecision(11)).join(',')).join(',') + ']'
  }).join(',') + ']'
  const L = serie(tronque.L), B = serie(tronque.B), R = serie(tronque.R)
  console.log(`${NOMS[nom].padEnd(8)} ${String(n).padStart(5)} termes, troncature : ${Math.round(pire)} km au pire`)
  total += n
  lignes.push(`  ${JSON.stringify(NOMS[nom])}: { L: ${L}, B: ${B}, R: ${R} },`)
}

const sortie = `// FICHIER GÉNÉRÉ par outils/vsop87.mjs — ne pas modifier à la main.
// Séries VSOP87B (P. Bretagnon et G. Francou, 1988), tronquées : ${total} termes en tout.
// Pour chaque planète et chaque coordonnée (L longitude, B latitude en radians ; R distance en UA), une liste par
// puissance de τ (millénaires TDB depuis J2000) ; chaque liste enchaîne les termes A, B, C : A·cos(B + C·τ).

export type SerieVSOP = readonly (readonly number[])[]

export const VSOP87B: Readonly<Record<string, { L: SerieVSOP; B: SerieVSOP; R: SerieVSOP }>> = {
${lignes.join('\n')}
}
`
const fichier = new URL('../src/donnees/vsop87.ts', import.meta.url)
fs.writeFileSync(fichier, sortie)
console.log(`${total} termes, ${Math.round(sortie.length / 1024)} Ko`)
