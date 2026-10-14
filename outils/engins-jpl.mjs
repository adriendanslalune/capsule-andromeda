// Génère src/donnees/engins-jpl.ts : trajectoires réelles des sondes et télescopes (hors orbite basse terrestre).
//
// Méthode : pour chaque engin, on demande à JPL Horizons (NASA) sa position à pas réguliers sur la période couverte,
// dans l'écliptique J2000, vue du centre choisi (le Soleil ; la Terre pour ceux qui tournent autour du point L2 ;
// Jupiter pour Juno). Le jeu interpole ensuite entre les points (courbe de Catmull-Rom).
// Si Horizons n'a pas de données jusqu'au bout de la période, on s'arrête là : le jeu garde ensuite l'engin auprès de
// sa planète (« apres »), ou prolonge sa course en ligne droite.
//
// Usage : node outils/engins-jpl.mjs      (réponses gardées dans outils/.cache/ ; relancer avant la fin de période)

import fs from 'node:fs'

const DEBUT = '2026-01-01'
const FIN = '2029-01-01'

// nom, code Horizons, centre (code), pas (jours), planète à suivre après la fin des données.
const ENGINS = [
  ['Voyager 1', -31, 10, 10], ['Voyager 2', -32, 10, 10], ['New Horizons', -98, 10, 10],
  ['Pioneer 10', -23, 10, 10], ['Pioneer 11', -24, 10, 10],
  ['Parker Solar Probe', -96, 10, 0.5],
  ['Solar Orbiter', -144, 10, 2], ['BepiColombo', -121, 10, 2, 'Mercure'], ['Europa Clipper', -159, 10, 2],
  ['JUICE', -28, 10, 2], ['Lucy', -49, 10, 2], ['Psyche', -255, 10, 2], ['Tesla Roadster', -143205, 10, 2],
  ['James Webb', -170, 399, 1], ['Gaia', -139479, 399, 1],
  ['Juno', -61, 599, 0.5, 'Jupiter'],
]
const CENTRES = { 10: 'Soleil', 399: 'Terre', 599: 'Jupiter' }

const CACHE = new URL('./.cache/', import.meta.url)
fs.mkdirSync(CACHE, { recursive: true })

async function horizons(code, centre, debut, fin, pas) {
  const pasTexte = pas >= 1 ? `${pas} d` : `${Math.round(pas * 24)} h`
  const url = 'https://ssd.jpl.nasa.gov/api/horizons.api?format=text&EPHEM_TYPE=VECTORS&VEC_TABLE=1&CSV_FORMAT=YES'
    + `&OUT_UNITS=AU-D&REF_PLANE=ECLIPTIC&REF_SYSTEM=J2000&COMMAND='${code}'&CENTER='500@${centre}'`
    + `&START_TIME='${debut}'&STOP_TIME='${fin}'&STEP_SIZE='${encodeURIComponent(pasTexte)}'`
  const fichier = new URL(`engin_${code}_${centre}_${debut}_${fin}_${pas}.txt`, CACHE)
  if (fs.existsSync(fichier)) return fs.readFileSync(fichier, 'utf8')
  for (let essai = 1; ; essai++) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const texte = await r.text()
      fs.writeFileSync(fichier, texte)
      return texte
    } catch (err) {
      if (essai >= 4) throw err
      await new Promise((ok) => setTimeout(ok, 3000 * essai))
    }
  }
}

const MOIS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 }
/** Limite de couverture annoncée par Horizons (« after A.D. 2027-APR-11 … »), en date AAAA-MM-JJ. */
function limite(texte, mot) {
  const m = texte.match(new RegExp(`${mot} A\\.D\\. (\\d{4})-([A-Z]{3})-(\\d{2})`))
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), MOIS[m[2]], Number(m[3])))
  if (mot === 'after') d.setUTCDate(d.getUTCDate() - 1)
  else d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

function points(texte) {
  const bloc = texte.split('$$SOE')[1]?.split('$$EOE')[0]
  if (!bloc) return null
  return bloc.trim().split('\n').map((l) => {
    const c = l.split(',').map((x) => x.trim())
    return { jd: Number(c[0]), x: Number(c[2]), y: Number(c[3]), z: Number(c[4]) }
  })
}

const sortie = []
for (const [nom, code, centre, pas, apres] of ENGINS) {
  let debut = DEBUT, fin = FIN
  let texte = await horizons(code, centre, debut, fin, pas)
  let p = points(texte)
  if (!p) {
    debut = limite(texte, 'prior to') ?? debut
    fin = limite(texte, 'after') ?? fin
    texte = await horizons(code, centre, debut, fin, pas)
    p = points(texte)
  }
  if (!p) { console.error(`${nom} : pas de données`); continue }
  const ms = (jd) => Math.round((jd - 2440587.5) * 86_400_000)
  sortie.push({ nom, code, centre: CENTRES[centre], debut: ms(p[0].jd), pasJours: pas, apres: apres ?? null, points: p.flatMap((q) => [q.x, q.y, q.z]) })
  console.log(`${nom.padEnd(20)} ${p.length} points, ${debut} → ${new Date(ms(p.at(-1).jd)).toISOString().slice(0, 10)}`)
}

const nombre = (x) => Number(x.toFixed(7)).toString()
let ts = `// FICHIER GÉNÉRÉ par outils/engins-jpl.mjs le ${new Date().toISOString().slice(0, 10)} — ne pas modifier à la main.
// Source : JPL Horizons (NASA). Positions dans l'écliptique J2000, en UA, vues du centre indiqué, à pas réguliers.
// Période : ${DEBUT} → ${FIN} (ou la fin des données publiées) : relancer l'outil avant la fin.

export interface Trajectoire {
  nom: string
  /** Code de l'engin chez JPL Horizons. */
  code: number
  /** Astre d'où sont vues les positions. */
  centre: 'Soleil' | 'Terre' | 'Jupiter'
  /** Instant du premier point (ms UTC) et écart entre deux points (jours). */
  debut: number
  pasJours: number
  /** Après le dernier point : planète auprès de laquelle l'engin reste (sinon, sa course continue en ligne droite). */
  apres: string | null
  /** x, y, z (UA) de chaque point, à la suite. */
  points: readonly number[]
}

export const FIN_DONNEES_ENGINS = ${Date.parse(FIN)}

export const TRAJECTOIRES: readonly Trajectoire[] = [
`
for (const e of sortie) {
  ts += `  { nom: ${JSON.stringify(e.nom)}, code: ${e.code}, centre: '${e.centre}', debut: ${e.debut}, pasJours: ${e.pasJours}, apres: ${e.apres ? `'${e.apres}'` : 'null'},\n    points: [${e.points.map(nombre).join(',')}] },\n`
}
ts += ']\n'
fs.writeFileSync(new URL('../src/donnees/engins-jpl.ts', import.meta.url), ts)
console.log(`src/donnees/engins-jpl.ts : ${(ts.length / 1024).toFixed(0)} Ko`)
