<script lang="ts">
  // Volet de la carte : vraies positions, zoom au doigt, cadran de cap, destination, rencontre, ping, tracés.
  import { onMount } from 'svelte'
  import { corpsDuSysteme, demiGrandAxeAutourDeLaPlanete, estPlanete, planeteDe, rayonCorps, rayonInfluence } from '../../astro/corps'
  import { UA_KM } from '../../astro/temps'
  import { NOMS_PLANETES, type NomPlanete } from '../../donnees/planetes'
  import { distanceEcho, positionVisiteur, viserTelescope, visiteurDetecte } from '../../moteur/chasse'
  import { estInstalle } from '../../moteur/economie'
  import {
    annulerDestination,
    choisirDestination,
    choisirDestinationAvecFenetre,
    distance,
    optionsDeDepart,
    planDeVol,
    positionAstre,
    positionDestination,
    seuilArrivee,
    tempsRestant,
    vitesseDuMoment,
    type Destination,
    type Point2,
  } from '../../moteur/fusee'
  import { hasardReel } from '../../moteur/hasard'
  import { vitesseActuelle } from '../../moteur/partie'
  import { DUREE_ACCELERATION } from '../../donnees/reglages'
  import { dateLocale, duree, dureePrecise, heureLocale, nombre, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'
  import Saut from '../provisoire/Saut.svelte' // PROVISOIRE
  import Reinitialiser from '../provisoire/Reinitialiser.svelte' // PROVISOIRE
  import { autresFusees } from '../reseau'
  import { NOMS_ENGINS, positionsEngins } from '../../astro/engins'
  import { satellitesDe } from '../../astro/satellites'

  /** Couleurs de la carte, style Moebius (validé par Adrien le 17/10/2026) : fond blanc cassé, encre brun-violet,
   *  astres en pastel, ombre violette, hachures le long du terminateur. */
  const PLAN = { fond: '#f4f1ea', trait: '#2b2138', route: '#e04b37', chasse: '#2f5f9e', ombre: '#54437a' }
  const L = 362
  const Hc = 400
  /** Mélange deux couleurs « #rrggbb » (k = part de la seconde). */
  function melanger(a: string, b: string, k: number): string {
    const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16)
    const canal = (d: number) => Math.round(((x >> d) & 255) * (1 - k) + ((y >> d) & 255) * k)
    return `#${((canal(16) << 16) | (canal(8) << 8) | canal(0)).toString(16).padStart(6, '0')}`
  }
  const VIVES: Record<string, string> = {
    Soleil: '#f2b53a', Mercure: '#a99d90', Vénus: '#e8c77a', Terre: '#3f7fc1', Mars: '#d0563a', Jupiter: '#d49a62',
    Saturne: '#e2c27d', Uranus: '#8fd0dc', Neptune: '#3f63c4', Lune: '#b9b2a6', Io: '#e2cc55', Europe: '#e6dcc8',
    Ganymède: '#988c7d', Callisto: '#6a5d50', Titan: '#d9953c', Triton: '#e2c6b8', Phobos: '#7a6a5a', Deimos: '#9a8670',
  }
  /** Couleur d'un astre : sa couleur propre adoucie vers le sable (gris chaud pour les petites lunes). */
  const couleurAstre = (nom: string) => melanger(VIVES[nom] ?? '#a89c8c', '#f7e8cc', 0.3)
  /** Taille minimale à l'écran (rayon, px) : les astres sont grossis pour rester visibles, à leur vraie taille de près. */
  const GEANTES = new Set(['Jupiter', 'Saturne', 'Uranus', 'Neptune'])
  const rayonMinimal = (nom: string) => (nom === 'Soleil' ? 11 : GEANTES.has(nom) ? 8 : estPlanete(nom) ? 6 : 3.5)

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const fusee = $derived(etat.fusee)
  const v = $derived(vitesseActuelle(etat))

  // Dessin fluide : à chaque image, la fusée et les astres sont placés à l'instant lissé (voir jeu.affichage).
  // Les calculs plus lourds (plan de vol, départs) restent à un par seconde.
  let lisse = $state.raw(jeu.affichage())
  onMount(() => {
    let image = 0
    const boucle = () => { lisse = jeu.affichage(); image = requestAnimationFrame(boucle) }
    image = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(image)
  })
  const tl = $derived(lisse.t)
  const fl = $derived(lisse.etat.fusee)

  // Vue : centre (UA) et demi-largeur (UA). Dans le système d'une planète, le centre est relatif à la planète
  // (elle reste à sa place à l'écran pendant qu'elle avance sur son orbite).
  let centre = $state<Point2>({ x: 0, y: 0 })
  let demi = $state(2.2)
  const k = $derived(L / 2 / demi) // pixels par UA
  /** Système cadré (« niveau ») : la planète suivie, ou null pour le système solaire. */
  let niveau = $state<NomPlanete | null>(null)
  const origine = $derived(niveau ? positionAstre(niveau, tl) : { x: 0, y: 0 })
  const c0 = $derived({ x: origine.x + centre.x, y: origine.y + centre.y })

  const ecran = (p: Point2) => ({ x: L / 2 + (p.x - c0.x) * k, y: Hc / 2 - (p.y - c0.y) * k })
  const monde = (sx: number, sy: number): Point2 => ({ x: c0.x + (sx - L / 2) / k, y: c0.y - (sy - Hc / 2) / k })

  function viser(c: Point2, d: number) { niveau = null; centre = c; demi = d; suivi = false; vue = null }

  /** Taille du cadrage d'un système (UA) : l'orbite de la plus lointaine des lunes de plus de 200 km de rayon. */
  function tailleSysteme(planete: NomPlanete): number {
    const lunes = corpsDuSysteme(planete).filter((n) => !estPlanete(n) && n !== 'ISS')
    const grandes = lunes.filter((n) => (rayonCorps(n) ?? 0) >= 200)
    const a = Math.max(0, ...(grandes.length ? grandes : lunes).map((n) => demiGrandAxeAutourDeLaPlanete(n) ?? 0))
    return a > 0 ? (a / UA_KM) * 1.25 : 0
  }
  const aUnSysteme = (nom: string) => estPlanete(nom) && tailleSysteme(nom) > 0
  /** Cadre le système d'une planète : la planète au centre, ses grandes lunes autour. */
  function ouvrirSysteme(planete: NomPlanete) {
    niveau = planete
    centre = { x: 0, y: 0 }
    demi = tailleSysteme(planete)
    suivi = false
    vue = null
  }

  // TRAJECTOIRE : cadre la fusée, le point de rencontre et la cible, et les suit tant qu'on ne touche pas la carte.
  let suivi = $state(false)
  function cadrerTrajectoire() {
    const dest = fusee.destination
    if (!dest) return
    const points = [fl.position, positionDestination(dest, tl), ...(plan ? [plan.point] : [])]
    const xs = points.map((q) => q.x)
    const ys = points.map((q) => q.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    niveau = null
    centre = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
    // Demi-largeur : assez pour tout voir, avec une marge de 64 px de chaque côté (le cadran de cap de la fusée).
    const marge = 64
    const demiX = ((maxX - minX) / 2) * (L / 2) / (L / 2 - marge)
    const demiY = ((maxY - minY) / 2) * (Hc / 2) / (Hc / 2 - marge) * (L / Hc)
    demi = Math.max(0.00005, demiX, demiY)
  }
  $effect(() => {
    void tl
    if (suivi) cadrerTrajectoire()
  })

  // Quadrillage : environ six cases dans la largeur, de 1, 2 ou 5 × 10ⁿ UA ; en kilomètres ronds aux petites échelles.
  const rond = (brut: number) => {
    const p10 = 10 ** Math.floor(Math.log10(brut))
    return [5, 2, 1].map((m) => m * p10).find((v) => v <= brut) ?? p10
  }
  const pasGrille = $derived.by(() => {
    const brut = (demi * 2) / 6
    return brut >= 0.01 ? rond(brut) : rond(brut * UA_KM) / UA_KM
  })
  const lignesGrille = $derived.by(() => {
    const coin = monde(0, Hc)
    const oppose = monde(L, 0)
    const v: number[] = []
    const h: number[] = []
    for (let x = Math.ceil(coin.x / pasGrille) * pasGrille; x <= oppose.x; x += pasGrille) v.push(ecran({ x, y: 0 }).x)
    for (let y = Math.ceil(coin.y / pasGrille) * pasGrille; y <= oppose.y; y += pasGrille) h.push(ecran({ x: 0, y }).y)
    return { v, h }
  })
  /** Taille d'une case, en UA (ou en km quand c'est petit). */
  const echelle = $derived(pasGrille >= 0.01 ? `${nombre(pasGrille, pasGrille < 1 ? (pasGrille < 0.1 ? 2 : 1) : 0)} UA` : `${Math.round(pasGrille * UA_KM).toLocaleString('fr-FR')} km`)

  /** Vues de la carte : la fusée de près, le trajet (suivi), les planètes intérieures, tout le système. */
  let vue = $state<'fusee' | 'trajet' | 'planetes' | 'tout' | null>(null)
  function choisirVue(v: 'fusee' | 'trajet' | 'planetes' | 'tout') {
    if (v === 'fusee') viser({ ...fusee.position }, Math.min(demi, 0.05))
    else if (v === 'planetes') viser({ x: 0, y: 0 }, 2.2)
    else if (v === 'tout') viser({ x: 0, y: 0 }, 32)
    else { suivi = true; cadrerTrajectoire() }
    vue = v
  }
  /** Onglet du panneau du bas : navigation (destination) ou chasse (radio, ping, tracés). */
  let mode = $state<'navigation' | 'chasse'>('navigation')
  // Tracés de chasse (cercles du ping, droites du télescope) : visibles dans l'onglet CHASSE.
  const tracesVisibles = $derived(mode === 'chasse')

  // Astres à dessiner : planètes, et les corps d'un système quand on zoome dessus. Chaque astre a un rayon à l'écran
  // (grossi, ou vrai de près). Une lune ou un engin trop près de sa planète pour s'en détacher n'est pas dessiné.
  type Marque = { nom: string; p: Point2; r: number; couleur: string; etiquette: boolean; engin?: boolean; soleil?: number }
  const rayonEcran = (nom: string) => Math.max(rayonMinimal(nom), ((rayonCorps(nom) ?? 0) / UA_KM) * k)
  /** Direction du Soleil à l'écran (degrés, sens des aiguilles d'une montre depuis la droite), vue depuis p. */
  const versSoleil = (p: Point2) => (Math.atan2(p.y, -p.x) * 180) / Math.PI
  const marques = $derived.by(() => {
    const l: Marque[] = [{ nom: 'Soleil', p: { x: 0, y: 0 }, r: rayonEcran('Soleil'), couleur: couleurAstre('Soleil'), etiquette: true }]
    for (const nom of NOMS_PLANETES) {
      const p = positionAstre(nom, tl)
      l.push({ nom, p, r: rayonEcran(nom), couleur: couleurAstre(nom), etiquette: true, soleil: versSoleil(p) })
    }
    const disques = l.map((m) => ({ s: ecran(m.p), r: m.r }))
    /** Libre : assez loin de tout disque déjà dessiné pour qu'on le distingue. */
    const libre = (p: Point2, r: number) => {
      const s = ecran(p)
      return disques.every((d) => Math.hypot(d.s.x - s.x, d.s.y - s.y) > d.r + r + 3)
    }
    for (const planete of NOMS_PLANETES) {
      const c = positionAstre(planete, tl)
      if (k * rayonInfluence(planete) < 30) continue
      if (Math.abs(c.x - c0.x) > demi * 1.6 || Math.abs(c.y - c0.y) > demi * 1.8) continue
      for (const nom of corpsDuSysteme(planete)) {
        if (estPlanete(nom) || nom === 'ISS') continue
        const a = demiGrandAxeAutourDeLaPlanete(nom)! / UA_KM
        const p = positionAstre(nom, tl)
        const r = rayonEcran(nom)
        if (!libre(p, r)) continue
        l.push({ nom, p, r, couleur: couleurAstre(nom), etiquette: a * k > 26, soleil: versSoleil(p) })
      }
    }
    for (const e of [{ nom: 'ISS', position: positionAstre('ISS', tl) }, ...positionsEngins(tl)]) {
      if (libre(e.position, 4.5)) l.push({ nom: e.nom, p: e.position, r: 4.5, couleur: PLAN.fond, etiquette: true, engin: true })
    }
    return l
  })

  /** Noms qui ne se chevauchent pas (ni entre eux, ni avec un astre), par ordre d'importance : Soleil, planètes,
   *  lunes, engins. La fusée et son cadran de cap gardent leur place. */
  const nomsVisibles = $derived.by(() => {
    type Boite = { x0: number; y0: number; x1: number; y1: number }
    const f = ecran(fl.position)
    const prises: Boite[] = [{ x0: f.x - 12, y0: f.y - 12, x1: f.x + 12, y1: f.y + 12 }]
    for (const m of marques) { const s = ecran(m.p); prises.push({ x0: s.x - m.r, y0: s.y - m.r, x1: s.x + m.r, y1: s.y + m.r }) }
    const ok = new Map<string, { x: number; y: number }>()
    for (const m of marques) {
      if (!m.etiquette) continue
      const s = ecran(m.p)
      const taille = m.engin ? 9 : 11
      const largeur = m.nom.length * taille * 0.62
      const ecart = m.engin ? 7 : m.r + 3
      // Quatre places essayées dans l'ordre : en haut à droite, en bas à droite, en haut à gauche, en bas à gauche.
      for (const [cote, haut] of [[1, true], [1, false], [-1, true], [-1, false]] as const) {
        const x = cote > 0 ? s.x + ecart : s.x - ecart - largeur
        const y = haut ? s.y - Math.max(m.r * 0.7, 2) - 2 : s.y + Math.max(m.r * 0.7, 2) + taille
        const boite = { x0: x - 1, y0: y - taille, x1: x + largeur + 1, y1: y + 2 }
        if (prises.every((q) => boite.x1 < q.x0 || boite.x0 > q.x1 || boite.y1 < q.y0 || boite.y0 > q.y1)) {
          ok.set(m.nom, { x, y })
          prises.push(boite)
          break
        }
      }
    }
    return ok
  })

  const plan = $derived(fusee.destination ? planDeVol(fusee, t, v) : null)
  const detecte = $derived(visiteurDetecte(etat, t))
  const visiteur = $derived(detecte !== null ? positionVisiteur(t) : null)

  // Sélection d'une nouvelle destination.
  let choix = $state<Destination | null>(null)
  /** Plusieurs objets sous le doigt : on propose de choisir. */
  let ambigus = $state<{ noms: string[]; point: Destination } | null>(null)
  function choisir(d: Destination) {
    choix = d
    ambigus = null
  }
  /** Liste de toutes les destinations, par familles (pour les objets lointains ou trop serrés sur la carte). */
  const LISTE = [
    { titre: 'Soleil, planètes et Lune', noms: ['Soleil', ...NOMS_PLANETES, 'Lune'] },
    { titre: 'Engins', noms: ['ISS', ...NOMS_ENGINS] },
    ...NOMS_PLANETES.filter((p) => satellitesDe(p).length).map((p) => ({ titre: `Satellites de ${p}`, noms: satellitesDe(p).map((s) => s.nom) })),
  ]
  function depuisLaListe(e: Event) {
    const nom = (e.currentTarget as HTMLSelectElement).value
    if (nom) choisir({ type: 'astre', astre: nom })
    ;(e.currentTarget as HTMLSelectElement).value = ''
  }
  const options = $derived(choix ? optionsDeDepart(fusee, choix, t, v) : null)
  const nomChoix = (d: Destination) => (d.type === 'astre' ? nomAstre(d.astre) : d.type === 'point' ? 'Point libre' : 'Objet inconnu')

  /** Durée de l'approche finale (s) : la fusée arrive à la distance d'arrivée, pas au centre de l'astre. */
  const approche = (d: Destination) => (v > 0 ? (seuilArrivee(d) * UA_KM) / v : 0)

  function partir(fenetre: boolean) {
    if (!choix) return
    const f = fenetre ? choisirDestinationAvecFenetre(fusee, choix, t, v) : choisirDestination(fusee, choix)
    jeu.remplacer({ ...etat, fusee: f }, [`NOUVEAU CAP : ${nomChoix(choix).toUpperCase()}.${fenetre ? ' DÉPART À LA FENÊTRE DE TIR.' : ''}`])
    choix = null
  }

  // Gestes : glisser pour déplacer, pincer pour zoomer, toucher pour choisir.
  const doigts = new Map<number, { x: number; y: number }>()
  let pincement = 0
  let deplace = false
  let svg: SVGSVGElement

  function local(e: PointerEvent) {
    const r = svg.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * L, y: ((e.clientY - r.top) / r.height) * Hc }
  }
  function appuyer(e: PointerEvent) {
    suivi = false
    vue = null
    svg.setPointerCapture(e.pointerId)
    doigts.set(e.pointerId, local(e))
    deplace = false
    if (doigts.size === 2) { const [a, b] = [...doigts.values()]; pincement = Math.hypot(a.x - b.x, a.y - b.y) }
  }
  function bouger(e: PointerEvent) {
    const avant = doigts.get(e.pointerId)
    if (!avant) return
    const ici = local(e)
    doigts.set(e.pointerId, ici)
    if (doigts.size === 1) {
      if (Math.hypot(ici.x - avant.x, ici.y - avant.y) > 0.5) deplace = true
      centre = { x: centre.x - (ici.x - avant.x) / k, y: centre.y + (ici.y - avant.y) / k }
    } else if (doigts.size === 2) {
      const [a, b] = [...doigts.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pincement > 0) demi = Math.max(0.00005, Math.min(250, demi * (pincement / d)))
      pincement = d
      deplace = true
    }
  }
  function relacher(e: PointerEvent) {
    const p = doigts.get(e.pointerId)
    doigts.delete(e.pointerId)
    if (doigts.size < 2) pincement = 0
    if (!p || deplace || doigts.size > 0) return
    // Toucher : l'astre ou l'engin à moins de 22 px ; s'il y en a plusieurs (la Terre, l'ISS, Hubble…), on demande
    // lequel ; sinon, un point libre.
    const proches = marques
      .map((m) => { const s = ecran(m.p); return { m, d: Math.hypot(s.x - p.x, s.y - p.y) } })
      .filter((x) => x.d < 22)
      .sort((a, b) => a.d - b.d)
    const w = monde(p.x, p.y)
    mode = 'navigation'
    if (proches.length > 1) {
      ambigus = { noms: proches.map((x) => x.m.nom), point: { type: 'point', x: w.x, y: w.y } }
      choix = null
      return
    }
    ambigus = null
    const nom = proches[0]?.m.nom
    // Toucher encore la planète choisie ouvre son système.
    if (nom && choix?.type === 'astre' && choix.astre === nom && aUnSysteme(nom) && niveau !== nom) { ouvrirSysteme(nom as NomPlanete); return }
    choix = nom ? { type: 'astre', astre: nom } : { type: 'point', x: w.x, y: w.y }
  }
  function molette(e: WheelEvent) {
    suivi = false
    e.preventDefault()
    demi = Math.max(0.00005, Math.min(250, demi * (e.deltaY > 0 ? 1.15 : 1 / 1.15)))
  }

  // Tracés de chasse.
  let rayon = $state('')
  let angle = $state('')
  const nombreSaisi = (s: string) => Number(s.replace(',', '.'))
  function tracerCercle() {
    const p = etat.chasse.dernierPing
    const r = nombreSaisi(rayon)
    if (!p || !(r > 0)) return
    jeu.traces = [...jeu.traces, { type: 'cercle', x: p.x, y: p.y, rayon: r }]
    rayon = ''
    jeu.sauvegarder()
  }
  function tracerDroite() {
    const p = etat.chasse.derniereVisee
    const a = nombreSaisi(angle)
    if (!p || !Number.isFinite(a)) return
    jeu.traces = [...jeu.traces, { type: 'droite', x: p.x, y: p.y, angle: a }]
    angle = ''
    jeu.sauvegarder()
  }

  // Un cercle pointillé de plusieurs millions de pixels (une orbite vue de très près) fige le dessin :
  // on ne trace que la partie visible, en petits segments. Même chose pour la route.
  const DEMI_DIAG = Math.hypot(L, Hc) / 2 + 20
  function arcVisible(c: Point2, r: number): string | null {
    const R = r * k
    const s = ecran(c)
    const dx = L / 2 - s.x
    const dy = Hc / 2 - s.y
    const d = Math.hypot(dx, dy)
    if (Math.abs(d - R) > DEMI_DIAG) return null
    if (R < 2000) return `M ${s.x - R} ${s.y} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0`
    const milieu = Math.atan2(dy, dx)
    const cos = (d * d + R * R - DEMI_DIAG * DEMI_DIAG) / (2 * d * R)
    const ouverture = cos <= -1 ? Math.PI : Math.acos(Math.min(1, cos))
    const n = 48
    let chemin = ''
    for (let i = 0; i <= n; i++) {
      const a = milieu - ouverture + (2 * ouverture * i) / n
      chemin += `${i ? 'L' : 'M'} ${s.x + Math.cos(a) * R} ${s.y + Math.sin(a) * R} `
    }
    return chemin
  }
  /** Segment coupé au cadre de la carte (méthode de Liang et Barsky), ou null s'il n'y passe pas. */
  function segmentVisible(a: { x: number; y: number }, b: { x: number; y: number }): string | null {
    const dx = b.x - a.x
    const dy = b.y - a.y
    let t0 = 0
    let t1 = 1
    for (const [q, r] of [[-dx, a.x + 20], [dx, L + 20 - a.x], [-dy, a.y + 20], [dy, Hc + 20 - a.y]]) {
      if (q === 0) { if (r < 0) return null; continue }
      const u = r / q
      if (q < 0) t0 = Math.max(t0, u)
      else t1 = Math.min(t1, u)
      if (t0 > t1) return null
    }
    return `M ${a.x + dx * t0} ${a.y + dy * t0} L ${a.x + dx * t1} ${a.y + dy * t1}`
  }

  // Les autres commissionnaires : un point de leur couleur ; leur nom quand on zoome assez pour les distinguer.
  // Les noms ne s'écrivent que s'ils ne se chevauchent pas (sinon, autour de la Terre, ce serait illisible).
  const autres = $derived.by(() => {
    const ecrits: { x: number; y: number }[] = [ecran(fl.position), ...[...nomsVisibles.values()].map((n) => ({ x: n.x - 5, y: n.y - 11 }))]
    return autresFusees(tl).map((a) => {
      const s = ecran(a.position)
      const visible = s.x > -10 && s.x < L + 10 && s.y > -10 && s.y < Hc + 10
      const libre = visible && ecrits.every((e) => Math.abs(e.x - s.x) > 70 || Math.abs(e.y - s.y) > 13)
      if (libre) ecrits.push(s)
      return { ...a, s, visible, nomVisible: libre }
    })
  })


  const posFusee = $derived(ecran(fl.position))
  const graduations = Array.from({ length: 12 }, (_, i) => i * 30)
</script>

<div class="carte">
  <button class="retour-cockpit" onclick={() => (jeu.page = 'cockpit')}>‹ COCKPIT</button>
  <!-- Vues de la carte. -->
  <div class="vues" role="group" aria-label="Vue de la carte">
    <button class:actif={vue === 'fusee'} onclick={() => choisirVue('fusee')}>FUSÉE</button>
    <button class:actif={vue === 'trajet'} disabled={!fusee.destination} onclick={() => choisirVue('trajet')}>TRAJET</button>
    <button class:actif={vue === 'planetes'} onclick={() => choisirVue('planetes')}>PLANÈTES</button>
    <button class:actif={vue === 'tout'} onclick={() => choisirVue('tout')}>TOUT</button>
  </div>
  <!-- Système cadré : le système solaire, ou celui d'une planète (toucher deux fois une planète l'ouvre). -->
  <div class="niveau">
    <span>{niveau ? `SYSTÈME ${niveau === 'Terre' ? 'DE LA TERRE' : `DE ${niveau.toUpperCase()}`}` : 'SYSTÈME SOLAIRE'}</span>
    {#if niveau}<button onclick={() => viser({ x: 0, y: 0 }, 2.2)}>‹ SYSTÈME SOLAIRE</button>
    {:else if choix?.type === 'astre' && aUnSysteme(choix.astre)}<button onclick={() => ouvrirSysteme(choix!.type === 'astre' ? choix!.astre as NomPlanete : 'Terre')}>VOIR SON SYSTÈME ›</button>{/if}
  </div>

  <svg bind:this={svg} viewBox={`0 0 ${L} ${Hc}`} class="plan" role="application" aria-label="Carte du système solaire"
    onpointerdown={appuyer} onpointermove={bouger} onpointerup={relacher} onpointercancel={relacher} onwheel={molette}>
    <defs>
      <!-- Hachures fines à 45° (le long du terminateur, style Moebius). -->
      <pattern id="hachures-carte" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="3" stroke={PLAN.trait} stroke-width="0.8" />
      </pattern>
    </defs>
    <rect width={L} height={Hc} fill={PLAN.fond} />
    <!-- Quadrillage. -->
    {#each lignesGrille.v as x}<line x1={x} y1="0" x2={x} y2={Hc} stroke={PLAN.trait} stroke-width="0.5" opacity=".1" />{/each}
    {#each lignesGrille.h as y}<line x1="0" y1={y} x2={L} y2={y} stroke={PLAN.trait} stroke-width="0.5" opacity=".1" />{/each}
    <!-- Orbites : planètes autour du Soleil, lunes autour de leur planète, de la couleur de l'astre. -->
    {#each NOMS_PLANETES as nom}
      {@const p = positionAstre(nom, tl)}
      {@const d = arcVisible({ x: 0, y: 0 }, Math.hypot(p.x, p.y))}
      {#if d}<path {d} fill="none" stroke={couleurAstre(nom)} stroke-width="0.9" opacity=".75" />{/if}
    {/each}
    {#each marques as m}
      {#if !m.engin && m.nom !== 'Soleil' && !estPlanete(m.nom)}
        {@const c = positionAstre(planeteDe(m.nom), tl)}
        {@const d = arcVisible(c, Math.hypot(m.p.x - c.x, m.p.y - c.y))}
        {#if d}<path {d} fill="none" stroke={m.couleur} stroke-width="0.8" opacity=".6" />{/if}
      {/if}
    {/each}
    {#each marques as m}
      {@const s = ecran(m.p)}
      {#if s.x > -m.r - 40 && s.x < L + m.r + 40 && s.y > -m.r - 40 && s.y < Hc + m.r + 40}
        {#if m.engin}
          <!-- Engin humain : petit losange, nom en plus petit. -->
          <path d={`M ${s.x} ${s.y - 4.5} L ${s.x + 4.5} ${s.y} L ${s.x} ${s.y + 4.5} L ${s.x - 4.5} ${s.y} Z`} fill="#23476b" stroke={PLAN.trait} stroke-width="1" />
          {@const n = nomsVisibles.get(m.nom)}
          {#if n}<text class="nom" x={n.x} y={n.y} font-size="9" fill={PLAN.trait} opacity=".85">{m.nom.toUpperCase()}</text>{/if}
        {:else}
          <circle cx={s.x} cy={s.y} r={m.r} fill={m.couleur} />
          {#if m.soleil !== undefined}
            <!-- Face de nuit : aplat violet, hachures sur la bande du terminateur (le Soleil est vers +x, une fois tourné). -->
            {@const r = m.r}
            {@const ombre = melanger(m.couleur, PLAN.ombre, 0.6)}
            {@const segment = (x0: number) => { const h = Math.sqrt(r * r - x0 * x0); return `M ${x0} ${-h} A ${r} ${r} 0 ${x0 > 0 ? 1 : 0} 0 ${x0} ${h} Z` }}
            <g transform={`translate(${s.x} ${s.y}) rotate(${m.soleil})`}>
              <path d={segment(-0.1 * r)} fill={ombre} />
              <path d={segment(0.2 * r)} fill="url(#hachures-carte)" />
              <path d={segment(-0.5 * r)} fill={ombre} />
            </g>
          {:else}
            <!-- Le Soleil : des rayons. -->
            {#each Array.from({ length: 12 }, (_, i) => i) as i}
              {@const a = (i * Math.PI) / 6}
              {@const r1 = m.r + (i % 2 ? 6 : 10)}
              <line x1={s.x + (m.r + 3) * Math.cos(a)} y1={s.y + (m.r + 3) * Math.sin(a)} x2={s.x + r1 * Math.cos(a)} y2={s.y + r1 * Math.sin(a)} stroke={PLAN.trait} stroke-width="1.6" stroke-linecap="round" />
            {/each}
          {/if}
          <circle cx={s.x} cy={s.y} r={m.r} fill="none" stroke={PLAN.trait} stroke-width={m.r > 15 ? 1.6 : 1} />
          {@const n = nomsVisibles.get(m.nom)}
          {#if n}<text class="nom" x={n.x} y={n.y} font-size="11" fill={PLAN.trait}>{m.nom.toUpperCase()}</text>{/if}
        {/if}
      {/if}
    {/each}

    {#if tracesVisibles}
      {#each jeu.traces as tr}
        {@const s = ecran(tr)}
        {#if tr.type === 'cercle'}
          {@const d = arcVisible(tr, tr.rayon)}
          {#if d}<path {d} fill="none" stroke={PLAN.chasse} stroke-width="1.6" stroke-dasharray="6 4" />{/if}
        {:else}
          {@const a = (tr.angle * Math.PI) / 180}
          <line x1={s.x} y1={s.y} x2={s.x + Math.cos(a) * 2000} y2={s.y - Math.sin(a) * 2000} stroke={PLAN.chasse} stroke-width="1.6" stroke-dasharray="6 4" />
        {/if}
      {/each}
    {/if}

    {#each autres as a}
      {#if a.visible}
        <circle cx={a.s.x} cy={a.s.y} r="3.2" fill={a.couleur} stroke={PLAN.trait} stroke-width="1" opacity={a.enLigne ? 1 : 0.55} />
        {#if a.nomVisible}<text x={a.s.x + 5} y={a.s.y + 11} font-size="11" font-family="var(--police-script)" fill={a.couleur}>{a.nom}</text>{/if}
      {/if}
    {/each}

    {#if visiteur}
      {@const s = ecran(visiteur)}
      <ellipse cx={s.x} cy={s.y} rx="9" ry="4.5" fill="#8fcf98" stroke={PLAN.trait} stroke-width="1.5" />
    {/if}

    {#if fusee.destination}
      {@const cible = ecran(positionDestination(fusee.destination, tl))}
      {@const point = plan ? ecran(plan.point) : cible}
      {@const route = segmentVisible(posFusee, point)}
      {@const visee = segmentVisible(posFusee, cible)}
      <!-- Deux traits : vers la destination là où elle est maintenant (blanc, fin), et vers le point de rencontre,
           là où la fusée la rejoindra (jaune). -->
      {#if visee}<path d={visee} fill="none" stroke={PLAN.trait} stroke-width="1.2" stroke-dasharray="2 4" opacity=".85" />{/if}
      {#if route}<path d={route} fill="none" stroke={PLAN.trait} stroke-width="4" stroke-linecap="round" /><path d={route} fill="none" stroke={PLAN.route} stroke-width="2.2" stroke-linecap="round" />{/if}
      <circle cx={point.x} cy={point.y} r="6" fill="none" stroke={PLAN.route} stroke-width="2" />
      <circle cx={cible.x} cy={cible.y} r="10" fill="none" stroke={PLAN.trait} stroke-width="1.5" stroke-dasharray="3 3" />
    {/if}
    {#if choix}
      {@const s = ecran(positionDestination(choix, tl))}
      <circle cx={s.x} cy={s.y} r="12" fill="none" stroke={PLAN.route} stroke-width="2.5" />
    {/if}

    <g transform={`translate(${posFusee.x} ${posFusee.y})`}>
      <circle r="40" fill="none" stroke={PLAN.trait} stroke-width="1" opacity=".45" />
      {#each graduations as g}
        {@const a = (g * Math.PI) / 180}
        <line x1={Math.cos(a) * 36} y1={-Math.sin(a) * 36} x2={Math.cos(a) * 40} y2={-Math.sin(a) * 40} stroke={PLAN.trait} stroke-width={g % 90 === 0 ? 2 : 1} />
        {#if g % 90 === 0}<text x={Math.cos(a) * 50} y={-Math.sin(a) * 50 + 4} text-anchor="middle" font-size="10" font-family="var(--police-chiffres)" fill={PLAN.trait}>{g}</text>{/if}
      {/each}
      <path d="M 9 0 L -6 5 L -3 0 L -6 -5 Z" fill="#e04b37" stroke={PLAN.trait} stroke-width="1.3" transform={`rotate(${-fl.cap})`} />
    </g>

    <!-- Légende des deux traits. -->
    {#if fusee.destination}
      <g transform={`translate(${L - 150} ${Hc - 68})`}>
        <rect width="144" height="26" fill={PLAN.fond} stroke={PLAN.trait} stroke-width="1.2" />
        <line x1="6" y1="8" x2="26" y2="8" stroke={PLAN.trait} stroke-width="1.2" stroke-dasharray="2 4" />
        <text x="32" y="11" font-size="8" font-family="var(--police-machine)" fill={PLAN.trait}>DESTINATION, MAINTENANT</text>
        <line x1="6" y1="19" x2="26" y2="19" stroke={PLAN.route} stroke-width="2.2" />
        <text x="32" y="22" font-size="8" font-family="var(--police-machine)" fill={PLAN.trait}>POINT DE RENCONTRE</text>
      </g>
    {/if}

    <!-- Cartouche du plan, comme sur un bleu d'architecte. -->
    <g transform={`translate(${L - 150} ${Hc - 40})`}>
      <rect width="144" height="34" fill={PLAN.fond} stroke={PLAN.trait} stroke-width="1.2" />
      <line x1="0" y1="14" x2="144" y2="14" stroke={PLAN.trait} stroke-width="0.8" />
      <text x="6" y="10.5" font-size="8" font-family="var(--police-machine)" fill={PLAN.trait}>O.N.V.I. — PLAN DE VOL C-58</text>
      <rect x="6" y="19" width="10" height="10" fill="none" stroke={PLAN.trait} stroke-width="1.2" />
      <text x="22" y="28" font-size="10" font-family="var(--police-machine)" fill={PLAN.trait}>= {echelle}</text>
    </g>
  </svg>

  <div class="onglets" role="tablist">
    <button role="tab" aria-selected={mode === 'navigation'} class:actif={mode === 'navigation'} onclick={() => (mode = 'navigation')}>DESTINATION</button>
    <button role="tab" aria-selected={mode === 'chasse'} class:actif={mode === 'chasse'} onclick={() => (mode = 'chasse')}>CHASSE</button>
  </div>
  <div class="panneau">
    {#if mode === 'navigation' && ambigus}
      <div class="ligne"><span class="etiquette">PLUSIEURS OBJETS ICI</span><button class="lien" onclick={() => (ambigus = null)}>annuler</button></div>
      <div class="ambigus">
        {#each ambigus.noms as n}<button onclick={() => choisir({ type: 'astre', astre: n })}>{nomAstre(n).replace(/^./, (c) => c.toUpperCase())}</button>{/each}
        <button class="clair" onclick={() => choisir(ambigus!.point)}>Point libre</button>
      </div>
    {:else if mode === 'navigation' && choix && options}
      <div class="ligne"><span class="etiquette">NOUVELLE DESTINATION</span><button class="lien" onclick={() => (choix = null)}>annuler</button></div>
      <div class="ligne"><span class="grand">{nomChoix(choix).replace(/^./, (c) => c.toUpperCase())}</span><span class="chiffres">{ua(distance(fusee.position, positionDestination(choix, t)))}</span></div>
      {#if options.maintenant}
        {@const voyage = (options.maintenant.arrivee - t) / 1000 - approche(choix) + (DUREE_ACCELERATION / 2) * Math.max(0, 1 - vitesseDuMoment(fusee, v) / v) ** 2}
        {@const quand = t + voyage * 1000}
        <button class="action clair" onclick={() => partir(false)}>PARTIR MAINTENANT — {duree(voyage)}<br /><small>arrivée le {dateLocale(quand)} à {heureLocale(quand)}</small></button>
      {/if}
      {#if !options.maintenant && !options.fenetre}
        <p class="aide">Hors de portée : à la vitesse actuelle de la fusée, on ne peut pas le rattraper.</p>
      {/if}
      {#if options.fenetre}
        <button class="action" onclick={() => partir(true)}>FENÊTRE DE TIR — départ le {dateLocale(options.fenetre.depart)} à {heureLocale(options.fenetre.depart)}<br /><small>arrivée le {dateLocale(options.fenetre.arrivee)} à {heureLocale(options.fenetre.arrivee)}</small></button>
      {/if}
    {:else if mode === 'navigation'}
      <div class="ligne">
        <span class="etiquette">DESTINATION</span>
        {#if fusee.destination}<button class="lien" onclick={() => jeu.remplacer({ ...etat, fusee: annulerDestination(fusee) }, ['DESTINATION ANNULÉE. MOTEUR COUPÉ.'])}>annuler</button>{/if}
      </div>
      <div class="ligne">
        <span class="grand">{fusee.destination ? nomChoix(fusee.destination).replace(/^./, (c) => c.toUpperCase()) : 'Aucune'}</span>
        {#if fusee.destination && v > 0}<span class="chiffres">{duree(tempsRestant(fusee, t, v) ?? 0)}</span>{/if}
      </div>
      <p class="aide">Touchez un astre, un engin ou un point de la carte pour choisir une destination, ou :</p>
      <select class="liste" aria-label="Choisir une destination dans la liste" onchange={depuisLaListe}>
        <option value="">Choisir dans la liste…</option>
        {#each LISTE as g}
          <optgroup label={g.titre}>{#each g.noms as n}<option value={n}>{nomAstre(n).replace(/^./, (c) => c.toUpperCase())}</option>{/each}</optgroup>
        {/each}
      </select>
    {:else}
      <div class="boutons">
        {#if estInstalle(etat, 'TEL')}
          <button class="action" onclick={() => { const r = viserTelescope(etat, t, hasardReel); jeu.remplacer(r.etat, r.messages) }}>TÉLESCOPE</button>
        {/if}
      </div>
      <!-- Calculateur de l'écho : la distance du visiteur au point du ping, en UA. -->
      {#if etat.chasse.dernierEcho}
        {@const d = distanceEcho(etat.chasse.dernierEcho.duree)}
        <div class="calcul">
          <span><small>DERNIER ÉCHO · {heureLocale(etat.chasse.dernierEcho.t)}</small>{dureePrecise(etat.chasse.dernierEcho.duree / 1000)} aller-retour → <b>{nombre(d, 3)} UA</b></span>
          <button onclick={() => { rayon = nombre(d, 3); tracerCercle() }} disabled={!etat.chasse.dernierPing}>TRACER</button>
        </div>
      {/if}
      <div class="tracer">
        <input inputmode="decimal" placeholder="rayon (UA)" bind:value={rayon} aria-label="Rayon du cercle en UA" />
        <button onclick={tracerCercle} disabled={!etat.chasse.dernierPing}>CERCLE</button>
        <input inputmode="decimal" placeholder="angle (°)" bind:value={angle} aria-label="Angle de la droite en degrés" />
        <button onclick={tracerDroite} disabled={!etat.chasse.derniereVisee}>DROITE</button>
        <button onclick={() => { jeu.traces = []; jeu.sauvegarder() }}>EFFACER</button>
      </div>
    {/if}
  </div>
  <!-- PROVISOIRE (à retirer sur ordre d'Adrien) : saut d'essai vers n'importe quelle destination. -->
  <Saut />
  <Reinitialiser />
</div>

<style>
  .carte {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 14px 14px;
    overflow-y: auto;
    flex: 1;
  }
  /* Rien ne rétrécit dans la colonne : elle défile si elle est trop haute. */
  .carte > :global(*) {
    flex-shrink: 0;
  }
  .retour-cockpit {
    align-self: flex-start;
    min-height: 40px;
    padding: 0 14px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--couleur-encre);
    color: var(--couleur-texte-clair);
    font-family: var(--police-chiffres);
    font-weight: 700;
    letter-spacing: 1px;
  }
  .vues {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 12px;
    overflow: hidden;
  }
  .vues button {
    min-height: 40px;
    border: 0;
    border-left: 2px solid var(--couleur-encre);
    background: var(--couleur-papier);
    font-family: var(--police-titre);
    font-size: 12px;
  }
  .vues button:first-child {
    border-left: 0;
  }
  .vues button.actif {
    background: var(--couleur-encre);
    color: var(--couleur-texte-clair);
  }
  .niveau {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 40px;
    font-family: var(--police-titre);
    font-size: 13px;
    letter-spacing: 1px;
  }
  .niveau button {
    min-height: 40px;
    padding: 0 12px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--moutarde);
    font-family: var(--police-chiffres);
    font-weight: 700;
    font-size: 12px;
  }
  /* Noms sur la carte : liseré de la couleur du fond, pour rester lisibles sur une orbite ou un astre. */
  .plan .nom {
    font-family: var(--police-machine);
    paint-order: stroke;
    stroke: #f4f1ea;
    stroke-width: 3px;
    stroke-linejoin: round;
  }
  .vues button:disabled {
    color: var(--couleur-texte-eteint);
  }
  .onglets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    border-bottom: 3px solid var(--couleur-encre);
  }
  .onglets button {
    min-height: 40px;
    border: var(--trait) solid var(--couleur-encre);
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    background: var(--couleur-papier-fonce);
    font-family: var(--police-titre);
    font-size: 13px;
  }
  .onglets button.actif {
    background: var(--cerise);
    color: var(--couleur-papier);
  }
  .ambigus {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ambigus button {
    min-height: 44px;
    padding: 0 12px;
    border: 2px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--couleur-bandeau);
    color: var(--couleur-texte-clair);
    font-weight: 700;
    font-size: 15px;
  }
  .ambigus button.clair {
    background: var(--couleur-papier);
    color: var(--couleur-encre);
  }
  .liste {
    min-height: 44px;
    padding: 0 10px;
    border: 2px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--couleur-papier);
    font: inherit;
    font-size: 16px;
  }
  .calcul {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--nuit);
    color: var(--menthe);
    font-family: var(--police-machine);
    font-size: 13px;
  }
  .calcul span {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .calcul small {
    font-size: 10px;
    letter-spacing: 1px;
    color: #9cc7a4;
  }
  .calcul b {
    color: var(--moutarde);
  }
  .calcul button {
    min-height: 40px;
    padding: 0 10px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--moutarde);
    font-weight: 700;
  }
  .aide {
    margin: 0;
    font-size: 13px;
    color: var(--couleur-texte-discret);
  }
  /* Le plan garde toujours ses proportions (largeur pleine, hauteur selon le dessin) : jamais écrasé par le panneau
     du dessous, donc ni bords coupés ni marges qui changent selon la vue. */
  .plan {
    display: block;
    flex: none;
    width: 100%;
    height: auto;
    aspect-ratio: 362 / 400;
    touch-action: none;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 10px;
    box-shadow: var(--ombre);
  }
  /* Panneau de commande : papier clair cerné d'encre (voir matieres.css). */
  .panneau {
    border-radius: var(--rayon-grand);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ligne {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .etiquette {
    font-size: 12px;
    letter-spacing: 2px;
    color: var(--couleur-texte-discret);
  }
  .grand {
    font-family: var(--police-titre);
    font-size: 22px;
  }
  .chiffres {
    font-family: var(--police-chiffres);
    font-size: 14px;
  }
  .lien {
    min-height: 32px;
    border: 0;
    background: none;
    color: var(--couleur-texte-discret);
    text-decoration: underline;
  }
  .action {
    min-height: 46px;
    border-radius: 12px;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--couleur-papier);
    box-shadow: var(--ombre-bouton);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    flex: 1;
  }
  .action.clair {
    background: var(--moutarde);
  }
  .action:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--couleur-encre);
  }
  .boutons {
    display: flex;
    gap: 8px;
  }
  .tracer {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
  }
  .tracer input {
    min-height: 40px;
    border-radius: 10px;
    border: var(--trait) solid var(--couleur-encre);
    background: #fffaf0;
    color: var(--couleur-encre);
    font: inherit;
    padding: 0 10px;
  }
  .tracer button {
    min-height: 40px;
    border-radius: 10px;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--couleur-trace);
    color: var(--couleur-papier);
    font-weight: 700;
    letter-spacing: 1px;
  }
  .tracer button:last-child {
    grid-column: 1 / -1;
  }
</style>
