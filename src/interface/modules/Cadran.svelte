<script lang="ts">
  // Cadran à aiguille (0 à 100), avec des zones colorées.
  let {
    valeur,
    zones = [],
    nom,
    taille = 130,
  }: { valeur: number; zones?: [number, number, string][]; nom: string; taille?: number } = $props()

  // L'aiguille balaie 240°, de −120° (0) à +120° (100).
  const angle = (v: number) => -120 + (Math.max(0, Math.min(100, v)) / 100) * 240
  function arc(de: number, a: number): string {
    const r = 44
    const p = (v: number) => {
      const t = ((angle(v) - 90) * Math.PI) / 180
      return `${60 + r * Math.cos(t)} ${60 + r * Math.sin(t)}`
    }
    return `M ${p(de)} A ${r} ${r} 0 ${angle(a) - angle(de) > 180 ? 1 : 0} 1 ${p(a)}`
  }
</script>

<svg width={taille} height={taille} viewBox="0 0 120 120" role="img" aria-label={`${nom} : ${Math.round(valeur)}`}>
  <circle cx="60" cy="60" r="56" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="3" />
  {#each zones as [de, a, couleur]}
    <path d={arc(de, a)} fill="none" stroke={couleur} stroke-width="8" />
  {/each}
  {#each [0, 20, 40, 60, 80, 100] as g}
    <line
      x1="60" y1="12" x2="60" y2="20"
      stroke="var(--couleur-encre)" stroke-width="2"
      transform={`rotate(${angle(g)} 60 60)`}
    />
  {/each}
  <text x="60" y="92" text-anchor="middle" font-size="12" font-weight="700" fill="var(--couleur-encre)">{nom}</text>
  <!-- L'aiguille glisse d'une valeur à l'autre (le moteur avance d'un pas par seconde). -->
  <line
    class="aiguille"
    x1="60" y1="60" x2="60" y2="18"
    stroke="var(--couleur-danger)" stroke-width="3" stroke-linecap="round"
    style={`transform: rotate(${angle(valeur)}deg)`}
  />
  <circle cx="60" cy="60" r="5" fill="var(--couleur-encre)" />
</svg>

<style>
  .aiguille {
    transform-box: view-box;
    transform-origin: 60px 60px;
    transition: transform 1s linear;
  }
</style>
