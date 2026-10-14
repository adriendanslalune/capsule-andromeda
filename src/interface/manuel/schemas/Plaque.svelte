<svelte:options namespace="svg" />

<script lang="ts">
  // Plaque d'identification d'une commande (son code), comme les étiquettes du tableau de bord.
  let { x, y, texte }: { x: number; y: number; texte: string } = $props()
  const l = $derived(texte.length * 6 + 8)
</script>

<rect x={x - l / 2} y={y - 6} width={l} height="12" fill="#1d1916" />
<text x={x} y={y + 3} text-anchor="middle" font-size="9" font-weight="700" fill="#f8f5ec" font-family="Courier Prime, monospace">{texte}</text>
