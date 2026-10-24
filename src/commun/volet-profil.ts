// Le volet Profil (dans « Plus » ; étape 8, écrans d'abord, d'après la maquette validée le 18/10/2026) : le pseudo du
// joueur (son nom dans les Messages), la toile d'araignée de son affinité avec les trois Maisons, son carnet de bord
// et les zones à libérer, et l'appartenance à une Maison (proposée selon l'affinité, jamais définitive).

import { MAISONS, SEUIL_MISSIONS, SEUIL_PART, titreMaison, COULEURS_MAISONS } from '../donnees/maisons'
import type { Jeu } from '../moteur/jeu'
import { affinites, maisonPreferee, maisonsOuvertes } from '../moteur/profil'
import { NOMBRE_MONOLITHES, PALIERS } from '../donnees/monolithes'
import { palierSuivant, statut } from '../moteur/monolithes'
import { jauge } from '../moteur/zones'
import { niveauDe, palierDe } from '../moteur/niveau'
import { PALIERS as PALIERS_NIVEAU } from '../donnees/niveaux'
import { dessinerVaisseau, imageForme, rayonVaisseau, urlFormePeinte } from '../carte/vaisseaux'
import { CATEGORIES_TROPHEES, TROPHEES } from '../donnees/trophees'
import { medaille } from './medailles'
import { ZONES_A_LIBERER } from '../donnees/zones'

const TEINTES: Record<string, string> = Object.fromEntries(MAISONS.map((m) => [m.maison, COULEURS_MAISONS[m.maison].pale]))
/** Les zones de la campagne (acte 1). */

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
    + (jeu.icare !== null ? '<div class="rang"><span>Titre secret</span><b>Icare</b></div>' : '')
    + `<div class="paliers">${PALIERS.map((p) => `<span class="${n >= p.seuil ? 'atteint' : ''}"><b>${p.titre}</b><small>${p.seuil}</small></span>`).join('')}</div>`
    + `<p class="petit">${suivant ? `Encore ${suivant.seuil - n} monolithe${suivant.seuil - n > 1 ? 's' : ''} pour devenir <b>${suivant.titre}</b>. Le bouton PING de la carte les cherche à la radio.` : 'Tu as tout trouvé : Oracle !'}</p></div>`
}

/**
 * L'appartenance (décision d'Adrien du 18/10/2026) : chaque Maison, ce qu'il faut pour la rejoindre, le bouton pour
 * la rejoindre quand l'affinité le permet ; redevenir neutre à tout moment. Jamais définitif.
 */
function htmlAppartenance(jeu: Jeu): string {
  const a = affinites(jeu), ouvertes = maisonsOuvertes(jeu)
  return '<div class="appartenance">' + MAISONS.map((m) => {
    const n = jeu.carnet.missions[m.maison], part = Math.round(a[m.maison] * 100)
    const membre = jeu.maison === m.maison
    const bouton = membre ? '<span class="membre">MEMBRE</span>'
      : ouvertes.includes(m.maison) ? `<button type="button" data-rejoindre="${m.maison}">REJOINDRE</button>`
        : `<small>${Math.min(n, SEUIL_MISSIONS)}/${SEUIL_MISSIONS} missions · ${part} % (il faut ${Math.round(SEUIL_PART * 100)} %)</small>`
    return `<div class="rang"><span class="maison maison-${m.maison}">${m.titre}</span>${bouton}</div>`
  }).join('')
    + (jeu.maison ? '<button type="button" class="neutre" data-rejoindre="">REDEVENIR NEUTRE</button>' : '')
    + `<p class="petit">Membre d'une Maison : dans chaque système, 4 de ses missions sur 6 (et 1 de chacune des autres), payées 25 % de plus, et son canal dans les Messages. Pour la rejoindre : ${SEUIL_MISSIONS} missions pour elle, et au moins ${Math.round(SEUIL_PART * 100)} % de tes missions. Jamais définitif.</p></div>`
}

/**
 * La libération (décisions d'Adrien du 21/10/2026) : chaque zone, système par système, avec sa jauge de résistance ;
 * la Terre, QG de la Résistance, libre dès le départ.
 */
function htmlZones(jeu: Jeu): string {
  const libres = jeu.zones.liberees.length
  let html = `<h3>Libération</h3><div class="bloc zones"><div class="rang"><span>Zones libérées</span><b>${libres} / ${ZONES_A_LIBERER.length}</b></div>`
    + '<div class="rang"><span>Terre</span><small>QG de la Résistance</small></div>'
  let systeme = ''
  for (const z of ZONES_A_LIBERER) {
    if (z.systeme !== systeme) { systeme = z.systeme; html += `<div class="systeme-zones">${z.systeme === 'Terre' ? 'Système de la Terre' : `Système ${/^[AEIOUÉ]/.test(z.systeme) ? 'd\'' : 'de '}${z.systeme}`}</div>` }
    const libre = jeu.zones.liberees.includes(z.nom), j = jauge(jeu.zones, z.nom)
    html += `<div class="rang zone${libre ? ' libre' : ''}"><span>${z.nom}${z.planete ? '' : ' <small>lune</small>'}</span>`
      + (libre ? '<small class="libere">✓ libérée</small>' : `<span class="jauge-zone"><i style="width:${j}%"></i><small>${j} %</small></span>`) + '</div>'
  }
  return html + '<p class="petit">Tout ce que tu fais près d\'une zone occupée fait monter sa résistance : contrats, chasseurs, monolithes, Voix perdues. À 100 %, sa quête de libération mène à l\'assaut contre son vaisseau amiral.</p></div>'
}

/** Le niveau du capitaine (décisions d'Adrien du 21/10/2026) : sa jauge, son engin, les paliers. Pour se montrer. */
function htmlNiveau(jeu: Jeu): string {
  const n = niveauDe(jeu.xp), p = palierDe(n.niveau), part = n.besoin ? Math.round((100 * n.dans) / n.besoin) : 100
  return `<h3>Niveau</h3><div class="bloc niveau-capitaine"><div class="rang"><span>Capitaine niv. <b>${n.niveau}</b></span><b>${p.nom}</b></div>`
    + `<div class="jauge-niveau"><i style="width:${part}%"></i></div>`
    + `<div class="rang"><small>${n.besoin ? `${n.dans.toLocaleString('fr-FR')} / ${n.besoin.toLocaleString('fr-FR')} XP vers le niveau ${n.niveau + 1}` : 'Niveau maximum !'}</small><small>${jeu.xp.toLocaleString('fr-FR')} XP en tout</small></div>`
    + `<div class="paliers">${PALIERS_NIVEAU.map((x) => `<span class="${n.niveau >= x.des ? 'atteint' : ''}"><b>${x.nom}</b><small>${x.des}</small></span>`).join('')}</div>`
    + '<p class="petit">Tout rapporte de l\'XP : contrats, chasseurs, zones libérées, quêtes, réparations, commerce (au plus 100 XP par jour), monolithes, Voix perdues. Ton niveau s\'affiche à côté de ton nom ; tous les 20 niveaux, ta capsule change de forme sur la carte.</p></div>'
}

/**
 * La signature du capitaine, au tampon (proposition validée par Adrien le 22/10/2026 : plus fun) : un tampon rond à
 * l'encre rouge, « CAPITAINE BREVETÉ DE LA RÉSISTANCE » tout autour, le nom et le numéro de la capsule au milieu.
 */
function signature(jeu: Jeu): string {
  const nom = jeu.pseudo.replace(/[<>&"]/g, '')
  return `<div class="bloc signature"><svg class="tampon-capitaine" viewBox="0 0 160 160" role="img" aria-label="Tampon du capitaine ${nom}">`
    + '<defs><path id="cercle-tampon" d="M80 80m-58 0a58 58 0 1 1 116 0a58 58 0 1 1-116 0"/></defs>'
    + '<circle cx="80" cy="80" r="74" class="anneau-ext"/><circle cx="80" cy="80" r="46" class="anneau-int"/>'
    + '<text class="tour"><textPath href="#cercle-tampon" startOffset="0">CAPITAINE BREVETÉ ★ RÉSISTANCE TERRIENNE ★ </textPath></text>'
    + `<text x="80" y="76" class="nom-tampon" text-anchor="middle" textLength="${Math.min(84, nom.length * 9)}" lengthAdjust="spacingAndGlyphs">${nom}</text>`
    + `<text x="80" y="93" class="numero-tampon" text-anchor="middle">N° ${jeu.numeroSerie}</text>`
    + `<text x="80" y="108" class="numero-tampon" text-anchor="middle">★ NIV. ${niveauDe(jeu.xp).niveau} ★</text></svg>`
    + `<div class="cote-tampon">${formeDuCapitaine(jeu)}`
    + '<p class="petit">Ton tampon de capitaine. Il fait foi dans tout le système solaire (sauf sur Triton).</p></div></div>'
}

const attribut = (x: string) => x.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * La vitrine des trophées (cadre validé par Adrien le 24/10/2026) : une étagère par catégorie, ses médailles ; gagnés,
 * leur nom (toucher : la phrase et la date) ; pas encore, grisés avec leur indice ; secrets, ni nom ni indice.
 */
function htmlTrophees(jeu: Jeu): string {
  const gagnes = Object.keys(jeu.trophees).length
  const date = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const etageres = CATEGORIES_TROPHEES.map(({ categorie, nom }) => {
    const liste = TROPHEES.filter((x) => x.categorie === categorie)
    const n = liste.filter((x) => x.n in jeu.trophees).length
    const cases = liste.map((x) => {
      const quand = jeu.trophees[x.n], gagne = quand !== undefined, cache = !gagne && x.secret
      const detail = gagne ? `<b>${x.nom}</b> « ${x.phrase} » <small>Gagné le ${date(quand)}.</small>`
        : cache ? '<b>Trophée secret</b> <small>À toi de le trouver. Aucun indice.</small>'
          : `<b>${x.nom}</b> <small>Pas encore : ${x.indice.charAt(0).toLowerCase()}${x.indice.slice(1)}.</small>`
      return `<button type="button" class="trophee${gagne ? ' gagne' : ''}" data-trophee="${attribut(detail)}">${medaille(x.categorie, x.rarete, gagne, x.secret)}<small>${cache ? '???' : x.nom}</small></button>`
    }).join('')
    return `<details class="etagere"><summary>${nom} <small>${n} / ${liste.length}</small></summary><div class="trophees">${cases}<p class="detail-trophee" hidden></p></div></details>`
  }).join('')
  return `<h3>Trophées</h3><div class="bloc vitrine"><div class="rang"><span>Gagnés</span><b>${gagnes} / ${TROPHEES.length}</b></div>`
    + `<p class="petit">La gloire, rien que la gloire. Touche une médaille pour la voir de près.</p>${etageres}</div>`
}

/** Le vaisseau du capitaine, dans la forme de son niveau (Adrien, 24/10/2026) : son image si elle est dessinée, sinon sa silhouette. */
function formeDuCapitaine(jeu: Jeu): string {
  const p = palierDe(niveauDe(jeu.xp).niveau)
  let src = imageForme(p.forme) ? urlFormePeinte(p.forme, jeu.maison) : null
  if (!src) {
    const toile = document.createElement('canvas')
    toile.width = toile.height = 160
    dessinerVaisseau(toile.getContext('2d')!, 80, 80, -Math.PI / 2, p.forme, 60 / rayonVaisseau(p.forme, 1), '#e04b37', '#2b2138')
    src = toile.toDataURL()
  }
  return `<img class="forme-profil" src="${src}" alt=""><b class="nom-forme">${p.nom}</b>`
}

export function htmlProfil(jeu: Jeu): string {
  const pref = maisonPreferee(jeu), c = jeu.carnet
  const total = MAISONS.reduce((s, m) => s + c.missions[m.maison], 0)
  return `<button type="button" class="retour" data-page="plus">‹ Plus</button>`
    + `<h3>Capitaine</h3><div class="bloc pseudo"><label for="pseudo">Ton nom dans les Messages</label>`
    + `<div class="ligne-pseudo"><input id="pseudo" type="text" maxlength="16" autocomplete="off" spellcheck="false" value="${jeu.pseudo}"/>`
    + `<button type="button" data-pseudo>OK</button></div><small>Capsule n° ${jeu.numeroSerie} · 3 à 16 lettres ou chiffres</small></div>`
    + signature(jeu)
    + htmlNiveau(jeu)
    + htmlCollection(jeu)
    + htmlTrophees(jeu)
    + `<h3>Maisons</h3><div class="bloc centre">${toile(jeu)}`
    + `<p>Maison : <b>${jeu.maison ? titreMaison(jeu.maison) : 'aucune (neutre)'}</b></p>`
    + `<p class="petit">${!total ? 'Fais des missions : ta toile se dessinera selon ce que tu préfères faire.'
      : pref ? `Tu penches vers les <b>${titreMaison(pref).toLowerCase()}</b>.` : 'Tu n\'as pas encore de préférence nette.'}</p>`
    + htmlAppartenance(jeu) + '</div>'
    + '<h3>Carnet de bord</h3><div class="bloc">'
    + MAISONS.map((m) => `<div class="rang"><span><span class="maison maison-${m.maison}">${m.titre}</span> missions</span><b>${c.missions[m.maison]}</b></div>`).join('')
    + `<div class="rang"><span>Crédits gagnés</span><b>${c.credits.toLocaleString('fr-FR')}</b></div>`
    + `<div class="rang"><span>Objets triés dans les épaves</span><b>${c.objetsTries}</b></div></div>`
    + htmlZones(jeu)
}
