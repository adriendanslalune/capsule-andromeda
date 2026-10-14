<script lang="ts">
  // Horloge à aiguilles : l'heure réelle d'arrivée à destination (heure du téléphone), ou l'heure actuelle à
  // l'arrêt. La date s'affiche dans le cadran quand l'arrivée n'est pas aujourd'hui.
  import { heureLocale } from '../format'

  let { instant, arrivee, maintenant }: { instant: number; arrivee: boolean; maintenant: number } = $props()

  const d = $derived(new Date(instant))
  const minutes = $derived(d.getMinutes() + d.getSeconds() / 60)
  const heures = $derived((d.getHours() % 12) + minutes / 60)
  const autreJour = $derived(arrivee && new Date(maintenant).toDateString() !== d.toDateString())
  const jour = $derived(d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '').toUpperCase())
  const point = (fraction: number, r: number) => {
    const a = fraction * 2 * Math.PI - Math.PI / 2
    return { x: 60 + r * Math.cos(a), y: 60 + r * Math.sin(a) }
  }
  const aiguilleH = $derived(point(heures / 12, 26))
  const aiguilleM = $derived(point(minutes / 60, 40))
</script>

<figure>
  <svg viewBox="0 0 120 120" role="img" aria-label={`${arrivee ? 'Arrivée' : 'Heure'} : ${heureLocale(instant)}`}>
    <!-- Lunette boulonnée, puis le cadran (réduit à l'intérieur). -->
    <circle cx="62.5" cy="62.5" r="57" fill="var(--couleur-encre)" />
    <circle cx="60" cy="60" r="57" fill="var(--moutarde)" stroke="var(--couleur-encre)" stroke-width="3" />
    {#each [45, 135, 225, 315] as v}
      {@const r = (v * Math.PI) / 180}
      <circle cx={60 + Math.cos(r) * 51.5} cy={60 + Math.sin(r) * 51.5} r="2.6" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="1.2" />
      <line x1={60 + Math.cos(r) * 51.5 - 1.6} y1={60 + Math.sin(r) * 51.5} x2={60 + Math.cos(r) * 51.5 + 1.6} y2={60 + Math.sin(r) * 51.5} stroke="var(--couleur-encre)" stroke-width="0.9" />
    {/each}
    <g transform="translate(60 60) scale(0.8) translate(-60 -60)">
    <circle cx="60" cy="60" r="56" fill={arrivee ? 'var(--couleur-papier)' : '#f6ead0'} stroke="var(--couleur-encre)" stroke-width="3.5" />
    {#each Array.from({ length: 60 }, (_, i) => i) as m}
      {@const p = point(m / 60, 48)}
      {@const q = point(m / 60, m % 5 === 0 ? 41 : 45)}
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--couleur-encre)" stroke-width={m % 15 === 0 ? 2.6 : m % 5 === 0 ? 1.6 : 0.8} stroke-linecap="round" />
    {/each}
    {#each [12, 3, 6, 9] as h}
      {@const c = point(h / 12, 33)}
      <text x={c.x} y={c.y + 4} text-anchor="middle" font-size="11" font-weight="700" font-family="var(--police-chiffres)" fill="var(--couleur-encre)">{h}</text>
    {/each}
    {#if autreJour}
      <rect x="40" y="70" width="40" height="13" rx="3" fill="var(--moutarde)" stroke="var(--couleur-encre)" stroke-width="1.4" />
      <text x="60" y="80" text-anchor="middle" font-size="8.5" font-weight="700" font-family="var(--police-texte)" fill="var(--couleur-encre)">{jour}</text>
    {/if}
    <line x1="60" y1="60" x2={aiguilleH.x} y2={aiguilleH.y} stroke="var(--couleur-encre)" stroke-width="4.5" stroke-linecap="round" />
    <line x1="60" y1="60" x2={aiguilleM.x} y2={aiguilleM.y} stroke="var(--cerise)" stroke-width="3" stroke-linecap="round" />
    <circle cx="60" cy="60" r="5" fill="var(--couleur-encre)" />
    </g>
  </svg>
  <figcaption><span class="etiquette-encre">{arrivee ? 'ARRIVÉE' : 'HEURE'}</span><b>{heureLocale(instant)}</b></figcaption>
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
    max-width: 112px;
  }
  figcaption {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 15px;
    white-space: nowrap;
  }
</style>
