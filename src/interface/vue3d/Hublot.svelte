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
  let eblouissement = $state(0)
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
      vue.filtreSolaire = jeu.filtreSolaire
      vue.dessiner(a.etat, a.t, horloge)
      etiquettes = vue.etiquettes
      eblouissement = vue.eblouissement
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
  {#each jeu.nomsAstres ? etiquettes : [] as e}
    <span class="etiquette" class:cible={e.cible} class:autre={!!e.couleur} style={`left: ${e.x}px; top: ${e.y}px${e.couleur ? `; color: ${e.couleur}` : ''}`}>{nomAstre(e.nom)}</span>
  {/each}
  <div class="eblouissement" style={`opacity: ${eblouissement}`}></div>
  <!-- Noms des astres : on les écrit ou on les retire (vue naturelle du ciel). -->
  <button class="filtre noms" class:actif={!jeu.nomsAstres} aria-pressed={!jeu.nomsAstres} aria-label="Retirer les noms des astres"
    onclick={(e) => { e.stopPropagation(); jeu.basculerNoms() }}>
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 7h16M4 12h10M4 17h13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none" />{#if !jeu.nomsAstres}<line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />{/if}</svg>
    NOMS
  </button>
  <!-- Filtre solaire : un toucher le pose ou le retire (sans sortir en vue extérieure). -->
  <button class="filtre" class:actif={jeu.filtreSolaire} aria-pressed={jeu.filtreSolaire} aria-label="Filtre solaire"
    onclick={(e) => { e.stopPropagation(); jeu.filtreSolaire = !jeu.filtreSolaire }}>
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor" />{#each [0, 45, 90, 135, 180, 225, 270, 315] as a}<line x1={12 + Math.cos((a * Math.PI) / 180) * 8} y1={12 + Math.sin((a * Math.PI) / 180) * 8} x2={12 + Math.cos((a * Math.PI) / 180) * 11} y2={12 + Math.sin((a * Math.PI) / 180) * 11} stroke="currentColor" stroke-width="2" stroke-linecap="round" />{/each}</svg>
    FILTRE
  </button>
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
  /* Voile d'éblouissement près du Soleil. */
  .eblouissement {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 50%, #ffffff 0 30%, #fff6d8 60%, #ffe9a8);
    transition: opacity 0.3s linear;
  }
  .filtre {
    position: absolute;
    right: 6px;
    bottom: 6px;
    display: flex;
    align-items: center;
    gap: 3px;
    min-height: 28px;
    padding: 0 7px;
    border: 1.5px solid var(--couleur-texte-clair);
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.45);
    color: var(--couleur-texte-clair);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .filtre.noms {
    right: auto;
    left: 6px;
  }
  .filtre.actif {
    background: var(--moutarde);
    border-color: var(--couleur-encre);
    color: var(--couleur-encre);
  }
  p {
    position: absolute;
    inset: 40% 0 auto;
    text-align: center;
    color: var(--couleur-texte-clair);
  }
</style>
