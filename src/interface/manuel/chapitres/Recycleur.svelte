<script lang="ts">
  // XI. RE-1 Recycleur d'air (entretien continu).
  import { RECYCLEUR } from '../../../donnees/modules'
  import Page from '../Page.svelte'
  import Bouton from '../schemas/Bouton.svelte'
  import Jauge from '../schemas/Jauge.svelte'
  import Levier from '../schemas/Levier.svelte'
  import Motifs from '../schemas/Motifs.svelte'
  import Plaque from '../schemas/Plaque.svelte'

  let { numero }: { numero: number } = $props()
  const R = RECYCLEUR
</script>

<Page {numero} chapitre="XI." titre="RE-1 — RECYCLEUR D’AIR">
  <svg class="planche" viewBox="0 0 344 132" aria-label="Planche du bloc RE-1">
    <Motifs />
    <rect x="44" y="2" width="256" height="126" rx="6" fill="none" stroke="#1d1916" stroke-width="1.5" />
    <Jauge x={104} y={50} r={38} nom="O2" valeur={R.o2Depart} zones={[[0, R.o2Minimum, 'rouge'], [R.o2ZoneVerteMin, R.o2ZoneVerteMax, 'verte']]} />
    <Jauge x={196} y={50} r={38} nom="CO2" valeur={R.co2Depart} zones={[[R.co2Maximum, 100, 'rouge']]} />
    <Levier x={262} y={52} h={56} />
    <Plaque x={262} y={92} texte="V-C" />
    <Bouton x={150} y={112} r={11} largeur={70} texte="POMPE" />
  </svg>
  <p>
    Le recycleur s’use en permanence, même en l’absence du commissionnaire : l’oxygène (O2) baisse d’un point toutes
    les {R.secondesParPointO2} s, le gaz carbonique (CO2) monte d’un point toutes les {R.secondesParPointCO2} s. Le bloc
    entre en avarie quand O2 passe sous {R.o2Minimum} ou CO2 au-dessus de {R.co2Maximum}.
  </p>
  <ol>
    <li>Ouvrir la vanne de purge V-C (levier en bas). Le CO2 baisse, et un peu d’O2 s’échappe.</li>
    <li>Attendre que le CO2 soit <b>bien</b> sous {R.co2Repare} (vers 35), puis refermer V-C.</li>
    <li>Pomper l’O2 avec POMPE (chaque coup : +{R.pompe}) jusqu’à la zone verte, entre {R.o2ZoneVerteMin} et {R.o2ZoneVerteMax}.</li>
  </ol>
  <p class="attention">ne jamais pomper vanne ouverte. Au-delà de {R.o2ZoneVerteMax}, la soupape lâche et l’O2 retombe à {R.o2ApresSoupape}.</p>
  <p class="discret">
    Refermée trop tôt, la vanne laisse le CO2 repasser {R.co2Repare} pendant que l’on pompe : la réparation échoue. Une
    avarie survenue purge ouverte est une faute de pilotage. Le recycleur ne participe jamais aux cascades. Un entretien
    régulier évite l’avarie.
  </p>
</Page>
