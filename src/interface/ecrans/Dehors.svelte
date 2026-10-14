<script lang="ts">
  // Vue 3D « dehors » : la fusée, le vrai ciel, les astres ; on cherche la soucoupe à l'œil, on la touche pour
  // l'approcher, et à moins de 300 m on la photographie.
  import { onMount } from 'svelte'
  import { approcherVisiteur, distanceVisiteurKm, photographierVisiteur, positionVisiteur, visiteurAPortee } from '../../moteur/chasse'
  import { CHASSE } from '../../donnees/chasse'
  import { vitesseActuelle } from '../../moteur/partie'
  import { nombre, nomAstre } from '../format'
  import { glisserPourFermer } from '../glisser'
  import { jeu } from '../jeu.svelte'
  import { Vue3D, type Etiquette } from '../vue3d/scene'

  let toile: HTMLCanvasElement
  let ecran = $state<HTMLElement>()
  const glisser = { sens: 'droite' as const, cible: () => ecran, fermer: () => jeu.fermer() }
  let cadre: HTMLDivElement
  let vue: Vue3D | null = null
  let etiquettes = $state<Etiquette[]>([])
  let erreur = $state<string | null>(null)
  let photo = $state<string | null>(null)
  let flash = $state(false)

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const peutPhotographier = $derived(!positionVisiteur(t).enVoyage && distanceVisiteurKm(etat, t) <= CHASSE.distancePhotoKm)

  onMount(() => {
    try {
      vue = new Vue3D(toile)
    } catch {
      erreur = 'La vue 3D n’est pas disponible sur cet appareil.'
      return
    }
    const ajuster = () => vue?.taille(cadre.clientWidth, cadre.clientHeight)
    ajuster()
    vue.recentrer(etat.fusee.cap)
    const observateur = new ResizeObserver(ajuster)
    observateur.observe(cadre)
    let image = 0
    const boucle = (horloge: number) => {
      if (vue && jeu.etat) {
        const a = jeu.affichage()
        vue.dessiner(a.etat, a.t, horloge)
        etiquettes = vue.etiquettes
      }
      image = requestAnimationFrame(boucle)
    }
    image = requestAnimationFrame(boucle)
    return () => {
      cancelAnimationFrame(image)
      observateur.disconnect()
      vue?.liberer()
      vue = null
    }
  })

  // Gestes : glisser pour tourner autour de la fusée, pincer pour zoomer, toucher la soucoupe pour l'approcher.
  const doigts = new Map<number, { x: number; y: number }>()
  let pincement = 0
  let deplace = false
  function appuyer(e: PointerEvent) {
    toile.setPointerCapture(e.pointerId)
    doigts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    deplace = false
    if (doigts.size === 2) { const [a, b] = [...doigts.values()]; pincement = Math.hypot(a.x - b.x, a.y - b.y) }
  }
  function bouger(e: PointerEvent) {
    const avant = doigts.get(e.pointerId)
    if (!avant || !vue) return
    const ici = { x: e.clientX, y: e.clientY }
    doigts.set(e.pointerId, ici)
    if (doigts.size === 1) {
      if (Math.hypot(ici.x - avant.x, ici.y - avant.y) > 1) deplace = true
      vue.tourner(ici.x - avant.x, ici.y - avant.y)
    } else if (doigts.size === 2) {
      const [a, b] = [...doigts.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pincement > 0) vue.zoomer(pincement / d)
      pincement = d
      deplace = true
    }
  }
  function relacher(e: PointerEvent) {
    const p = doigts.get(e.pointerId)
    doigts.delete(e.pointerId)
    if (doigts.size < 2) pincement = 0
    if (!p || deplace || !vue?.visiteurEcran) return
    const r = toile.getBoundingClientRect()
    const v = vue.visiteurEcran
    if (Math.hypot(p.x - r.left - v.x, p.y - r.top - v.y) > 28) return
    if (!visiteurAPortee(etat, t)) return
    const a = approcherVisiteur(etat, t)
    jeu.remplacer(a.etat, a.messages)
  }

  function photographier() {
    if (!vue) return
    flash = true
    setTimeout(() => (flash = false), 250)
    const image = vue.photo()
    const r = photographierVisiteur(etat, t)
    jeu.remplacer(r.etat, r.messages)
    if (r.trouvaille) photo = image
  }
</script>

<main bind:this={ecran}>
  <div class="cadre" bind:this={cadre}>
    <canvas bind:this={toile} onpointerdown={appuyer} onpointermove={bouger} onpointerup={relacher} onpointercancel={relacher}
      onwheel={(e) => { e.preventDefault(); vue?.zoomer(e.deltaY > 0 ? 1.15 : 1 / 1.15) }}></canvas>
    {#each etiquettes as e}
      <span class="etiquette" class:cible={e.cible} style={`left: ${e.x}px; top: ${e.y}px`}>{nomAstre(e.nom)}</span>
    {/each}
    {#if flash}<div class="flash"></div>{/if}
  </div>

  {#if erreur}<p class="erreur">{erreur}</p>{/if}

  <div class="bord" use:glisserPourFermer={glisser}></div>
  <header>
    <button class="bouton" onclick={() => jeu.fermer()}>‹ TABLEAU DE BORD</button>
    <span class="info">C-58 · CAP {String(Math.round(etat.fusee.cap) % 360).padStart(3, '0')}° · {nombre(etat.fusee.destination ? vitesseActuelle(etat) : 0, 1)} km/s</span>
  </header>

  <footer>
    <button class="bouton clair" onclick={() => vue?.recentrer(etat.fusee.cap)}>RECENTRER</button>
    {#if peutPhotographier}<button class="photo bouton cerise" onclick={photographier}>PHOTO</button>{/if}
  </footer>

  {#if photo}
    <div class="cliche" role="dialog" aria-label="Photo du visiteur">
      <img src={photo} alt="Le visiteur, vu depuis la fusée" />
      <p>VISITEUR PHOTOGRAPHIÉ. LA PHOTO EST TRANSMISE À L’OFFICE.</p>
      <button onclick={() => (photo = null)}>FERMER</button>
    </div>
  {/if}
</main>

<style>
  .bord {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 22px;
    z-index: 5;
  }
  main {
    position: relative;
    height: 100%;
    background: var(--nuit);
  }
  .cadre {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
  }
  .etiquette {
    position: absolute;
    transform: translate(8px, -18px);
    font-size: 13px;
    letter-spacing: 1px;
    color: var(--couleur-texte-clair);
    pointer-events: none;
    white-space: nowrap;
  }
  .etiquette.cible {
    color: var(--couleur-avarie);
    font-weight: 700;
  }
  header {
    position: absolute;
    top: 14px;
    left: 14px;
    right: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  header button,
  footer button {
    min-height: 44px;
    padding: 0 16px;
    font-size: 14px;
  }
  .info {
    font-family: var(--police-chiffres);
    font-size: 11px;
    color: var(--couleur-texte-clair);
    text-align: right;
  }
  footer {
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 24px;
    display: flex;
    justify-content: space-between;
  }
  footer .photo {
    font-family: var(--police-titre);
    font-size: 18px;
    padding: 0 22px;
  }
  .flash {
    position: absolute;
    inset: 0;
    background: #fff;
    opacity: 0.8;
  }
  .erreur {
    position: absolute;
    top: 45%;
    left: 20px;
    right: 20px;
    text-align: center;
    color: var(--couleur-texte-clair);
  }
  .cliche {
    position: absolute;
    inset: 60px 14px;
    background: var(--couleur-papier);
    color: var(--couleur-encre);
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
  .cliche img {
    width: 100%;
    border: 6px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  .cliche p {
    text-align: center;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .cliche button {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 12px;
    border: 2px solid var(--couleur-encre);
    background: none;
    font-weight: 700;
  }
</style>
