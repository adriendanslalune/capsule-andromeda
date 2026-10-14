<script lang="ts">
  // II. Nomenclature du poste de pilotage.
  import { DUREE_ACCELERATION } from '../../../donnees/reglages'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const organes = [
    ['Voyant TÉLÉGR.', 'Allumé : télégramme arrivé. Le toucher ouvre le guichet des télégrammes (XVIII).'],
    ['Compteur de crédits', 'Solde du commissionnaire. Le toucher ouvre le portefeuille.'],
    ['Interrupteur de son', 'Coupe ou rétablit les alarmes et les sons du bord.'],
    ['Manuel', 'Ouvre le présent manuel à l’écran.'],
    ['Onglets', 'CARTE, CONTRATS, COCKPIT, ATELIER, TROPHÉES. L’onglet qui ressort est la page affichée ; glisser le doigt mène à la voisine. Pastille rouge : avaries.'],
    ['Hublot', 'Vue droit devant, vers la destination. Le toucher ouvre la vue extérieure.'],
    ['Interrupteur MOTEUR', `ON : poussée. OFF : la fusée s’arrête en ${DUREE_ACCELERATION} s et garde sa destination. Il lui faut ${DUREE_ACCELERATION} s pour reprendre sa vitesse.`],
    ['Tachymètre', 'Vitesse du moment (lucarne, en km/s). Secteur vert : vitesse de croisière. Toucher un cadran le montre en grand.'],
    ['Compas de cap', 'Aiguille : cap. Triangle : direction de la destination. 0° à droite de la carte, sens inverse des aiguilles d’une montre.'],
    ['Horloge d’arrivée', 'Heure prévue de l’arrivée (heure du téléphone). À l’arrêt : heure actuelle.'],
    ['Écran de navigation', 'Destination, temps restant, frise du trajet.'],
    ['Instruments de bord', 'ROUTE : distance parcourue par l’appareil. SOLEIL : distance au Soleil. RADIO TERRE : délai d’un message jusqu’à la Terre. EN LIGNE : commissionnaires connectés (au total, et près de la fusée) ; leurs fusées sont des points de couleur sur la carte.'],
    ['Voyants des blocs', 'Vert : en ordre. Rouge clignotant : avarie. Pointillés : non installé. Le toucher ouvre le bloc. Trait PROPULSION : CH-1 et TU-1 (IV).'],
    ['Plaque constructeur', 'Numéro de série de l’appareil (chapitre III).'],
    ['Radar de chasse', 'État de la recherche du visiteur (chapitre XVII). Le toucher ouvre la carte.'],
    ['Téléscripteur', 'Derniers messages du bord, le plus récent en haut. Le toucher déroule tout le journal.'],
  ]
</script>

<Page {numero} chapitre="II." titre="NOMENCLATURE DU POSTE">
  <ol class="nomenclature">
    {#each organes as [nom, description], i}
      <li><span class="n">{i + 1}</span><b>{nom}.</b> {description}</li>
    {/each}
  </ol>
</Page>

<style>
  .nomenclature {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-size: 8.8px;
    line-height: 1.2;
  }
  .n {
    display: inline-grid;
    place-items: center;
    width: 13px;
    height: 13px;
    margin-right: 5px;
    border: 1px solid #1d1916;
    border-radius: 50%;
    font-size: 8.5px;
    font-weight: 700;
  }
</style>
