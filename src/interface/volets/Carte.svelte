<script lang="ts">
  // Volet de la carte : vraies positions, zoom au doigt, cadran de cap, destination, rencontre, ping, tracés.
  import { onMount } from 'svelte'
  import { corpsDuSysteme, demiGrandAxeAutourDeLaPlanete, estPlanete, rayonInfluence } from '../../astro/corps'
  import { UA_KM } from '../../astro/temps'
  import { NOMS_PLANETES } from '../../donnees/planetes'
  import { ping, positionVisiteur, reglerRadio, viserTelescope, visiteurDetecte } from '../../moteur/chasse'
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
    type Destination,
    type Point2,
  } from '../../moteur/fusee'
  import { hasardReel } from '../../moteur/hasard'
  import { vitesseActuelle } from '../../moteur/partie'
  import { dateLocale, duree, nombre, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'

  const L = 362
  const Hc = 400
  const COULEURS: Record<string, string> = {
    Mercure: '#cfc6b6', Vénus: '#efdfae', Terre: '#7fa4cf', Mars: '#e07a5c',
    Jupiter: '#dcb184', Saturne: '#e6cf92', Uranus: '#a9d2d6', Neptune: '#7f9fd6',
  }

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

  // Vue : centre (UA) et demi-largeur (UA).
  let centre = $state<Point2>({ x: 0, y: 0 })
  let demi = $state(2.2)
  const k = $derived(L / 2 / demi) // pixels par UA

  const ecran = (p: Point2) => ({ x: L / 2 + (p.x - centre.x) * k, y: Hc / 2 - (p.y - centre.y) * k })
  const monde = (sx: number, sy: number): Point2 => ({ x: centre.x + (sx - L / 2) / k, y: centre.y - (sy - Hc / 2) / k })

  function viser(c: Point2, d: number) { centre = c; demi = d }
  const raccourcis = [
    { nom: 'INTÉRIEUR', f: () => viser({ x: 0, y: 0 }, 2.2) },
    { nom: 'JUPITER', f: () => viser({ x: 0, y: 0 }, 6) },
    { nom: 'EXTÉRIEUR', f: () => viser({ x: 0, y: 0 }, 32) },
    { nom: 'C-58', f: () => viser({ ...fusee.position }, Math.min(demi, 0.05)) },
  ]
  let tracesVisibles = $state(true)

  // Astres à dessiner : planètes, et les corps d'un système quand on zoome dessus.
  type Marque = { nom: string; p: Point2; r: number; couleur: string; etiquette: boolean }
  const marques = $derived.by(() => {
    const l: Marque[] = []
    for (const nom of NOMS_PLANETES) l.push({ nom, p: positionAstre(nom, tl), r: nom === 'Jupiter' || nom === 'Saturne' ? 6 : 4.5, couleur: COULEURS[nom], etiquette: true })
    for (const planete of NOMS_PLANETES) {
      const c = positionAstre(planete, tl)
      if (k * rayonInfluence(planete) < 30) continue
      if (Math.abs(c.x - centre.x) > demi * 1.6 || Math.abs(c.y - centre.y) > demi * 1.8) continue
      for (const nom of corpsDuSysteme(planete)) {
        if (estPlanete(nom)) continue
        const a = demiGrandAxeAutourDeLaPlanete(nom)! / UA_KM
        if (a * k < 6) continue
        l.push({ nom, p: positionAstre(nom, tl), r: 3, couleur: '#cfc8b8', etiquette: a * k > 26 })
      }
    }
    return l
  })

  const plan = $derived(fusee.destination ? planDeVol(fusee, t, v) : null)
  const detecte = $derived(visiteurDetecte(etat, t))
  const visiteur = $derived(detecte !== null ? positionVisiteur(t) : null)

  // Sélection d'une nouvelle destination.
  let choix = $state<Destination | null>(null)
  const options = $derived(choix ? optionsDeDepart(fusee, choix, t, v) : null)
  const nomChoix = (d: Destination) => (d.type === 'astre' ? nomAstre(d.astre) : d.type === 'point' ? 'Point libre' : 'Objet inconnu')

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
    // Toucher : l'astre le plus proche à moins de 18 px, sinon un point libre.
    let meilleur: Marque | null = null
    let dMin = 18
    for (const m of marques) {
      const s = ecran(m.p)
      const d = Math.hypot(s.x - p.x, s.y - p.y)
      if (d < dMin) { dMin = d; meilleur = m }
    }
    const w = monde(p.x, p.y)
    choix = meilleur ? { type: 'astre', astre: meilleur.nom } : { type: 'point', x: w.x, y: w.y }
  }
  function molette(e: WheelEvent) {
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

  const posFusee = $derived(ecran(fl.position))
  const graduations = Array.from({ length: 12 }, (_, i) => i * 30)
</script>

<div class="carte">
  <div class="raccourcis">
    {#each raccourcis as r}<button onclick={r.f}>{r.nom}</button>{/each}
    <button class:actif={tracesVisibles} class="traces" onclick={() => (tracesVisibles = !tracesVisibles)}>TRACÉS</button>
  </div>

  <svg bind:this={svg} viewBox={`0 0 ${L} ${Hc}`} class="plan" role="application" aria-label="Carte du système solaire"
    onpointerdown={appuyer} onpointermove={bouger} onpointerup={relacher} onpointercancel={relacher} onwheel={molette}>
    <rect width={L} height={Hc} fill="#fffaf0" />
    {#each NOMS_PLANETES as nom}
      {@const c = ecran({ x: 0, y: 0 })}
      <circle cx={c.x} cy={c.y} r={Math.hypot(positionAstre(nom, tl).x, positionAstre(nom, tl).y) * k} fill="none" stroke="#2b2723" stroke-width="0.8" opacity=".35" />
    {/each}
    {#if true}
      {@const s = ecran({ x: 0, y: 0 })}
      <circle cx={s.x} cy={s.y} r="9" fill="#f2b53a" stroke="#2a1e17" stroke-width="2.5" />
    {/if}
    {#each marques as m}
      {@const s = ecran(m.p)}
      {#if s.x > -40 && s.x < L + 40 && s.y > -40 && s.y < Hc + 40}
        <circle cx={s.x} cy={s.y} r={m.r} fill={m.couleur} stroke="#2b2723" stroke-width="1.5" />
        {#if m.etiquette}<text x={s.x + 8} y={s.y - 6} font-size="12" font-weight="600" fill="#2b2723">{m.nom.toUpperCase()}</text>{/if}
      {/if}
    {/each}

    {#if tracesVisibles}
      {#each jeu.traces as tr}
        {@const s = ecran(tr)}
        {#if tr.type === 'cercle'}
          <circle cx={s.x} cy={s.y} r={tr.rayon * k} fill="none" stroke="#3c6fa8" stroke-width="1.5" stroke-dasharray="6 4" />
        {:else}
          {@const a = (tr.angle * Math.PI) / 180}
          <line x1={s.x} y1={s.y} x2={s.x + Math.cos(a) * 2000} y2={s.y - Math.sin(a) * 2000} stroke="#3c6fa8" stroke-width="1.5" stroke-dasharray="6 4" />
        {/if}
      {/each}
    {/if}

    {#if visiteur}
      {@const s = ecran(visiteur)}
      <ellipse cx={s.x} cy={s.y} rx="9" ry="4.5" fill="#6fbf73" stroke="#2b2723" stroke-width="1.5" />
    {/if}

    {#if fusee.destination}
      {@const cible = ecran(positionDestination(fusee.destination, tl))}
      {@const point = plan ? ecran(plan.point) : cible}
      <path d={`M ${posFusee.x} ${posFusee.y} L ${point.x} ${point.y}`} fill="none" stroke="#e0743f" stroke-width="2" stroke-dasharray="7 5" />
      <circle cx={point.x} cy={point.y} r="6" fill="none" stroke="#e0743f" stroke-width="2" />
      <circle cx={cible.x} cy={cible.y} r="10" fill="none" stroke="#2b2723" stroke-width="1.5" stroke-dasharray="3 3" />
    {/if}
    {#if choix}
      {@const s = ecran(positionDestination(choix, tl))}
      <circle cx={s.x} cy={s.y} r="12" fill="none" stroke="#c9452f" stroke-width="2.5" />
    {/if}

    <g transform={`translate(${posFusee.x} ${posFusee.y})`}>
      <circle r="40" fill="none" stroke="#2b2723" stroke-width="1" opacity=".5" />
      {#each graduations as g}
        {@const a = (g * Math.PI) / 180}
        <line x1={Math.cos(a) * 36} y1={-Math.sin(a) * 36} x2={Math.cos(a) * 40} y2={-Math.sin(a) * 40} stroke="#2b2723" stroke-width={g % 90 === 0 ? 2 : 1} />
        {#if g % 90 === 0}<text x={Math.cos(a) * 50} y={-Math.sin(a) * 50 + 4} text-anchor="middle" font-size="10" font-family="var(--police-chiffres)" fill="#2b2723">{g}</text>{/if}
      {/each}
      <path d="M 9 0 L -6 5 L -3 0 L -6 -5 Z" fill="#e0743f" stroke="#2b2723" stroke-width="1.3" transform={`rotate(${-fl.cap})`} />
    </g>

    <text x="8" y={Hc - 8} font-size="11" font-family="var(--police-chiffres)" fill="#2b2723">{nombre(demi * 2, demi < 0.05 ? 4 : 2)} UA de large</text>
  </svg>

  <div class="panneau">
    {#if choix && options}
      <div class="ligne"><span class="etiquette">NOUVELLE DESTINATION</span><button class="lien" onclick={() => (choix = null)}>annuler</button></div>
      <div class="ligne"><span class="grand">{nomChoix(choix).replace(/^./, (c) => c.toUpperCase())}</span><span class="chiffres">{ua(distance(fusee.position, positionDestination(choix, t)))}</span></div>
      {#if options.maintenant}
        <button class="action clair" onclick={() => partir(false)}>PARTIR MAINTENANT — arrivée {duree((options.maintenant.arrivee - t) / 1000)}</button>
      {/if}
      {#if options.fenetre}
        <button class="action" onclick={() => partir(true)}>FENÊTRE DE TIR — départ le {dateLocale(options.fenetre.depart)}, arrivée le {dateLocale(options.fenetre.arrivee)}</button>
      {/if}
    {:else}
      <div class="ligne">
        <span class="etiquette">DESTINATION</span>
        {#if fusee.destination}<button class="lien" onclick={() => jeu.remplacer({ ...etat, fusee: annulerDestination(fusee) }, ['DESTINATION ANNULÉE. MOTEUR COUPÉ.'])}>annuler</button>{/if}
      </div>
      <div class="ligne">
        <span class="grand">{fusee.destination ? nomChoix(fusee.destination).replace(/^./, (c) => c.toUpperCase()) : 'Aucune'}</span>
        {#if plan}<span class="chiffres">{duree((plan.arrivee - t) / 1000)}</span>{/if}
      </div>
      <div class="radio">
        <span class="etiquette">RADIO</span>
        <button onclick={() => jeu.remplacer(reglerRadio(etat, -0.1))}>−0,1</button>
        <button onclick={() => jeu.remplacer(reglerRadio(etat, -0.01))}>−</button>
        <span class="chiffres">{nombre(etat.chasse.frequenceRadio, 2)}</span>
        <button onclick={() => jeu.remplacer(reglerRadio(etat, 0.01))}>+</button>
        <button onclick={() => jeu.remplacer(reglerRadio(etat, 0.1))}>+0,1</button>
      </div>
      <div class="boutons">
        <button class="action clair" onclick={() => { const r = ping(etat, t); jeu.remplacer(r.etat, r.messages) }}>PING</button>
        {#if estInstalle(etat, 'TEL')}
          <button class="action" onclick={() => { const r = viserTelescope(etat, t, hasardReel); jeu.remplacer(r.etat, r.messages) }}>TÉLESCOPE</button>
        {/if}
      </div>
      {#if tracesVisibles}
        <div class="tracer">
          <input inputmode="decimal" placeholder="rayon (UA)" bind:value={rayon} aria-label="Rayon du cercle en UA" />
          <button onclick={tracerCercle} disabled={!etat.chasse.dernierPing}>CERCLE</button>
          <input inputmode="decimal" placeholder="angle (°)" bind:value={angle} aria-label="Angle de la droite en degrés" />
          <button onclick={tracerDroite} disabled={!etat.chasse.derniereVisee}>DROITE</button>
          <button onclick={() => { jeu.traces = []; jeu.sauvegarder() }}>EFFACER</button>
        </div>
      {/if}
    {/if}
  </div>
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
  .raccourcis {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .raccourcis button {
    min-height: 32px;
    padding: 0 10px;
    border-radius: 14px;
    border: 2px solid var(--couleur-encre);
    background: var(--couleur-papier);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .raccourcis .traces {
    border-color: var(--couleur-trace);
    color: var(--couleur-trace);
  }
  .raccourcis .traces.actif {
    background: var(--couleur-trace);
    color: var(--couleur-papier);
  }
  .plan {
    width: 100%;
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
  .radio {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .radio button {
    min-height: 36px;
    min-width: 44px;
    border-radius: 10px;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--couleur-papier);
    font-weight: 700;
  }
  .radio .chiffres {
    font-size: 18px;
    min-width: 56px;
    text-align: center;
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
