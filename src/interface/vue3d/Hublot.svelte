<script lang="ts">
  // Hublot du tableau de bord : la vue depuis l'intérieur de la fusée, à travers trois vitres de 60° (gauche, face,
  // droite), soit 180°, sans déformation. Les montants entre les vitres cachent les raccords.
  import { onMount } from 'svelte'
  import { nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'
  import { disposerVitres, MONTANT, Vue3D, type Etiquette } from './scene'

  let toile: HTMLCanvasElement
  let cadre: HTMLDivElement
  let etiquettes = $state<Etiquette[]>([])
  let indisponible = $state(false)
  let largeur = $state(0)
  const montants = $derived(disposerVitres(largeur).slice(1).map((v) => v.x - MONTANT))

  onMount(() => {
    let vue: Vue3D
    try {
      vue = new Vue3D(toile, 'hublot')
    } catch {
      indisponible = true
      return
    }
    const ajuster = () => { largeur = cadre.clientWidth; vue.taille(cadre.clientWidth, cadre.clientHeight) }
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
  {#each montants as x}<div class="montant" style={`left: ${x}px; width: ${MONTANT}px`}></div>{/each}
  {#each etiquettes as e}
    <span class={`etiquette ${e.horsChamp ?? ''}`} class:cible={e.cible} style={`left: ${e.x}px; top: ${e.y}px`}>
      {#if e.horsChamp === 'gauche'}‹ {/if}{nomAstre(e.nom)}{#if e.horsChamp === 'droite'} ›{/if}
    </span>
  {/each}
  {#if indisponible}<p>Vue indisponible sur cet appareil.</p>{/if}
</div>

<style>
  .hublot {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #05080d;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  .montant {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--couleur-fond);
    border-left: 1px solid var(--couleur-bordure-forte);
    border-right: 1px solid var(--couleur-bordure-forte);
  }
  .etiquette {
    position: absolute;
    transform: translate(7px, -16px);
    font-size: 12px;
    letter-spacing: 1px;
    color: var(--couleur-texte-discret);
    pointer-events: none;
    white-space: nowrap;
  }
  .etiquette.cible {
    color: var(--couleur-avarie);
    font-weight: 700;
  }
  .etiquette.gauche {
    transform: translate(6px, -50%);
  }
  .etiquette.droite {
    transform: translate(calc(-100% - 6px), -50%);
  }
  p {
    position: absolute;
    inset: 40% 0 auto;
    text-align: center;
    color: var(--couleur-texte-discret);
  }
</style>
