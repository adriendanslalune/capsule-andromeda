<script lang="ts">
  // II. Nomenclature du poste de pilotage.
  import { DUREE_ACCELERATION } from '../../../donnees/reglages'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const organes = [
    ['Cadrans', 'Vitesse (km/s) ; cap (flèche rouge : cap ; jaune : destination ; 0° à droite de la carte, sens inverse des aiguilles d’une montre) ; heure d’arrivée. Les toucher : instruments en grand.'],
    ['Interrupteur MOTEUR', `En haut, ON : poussée. En bas, OFF : la fusée s’arrête en ${DUREE_ACCELERATION} s et garde sa destination.`],
    ['Compteur de crédits', 'Solde du commissionnaire. Le toucher ouvre le portefeuille.'],
    ['Manuel', 'Ouvre le présent manuel à l’écran.'],
    ['Intercalaires', 'MISSIONS, LIAISONS, COCKPIT, COMMERCE, ATELIER ; glisser le doigt mène à la page voisine. Pastilles : avaries (rouge), télégrammes (jaune, XVIII).'],
    ['Écran de la caméra', 'L’extérieur, droit devant ; boutons NOMS et FILTRE. Le toucher : vue extérieure.'],
    ['Navigation incrustée', 'Destination, temps restant, arrivée (heure du téléphone) ; frise au bas de l’image.'],
    ['Radio', 'Écran des ondes (le message y défile), boutons GROS et FIN, − et +, ÉMETTRE, haut-parleur (XX).'],
    ['Navigation', 'Radar : destination (blanc), point de rencontre (jaune), écho du visiteur si DET le repère (XVII). Le toucher ouvre la carte.'],
    ['Voyants des blocs', 'Vert : en ordre. Rouge : avarie. Pointillés : non installé. Le toucher ouvre le bloc. Trait PROPULSION : CH-1 et TU-1 (IV).'],
    ['Plaque constructeur', 'Numéro de série de l’appareil (chapitre III).'],
    ['Mission', 'Contrat en cours : destination, prime, distance. Le toucher ouvre MISSIONS, CONTRATS.'],
    ['Transmissions', 'Les 3 derniers messages et les connectés. Le toucher ouvre LIAISONS, COMMUNICATION (XVIII).'],
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
