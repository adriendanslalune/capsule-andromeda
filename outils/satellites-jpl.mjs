// Génère src/donnees/satellites.ts : orbites réelles de tous les satellites naturels des planètes.
//
// Méthode :
//  1. La liste des satellites (noms, codes, planètes) vient du tableau public de JPL (NASA) :
//       https://ssd.jpl.nasa.gov/sats/elem/   et les rayons de https://ssd.jpl.nasa.gov/sats/phys_par/
//     (les éléments « moyens » de ce tableau ne sont pas utilisés : JPL précise qu'ils ne conviennent pas
//      au calcul de positions, et on a vérifié qu'ils sont faux de plus de 100° pour Titan.)
//  2. Pour chaque satellite, on demande à JPL Horizons ses éléments osculateurs exacts tous les 10 jours
//     sur la période couverte, dans l'écliptique J2000, vus du centre de la planète.
//  3. On ajuste une ellipse qui tourne régulièrement : a, e, i constants ; nœud Ω, longitude du périastre ϖ
//     et longitude moyenne λ qui varient linéairement avec le temps (moindres carrés).
//
// Usage : node outils/satellites-jpl.mjs [code code …]   (sans code : tous les satellites)
// Les réponses d'Horizons sont gardées dans outils/.cache/ pour pouvoir relancer sans tout retélécharger.
// À relancer avant la fin de la période couverte, ou quand de nouveaux satellites sont publiés.

import fs from 'node:fs'

const DEBUT = '2026-01-01'
const FIN = '2031-01-01'
const PAS_JOURS = 10
// Écart maximal accepté (degrés, vu de la planète) : serré pour les satellites de taille connue (les grands),
// plus large pour les petits satellites lointains de quelques kilomètres, invisibles sauf à les frôler.
const TOLERANCE_GRANDS = 1
const TOLERANCE_PETITS = 5
const ECHANTILLONS_MIN_PAR_TRANCHE = 4

const PLANETES = {
  Earth: ['Terre', 399], Mars: ['Mars', 499], Jupiter: ['Jupiter', 599],
  Saturn: ['Saturne', 699], Uranus: ['Uranus', 799], Neptune: ['Neptune', 899],
}

// Noms français usuels ; les autres gardent leur nom international.
const NOMS_FR = {
  Europa: 'Europe', Ganymede: 'Ganymède', Amalthea: 'Amalthée', Thebe: 'Thébé', Metis: 'Métis', Adrastea: 'Adrastée',
  Leda: 'Léda', Elara: 'Élara', Pasiphae: 'Pasiphaé', Sinope: 'Sinopé', Lysithea: 'Lysithéa', Carme: 'Carmé',
  Ananke: 'Ananké', Enceladus: 'Encelade', Tethys: 'Téthys', Rhea: 'Rhéa', Hyperion: 'Hypérion', Iapetus: 'Japet',
  Phoebe: 'Phœbé', Epimetheus: 'Épiméthée', Helene: 'Hélène', Telesto: 'Télesto', Prometheus: 'Prométhée',
  Pandora: 'Pandore', Oberon: 'Obéron', Nereid: 'Néréide', Proteus: 'Protée', Galatea: 'Galatée', Naiad: 'Naïade',
}

const CACHE = new URL('./.cache/', import.meta.url)
fs.mkdirSync(CACHE, { recursive: true })

async function lireTexte(url) {
  for (let essai = 1; ; essai++) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.text()
    } catch (err) {
      if (essai >= 4) throw err
      await new Promise((ok) => setTimeout(ok, 3000 * essai))
    }
  }
}

function lignesTableau(html) {
  return [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
      c[1].replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()))
    .filter((l) => l.length > 3)
}

/**
 * Éléments osculateurs d'Horizons : [{ jj, e, i, noeud, omega, M, a }], ou { finEphemeride } si Horizons
 * n'a pas de données sur la période demandée (il indique alors la date de fin de ses données).
 */
async function elementsHorizons(code, centre, debut = DEBUT, fin = FIN) {
  const fichier = new URL(`${code}${debut === DEBUT ? '' : '-' + debut}.txt`, CACHE)
  let texte = fs.existsSync(fichier) ? fs.readFileSync(fichier, 'utf8') : null
  if (!texte) {
    const p = new URLSearchParams({
      format: 'text', COMMAND: `'${code}'`, EPHEM_TYPE: 'ELEMENTS', CENTER: `'500@${centre}'`,
      REF_PLANE: 'ECLIPTIC', REF_SYSTEM: 'ICRF', OUT_UNITS: 'KM-D', CSV_FORMAT: 'YES', OBJ_DATA: 'NO',
      START_TIME: `'${debut}'`, STOP_TIME: `'${fin}'`, STEP_SIZE: `'${PAS_JOURS} d'`,
    })
    texte = await lireTexte('https://ssd.jpl.nasa.gov/api/horizons.api?' + p)
    if (texte.includes('$$SOE')) fs.writeFileSync(fichier, texte)
  }
  // Certains codes de satellites sont aussi des numéros d'astéroïdes : Horizons renvoie alors l'astéroïde.
  if (/Target body name:.*\{source: JPL#/.test(texte)) return null
  const bloc = texte.split('$$SOE')[1]?.split('$$EOE')[0]
  if (!bloc) {
    const m = texte.match(/No ephemeris for target .* after A\.D\. (\d{4})-([A-Z]{3})-(\d{2})/)
    return m ? { finEphemeride: `${m[1]}-${MOIS[m[2]]}-${m[3]}` } : null
  }
  return bloc.trim().split('\n').map((l) => {
    const c = l.split(',').map((s) => s.trim())
    return { jj: +c[0], e: +c[2], i: +c[4], noeud: +c[5], omega: +c[6], M: +c[9], a: +c[11] }
  })
}

/** Déroule une suite d'angles (degrés) en suivant une prédiction, pour supprimer les sauts de 360°. */
function derouler(angles, predictions) {
  return angles.map((x, k) => x + 360 * Math.round((predictions[k] - x) / 360))
}

/** Droite des moindres carrés y = y0 + pente·(t − t0). */
function droite(ts, ys, t0) {
  const n = ts.length
  const mt = ts.reduce((s, t) => s + t - t0, 0) / n
  const my = ys.reduce((s, y) => s + y, 0) / n
  let num = 0, den = 0
  ts.forEach((t, k) => { num += (t - t0 - mt) * (ys[k] - my); den += (t - t0 - mt) ** 2 })
  const pente = den ? num / den : 0
  return [my - pente * mt, pente]
}

/** Déroule un angle échantillonné pas à pas, en prédisant chaque point à partir de la vitesse estimée. */
function deroulerPasAPas(ts, angles, vitesseInitiale) {
  const res = [angles[0]]
  let vitesse = vitesseInitiale
  for (let k = 1; k < angles.length; k++) {
    const prediction = res[k - 1] + vitesse * (ts[k] - ts[k - 1])
    res.push(derouler([angles[k]], [prediction])[0])
    if (k >= 3) vitesse = droite(ts.slice(0, k + 1), res, ts[0])[1]
  }
  return res
}

const MOIS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08',
  SEP: '09', OCT: '10', NOV: '11', DEC: '12' }

const moyenne = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length
const RAD = Math.PI / 180

function position(a, e, M, omega, noeud, i) {
  let E = M * RAD + e * Math.sin(M * RAD)
  for (let n = 0; n < 30; n++) E -= (E - e * Math.sin(E) - M * RAD) / (1 - e * Math.cos(E))
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E)
  const co = Math.cos(omega * RAD), so = Math.sin(omega * RAD), cO = Math.cos(noeud * RAD), sO = Math.sin(noeud * RAD)
  const ci = Math.cos(i * RAD), si = Math.sin(i * RAD)
  return [(co * cO - so * sO * ci) * xp + (-so * cO - co * sO * ci) * yp,
    (co * sO + so * cO * ci) * xp + (-so * sO + co * cO * ci) * yp, so * si * xp + co * si * yp]
}

function angleEntre(u, v) {
  const c = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v))
  return Math.acos(Math.min(1, Math.max(-1, c))) / RAD
}

/** Ajuste l'ellipse tournante sur des échantillons ; renvoie les éléments et l'écart maximal (degrés). */
function ajuster(echantillons, GM) {
  const epoque = (echantillons[0].jj + echantillons[echantillons.length - 1].jj) / 2
  const ts = echantillons.map((s) => s.jj)
  const noeuds = echantillons.map((s) => s.noeud)
  const varpis = echantillons.map((s) => s.noeud + s.omega)
  const lambdas = echantillons.map((s) => s.noeud + s.omega + s.M)
  // Vitesse initiale de λ : mouvement moyen képlérien, affiné ensuite au fil des échantillons.
  const L = deroulerPasAPas(ts, lambdas, 360 / periodeKepler(echantillons[0].a, GM))
  const W = deroulerPasAPas(ts, varpis, 0)
  const O = deroulerPasAPas(ts, noeuds, 0)
  const [lambda0, dLambda] = droite(ts, L, epoque)
  const [varpi0, dVarpi] = droite(ts, W, epoque)
  const [noeud0, dNoeud] = droite(ts, O, epoque)
  const el = {
    debut: echantillons[0].jj, epoque, a: moyenne(echantillons.map((s) => s.a)), e: moyenne(echantillons.map((s) => s.e)),
    i: moyenne(echantillons.map((s) => s.i)), noeud0, dNoeud, varpi0, dVarpi, lambda0, dLambda,
  }
  let ecartMax = 0
  for (const s of echantillons) {
    const dt = s.jj - epoque
    const noeud = el.noeud0 + el.dNoeud * dt, varpi = el.varpi0 + el.dVarpi * dt, lambda = el.lambda0 + el.dLambda * dt
    const modele = position(el.a, el.e, lambda - varpi, varpi - noeud, noeud, el.i)
    const vrai = position(s.a, s.e, s.M, s.omega, s.noeud, s.i)
    ecartMax = Math.max(ecartMax, angleEntre(modele, vrai))
  }
  return { el, ecartMax }
}

/**
 * Découpe la période en tranches tant que l'écart dépasse la tolérance (orbites très perturbées :
 * Janus et Épiméthée qui échangent leurs orbites, Hypérion, satellites lointains secoués par le Soleil).
 */
function ajusterParTranches(echantillons, GM, tolerance) {
  const { el, ecartMax } = ajuster(echantillons, GM)
  if (ecartMax <= tolerance || echantillons.length < 2 * ECHANTILLONS_MIN_PAR_TRANCHE) {
    return { tranches: [el], ecartMax }
  }
  const milieu = Math.floor(echantillons.length / 2)
  // La seconde moitié reprend le dernier point de la première, pour ne pas laisser de trou entre les deux.
  const a = ajusterParTranches(echantillons.slice(0, milieu + 1), GM, tolerance)
  const b = ajusterParTranches(echantillons.slice(milieu), GM, tolerance)
  return { tranches: [...a.tranches, ...b.tranches], ecartMax: Math.max(a.ecartMax, b.ecartMax) }
}

/** Période képlérienne (jours) pour un demi-grand axe a (km) et la constante GM de la planète (km³/s²). */
function periodeKepler(a, GM) {
  return (2 * Math.PI * Math.sqrt(a ** 3 / GM)) / 86400
}

// Constantes gravitationnelles des planètes (km³/s², JPL).
const GM = { 399: 398600.435, 499: 42828.375, 599: 126686531.9, 699: 37931206.2, 799: 5793951.3, 899: 6835099.5 }

// ---------------------------------------------------------------------------------------------------
const filtre = process.argv.slice(2).map(Number)
const tableau = lignesTableau(await lireTexte('https://ssd.jpl.nasa.gov/sats/elem/'))
const rayons = Object.fromEntries(lignesTableau(await lireTexte('https://ssd.jpl.nasa.gov/sats/phys_par/'))
  .map((l) => [Number(l[2]), Number(l[4].split(' ')[0])]))

const vus = new Set()
const liste = []
for (const l of tableau) {
  const [, planeteJpl, nomJpl, code] = l
  if (!(planeteJpl in PLANETES) || nomJpl === 'Moon' || vus.has(+code)) continue // la Lune a son propre calcul
  if (filtre.length && !filtre.includes(+code)) continue
  vus.add(+code)
  const nom = NOMS_FR[nomJpl] ?? nomJpl.replace(/^S(\d{4})_([A-Z])_(\d+)$/, 'S/$1 $2 $3')
  liste.push({ nom, code: +code, planete: PLANETES[planeteJpl][0], centre: PLANETES[planeteJpl][1] })
}

const sortie = []
const ecarts = []
const prolonges = []
for (const [k, s] of liste.entries()) {
  let ech = await elementsHorizons(s.code, s.centre)
  let prolonge = false
  if (ech?.finEphemeride) {
    // Données anciennes seulement : on ajuste une seule orbite sur les 5 dernières années connues,
    // et on la prolonge jusqu'à aujourd'hui (précision moindre).
    const fin = ech.finEphemeride
    const debut = `${Number(fin.slice(0, 4)) - 5}${fin.slice(4)}`
    const recent = new Date(Date.parse(fin) - 86400000).toISOString().slice(0, 10)
    ech = await elementsHorizons(s.code, s.centre, debut, recent)
    prolonge = true
  }
  if (!Array.isArray(ech)) { console.warn(`Horizons ne connaît pas ${s.nom} (${s.code}) : ignoré.`); continue }
  const { tranches, ecartMax } = prolonge ? { tranches: [ajuster(ech, GM[s.centre]).el], ecartMax: 0 }
    : ajusterParTranches(ech, GM[s.centre], s.code in rayons ? TOLERANCE_GRANDS : TOLERANCE_PETITS)
  if (prolonge) prolonges.push(s.nom)
  ecarts.push([ecartMax, s.nom, s.planete, tranches.length])
  const r = (x, n) => Number(x.toFixed(n))
  sortie.push([s.nom, s.code, s.planete, rayons[s.code] ?? null, tranches.map((el) => [
    r(el.debut, 1), r(el.epoque, 1), r(el.a, 1), r(el.e, 6), r(el.i, 5), r(el.noeud0 % 360, 5), r(el.dNoeud, 9),
    r(el.varpi0 % 360, 5), r(el.dVarpi, 9), r(el.lambda0 % 360, 5), r(el.dLambda, 8)])])
  if ((k + 1) % 25 === 0) console.log(`${k + 1} / ${liste.length}`)
}

ecarts.sort((a, b) => b[0] - a[0])
console.log('Plus grands écarts sur la période (degrés vus de la planète) :')
for (const [e, nom, pl, n] of ecarts.slice(0, 15)) console.log(`  ${e.toFixed(2).padStart(7)}°  ${nom} (${pl}), ${n} tranche(s)`)
console.log(`Tranches au total : ${sortie.reduce((n, s) => n + s[4].length, 0)}`)
if (ecarts.length) console.log(`Écart médian : ${ecarts[Math.floor(ecarts.length / 2)][0].toFixed(2)}°`)

if (prolonges.length) console.log(`Orbites prolongées depuis des données anciennes : ${prolonges.join(', ')}`)

if (filtre.length) process.exit(0) // essai partiel : on n'écrit pas le fichier

const date = new Date().toISOString().slice(0, 10)
const ts = `// FICHIER GÉNÉRÉ par outils/satellites-jpl.mjs le ${date} — ne pas modifier à la main.
// Source : JPL/NASA (liste et rayons des satellites ; positions de précision du système Horizons).
// ${sortie.length} satellites naturels des planètes (hors Lune, calculée à part).
// Orbites ajustées sur la période ${DEBUT} → ${FIN} : relancer l'outil avant la fin de cette période.

import type { PlaneteAvecSatellites } from './planetes'

/** Fin de la période couverte par l'ajustement (ms UTC). Au-delà, la précision se dégrade peu à peu. */
export const FIN_VALIDITE_SATELLITES = ${Date.parse(FIN)}

/**
 * Une tranche d'orbite, vue du centre de la planète, dans l'écliptique J2000 :
 * [début de validité (jour julien), époque des éléments (jour julien), demi-grand axe a (km), excentricité e,
 *  inclinaison i (°), nœud Ω à l'époque (°), variation de Ω (°/jour), longitude du périastre ϖ à l'époque (°),
 *  variation de ϖ (°/jour), longitude moyenne λ à l'époque (°), variation de λ (°/jour)]
 * Une tranche vaut jusqu'au début de la suivante.
 */
export type TrancheOrbite = readonly [
  debut: number, epoque: number, a: number, e: number, i: number,
  noeud: number, dNoeud: number, varpi: number, dVarpi: number, lambda: number, dLambda: number,
]

/** [nom, code JPL, planète, rayon (km, null = inconnu), tranches d'orbite dans l'ordre du temps] */
export type OrbiteSatellite = readonly [
  nom: string, code: number, planete: PlaneteAvecSatellites, rayon: number | null, tranches: readonly TrancheOrbite[],
]

export const SATELLITES: readonly OrbiteSatellite[] = [
${sortie.map((s) => '  ' + JSON.stringify(s) + ',').join('\n')}
]
`
fs.writeFileSync(new URL('../src/donnees/satellites.ts', import.meta.url), ts)
console.log(`${sortie.length} satellites écrits.`)
