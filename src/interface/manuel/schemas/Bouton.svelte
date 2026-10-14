<svelte:options namespace="svg" />

<script lang="ts">
  // Bouton schématique : rond (ou rectangle arrondi si une largeur est donnée), avec son inscription.
  let { x, y, r = 14, largeur = 0, texte = '' }: { x: number; y: number; r?: number; largeur?: number; texte?: string } = $props()
</script>

{#if largeur}
  <rect x={x - largeur / 2} y={y - r} width={largeur} height={r * 2} rx="5" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.5" />
  <line x1={x - largeur / 2 + 3} y1={y + r - 3} x2={x + largeur / 2 - 3} y2={y + r - 3} stroke="#1d1916" stroke-width="0.6" />
{:else}
  <circle cx={x} cy={y} r={r} fill="#f8f5ec" stroke="#1d1916" stroke-width="1.6" />
  <circle cx={x} cy={y} r={r * 0.78} fill="none" stroke="#1d1916" stroke-width="0.6" />
{/if}
{#if texte}<text x={x} y={y + 3.5} text-anchor="middle" font-size="9" font-weight="700" font-family="Courier Prime, monospace">{texte}</text>{/if}
