<svelte:options namespace="svg" />

<script lang="ts">
  // Repère numéroté d'une planche : un trait fin de l'organe au numéro cerclé (renvoie à la nomenclature).
  let { x, y, tx, ty, n }: { x: number; y: number; tx: number; ty: number; n: number | string } = $props()
</script>

<line x1={x} y1={y} x2={tx} y2={ty} stroke="#1d1916" stroke-width="0.6" />
<circle cx={x} cy={y} r="1.6" fill="#1d1916" />
<circle cx={tx} cy={ty} r="7.5" fill="#f8f5ec" stroke="#1d1916" stroke-width="1" />
<text x={tx} y={ty + 3} text-anchor="middle" font-size="8.5" font-weight="700" font-family="Courier Prime, monospace">{n}</text>
