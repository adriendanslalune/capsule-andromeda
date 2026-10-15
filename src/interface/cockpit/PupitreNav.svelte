<script lang="ts">
  // Pupitre du cockpit, à droite : la navigation, en radar. La fusée au centre (flèche selon son cap), la destination
  // là où elle est maintenant (trait blanc pointillé) et le point de rencontre (trait jaune), comme sur la carte ;
  // distances en échelle logarithmique (la plus lointaine au bord). Sans destination : le Soleil et la Terre.
  // Un balayage tourne en permanence ; le visiteur y fait un écho quand le détecteur DET le repère.
  // Le toucher ouvre la page NAVIGATION.
  import { direction, distance, enAttenteDeFenetre, planDeVol, positionAstre, positionDestination, type Point2 } from '../../moteur/fusee'
  import { vitesseActuelle } from '../../moteur/partie'
  import { positionVisiteur, visiteurDetecte } from '../../moteur/chasse'
  import { nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const fusee = $derived(etat.fusee)
  const ici = $derived<Point2>({ x: fusee.position.x + (fusee.ecartOrbite?.x ?? 0), y: fusee.position.y + (fusee.ecartOrbite?.y ?? 0) })
  const dest = $derived(fusee.destination)
  const cible = $derived(dest ? positionDestination(dest, t) : null)
  const plan = $derived(dest ? planDeVol(fusee, t, vitesseActuelle(etat)) : null)
  const rencontre = $derived(plan?.point ?? null)

  // Repères : la destination et le point de rencontre ; sans destination, le Soleil et la Terre.
  const reperes = $derived.by(() => {
    if (cible) return [{ p: cible, sorte: 'cible' as const }, ...(rencontre ? [{ p: rencontre, sorte: 'rencontre' as const }] : [])]
    const l: { p: Point2; sorte: 'soleil' | 'terre' }[] = [{ p: { x: 0, y: 0 }, sorte: 'soleil' }]
    if (fusee.orbite !== 'Terre') l.push({ p: positionAstre('Terre', t), sorte: 'terre' })
    return l
  })
  const R = 46
  const dmax = $derived(Math.max(1e-9, ...reperes.map((r) => distance(ici, r.p))))
  const d0 = $derived(dmax / 40)
  const placer = (p: Point2) => {
    const d = distance(ici, p)
    const r = d < 1e-12 ? 0 : (R * 0.88 * Math.log10(1 + d / d0)) / Math.log10(1 + dmax / d0)
    const a = (direction(ici, p) * Math.PI) / 180
    return { x: 50 + Math.cos(a) * r, y: 50 - Math.sin(a) * r }
  }
  // Le visiteur, s'il est détecté (DET) : un écho qui clignote, à sa place sur le radar.
  const echo = $derived(visiteurDetecte(etat, t) !== null ? placer(positionVisiteur(t)) : null)
  const nom = $derived(dest?.type === 'astre' ? nomAstre(dest.astre) : dest?.type === 'visiteur' ? 'objet inconnu' : dest ? 'point libre' : null)
</script>

<button class="instrument nav" onclick={() => (jeu.page = 'carte')} aria-label="Ouvrir la page NAVIGATION">
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <linearGradient id="balayage" x1="1" y1="1" x2="0.7" y2="0">
        <stop offset="0" stop-color="#cfe9ff" stop-opacity="0.55" />
        <stop offset="1" stop-color="#cfe9ff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r={R} fill="#0f2747" stroke="var(--couleur-encre)" stroke-width="3" />
    {#each [0.33, 0.66] as k}<circle cx="50" cy="50" r={R * k} fill="none" stroke="#9fc1e8" stroke-width="0.5" opacity=".5" />{/each}
    <line x1="4" y1="50" x2="96" y2="50" stroke="#9fc1e8" stroke-width="0.4" opacity=".5" />
    <line x1="50" y1="4" x2="50" y2="96" stroke="#9fc1e8" stroke-width="0.4" opacity=".5" />
    {#each reperes as r}
      {@const q = placer(r.p)}
      {#if r.sorte === 'cible'}
        <line x1="50" y1="50" x2={q.x} y2={q.y} stroke="#eef4ff" stroke-width="1" stroke-dasharray="1.5 2.5" />
        <circle cx={q.x} cy={q.y} r="4" fill="none" stroke="#eef4ff" stroke-width="1.2" stroke-dasharray="2 1.5" />
      {:else if r.sorte === 'rencontre'}
        <line x1="50" y1="50" x2={q.x} y2={q.y} stroke="var(--moutarde)" stroke-width="1.6" stroke-dasharray="4 3" />
        <circle cx={q.x} cy={q.y} r="2.6" fill="none" stroke="var(--moutarde)" stroke-width="1.5" />
      {:else if r.sorte === 'soleil'}
        <circle cx={q.x} cy={q.y} r="3.5" fill="var(--moutarde)" />
      {:else}
        <circle cx={q.x} cy={q.y} r="2.5" fill="#7fa4cf" />
      {/if}
    {/each}
    <!-- Balayage : un secteur clair qui tourne autour de la fusée. -->
    <g class="balayage">
      <path d={`M 50 50 L ${50 + R} 50 A ${R} ${R} 0 0 0 ${50 + R * Math.cos(0.7)} ${50 - R * Math.sin(0.7)} Z`} fill="url(#balayage)" />
    </g>
    {#if echo}<circle class="echo" cx={echo.x} cy={echo.y} r="3.2" fill="var(--menthe)" stroke="var(--couleur-encre)" stroke-width="0.8" />{/if}
    <path d="M 7 0 L -5 4 L -2.5 0 L -5 -4 Z" fill="var(--cerise)" stroke="#f8f5ec" stroke-width="0.8" transform={`translate(50 50) rotate(${-fusee.cap})`} />
  </svg>
  <span class="legende">
    <small>NAVIGATION</small>
    {#if nom}<b>{nom}</b><span>{ua(cible ? distance(ici, cible) : 0)}{dest && enAttenteDeFenetre(fusee) ? ' · fenêtre' : ''}</span>
    {:else}<b>À choisir</b><span>aucune destination</span>{/if}
  </span>
</button>

<style>
  .instrument {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: inherit;
  }
  .instrument:active svg {
    transform: scale(0.97);
  }
  svg {
    width: 136px;
    height: 136px;
    filter: drop-shadow(2px 2px 0 var(--couleur-encre));
  }
  .balayage {
    transform-origin: 50px 50px;
    animation: tourne 4s linear infinite;
  }
  @keyframes tourne {
    to {
      transform: rotate(-360deg);
    }
  }
  .echo {
    animation: clignote 1.2s steps(1) infinite;
  }
  @keyframes clignote {
    50% {
      opacity: 0;
    }
  }
  .legende {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.1;
    max-width: 100%;
  }
  .legende small {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--couleur-encre-discrete);
  }
  .legende b {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--police-titre);
    font-weight: 400;
    font-size: 14px;
  }
  .legende span {
    font-family: var(--police-chiffres);
    font-size: 12px;
  }
</style>
