<script lang="ts">
  // Décor d'un module : la C-58 est une vieille fusée rafistolée dans tous les sens. Scotch, plaques rapiécées,
  // vis en trop, câbles, rayures, tampon d'inspection, tasse de café… Le décor est tiré au hasard d'après le code
  // du module (toujours le même pour un module donné), placé surtout sur les bords, derrière les commandes, et
  // ne porte aucun texte qui pourrait passer pour un indice.
  import { mulberry32 } from '../../moteur/hasard'

  let { graine }: { graine: string } = $props()

  type Genre = 'scotch' | 'plaque' | 'vis' | 'rayures' | 'danger' | 'tampon' | 'cafe' | 'cable' | 'note' | 'dessin' | 'bosse'
  interface Piece { genre: Genre; x: number; y: number; angle: number; taille: number; couleur: string }

  const COULEURS_CABLES = ['var(--cerise)', 'var(--sarcelle)', 'var(--moutarde)', 'var(--ciel)']

  const graineNum = $derived.by(() => {
    let n = 0
    for (const c of graine) n = (n * 31 + c.charCodeAt(0)) >>> 0
    return n
  })

  // Tôles rapiécées : de grands morceaux de tôle de teintes un peu différentes, rivetés, qui forment le panneau.
  const toles = $derived.by(() => {
    const h = mulberry32(graineNum ^ 0x5eed)
    return Array.from({ length: 4 }, () => ({
      x: -5 + h() * 70, y: 8 + h() * 70, l: 30 + h() * 45, h: 14 + h() * 26, angle: (h() - 0.5) * 4, teinte: h() < 0.5 ? 0.05 : 0.09,
    }))
  })

  const pieces = $derived.by(() => {
    const h = mulberry32(graineNum)
    const pris = (l: readonly Genre[]) => l[Math.floor(h() * l.length)]
    // Emplacements : surtout les bords (gauche, droite, bas), un peu le haut.
    const place = () => {
      const zone = h()
      if (zone < 0.28) return { x: h() * 10, y: 12 + h() * 76 }
      if (zone < 0.56) return { x: 90 + h() * 10, y: 12 + h() * 76 }
      if (zone < 0.8) return { x: h() * 100, y: 80 + h() * 18 }
      if (zone < 0.9) return { x: 10 + h() * 80, y: 60 + h() * 20 }
      return { x: 10 + h() * 80, y: 11 + h() * 5 }
    }
    const liste: Piece[] = []
    const genres: Genre[] = ['scotch', 'scotch', 'plaque', 'vis', 'vis', 'vis', 'rayures', 'danger', 'cable', 'cable', 'cafe', 'note', 'dessin', 'bosse', 'tampon']
    const nombre = 22 + Math.floor(h() * 6)
    for (let i = 0; i < nombre; i++) {
      liste.push({ genre: pris(genres), ...place(), angle: (h() - 0.5) * 70, taille: 0.8 + h() * 0.5, couleur: COULEURS_CABLES[Math.floor(h() * COULEURS_CABLES.length)] })
    }
    return liste
  })
</script>

<div class="bricolage" aria-hidden="true">
  {#each toles as t}
    <div class="tole" style={`left: ${t.x}%; top: ${t.y}%; width: ${t.l}%; height: ${t.h}%; transform: rotate(${t.angle}deg); background-color: rgba(42, 30, 23, ${t.teinte})`}></div>
  {/each}
  {#each pieces as p}
    <svg class="piece" style={`left: ${p.x}%; top: ${p.y}%; transform: translate(-50%, -50%) rotate(${p.angle}deg) scale(${p.taille})`}
      width="120" height="80" viewBox="-60 -40 120 80">
      {#if p.genre === 'scotch'}
        <!-- Bande de scotch aux bouts déchirés. -->
        <path d="M -48 -10 L 48 -10 L 45 -6 L 49 -2 L 45 2 L 49 6 L 46 10 L -48 10 L -45 6 L -49 2 L -45 -2 L -49 -6 Z"
          fill="rgba(226, 216, 186, 0.92)" stroke="var(--couleur-encre)" stroke-width="1.4" />
        <line x1="-40" y1="-4" x2="40" y2="-4" stroke="rgba(42,30,23,.12)" stroke-width="2" />
      {:else if p.genre === 'plaque'}
        <!-- Plaque rapiécée, vissée de travers. -->
        <rect x="-32" y="-22" width="64" height="44" rx="4" fill="var(--couleur-papier-fonce)" stroke="var(--couleur-encre)" stroke-width="2.5" />
        {#each [[-25, -15], [25, -15], [-25, 15], [25, 15]] as [x, y]}
          <circle cx={x} cy={y} r="3.5" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="1.5" />
          <line x1={x - 2.4} y1={y} x2={x + 2.4} y2={y} stroke="var(--couleur-encre)" stroke-width="1.2" />
        {/each}
        <path d="M -18 -4 L 16 6 M -14 8 L 6 2" stroke="rgba(42,30,23,.25)" stroke-width="1.5" />
      {:else if p.genre === 'vis'}
        <circle r="6" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="2" />
        <line x1="-4" y1="0" x2="4" y2="0" stroke="var(--couleur-encre)" stroke-width="1.8" />
      {:else if p.genre === 'rayures'}
        <path d="M -30 -6 L 26 -14 M -26 2 L 30 -4 M -18 10 L 20 6" stroke="rgba(42,30,23,.28)" stroke-width="1.4" stroke-linecap="round" />
      {:else if p.genre === 'danger'}
        <!-- Bande de danger jaune et noire. -->
        <defs>
          <pattern id={`danger-${p.x}-${p.y}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="10" fill="var(--couleur-encre)" />
            <rect x="5" width="5" height="10" fill="var(--moutarde)" />
          </pattern>
        </defs>
        <rect x="-40" y="-8" width="80" height="16" fill={`url(#danger-${p.x}-${p.y})`} stroke="var(--couleur-encre)" stroke-width="2" />
      {:else if p.genre === 'tampon'}
        <!-- Tampon d'inspection, à moitié effacé. -->
        <g opacity="0.55">
          <circle r="24" fill="none" stroke="var(--cerise)" stroke-width="2.5" />
          <circle r="18" fill="none" stroke="var(--cerise)" stroke-width="1.2" stroke-dasharray="3 2" />
          <text y="3.5" text-anchor="middle" font-size="9" font-weight="700" font-family="var(--police-texte)" fill="var(--cerise)" letter-spacing="1">INSPECTÉ</text>
        </g>
      {:else if p.genre === 'cafe'}
        <!-- Trace de tasse de café. -->
        <circle r="20" fill="none" stroke="rgba(120, 72, 30, 0.28)" stroke-width="3.5" stroke-dasharray="70 10 30 6" />
        <circle cx="3" cy="2" r="17" fill="none" stroke="rgba(120, 72, 30, 0.14)" stroke-width="2" />
      {:else if p.genre === 'cable'}
        <!-- Câble qui pendouille, avec un collier de serrage. -->
        <path d="M -56 -20 C -20 30, 20 -30, 56 18" fill="none" stroke="var(--couleur-encre)" stroke-width="8" stroke-linecap="round" />
        <path d="M -56 -20 C -20 30, 20 -30, 56 18" fill="none" stroke={p.couleur} stroke-width="4.5" stroke-linecap="round" />
        <rect x="-4" y="-7" width="8" height="12" rx="2" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="1.5" />
      {:else if p.genre === 'note'}
        <!-- Note scotchée, gribouillée (illisible). -->
        <rect x="-22" y="-20" width="44" height="40" fill="#fff6d8" stroke="var(--couleur-encre)" stroke-width="1.5" />
        <path d="M -16 -8 q 4 -3 8 0 t 8 0 t 8 0 M -16 0 q 4 -3 8 0 t 8 0 M -16 8 q 4 -3 8 0 t 8 0 t 8 0" fill="none" stroke="rgba(42,30,23,.45)" stroke-width="1.3" />
        <rect x="-10" y="-25" width="20" height="9" fill="rgba(226, 216, 186, 0.92)" stroke="var(--couleur-encre)" stroke-width="1" />
      {:else if p.genre === 'dessin'}
        <!-- Petite fusée dessinée au feutre par un ancien commissionnaire. -->
        <g fill="none" stroke="rgba(42,30,23,.5)" stroke-width="1.6" stroke-linejoin="round">
          <path d="M -16 0 L 8 -6 Q 20 0 8 6 Z" />
          <path d="M -10 -2 L -18 -10 M -10 2 L -18 10" />
          <path d="M -18 0 L -26 -2 M -18 1 L -27 4" />
        </g>
      {:else}
        <!-- Bosse dans la tôle. -->
        <ellipse rx="16" ry="9" fill="none" stroke="rgba(42,30,23,.3)" stroke-width="1.4" />
        <path d="M -9 -2 Q 0 -7 9 -2" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2" />
      {/if}
    </svg>
  {/each}
</div>

<style>
  .bricolage {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }
  .piece {
    position: absolute;
  }
  .tole {
    position: absolute;
    border: 2px solid rgba(42, 30, 23, 0.28);
    border-radius: 4px;
    /* Rangées de rivets en haut et en bas. */
    background-image: radial-gradient(circle, rgba(42, 30, 23, 0.4) 1.8px, transparent 2.3px),
      radial-gradient(circle, rgba(42, 30, 23, 0.4) 1.8px, transparent 2.3px);
    background-size: 18px 10px, 18px 10px;
    background-position: 4px 2px, 4px calc(100% - 2px);
    background-repeat: repeat-x, repeat-x;
  }
</style>
