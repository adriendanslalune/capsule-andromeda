<script lang="ts">
  // III. Repères du bord : numéro de série, interrupteurs S-1 à S-4, quand surviennent les avaries.
  import { PANNES } from '../../../donnees/reglages'
  import Page from '../Page.svelte'
  import Levier from '../schemas/Levier.svelte'
  import Plaque from '../schemas/Plaque.svelte'

  let { numero }: { numero: number } = $props()
</script>

<Page {numero} chapitre="III." titre="REPÈRES DU BORD">
  <p>Plusieurs procédures dépendent de l’état du bord. Avant toute intervention, relever les repères suivants.</p>
  <h3>Numéro de série</h3>
  <p>Gravé sur la plaque constructeur, au bas de la console (repère 12). Il est propre à chaque appareil.</p>
  <svg class="planche plaque" viewBox="0 0 344 44" aria-label="Plaque constructeur">
    <rect x="72" y="4" width="200" height="36" fill="none" stroke="#1d1916" stroke-width="1.5" />
    <rect x="76" y="8" width="192" height="28" fill="none" stroke="#1d1916" stroke-width="0.6" />
    <text x="172" y="19" text-anchor="middle" font-size="7.5" font-family="Courier Prime, monospace">O.N.V.I. · FUSÉE DE CROISIÈRE C-58</text>
    <text x="172" y="32" text-anchor="middle" font-size="11" font-weight="700" font-family="Courier Prime, monospace">N° SÉRIE  KE4-71B</text>
  </svg>
  <p>
    « <b>Dernier chiffre</b> » : le dernier chiffre lu dans le numéro (ici 1, donc impair).<br />
    « <b>Commence par une voyelle</b> » : A, E, I, O, U ou Y en première lettre.
  </p>
  <h3>Interrupteurs S-1 à S-4 (bloc AL-1)</h3>
  <svg class="planche petit" viewBox="0 0 344 76" aria-label="Interrupteurs S-1 à S-4">
    {#each [true, true, false, true] as haut, i}
      <Levier x={112 + i * 40} y={32} h={50} {haut} />
      <Plaque x={112 + i * 40} y={68} texte={`S-${i + 1}`} />
    {/each}
  </svg>
  <p>
    Chaque interrupteur est en position HAUTE ou BASSE. S-4 commande l’alimentation des fusibles : en position
    basse, le circuit est coupé. Les autres modifient certaines procédures (voir chaque bloc).
  </p>
  <h3>Avaries</h3>
  <p>
    Les avaries ne surviennent qu’en voyage : jamais en orbite, à l’arrêt, moteur coupé ou en attente d’une fenêtre
    de tir. Environ une par voyage, {PANNES.maxParJour} au plus par 24 heures. Une avarie ne rapporte rien : tant
    qu’elle dure, la fusée avance moins vite. Seules les commissions remplies sont payées par l’Office.
  </p>
</Page>

<style>
  .plaque {
    width: 80%;
    align-self: center;
  }
  .petit {
    width: 70% !important;
    align-self: center;
  }
</style>
