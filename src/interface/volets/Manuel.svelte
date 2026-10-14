<script lang="ts">
  // Volet du manuel : le manuel d'entretien, page par page, mis à l'échelle de l'écran ; IMPRIMER ouvre
  // l'impression du téléphone (ou l'enregistrement en PDF) de tout le manuel.
  import { jeu } from '../jeu.svelte'
  import { PAGES } from '../manuel/pages'

  let cadre: HTMLDivElement
  let echelle = $state(0.9)
  $effect(() => {
    const ajuster = () => (echelle = Math.min(1.4, (cadre.clientWidth - 4) / 400))
    ajuster()
    const o = new ResizeObserver(ajuster)
    o.observe(cadre)
    return () => o.disconnect()
  })
  $effect(() => {
    void jeu.pageManuel
    if (cadre) cadre.scrollTop = 0
  })

  const page = $derived(PAGES[jeu.pageManuel] ?? PAGES[0])
  const aller = (d: number) => (jeu.pageManuel = Math.max(0, Math.min(PAGES.length - 1, jeu.pageManuel + d)))
</script>

<div class="manuel">
  <div class="cadre" bind:this={cadre}>
    <div class="feuille" style={`width: ${400 * echelle}px; height: ${567 * echelle}px`}>
      <div class="echelle" style={`transform: scale(${echelle})`} aria-label={`Page ${jeu.pageManuel + 1} du manuel`}>
        <page.composant numero={jeu.pageManuel + 1} />
      </div>
    </div>
  </div>
  <nav>
    <button class="bouton clair" onclick={() => aller(-1)} disabled={jeu.pageManuel === 0} aria-label="Page précédente">‹</button>
    <button class="bouton clair" onclick={() => (jeu.pageManuel = 1)}>SOMMAIRE</button>
    <span>{jeu.pageManuel + 1} / {PAGES.length}</span>
    <button class="bouton clair" onclick={() => (jeu.impression = true)}>IMPRIMER</button>
    <button class="bouton clair" onclick={() => aller(1)} disabled={jeu.pageManuel === PAGES.length - 1} aria-label="Page suivante">›</button>
  </nav>
</div>

<style>
  .manuel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 6px 0 0;
  }
  .cadre {
    flex: 1;
    overflow-y: auto;
    padding: 0 14px;
    display: flex;
    justify-content: center;
  }
  .feuille {
    flex: none;
    border: 1px solid #1d1916;
    box-shadow: var(--ombre);
    overflow: hidden;
  }
  .echelle {
    width: 400px;
    transform-origin: top left;
  }
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 10px 14px 16px;
  }
  nav button {
    min-height: 44px;
    min-width: 44px;
    padding: 0 10px;
    font-size: 13px;
  }
  nav span {
    font-family: var(--police-chiffres);
    font-weight: 700;
  }
</style>
