<script lang="ts">
  // II. Nomenclature du poste de pilotage.
  import { DUREE_ACCELERATION } from '../../../donnees/reglages'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const organes = [
    ['Compteur de crédits', 'Solde du commissionnaire. Le toucher ouvre le portefeuille.'],
    ['Interrupteur de son', 'Coupe ou rétablit les alarmes et les sons du bord.'],
    ['Hublot', 'Vue droit devant, depuis le poste. Le toucher ouvre la vue extérieure de l’appareil.'],
    ['Liaison', 'Au bas du hublot : commissionnaires en vol, au total et près de la fusée.'],
    ['Interrupteur MOTEUR', `ON : poussée. OFF : la fusée s’arrête en ${DUREE_ACCELERATION} s et garde sa destination. Il lui faut ${DUREE_ACCELERATION} s pour reprendre sa vitesse.`],
    ['Tachymètre', 'Vitesse du moment, en km/s. Le secteur repéré indique la vitesse de croisière.'],
    ['Compas de cap', 'Aiguille : cap de la fusée. Triangle : direction de la destination. 0° à droite de la carte, sens inverse des aiguilles d’une montre.'],
    ['Horloge d’arrivée', 'Heure prévue de l’arrivée (heure du téléphone). À l’arrêt : heure actuelle.'],
    ['Écran de navigation', 'Destination, temps restant à la seconde, frise du trajet (départ et arrivée).'],
    ['Voyants des blocs', 'Vert : en ordre. Rouge clignotant : avarie. Pointillés : non installé. Le toucher ouvre le bloc.'],
    ['Lien PROPULSION', 'CH-1 et TU-1 forment le bloc propulsion (IV).'],
    ['Plaque constructeur', 'Numéro de série de l’appareil (chapitre III).'],
    ['Radar de chasse', 'État de la recherche du visiteur (chapitre XVII). Le toucher ouvre la carte.'],
    ['Téléscripteur', 'Derniers messages du bord et de l’Office.'],
    ['Boutons du bas', 'CARTE, CONTRATS, ATELIER, TROPHÉES, MANUEL.'],
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
    font-size: 9.5px;
    line-height: 1.25;
  }
  .n {
    display: inline-grid;
    place-items: center;
    width: 15px;
    height: 15px;
    margin-right: 5px;
    border: 1px solid #1d1916;
    border-radius: 50%;
    font-size: 8.5px;
    font-weight: 700;
  }
</style>
