<script lang="ts">
  // Petit dessin schématique de la destination, au trait vert de l'écran de navigation : le Soleil et ses rayons,
  // une planète (anneaux de Saturne, bandes de Jupiter, continents de la Terre…), la Lune et ses cratères, un satellite,
  // un engin (stations, sondes, télescopes), un point libre (réticule), le visiteur (soucoupe).
  import { estEngin } from '../../astro/engins'
  import { estPlanete } from '../../astro/corps'
  import type { Destination } from '../../moteur/fusee'

  let { destination }: { destination: Destination } = $props()
  const nom = $derived(destination.type === 'point' ? '' : destination.astre)
  const sorte = $derived(
    destination.type === 'point' ? 'point'
      : destination.type === 'visiteur' ? 'visiteur'
      : nom === 'Soleil' ? 'soleil'
      : nom === 'ISS' || nom === 'Tiangong' ? 'station'
      : estEngin(nom) ? 'sonde'
      : nom === 'Lune' ? 'lune'
      : estPlanete(nom) ? 'planete' : 'satellite',
  )
</script>

<svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  {#if sorte === 'soleil'}
    <circle cx="20" cy="20" r="8" />
    {#each [0, 45, 90, 135, 180, 225, 270, 315] as a}
      {@const r = (a * Math.PI) / 180}
      <line x1={20 + Math.cos(r) * 11} y1={20 + Math.sin(r) * 11} x2={20 + Math.cos(r) * 16} y2={20 + Math.sin(r) * 16} />
    {/each}
  {:else if sorte === 'planete'}
    {#if nom === 'Saturne'}
      <circle cx="20" cy="20" r="9" />
      <ellipse cx="20" cy="20" rx="17" ry="5" transform="rotate(-18 20 20)" />
    {:else if nom === 'Jupiter'}
      <circle cx="20" cy="20" r="14" />
      <path d="M7 15 H33 M6.5 21 H33.5 M8 27 H32" stroke-width="1.2" />
      <ellipse cx="25" cy="24" rx="3" ry="1.6" stroke-width="1.2" />
    {:else if nom === 'Terre'}
      <circle cx="20" cy="20" r="13" />
      <path d="M12 13 Q16 11 18 15 Q20 19 15 22 Q12 24 13 28 M23 9 Q28 12 26 16 Q24 20 29 23" stroke-width="1.2" />
    {:else if nom === 'Uranus' || nom === 'Neptune'}
      <circle cx="20" cy="20" r="11" />
      {#if nom === 'Uranus'}<ellipse cx="20" cy="20" rx="4" ry="16" stroke-width="1" />{:else}<path d="M11 17 Q20 14 29 17 M10 23 Q20 26 30 23" stroke-width="1.1" />{/if}
    {:else}
      <circle cx="20" cy="20" r={nom === 'Mercure' ? 8 : nom === 'Mars' ? 9 : 11} />
      <path d="M14 17 Q20 15 26 18 M15 24 Q21 22 26 25" stroke-width="1.1" />
    {/if}
  {:else if sorte === 'lune'}
    <circle cx="20" cy="20" r="11" />
    <circle cx="16" cy="16" r="2.5" stroke-width="1.1" /><circle cx="24" cy="23" r="3" stroke-width="1.1" /><circle cx="17" cy="25" r="1.5" stroke-width="1.1" />
  {:else if sorte === 'satellite'}
    <circle cx="22" cy="20" r="7" />
    <circle cx="20" cy="18" r="1.5" stroke-width="1" />
    <path d="M4 32 Q6 20 4 8" stroke-dasharray="2 2" stroke-width="1.1" />
  {:else if sorte === 'station'}
    <path d="M4 20 H36" stroke-width="2" />
    <rect x="5" y="9" width="5" height="9" stroke-width="1.2" /><rect x="5" y="22" width="5" height="9" stroke-width="1.2" />
    <rect x="30" y="9" width="5" height="9" stroke-width="1.2" /><rect x="30" y="22" width="5" height="9" stroke-width="1.2" />
    <rect x="16" y="17" width="8" height="12" rx="2" />
  {:else if sorte === 'sonde'}
    <path d="M14 14 Q20 6 26 14 Z" />
    <rect x="17" y="16" width="6" height="6" />
    <rect x="4" y="17" width="10" height="4" stroke-width="1.2" /><rect x="26" y="17" width="10" height="4" stroke-width="1.2" />
    <path d="M20 22 V32" />
  {:else if sorte === 'visiteur'}
    <ellipse cx="20" cy="23" rx="15" ry="5" />
    <path d="M12 21 Q20 8 28 21" />
  {:else}
    <circle cx="20" cy="20" r="10" stroke-dasharray="3 2" />
    <path d="M20 5 V13 M20 27 V35 M5 20 H13 M27 20 H35" />
  {/if}
</svg>

<style>
  svg {
    width: 34px;
    height: 34px;
    flex: none;
  }
</style>
