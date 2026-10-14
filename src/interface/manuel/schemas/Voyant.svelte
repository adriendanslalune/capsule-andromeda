<svelte:options namespace="svg" />

<script lang="ts">
  // Voyant schématique : rond cerclé ; allumé, il rayonne.
  let { x, y, r = 8, allume = false }: { x: number; y: number; r?: number; allume?: boolean } = $props()
</script>

<circle cx={x} cy={y} r={r} fill={allume ? '#1d1916' : '#f8f5ec'} stroke="#1d1916" stroke-width="1.5" />
<circle cx={x} cy={y} r={r * 0.55} fill="none" stroke={allume ? '#f8f5ec' : '#1d1916'} stroke-width="0.6" />
{#if allume}
  {#each Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4) as a}
    <line x1={x + Math.cos(a) * r * 1.3} y1={y + Math.sin(a) * r * 1.3} x2={x + Math.cos(a) * r * 1.75} y2={y + Math.sin(a) * r * 1.75} stroke="#1d1916" stroke-width="1" />
  {/each}
{/if}
