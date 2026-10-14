<script lang="ts">
  // V (suite). Procédure 3 (défauts simultanés) et généralités sur la conduite du moteur.
  import { DUREE_ACCELERATION } from '../../../donnees/reglages'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
</script>

<Page {numero} chapitre="V." titre="PROCÉDURES DE PROPULSION (SUITE)">
  <h3>Procédure 3 — Défauts simultanés</h3>
  <p>Symptôme : V-1 et V-2 allumés en même temps.</p>
  <ol>
    <li>Appliquer la procédure 1 en entier.</li>
    <li>Seulement ensuite, appliquer la procédure 2.</li>
  </ol>
  <p class="attention">
    Une purge (P) pendant une surchauffe provoque un emballement de tuyère. Le commissionnaire ne doit en aucun cas
    presser P tant que V-1 est allumé.
  </p>

  <h3>Généralités</h3>
  <p>
    Tant qu’un témoin reste allumé, la fusée perd de la vitesse. Une avarie non traitée ne met pas l’appareil en
    danger immédiat, mais retarde l’arrivée.
  </p>
  <p>Le commissionnaire ramène les commandes en position nominale à la fin de chaque procédure.</p>
  <p>
    Le moteur ne change jamais de régime d’un coup : il lui faut {DUREE_ACCELERATION} secondes pour passer de l’arrêt à
    la vitesse de croisière, ou de la croisière à l’arrêt. Il en va de même quand la vitesse de croisière change (avarie,
    levier L-A, amélioration de l’atelier).
  </p>
  <p>
    L’interrupteur MOTEUR permet de s’arrêter en route : la fusée ralentit, s’immobilise et conserve sa destination.
    Elle repart dès que l’interrupteur revient sur ON.
  </p>
  <p>
    La fusée ne traverse jamais un astre : sa route le contourne d’elle-même, au prix d’un léger détour.
  </p>
  <p class="discret">
    Toute modification du régime moteur hors procédure officielle est formellement interdite et engage la
    responsabilité personnelle du commissionnaire.
  </p>
</Page>
