<script lang="ts">
  // Tachymètre : vitesse de la fusée (km/s), aiguille sur 240°. L'échelle s'élargit quand le moteur est amélioré.
  import { nombre } from '../format'

  let { valeur, croisiere }: { valeur: number; croisiere: number } = $props()

  /** Graduation maximale : 50, 100, 200, 500, 1 000… au moins 1,25 fois la vitesse de croisière. */
  const max = $derived.by(() => {
    for (let p = 10; ; p *= 10) for (const m of [5, 10, 20]) if (m * p >= croisiere * 1.25) return m * p
  })
  const angle = (v: number) => -120 + (Math.max(0, Math.min(max, v)) / max) * 240
  const point = (v: number, r: number) => {
    const a = ((angle(v) - 90) * Math.PI) / 180
    return { x: 60 + r * Math.cos(a), y: 60 + r * Math.sin(a) }
  }
  const graduations = $derived(Array.from({ length: 21 }, (_, i) => (i * max) / 20))
</script>

<figure>
  <svg viewBox="0 0 120 120" role="img" aria-label={`Vitesse : ${nombre(valeur, 1)} km/s`}>
    <circle cx="63" cy="63" r="56" fill="var(--couleur-encre)" />
    <circle cx="60" cy="60" r="56" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="3.5" />
    <!-- Zone de croisière. -->
    {#if croisiere > 0}
      {@const a = point(croisiere * 0.96, 44)}
      {@const b = point(Math.min(max, croisiere * 1.04), 44)}
      <path d={`M ${a.x} ${a.y} A 44 44 0 0 1 ${b.x} ${b.y}`} fill="none" stroke="var(--menthe)" stroke-width="8" />
    {/if}
    {#each graduations as g, i}
      {@const p = point(g, 48)}
      {@const q = point(g, i % 4 === 0 ? 38 : i % 2 === 0 ? 41 : 43.5)}
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--couleur-encre)" stroke-width={i % 4 === 0 ? 2.4 : 1.2} stroke-linecap="round" />
      {#if i % 4 === 0}
        {@const c = point(g, 29)}
        <text x={c.x} y={c.y + 3.5} text-anchor="middle" font-size="10" font-weight="700" font-family="var(--police-chiffres)" fill="var(--couleur-encre)">{g}</text>
      {/if}
    {/each}
    <text x="60" y="84" text-anchor="middle" font-size="8.5" font-weight="700" letter-spacing="1" font-family="var(--police-texte)" fill="var(--couleur-encre)">KM/S</text>
    <g class="aiguille" style={`transform: rotate(${angle(valeur)}deg)`}>
      <path d="M 57.6 64 L 59 19 L 60 14 L 61 19 L 62.4 64 Z" fill="var(--cerise)" stroke="var(--couleur-encre)" stroke-width="1.6" stroke-linejoin="round" />
    </g>
    <circle cx="60" cy="60" r="5.5" fill="var(--couleur-encre)" />
  </svg>
  <figcaption><span class="etiquette-encre">VITESSE</span><b>{nombre(valeur, 1)}</b></figcaption>
</figure>

<style>
  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  svg {
    width: 100%;
    max-width: 106px;
  }
  .aiguille {
    transform-box: view-box;
    transform-origin: 60px 60px;
    transition: transform 1s linear;
  }
  figcaption {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 15px;
    white-space: nowrap;
  }
</style>
