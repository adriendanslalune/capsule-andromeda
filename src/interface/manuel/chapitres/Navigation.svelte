<script lang="ts">
  // XIX. Navigation : destinations, distances d'arrivée, amarrage à l'ISS, Soleil et filtre solaire.
  import { UA_KM } from '../../../astro/temps'
  import { AMARRAGE_ISS_KM, SEUIL_ARRIVEE, SEUIL_ARRIVEE_LUNE, SEUIL_ARRIVEE_POINT_KM, SEUIL_ARRIVEE_SOLEIL } from '../../../donnees/reglages'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const km = (ua: number) => Math.round(ua * UA_KM).toLocaleString('fr-FR')
  const virgule = (x: number) => String(x).replace('.', ',')
</script>

<Page {numero} chapitre="XIX." titre="NAVIGATION">
  <p>
    La destination se choisit sur la carte : une planète, un satellite, la Lune, le Soleil, ou un point libre. Le
    voyage suit la vraie position des astres ; la fusée contourne d’elle-même ceux qui sont sur sa route.
  </p>
  <h3>Distances d’arrivée</h3>
  <table>
    <tbody>
      <tr><td>Planète</td><td>{virgule(SEUIL_ARRIVEE)} UA ({km(SEUIL_ARRIVEE)} km)</td></tr>
      <tr><td>Lune</td><td>{virgule(SEUIL_ARRIVEE_LUNE)} UA ({km(SEUIL_ARRIVEE_LUNE)} km)</td></tr>
      <tr><td>Autre satellite</td><td>le quart de son orbite, au plus comme la Lune</td></tr>
      <tr><td>Soleil</td><td>{virgule(SEUIL_ARRIVEE_SOLEIL)} UA ({km(SEUIL_ARRIVEE_SOLEIL)} km)</td></tr>
      <tr><td>Point libre</td><td>{SEUIL_ARRIVEE_POINT_KM.toLocaleString('fr-FR')} km</td></tr>
    </tbody>
  </table>
  <p>Arrivée, la fusée se met en orbite et suit l’astre.</p>
  <h3>Retour sur Terre</h3>
  <p>
    La Terre se rejoint par l’ISS : choisir la Terre mène à la station, où la fusée s’amarre à
    {Math.round(AMARRAGE_ISS_KM * 1000)} m du module d’amarrage. Les contrats pour la Terre se remplissent à l’amarrage.
  </p>
  <h3>Approche du Soleil</h3>
  <p>
    À moins de 0,6 UA du Soleil (entre Vénus et Mercure), la lumière éblouit peu à peu le hublot et la vue extérieure. Le bouton FILTRE (au
    coin du hublot ; FILTRE SOLAIRE dans la vue extérieure) pose le filtre : tout s’assombrit, le Soleil n’est plus
    qu’une boule blanche. Le même bouton le retire.
  </p>
</Page>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
  }
  td {
    padding: 2px 4px;
    border-bottom: 1px dotted #1d1916;
  }
  td:first-child {
    font-weight: 700;
    width: 32%;
  }
</style>
