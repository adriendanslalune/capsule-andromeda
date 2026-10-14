<script lang="ts">
  // Hublot du cockpit : la vraie vue 3D depuis l'intérieur de la fusée, droit devant (les astres à leur vraie
  // place et à leur vraie distance) ; le toucher ouvre la vue extérieure en plein écran.
  import { onMount } from 'svelte'
  import { nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'
  import { Vue3D, type Etiquette } from './scene'

  let toile: HTMLCanvasElement
  let cadre: HTMLDivElement
  let etiquettes = $state<Etiquette[]>([])
  let indisponible = $state(false)

  onMount(() => {
    let vue: Vue3D
    try {
      vue = new Vue3D(toile, { interieur: true })
    } catch {
      indisponible = true
      return
    }
    const ajuster = () => vue.taille(cadre.clientWidth, cadre.clientHeight)
    ajuster()
    const observateur = new ResizeObserver(ajuster)
    observateur.observe(cadre)
    let image = 0
    const boucle = (horloge: number) => {
      image = requestAnimationFrame(boucle)
      // Pas de dessin quand un volet couvre le hublot.
      if (!jeu.etat || jeu.volet) return
      const a = jeu.affichage()
      vue.dessiner(a.etat, a.t, horloge)
      etiquettes = vue.etiquettes
    }
    image = requestAnimationFrame(boucle)
    return () => {
      cancelAnimationFrame(image)
      observateur.disconnect()
      vue.liberer()
    }
  })
</script>

<div class="hublot" bind:this={cadre}>
  <canvas bind:this={toile}></canvas>
  {#each etiquettes as e}
    <span class="etiquette" class:cible={e.cible} class:autre={!!e.couleur} style={`left: ${e.x}px; top: ${e.y}px${e.couleur ? `; color: ${e.couleur}` : ''}`}>{nomAstre(e.nom)}</span>
  {/each}
  {#if indisponible}<p>Vue indisponible sur cet appareil.</p>{/if}
</div>

<style>
  .hublot {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--nuit);
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  .etiquette {
    position: absolute;
    transform: translate(7px, -16px);
    font-size: 12px;
    letter-spacing: 1px;
    color: var(--couleur-texte-clair);
    opacity: 0.8;
    pointer-events: none;
    white-space: nowrap;
  }
  .etiquette.autre {
    font-family: var(--police-script);
    letter-spacing: 0;
    opacity: 0.95;
  }
  .etiquette.cible {
    color: var(--moutarde);
    opacity: 1;
    font-weight: 700;
  }
  p {
    position: absolute;
    inset: 40% 0 auto;
    text-align: center;
    color: var(--couleur-texte-clair);
  }
</style>
