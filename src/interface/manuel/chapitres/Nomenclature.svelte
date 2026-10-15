<script lang="ts">
  // II. Nomenclature du poste de pilotage.
  import { DUREE_ACCELERATION } from '../../../donnees/reglages'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const organes = [
    ['Compteur de crédits', 'Solde du commissionnaire. Le toucher ouvre le portefeuille.'],
    ['Interrupteur de son', 'Coupe ou rétablit les alarmes et les sons du bord.'],
    ['Manuel', 'Ouvre le présent manuel à l’écran.'],
    ['Onglets', 'NAVIGATION, SOCIAL, COCKPIT, ATELIER, TROPHÉES ; glisser le doigt mène à la page voisine. Pastilles : avaries (rouge), télégrammes (jaune, XVIII).'],
    ['Hublot', 'Vue droit devant ; boutons NOMS et FILTRE. Le toucher : vue extérieure.'],
    ['Écran de navigation', 'Au pied du hublot : destination, temps restant, arrivée (heure du téléphone), frise.'],
    ['Radio', 'Écran des ondes (le message y défile), boutons GROS et FIN, − et +, ÉMETTRE, haut-parleur (XX).'],
    ['Navigation', 'Radar : destination (blanc) et point de rencontre (jaune). Le toucher ouvre NAVIGATION.'],
    ['Cadrans', 'Vitesse (km/s) ; cap (aiguille : cap ; triangle : destination ; 0° à droite de la carte, sens inverse des aiguilles d’une montre) ; heure d’arrivée. Les toucher : instruments en grand.'],
    ['Interrupteur MOTEUR', `ON : poussée. OFF : la fusée s’arrête en ${DUREE_ACCELERATION} s et garde sa destination ; il lui faut ${DUREE_ACCELERATION} s pour reprendre sa vitesse.`],
    ['Voyants des blocs', 'Vert : en ordre. Rouge : avarie. Pointillés : non installé. Le toucher ouvre le bloc. Trait PROPULSION : CH-1 et TU-1 (IV).'],
    ['Plaque constructeur', 'Numéro de série de l’appareil (chapitre III).'],
    ['Mission', 'Contrat en cours : destination, prime, distance. Le toucher ouvre SOCIAL, CONTRATS.'],
    ['Visiteur', 'Radar de la chasse (chapitre XVII), jours de saison. Le toucher ouvre la page NAVIGATION.'],
    ['Transmissions', 'Les 3 derniers messages et les connectés. Le toucher ouvre SOCIAL, COMMUNICATION (XVIII).'],
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
