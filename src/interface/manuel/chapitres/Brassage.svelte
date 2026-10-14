<script lang="ts">
  // VIII. PB-1 Tableau de brassage : table des branchements (données du jeu).
  import { BRASSAGE_CIBLE, BRASSAGE_DEPART, COULEURS_CABLES } from '../../../donnees/modules'
  import Page from '../Page.svelte'
  import Plaque from '../schemas/Plaque.svelte'
  import Voyant from '../schemas/Voyant.svelte'

  let { numero }: { numero: number } = $props()
  const x = (n: number) => 72 + (n - 1) * 50
  const motif: Record<string, string> = { rouge: '', bleu: '6 3', jaune: '2 2' }
</script>

<Page {numero} chapitre="VIII." titre="PB-1 — TABLEAU DE BRASSAGE">
  <svg class="planche" viewBox="0 0 344 170" aria-label="Planche du tableau de brassage">
    {#each COULEURS_CABLES as c, i}
      <Voyant x={122 + i * 50} y={10} r={7} allume={c === 'bleu'} />
      <Plaque x={122 + i * 50} y={27} texte={c.toUpperCase()} />
    {/each}
    <rect x="44" y="38" width="256" height="128" rx="6" fill="none" stroke="#1d1916" stroke-width="1.5" />
    <!-- Câbles d'une fusée neuve (trait plein : rouge ; tirets : bleu ; pointillés : jaune). -->
    {#each COULEURS_CABLES as c}
      {@const [a, b] = BRASSAGE_DEPART[c]}
      <path d={`M ${x(a)} 70 C ${x(a)} 110, ${x(b)} 100, ${x(b)} 138`} fill="none" stroke="#1d1916" stroke-width="2.2" stroke-dasharray={motif[c]} />
    {/each}
    {#each [1, 2, 3, 4, 5] as n}
      {#each [['A', 70], ['B', 138]] as [rang, y]}
        <circle cx={x(n)} cy={y as number} r="10" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.4" />
        <circle cx={x(n)} cy={y as number} r="4" fill="#1d1916" />
        <text x={x(n)} y={rang === 'A' ? 54 : 162} text-anchor="middle" font-size="8.5" font-weight="700" font-family="Courier Prime, monospace">{rang}-{n}</text>
      {/each}
    {/each}
  </svg>
  <p>
    Cinq prises de départ (A-1 à A-5, en haut), cinq prises d’arrivée (B-1 à B-5, en bas), trois câbles :
    ROUGE (trait plein), BLEU (tirets), JAUNE (pointillés). Symptôme : un témoin de couleur clignote ; le câble de
    cette couleur est défectueux et doit être déplacé.
  </p>
  <ol>
    <li>Débrancher le câble défectueux (toucher l’une de ses fiches).</li>
    <li>Le rebrancher : toucher d’abord la prise A, puis la prise B indiquées par le tableau.</li>
  </ol>
  <table>
    <thead><tr><th>CÂBLE</th><th>DERNIER CHIFFRE PAIR</th><th>IMPAIR</th></tr></thead>
    <tbody>
      {#each COULEURS_CABLES as c}
        {@const [pair, impair] = BRASSAGE_CIBLE[c]}
        <tr><td>{c.toUpperCase()}</td><td>A-{pair[0]} vers B-{pair[1]}</td><td>A-{impair[0]} vers B-{impair[1]}</td></tr>
      {/each}
    </tbody>
  </table>
  <p class="exception">si une prise indiquée est déjà occupée, prendre la prise suivante libre de la même rangée (après 5, revenir à 1).</p>
</Page>
