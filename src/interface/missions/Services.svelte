<script lang="ts">
  // MISSIONS, SERVICES : les appels à l'aide captés sur le canal de détresse (5,00). Pas encore d'appels : la
  // rubrique annonce ce qui viendra (docs/conception-destin.md, §5).
  import { STATIONS_RADIO } from '../../donnees/radio'
  import { nombre } from '../format'
  import BientotDisponible from './BientotDisponible.svelte'
</script>

<div class="rubrique">
  <p class="intro">Appels à l’aide captés sur le canal de détresse, <b>{nombre(STATIONS_RADIO.detresse, 2)}</b> : une fusée en panne, à court de carburant, à remorquer ou à évacuer. Tous ceux qui arrivent à temps sont récompensés.</p>
  <BientotDisponible titre="Aucun appel en cours" texte="Le canal de détresse est en veille. Les premiers appels arriveront avec la prochaine version." />
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
