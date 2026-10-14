<script lang="ts">
  // Cadran à aiguille (0 à 100), avec des zones colorées, à plat : fond papier, trait d'encre, graduations
  // chiffrées, aiguille rouge.
  let {
    valeur,
    zones = [],
    nom,
    taille = 150,
  }: { valeur: number; zones?: [number, number, string][]; nom: string; taille?: number } = $props()

  // L'aiguille balaie 240°, de −120° (0) à +120° (100).
  const angle = (v: number) => -120 + (Math.max(0, Math.min(100, v)) / 100) * 240
  const point = (v: number, r: number) => {
    const t = ((angle(v) - 90) * Math.PI) / 180
    return { x: 60 + r * Math.cos(t), y: 60 + r * Math.sin(t) }
  }
  function arc(de: number, a: number): string {
    const r = 42
    const p = point(de, r)
    const q = point(a, r)
    return `M ${p.x} ${p.y} A ${r} ${r} 0 ${angle(a) - angle(de) > 180 ? 1 : 0} 1 ${q.x} ${q.y}`
  }
  const graduations = Array.from({ length: 21 }, (_, i) => i * 5)
</script>

<svg width={taille} height={taille} viewBox="0 0 120 120" role="img" aria-label={`${nom} : ${Math.round(valeur)}`}>
  <!-- Boîtier : ombre dure, puis le cadran cerné d'encre. -->
  <circle cx="63" cy="63" r="55" fill="var(--couleur-encre)" />
  <circle cx="60" cy="60" r="55" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="3.5" />
  {#each zones as [de, a, couleur]}
    <path d={arc(de, a)} fill="none" stroke={couleur} stroke-width="8" />
  {/each}
  <!-- Graduations : longues et chiffrées toutes les 20, moyennes toutes les 10, courtes toutes les 5. -->
  {#each graduations as g}
    {@const long = g % 20 === 0}
    {@const p = point(g, 47)}
    {@const q = point(g, long ? 37 : g % 10 === 0 ? 40 : 42.5)}
    <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--couleur-encre)" stroke-width={long ? 2.4 : 1.2} stroke-linecap="round" />
    {#if long}
      {@const c = point(g, 29)}
      <text x={c.x} y={c.y + 3.6} text-anchor="middle" font-size="10.5" font-weight="700" font-family="var(--police-chiffres)" fill="var(--couleur-encre)">{g}</text>
    {/if}
  {/each}
  <text x="60" y="88" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="1.5" font-family="var(--police-texte)" fill="var(--couleur-encre)">{nom}</text>
  <!-- Aiguille, qui glisse d'une valeur à l'autre (le moteur avance d'un pas par seconde). -->
  <g class="aiguille" style={`transform: rotate(${angle(valeur)}deg)`}>
    <path d="M 57.6 64 L 59 18 L 60 13 L 61 18 L 62.4 64 Z" fill="var(--cerise)" stroke="var(--couleur-encre)" stroke-width="1.6" stroke-linejoin="round" />
  </g>
  <circle cx="60" cy="60" r="5.5" fill="var(--couleur-encre)" />
</svg>

<style>
  .aiguille {
    transform-box: view-box;
    transform-origin: 60px 60px;
    transition: transform 1s linear;
  }
</style>
