<svelte:options namespace="svg" />

<script lang="ts">
  // Levier schématique : plaque à fente, pommeau rond, en haut ou en bas.
  let { x, y, h = 60, haut = true }: { x: number; y: number; h?: number; haut?: boolean } = $props()
  const l = $derived(h * 0.46)
</script>

<rect x={x - l / 2} y={y - h / 2} width={l} height={h} rx="5" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.5" />
<rect x={x - 3} y={y - h / 2 + 7} width="6" height={h - 14} rx="3" fill="#1d1916" />
<circle cx={x} cy={haut ? y - h / 2 + 11 : y + h / 2 - 11} r={l * 0.38} fill="#f8f5ec" stroke="#1d1916" stroke-width="1.6" />
