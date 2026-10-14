<script lang="ts">
  // II. Nomenclature du poste de pilotage.
  import { DUREE_ACCELERATION } from '../../../donnees/reglages'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const organes = [
    ['Voyant TÉLÉGR.', 'Allumé : télégramme arrivé. Le toucher ouvre les télégrammes (XVIII).'],
    ['Compteur de crédits', 'Solde du commissionnaire. Le toucher ouvre le portefeuille.'],
    ['Interrupteur de son', 'Coupe ou rétablit les alarmes et les sons du bord.'],
    ['Manuel', 'Ouvre le présent manuel à l’écran.'],
    ['Onglets', 'NAVIGATION, CONTRATS, COCKPIT, ATELIER, TROPHÉES. L’onglet qui ressort est la page affichée ; glisser le doigt mène à la voisine. Pastille rouge : avaries.'],
    ['Hublot', 'Vue droit devant, vers la destination. Le toucher ouvre la vue extérieure.'],
    ['Écran de navigation', 'Destination, temps restant, jour et heure d’arrivée (heure du téléphone), frise du trajet.'],
    ['Cadrans', 'Vitesse (km/s) ; cap (aiguille : cap ; triangle : destination ; 0° à droite de la carte, sens inverse des aiguilles d’une montre) ; heure d’arrivée. Les toucher ouvre les instruments en grand et les relevés (route, Soleil, radio).'],
    ['Interrupteur MOTEUR', `ON : poussée. OFF : la fusée s’arrête en ${DUREE_ACCELERATION} s et garde sa destination ; il lui faut ${DUREE_ACCELERATION} s pour reprendre sa vitesse.`],
    ['Voyants des blocs', 'Vert : en ordre. Rouge clignotant : avarie. Pointillés : non installé. Le toucher ouvre le bloc. Trait PROPULSION : CH-1 et TU-1 (IV).'],
    ['Plaque constructeur', 'Numéro de série de l’appareil (chapitre III).'],
    ['Mission', 'Contrat en cours : destination, prime, distance. Le toucher ouvre les contrats.'],
    ['Visiteur', 'Radar de la chasse (chapitre XVII), jours de saison. Le toucher ouvre la page NAVIGATION.'],
    ['Liaison', 'Commissionnaires en ligne, classement, dernière annonce. Le toucher ouvre la liaison (télégrammes, classement, annonces) ; les autres fusées sont des points de couleur sur la carte.'],
    ['Journal de bord', 'Dernier message du bord. Le toucher déroule tout le journal.'],
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
