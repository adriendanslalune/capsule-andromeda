<script lang="ts">
  // MISSIONS, HISTOIRES : les fils d'histoire au choix (docs/conception-destin.md, §3). Ils ne sont pas encore
  // jouables : la rubrique les présente.
  import BientotDisponible from './BientotDisponible.svelte'

  const FILS = [
    { titre: 'Les Monolithes', texte: 'Un signal venu d’ailleurs, sur 7,50. Dix monolithes cachés dans le système solaire ; les dix réunis donnent accès à une technologie extraterrestre.' },
    { titre: 'La carrière à l’Office', texte: 'Des grades, des missions de prestige, des contrats mieux payés.' },
    { titre: 'Les Indépendants', texte: 'Des commerçants libres et des cargaisons douteuses, plus rentables, plus risquées.' },
    { titre: 'Le Visiteur', texte: 'Qui est-il, d’où vient-il ? Chaque saison, un chapitre.' },
  ]
</script>

<div class="rubrique">
  <p class="intro">Chaque fil d’histoire se découvre en jouant ; on choisit de le suivre ou non, et on peut en suivre plusieurs.</p>
  {#each FILS as f}<BientotDisponible titre={f.titre} texte={f.texte} />{/each}
</div>

<style>
  .rubrique {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 2px;
  }
  .intro {
    margin: 0;
    font-size: 14px;
    line-height: 1.35;
  }
</style>
