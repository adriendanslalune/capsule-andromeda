<script lang="ts">
  // XIX. Navigation : destinations, distances d'arrivée, amarrage à l'ISS, Soleil et filtre solaire.
  import { UA_KM } from '../../../astro/temps'
  import { AMARRAGE_ISS_KM, ORBITE_RAYONS, SEUIL_ARRIVEE_POINT_KM, SEUIL_ARRIVEE_SOLEIL } from '../../../donnees/reglages'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const km = (ua: number) => Math.round(ua * UA_KM).toLocaleString('fr-FR')
  const virgule = (x: number) => String(x).replace('.', ',')
</script>

<Page {numero} chapitre="XIX." titre="NAVIGATION">
  <p>
    La destination se choisit sur la carte de la page NAVIGATION (ou dans sa liste) : une planète, un satellite, la Lune, le Soleil, un engin, ou un point libre. Le
    voyage suit la vraie position des astres ; la fusée contourne d’elle-même ceux qui sont sur sa route.
  </p>
  <h3>Distances d’arrivée</h3>
  <table>
    <tbody>
      <tr><td>Planète, Lune, satellite</td><td>{ORBITE_RAYONS} rayons de l’astre, depuis son centre (Lune : {(ORBITE_RAYONS * 1737.4).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} km)</td></tr>
      <tr><td>Soleil</td><td>{virgule(SEUIL_ARRIVEE_SOLEIL)} UA ({km(SEUIL_ARRIVEE_SOLEIL)} km)</td></tr>
      <tr><td>Engin</td><td>on s’en approche à trois fois sa taille (25 à 100 m)</td></tr>
      <tr><td>Point libre</td><td>{SEUIL_ARRIVEE_POINT_KM.toLocaleString('fr-FR')} km</td></tr>
    </tbody>
  </table>
  <p>Arrivée, la fusée se met en orbite et suit l’astre.</p>
  <h3>Retour sur Terre</h3>
  <p>
    La Terre se rejoint par l’ISS : choisir la Terre mène à la station, où la fusée s’amarre à
    {Math.round(AMARRAGE_ISS_KM * 1000)} m du module d’amarrage. Les contrats pour la Terre se remplissent à l’amarrage.
  </p>
  <p class="discret">Sur la carte, les losanges blancs sont des engins humains (stations, télescopes, sondes) : on peut s’y rendre comme à un astre.</p>
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
