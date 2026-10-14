<script lang="ts">
  // Compas de cap : l'aiguille donne le cap de la fusée, le repère moutarde la direction de la destination.
  // Même convention que la carte : 0° vers la droite (point vernal), angles dans le sens trigonométrique.
  import { untrack } from 'svelte'
  let { cap, vers }: { cap: number; vers: number | null } = $props()

  const point = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180
    return { x: 60 + r * Math.cos(a), y: 60 - r * Math.sin(a) }
  }
  const graduations = Array.from({ length: 36 }, (_, i) => i * 10)
  // Rotation d'écran (sens horaire) correspondant à un angle trigonométrique.
  const rotation = (deg: number) => 90 - deg
  // Pour que l'aiguille tourne par le plus court chemin, on cumule les écarts.
  let affiche = $state(0)
  let precedent = 0
  $effect(() => {
    const ecart = ((cap - precedent + 540) % 360) - 180
    precedent = cap
    untrack(() => (affiche += ecart))
  })
</script>

<figure>
  <svg viewBox="0 0 120 120" role="img" aria-label={`Cap : ${Math.round(cap)}°`}>
    <circle cx="63" cy="63" r="56" fill="var(--couleur-encre)" />
    <circle cx="60" cy="60" r="56" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="3.5" />
    {#each graduations as g}
      {@const p = point(g, 48)}
      {@const q = point(g, g % 90 === 0 ? 39 : g % 30 === 0 ? 42 : 44.5)}
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--couleur-encre)" stroke-width={g % 90 === 0 ? 2.4 : 1.2} stroke-linecap="round" />
      {#if g % 90 === 0}
        {@const c = point(g, 30)}
        <text x={c.x} y={c.y + 3.5} text-anchor="middle" font-size="10" font-weight="700" font-family="var(--police-chiffres)" fill="var(--couleur-encre)">{g}</text>
      {/if}
    {/each}
    <!-- Repère de la destination. -->
    {#if vers !== null}
      <g style={`transform: rotate(${rotation(vers)}deg)`} class="tourne">
        <path d="M 60 6 L 66 17 L 54 17 Z" fill="var(--moutarde)" stroke="var(--couleur-encre)" stroke-width="1.6" stroke-linejoin="round" />
      </g>
    {/if}
    <!-- Aiguille : une petite fusée. -->
    <g class="tourne aiguille" style={`transform: rotate(${rotation(0) - affiche}deg)`}>
      <path d="M 60 16 Q 66 26 64 52 L 56 52 Q 54 26 60 16 Z" fill="var(--cerise)" stroke="var(--couleur-encre)" stroke-width="1.6" />
      <path d="M 56 46 L 51 56 L 56 54 Z M 64 46 L 69 56 L 64 54 Z" fill="var(--cerise)" stroke="var(--couleur-encre)" stroke-width="1.4" stroke-linejoin="round" />
      <line x1="60" y1="60" x2="60" y2="96" stroke="var(--couleur-encre)" stroke-width="2.2" stroke-linecap="round" />
    </g>
    <circle cx="60" cy="60" r="5.5" fill="var(--couleur-encre)" />
  </svg>
  <figcaption><span class="etiquette-encre">CAP</span><b>{String(Math.round(cap) % 360).padStart(3, '0')}°</b></figcaption>
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
  .tourne {
    transform-box: view-box;
    transform-origin: 60px 60px;
  }
  .aiguille {
    transition: transform 0.4s ease-out;
  }
  figcaption {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 15px;
    white-space: nowrap;
  }
</style>
