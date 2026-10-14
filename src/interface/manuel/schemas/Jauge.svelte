<svelte:options namespace="svg" />

<script lang="ts">
  // Cadran schématique (0 à 100, aiguille sur 240°, comme dans le jeu) : graduations chiffrées, zones hachurées.
  let {
    x, y, r = 40, zones = [], nom = '', valeur = 50,
  }: { x: number; y: number; r?: number; zones?: [number, number, 'rouge' | 'bleue' | 'verte'][]; nom?: string; valeur?: number } = $props()

  const angle = (v: number) => -120 + (v / 100) * 240
  const point = (v: number, rr: number) => {
    const a = ((angle(v) - 90) * Math.PI) / 180
    return { x: x + rr * Math.cos(a), y: y + rr * Math.sin(a) }
  }
  function secteur(de: number, a: number) {
    const r1 = r * 0.7, r2 = r * 0.86
    const p1 = point(de, r2), p2 = point(a, r2), p3 = point(a, r1), p4 = point(de, r1)
    const grand = (a - de) * 2.4 > 180 ? 1 : 0
    return `M ${p1.x} ${p1.y} A ${r2} ${r2} 0 ${grand} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r1} ${r1} 0 ${grand} 0 ${p4.x} ${p4.y} Z`
  }
  const aiguille = $derived(point(valeur, r * 0.78))
</script>

<circle cx={x} cy={y} r={r} fill="#f8f5ec" stroke="#1d1916" stroke-width="2" />
<circle cx={x} cy={y} r={r * 0.92} fill="none" stroke="#1d1916" stroke-width="0.6" />
{#each zones as [de, a, motif]}
  <path d={secteur(de, a)} fill={`url(#zone-${motif})`} stroke="#1d1916" stroke-width="0.6" />
{/each}
{#each Array.from({ length: 11 }, (_, i) => i * 10) as v}
  {@const p = point(v, r * 0.86)}
  {@const q = point(v, v % 20 === 0 ? r * 0.66 : r * 0.74)}
  <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#1d1916" stroke-width={v % 20 === 0 ? 1.4 : 0.7} />
  {#if v % 20 === 0}
    {@const c = point(v, r * 0.5)}
    <text x={c.x} y={c.y + r * 0.06} text-anchor="middle" font-size={r * 0.17} font-family="Courier Prime, monospace">{v}</text>
  {/if}
{/each}
{#if nom}<text x={x} y={y + r * 0.42} text-anchor="middle" font-size={r * 0.18} font-weight="700" font-family="Courier Prime, monospace">{nom}</text>{/if}
<line x1={x} y1={y} x2={aiguille.x} y2={aiguille.y} stroke="#1d1916" stroke-width="1.8" stroke-linecap="round" />
<circle cx={x} cy={y} r={r * 0.07} fill="#1d1916" />
