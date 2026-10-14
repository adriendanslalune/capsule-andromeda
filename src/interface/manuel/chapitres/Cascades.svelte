<script lang="ts">
  // XVI. Pannes multiples (cascades).
  import { PANNES } from '../../../donnees/reglages'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const ordre = ['AL', 'AN', 'CH', 'CO', 'CR', 'HY', 'LP', 'MO', 'PB', 'SX', 'TU']
  const [p1, p2, p3] = PANNES.paliersCascade
</script>

<Page {numero} chapitre="XVI." titre="PANNES MULTIPLES">
  <p>
    Avec l’âge de l’appareil, les avaries tendent à survenir en cascade : plusieurs blocs tombent en panne au même
    instant. Le téléscripteur l’annonce par « AVARIE EN CASCADE ».
  </p>
  <table>
    <thead><tr><th>AMÉLIORATIONS DU MOTEUR</th><th>BLOCS EN CASCADE, AU PLUS</th></tr></thead>
    <tbody>
      <tr><td>moins de {p1}</td><td>1 (pas de cascade)</td></tr>
      <tr><td>de {p1} à {p2 - 1}</td><td>2</td></tr>
      <tr><td>de {p2} à {p3 - 1}</td><td>3</td></tr>
      <tr><td>{p3} et plus</td><td>4</td></tr>
    </tbody>
  </table>
  <h3>Ordre de réparation</h3>
  <p>Les blocs d’une cascade se réparent dans l’ordre alphabétique de leur code :</p>
  <p class="ordre">{ordre.join(' · ')}</p>
  <p>Si le dernier chiffre du n° de série est IMPAIR, dans l’ordre inverse.</p>
  <p class="exception">une surchauffe (TU-1) se traite TOUJOURS en premier, quel que soit l’ordre.</p>
  <p>
    Un bloc réparé hors de son tour retombe aussitôt en panne. La prime d’une cascade est versée à la fin, majorée de
    {PANNES.majorationParModule * 100} % par bloc supplémentaire.
  </p>
  <p class="discret">Le recycleur RE-1 ne participe jamais aux cascades.</p>
</Page>

<style>
  .ordre {
    text-align: center;
    font-weight: 700;
    letter-spacing: 1px;
    border: 1px solid #1d1916;
    padding: 3px;
  }
</style>
