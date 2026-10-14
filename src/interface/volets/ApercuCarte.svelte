<script lang="ts">
  // Aperçu de la carte pour un contrat : un petit plan d'architecte qui cadre la fusée et la destination, avec les
  // planètes alentour. Un toucher n'importe où le referme.
  import { NOMS_PLANETES } from '../../donnees/planetes'
  import { UA_KM } from '../../astro/temps'
  import { distance, positionAstre, type Point2 } from '../../moteur/fusee'
  import { km, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'

  let { astre, titre, fermer }: { astre: string; titre: string; fermer: () => void } = $props()

  const PLAN = { fond: '#1f4f8c', trait: '#eef4ff', route: '#f2b53a' }
  const L = 340
  const H = 300

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const fusee = $derived(etat.fusee.position)
  const cible = $derived(positionAstre(astre, t))
  const d = $derived(distance(fusee, cible))
  // Cadre : la fusée et la destination, avec de la marge.
  const centre = $derived({ x: (fusee.x + cible.x) / 2, y: (fusee.y + cible.y) / 2 })
  const demi = $derived(Math.max(d * 0.75, 0.0006))
  const k = $derived(L / 2 / demi)
  const ecran = (p: Point2) => ({ x: L / 2 + (p.x - centre.x) * k, y: H / 2 - (p.y - centre.y) * k })
  const dedans = (s: { x: number; y: number }) => s.x > -20 && s.x < L + 20 && s.y > -20 && s.y < H + 20
  const soleil = $derived(ecran({ x: 0, y: 0 }))
  // Orbites dessinées tant qu'elles restent raisonnables à l'écran (sinon ce sont des droites hors cadre).
  const orbites = $derived(
    NOMS_PLANETES.map((n) => { const p = positionAstre(n, t); return { n, r: Math.hypot(p.x, p.y) * k, s: ecran(p) } }).filter((o) => o.r < 5000),
  )
  /** Astres repères : planètes et Lune dans le cadre (hors destination). */
  const reperes = $derived(
    [...NOMS_PLANETES, 'Lune'].filter((n) => n !== astre).map((n) => ({ n, s: ecran(positionAstre(n, t)) })).filter((m) => dedans(m.s)),
  )
  const sf = $derived(ecran(fusee))
  const sc = $derived(ecran(cible))
  const echelle = $derived(demi * 2 * UA_KM < 5e6 ? km(demi * 2 * UA_KM) : ua(demi * 2))
</script>

<div class="apercu" role="presentation" onclick={fermer}>
  <figure>
    <figcaption><span class="etiquette-encre">DESTINATION</span> {titre}</figcaption>
    <svg viewBox={`0 0 ${L} ${H}`} aria-label={`Aperçu de la carte : ${nomAstre(astre)}`}>
      <rect width={L} height={H} fill={PLAN.fond} />
      {#each Array.from({ length: 9 }, (_, i) => i) as i}
        <line x1={(i * L) / 8} y1="0" x2={(i * L) / 8} y2={H} stroke={PLAN.trait} stroke-width="0.5" opacity=".18" />
        <line x1="0" y1={(i * H) / 8} x2={L} y2={(i * H) / 8} stroke={PLAN.trait} stroke-width="0.5" opacity=".18" />
      {/each}
      {#each orbites as o}
        <circle cx={soleil.x} cy={soleil.y} r={o.r} fill="none" stroke={PLAN.trait} stroke-width="0.7" stroke-dasharray="4 3" opacity=".45" />
      {/each}
      {#each reperes as m}
        <circle cx={m.s.x} cy={m.s.y} r={m.n === 'Lune' ? 3 : 4} fill={PLAN.trait} opacity=".85" />
        <text x={m.s.x + 6} y={m.s.y - 5} font-size="10" font-family="var(--police-machine)" fill={PLAN.trait} opacity=".85">{m.n.toUpperCase()}</text>
      {/each}
      {#if dedans(soleil)}<circle cx={soleil.x} cy={soleil.y} r="8" fill="#f2b53a" stroke={PLAN.trait} stroke-width="1.5" />{/if}
      <line x1={sf.x} y1={sf.y} x2={sc.x} y2={sc.y} stroke={PLAN.route} stroke-width="2" stroke-dasharray="7 5" />
      <!-- La destination, entourée ; la fusée. -->
      <circle cx={sc.x} cy={sc.y} r="5" fill={PLAN.route} stroke={PLAN.trait} stroke-width="1.5" />
      <circle cx={sc.x} cy={sc.y} r="14" fill="none" stroke={PLAN.route} stroke-width="2" />
      <text x={sc.x} y={sc.y - 20} text-anchor="middle" font-size="13" font-weight="700" font-family="var(--police-machine)" fill={PLAN.route}>{astre.toUpperCase()}</text>
      <path d="M 9 0 L -6 5 L -3 0 L -6 -5 Z" transform={`translate(${sf.x} ${sf.y})`} fill="#e04b37" stroke={PLAN.trait} stroke-width="1.3" />
      <text x={sf.x} y={sf.y + 18} text-anchor="middle" font-size="10" font-family="var(--police-machine)" fill={PLAN.trait}>C-58</text>
      <g transform={`translate(${L - 128} ${H - 26})`}>
        <rect width="122" height="20" fill={PLAN.fond} stroke={PLAN.trait} stroke-width="1" />
        <text x="6" y="14" font-size="9" font-family="var(--police-machine)" fill={PLAN.trait}>LARGEUR {echelle}</text>
      </g>
    </svg>
    <p>{ua(d)} de la fusée · toucher pour fermer</p>
  </figure>
</div>

<style>
  .apercu {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(42, 30, 23, 0.72);
    animation: apparait 0.2s ease-out;
  }
  figure {
    margin: 0;
    width: min(100%, 380px);
    padding: 10px;
    border: 3px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--couleur-papier);
    box-shadow: var(--ombre);
  }
  figcaption {
    margin-bottom: 8px;
    font-size: 15px;
    line-height: 1.25;
  }
  svg {
    display: block;
    width: 100%;
    border: 2px solid var(--couleur-encre);
    border-radius: 4px;
  }
  p {
    margin: 6px 0 0;
    text-align: center;
    font-size: 13px;
    color: var(--couleur-texte-discret);
  }
  @keyframes apparait {
    from {
      opacity: 0;
      transform: scale(0.94);
    }
  }
</style>
