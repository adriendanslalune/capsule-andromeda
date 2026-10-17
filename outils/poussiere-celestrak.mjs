// Génère src/donnees/poussiere.ts : la « poussière » de satellites, tous les satellites actifs autour de la Terre.
//
// Méthode : on télécharge chez CelesTrak les orbites publiées (TLE) de tous les satellites actifs, on en garde les six
// éléments utiles, ramenés à un même instant de référence (minuit UTC du jour du téléchargement), arrondis (la
// poussière est décorative : quelques kilomètres d'écart ne se voient pas). Les engins qui ont leur propre fiche dans
// le jeu (ISS, Hubble, Tiangong, la sélection…) sont retirés : ils sont dessinés à part.
// Pas de mise à jour régulière prévue (décision d'Adrien du 17/10/2026).
//
// Usage : NODE_USE_ENV_PROXY=1 node outils/poussiere-celestrak.mjs   (réponse gardée dans outils/.cache/ ;
//         ajouter --frais pour retélécharger)

import fs from 'node:fs'
import { ENGINS } from '../src/donnees/engins.ts'
import { elementsTLE } from '../src/moteur/poussiere.ts'

const ADRESSE = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle'
const CACHE = new URL('./.cache/celestrak-actifs.txt', import.meta.url)
const SORTIE = new URL('../src/donnees/poussiere.ts', import.meta.url)
/** Numéros NORAD des engins qui ont leur fiche (src/donnees/engins.ts ; l'ISS, src/donnees/iss.ts). */
const A_PART = new Set(['25544', ...ENGINS.filter((e) => e.tle).map((e) => e.tle.ligne1.slice(2, 7).trim())])

async function telecharger() {
  // CelesTrak coupe parfois la connexion : on réessaie.
  for (let essai = 1; essai <= 6; essai++) {
    try {
      const r = await fetch(ADRESSE)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const texte = await r.text()
      if (!texte.includes('\n1 ')) throw new Error('réponse inattendue')
      return texte
    } catch (e) {
      console.warn(`Essai ${essai} : ${e.message}`)
      await new Promise((ok) => setTimeout(ok, 2000 * essai))
    }
  }
  throw new Error('CelesTrak injoignable')
}

if (process.argv.includes('--frais') || !fs.existsSync(CACHE)) {
  fs.mkdirSync(new URL('./', CACHE), { recursive: true })
  fs.writeFileSync(CACHE, await telecharger())
}
const lignes = fs.readFileSync(CACHE, 'utf8').split(/\r?\n/)
const date = fs.statSync(CACHE).mtime
const reference = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())

const arrondi = (x, d) => String(Number(x.toFixed(d)))
const valeurs = []
let gardes = 0, retires = 0
for (let k = 0; k + 2 < lignes.length; k++) {
  const l1 = lignes[k + 1], l2 = lignes[k + 2]
  if (!l1?.startsWith('1 ') || !l2?.startsWith('2 ')) continue
  k += 2
  const [i, noeud, e, omega, M, n] = elementsTLE(l1, l2, reference)
  // Engins à part, orbites presque paraboliques ou illisibles.
  if (A_PART.has(l1.slice(2, 7).trim()) || !(e < 0.95) || !(n > 0)) { retires++; continue }
  valeurs.push(arrondi(i, 2), arrondi(noeud, 2), arrondi(e, 5), arrondi(omega, 1), arrondi(M, 1), arrondi(n, 5))
  gardes++
}

// Une ligne de texte par tranche de 6 000 nombres (1 000 satellites), pour garder un fichier lisible par les éditeurs.
const tranches = []
for (let k = 0; k < valeurs.length; k += 6000) tranches.push(`  '${valeurs.slice(k, k + 6000).join(' ')}'`)
fs.writeFileSync(SORTIE, `// Fichier généré par outils/poussiere-celestrak.mjs : ne pas modifier à la main.
// Tous les satellites actifs autour de la Terre (CelesTrak, orbites TLE du ${new Date(reference).toISOString().slice(0, 10)}),
// sauf les engins qui ont leur fiche. Par satellite : inclinaison, nœud ascendant, excentricité, argument du périgée,
// anomalie moyenne à l'instant de référence (degrés), mouvement moyen (tours par jour). Voir src/moteur/poussiere.ts.

/** Instant de référence des éléments (ms UTC). */
export const REFERENCE_POUSSIERE = ${reference}

/** ${gardes} satellites. */
export const POUSSIERE = [
${tranches.join(',\n')},
].join(' ')
`)
console.log(`${gardes} satellites gardés, ${retires} retirés → src/donnees/poussiere.ts (${Math.round(fs.statSync(SORTIE).size / 1024)} Ko)`)
