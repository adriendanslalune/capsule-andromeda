<script lang="ts">
  // IV. Bloc propulsion (CH-1 chambre de combustion, TU-1 tuyère) : planche, nomenclature, positions nominales.
  import { PROPULSION } from '../../../donnees/modules'
  import Page from '../Page.svelte'
  import Bouton from '../schemas/Bouton.svelte'
  import Jauge from '../schemas/Jauge.svelte'
  import Levier from '../schemas/Levier.svelte'
  import Motifs from '../schemas/Motifs.svelte'
  import Plaque from '../schemas/Plaque.svelte'
  import Repere from '../schemas/Repere.svelte'
  import Voyant from '../schemas/Voyant.svelte'

  let { numero }: { numero: number } = $props()
</script>

<Page {numero} chapitre="IV." titre="BLOC PROPULSION — CH-1, TU-1">
  <svg class="planche reduite" viewBox="0 0 344 230" aria-label="Planche du bloc propulsion">
    <Motifs />
    <rect x="40" y="4" width="264" height="222" rx="8" fill="none" stroke="#1d1916" stroke-width="1.5" />
    <Jauge x={118} y={60} r={42} nom="M-1" zones={[[0, 15, 'bleue'], [90, 100, 'rouge']]} />
    <Jauge x={226} y={60} r={42} nom="T-2" zones={[[60, 100, 'rouge']]} valeur={45} />
    <Plaque x={118} y={112} texte="M-1" />
    <Plaque x={226} y={112} texte="T-2" />
    <Voyant x={150} y={134} />
    <Voyant x={194} y={134} />
    <Plaque x={150} y={152} texte="V-1" />
    <Plaque x={194} y={152} texte="V-2" />
    <Levier x={74} y={184} h={60} />
    <Plaque x={74} y={219} texte="L-A" />
    <circle cx="140" cy="188" r="22" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.6" stroke-dasharray="2 1.5" />
    <circle cx="140" cy="188" r="13" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.2" />
    <text x="140" y="192" text-anchor="middle" font-size="11" font-weight="700" font-family="Courier Prime, monospace">5</text>
    <Plaque x={140} y={219} texte="R" />
    <Bouton x={204} y={188} r={19} texte="P" />
    <Plaque x={204} y={219} texte="P" />
    <Levier x={270} y={184} h={60} />
    <Plaque x={270} y={219} texte="L-B" />

    <Repere x={84} y={40} tx={20} ty={40} n={1} />
    <Repere x={260} y={40} tx={324} ty={40} n={2} />
    <Repere x={142} y={134} tx={20} ty={134} n={3} />
    <Repere x={202} y={134} tx={324} ty={134} n={4} />
    <Repere x={66} y={170} tx={20} ty={170} n={5} />
    <Repere x={130} y={170} tx={110} ty={150} n={6} />
    <Repere x={218} y={176} tx={240} ty={150} n={7} />
    <Repere x={278} y={170} tx={324} ty={170} n={8} />
  </svg>
  <ol class="legende">
    <li><b>M-1 Manomètre de chambre.</b> Pression dans la chambre de combustion (CH-1). Zone bleue : sous-pression. Zone rouge : surpression.</li>
    <li><b>T-2 Thermomètre de tuyère.</b> Température de la tuyère (TU-1). Zone rouge : surchauffe.</li>
    <li><b>V-1 Témoin de surchauffe.</b> Allumé fixe : procédure 1.</li>
    <li><b>V-2 Témoin de pression.</b> Clignotant, avec alarme : procédure 2.</li>
    <li><b>L-A Levier d’injection.</b> Haut : injection ouverte. Bas : injection coupée, la vitesse chute fortement.</li>
    <li><b>R Molette de mélange.</b> Dix crans, de 0 à 9. Chaque pression avance d’un cran ; après 9 vient 0. Plus le cran est élevé, plus la pression monte.</li>
    <li><b>P Bouton de purge.</b> Libère la pression de chambre. Uniquement dans le cadre d’une procédure.</li>
    <li><b>L-B Levier de dérivation auxiliaire.</b> Réservé à la maintenance au sol. Ne jamais manœuvrer en vol.</li>
  </ol>
  <p><b>Positions nominales en croisière :</b> L-A haut, L-B haut, R sur {PROPULSION.moletteDepart}. M-1 vers {PROPULSION.pressionNominale}, T-2 vers {PROPULSION.temperatureNominale}. Témoins éteints.</p>
</Page>

<style>
  .reduite {
    width: 90% !important;
    align-self: center;
  }
  .legende {
    font-size: 9.5px;
    line-height: 1.25;
    padding-left: 18px;
  }
</style>
