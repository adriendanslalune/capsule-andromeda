<script lang="ts">
  // Cadran à aiguille (0 à 100), avec des zones colorées : lunette chromée, graduations chiffrées, aiguille avec
  // ombre et contrepoids, reflet sur le verre.
  let {
    valeur,
    zones = [],
    nom,
    taille = 130,
  }: { valeur: number; zones?: [number, number, string][]; nom: string; taille?: number } = $props()

  const id = `c${Math.random().toString(36).slice(2, 8)}`
  // L'aiguille balaie 240°, de −120° (0) à +120° (100).
  const angle = (v: number) => -120 + (Math.max(0, Math.min(100, v)) / 100) * 240
  const point = (v: number, r: number) => {
    const t = ((angle(v) - 90) * Math.PI) / 180
    return { x: 60 + r * Math.cos(t), y: 60 + r * Math.sin(t) }
  }
  function arc(de: number, a: number): string {
    const r = 40
    const p = point(de, r)
    const q = point(a, r)
    return `M ${p.x} ${p.y} A ${r} ${r} 0 ${angle(a) - angle(de) > 180 ? 1 : 0} 1 ${q.x} ${q.y}`
  }
  const graduations = Array.from({ length: 21 }, (_, i) => i * 5)
</script>

<svg width={taille} height={taille} viewBox="0 0 120 120" role="img" aria-label={`${nom} : ${Math.round(valeur)}`}>
  <defs>
    <linearGradient id={`${id}-lunette`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" />
      <stop offset="0.35" stop-color="#b9c2c7" />
      <stop offset="0.6" stop-color="#4f5a60" />
      <stop offset="0.85" stop-color="#e9eef0" />
      <stop offset="1" stop-color="#8d979c" />
    </linearGradient>
    <radialGradient id={`${id}-fond`} cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="#fbf3dc" />
      <stop offset="0.8" stop-color="#ead9ae" />
      <stop offset="1" stop-color="#c9b583" />
    </radialGradient>
    <linearGradient id={`${id}-verre`} x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55" />
      <stop offset="0.45" stop-color="#fff" stop-opacity="0.06" />
      <stop offset="1" stop-color="#fff" stop-opacity="0" />
    </linearGradient>
  </defs>
  <!-- Lunette et cadran. -->
  <circle cx="60" cy="61.5" r="58" fill="rgba(0,0,0,0.35)" />
  <circle cx="60" cy="60" r="58" fill={`url(#${id}-lunette)`} />
  <circle cx="60" cy="60" r="51" fill="#1a1a1a" />
  <circle cx="60" cy="60" r="49.5" fill={`url(#${id}-fond)`} />
  {#each zones as [de, a, couleur]}
    <path d={arc(de, a)} fill="none" stroke={couleur} stroke-width="7" opacity="0.9" />
  {/each}
  <!-- Graduations : longues et chiffrées toutes les 20, moyennes toutes les 10, courtes toutes les 5. -->
  {#each graduations as g}
    {@const long = g % 20 === 0}
    {@const p = point(g, 46)}
    {@const q = point(g, long ? 36 : g % 10 === 0 ? 39 : 41.5)}
    <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#22160f" stroke-width={long ? 2.2 : 1.1} stroke-linecap="round" />
    {#if long}
      {@const c = point(g, 28)}
      <text x={c.x} y={c.y + 3.6} text-anchor="middle" font-size="10" font-weight="700" font-family="var(--police-chiffres)" fill="#22160f">{g}</text>
    {/if}
  {/each}
  <text x="60" y="86" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="1.5" font-family="var(--police-texte)" fill="#22160f">{nom}</text>
  <!-- Aiguille (avec son ombre), qui glisse d'une valeur à l'autre : le moteur avance d'un pas par seconde. -->
  <g class="aiguille ombre" style={`transform: translate(1.6px, 2.2px) rotate(${angle(valeur)}deg)`}>
    <path d="M 58.6 72 L 59.2 17 L 60 13 L 60.8 17 L 61.4 72 Z" fill="rgba(0,0,0,0.3)" />
  </g>
  <g class="aiguille" style={`transform: rotate(${angle(valeur)}deg)`}>
    <path d="M 58.6 60 L 59.2 17 L 60 13 L 60.8 17 L 61.4 60 Z" fill="#d93a2b" />
    <path d="M 57.5 60 L 58 73 Q 60 76 62 73 L 62.5 60 Z" fill="#22160f" />
  </g>
  <circle cx="60" cy="60" r="5.5" fill={`url(#${id}-lunette)`} />
  <circle cx="60" cy="60" r="2" fill="#22160f" />
  <!-- Reflet du verre. -->
  <path d="M 18 48 A 44 44 0 0 1 96 28 A 52 40 0 0 0 18 48 Z" fill={`url(#${id}-verre)`} />
</svg>

<style>
  .aiguille {
    transform-box: view-box;
    transform-origin: 60px 60px;
    transition: transform 1s linear;
  }
  svg {
    overflow: visible;
  }
</style>
