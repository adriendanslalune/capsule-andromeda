<script lang="ts">
  // IX. LP-1 Lampes à vide.
  import { LAMPES } from '../../../donnees/modules'
  import Page from '../Page.svelte'
  import Bouton from '../schemas/Bouton.svelte'
  import Plaque from '../schemas/Plaque.svelte'

  let { numero }: { numero: number } = $props()
</script>

<Page {numero} chapitre="IX." titre="LP-1 — LAMPES À VIDE">
  <svg class="planche" viewBox="0 0 344 150" aria-label="Planche du bloc LP-1">
    <rect x="54" y="2" width="236" height="118" rx="6" fill="none" stroke="#1d1916" stroke-width="1.5" />
    {#each Array.from({ length: LAMPES.nombre }, (_, i) => i) as i}
      {@const x = 88 + (i % 3) * 84}
      {@const y = 8 + Math.floor(i / 3) * 56}
      <path d={`M ${x - 12} ${y + 34} L ${x - 12} ${y + 12} Q ${x - 12} ${y} ${x} ${y} Q ${x + 12} ${y} ${x + 12} ${y + 12} L ${x + 12} ${y + 34} Z`} fill="#f8f5ec" stroke="#1d1916" stroke-width="1.3" />
      <path d={`M ${x - 4} ${y + 30} L ${x - 4} ${y + 14} Q ${x} ${y + 9} ${x + 4} ${y + 14} L ${x + 4} ${y + 30}`} fill="none" stroke="#1d1916" stroke-width="0.9" />
      <rect x={x - 11} y={y + 34} width="22" height="7" fill="#1d1916" />
      <text x={x + 22} y={y + 30} font-size="8" font-weight="700" font-family="Courier Prime, monospace">L-{i + 1}</text>
    {/each}
    <Bouton x={172} y={136} r={11} texte="✣" />
    <Plaque x={204} y={136} texte="VT" />
  </svg>
  <p>
    Six lampes, L-1 à L-{LAMPES.nombre}. En service, leur filament brille ORANGE. Une lampe défectueuse est ÉTEINTE,
    BLEUE ou VERTE. Symptôme : une ou plusieurs lampes défectueuses, bloc LP-1 en avarie.
  </p>
  <ol>
    <li>Mettre le ventilateur VT en marche. Une lampe chaude ne se touche jamais ventilateur arrêté.</li>
    <li>Remplacer les lampes défectueuses (les toucher), dans l’ordre ci-dessous.</li>
    <li>Arrêter le ventilateur VT.</li>
  </ol>
  <h3>Ordre de remplacement</h3>
  <ol>
    <li>D’abord les lampes ÉTEINTES, puis les BLEUES, puis les VERTES.</li>
    <li>À couleur égale : par numéro croissant si le dernier chiffre du n° de série est PAIR, décroissant s’il est IMPAIR.</li>
  </ol>
  <p class="discret">Toucher une lampe hors de son tour : refus ; reprendre à la bonne lampe. Toucher une lampe ventilateur arrêté : brûlure.</p>
</Page>
