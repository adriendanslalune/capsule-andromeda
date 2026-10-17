<svelte:options namespace="svg" />

<script lang="ts" module>
  /** Silhouette de chaque engin sur la carte (reconnaissable à sa forme, demande d'Adrien du 17/10/2026). */
  export type Forme = 'station' | 'tiangong' | 'telescope' | 'webb' | 'gaia' | 'bouclier' | 'antenne' | 'sonde' | 'voiture'
  const FORMES: Record<string, Forme> = {
    ISS: 'station', Tiangong: 'tiangong', Hubble: 'telescope', 'James Webb': 'webb', Gaia: 'gaia',
    'Parker Solar Probe': 'bouclier', 'Solar Orbiter': 'bouclier', 'Tesla Roadster': 'voiture',
    'New Horizons': 'antenne', 'Pioneer 10': 'antenne', 'Pioneer 11': 'antenne', 'Voyager 1': 'antenne', 'Voyager 2': 'antenne',
  }
  export const formeDe = (nom: string): Forme => FORMES[nom] ?? 'sonde'
</script>

<script lang="ts">
  // Dessiné dans un carré d'environ 16 px, centré sur (x, y) : aplats de couleur cernés d'encre (style de la carte).
  let { nom, x, y, encre }: { nom: string; x: number; y: number; encre: string } = $props()
  const CORPS = '#23476b', PANNEAU = '#8fd0dc', OR = '#f2b53a', ROSE = '#f3a08b', CLAIR = '#faf2dc'
  const forme = $derived(formeDe(nom))
</script>

<g transform={`translate(${x} ${y})`} stroke={encre} stroke-width="0.9" stroke-linejoin="round">
  {#if forme === 'station'}
    <line x1="-8" y1="0" x2="8" y2="0" stroke-width="1.4" />
    <rect x="-8.5" y="-4.5" width="3.5" height="9" fill={PANNEAU} />
    <rect x="5" y="-4.5" width="3.5" height="9" fill={PANNEAU} />
    <rect x="-2" y="-2.5" width="4" height="5" fill={CORPS} />
  {:else if forme === 'tiangong'}
    <rect x="-1.8" y="-6" width="3.6" height="12" rx="1" fill={CORPS} />
    <rect x="-8" y="-1.5" width="6" height="3" fill={PANNEAU} />
    <rect x="2" y="-1.5" width="6" height="3" fill={PANNEAU} />
  {:else if forme === 'telescope'}
    <rect x="-1.5" y="-7" width="3" height="4" fill={PANNEAU} />
    <rect x="-1.5" y="3" width="3" height="4" fill={PANNEAU} />
    <rect x="-6" y="-2.5" width="11" height="5" rx="1" fill={CORPS} />
    <rect x="5" y="-2.5" width="1.6" height="5" fill={CLAIR} />
  {:else if forme === 'webb'}
    <path d="M -8 3 L 0 0 L 8 3 L 0 6.5 Z" fill={ROSE} />
    <path d="M 0 -7.5 L 3.5 -5.5 L 3.5 -1.5 L 0 0.5 L -3.5 -1.5 L -3.5 -5.5 Z" fill={OR} />
  {:else if forme === 'gaia'}
    <ellipse cx="0" cy="3" rx="7.5" ry="2.8" fill={CLAIR} />
    <rect x="-2.5" y="-5" width="5" height="7" rx="1" fill={CORPS} />
  {:else if forme === 'bouclier'}
    <rect x="-2.5" y="-2" width="5" height="6" fill={CORPS} />
    <rect x="-7" y="-1" width="4.5" height="2.5" fill={PANNEAU} />
    <rect x="2.5" y="-1" width="4.5" height="2.5" fill={PANNEAU} />
    <path d="M -6 -3.5 Q 0 -8 6 -3.5 Z" fill={CLAIR} />
  {:else if forme === 'antenne'}
    <line x1="0" y1="0" x2="6" y2="6" stroke-width="1.1" />
    <rect x="-2" y="0" width="4" height="3.5" fill={CORPS} />
    <path d="M -6.5 0 A 6.5 4 0 0 0 6.5 0 Z" fill={CLAIR} transform="translate(0 -1) rotate(180)" />
  {:else if forme === 'voiture'}
    <path d="M -8 2 L -7 -1 L -3 -1.5 L -1 -4 L 3 -4 L 5 -1.5 L 8 -1 L 8 2 Z" fill="#e04b37" />
    <circle cx="-4.5" cy="2.5" r="1.8" fill={encre} />
    <circle cx="4.5" cy="2.5" r="1.8" fill={encre} />
  {:else}
    <rect x="-9" y="-1.5" width="6" height="3" fill={PANNEAU} />
    <rect x="3" y="-1.5" width="6" height="3" fill={PANNEAU} />
    <rect x="-3" y="-3" width="6" height="6" fill={CORPS} />
    <line x1="0" y1="-3" x2="0" y2="-6.5" />
    <circle cx="0" cy="-6.5" r="1" fill={CLAIR} />
  {/if}
</g>
