<script lang="ts">
  // XVIII. Télégrammes : écrire aux autres commissionnaires (quota, destinataires, délai de la lumière).
  import { SECONDES_LUMIERE_PAR_UA } from '../../../astro/lumiere'
  import { TELEGRAMMES } from '../../../donnees/reglages'
  import { PHRASES } from '../../../donnees/telegrammes'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const T = TELEGRAMMES
  const minutes = (ua: number) => Math.round((ua * SECONDES_LUMIERE_PAR_UA) / 60)
</script>

<Page {numero} chapitre="XVIII." titre="TÉLÉGRAMMES">
  <p>
    Le voyant TÉLÉGR., au centre de la barre du haut, s’allume quand un télégramme est arrivé (d’un commissionnaire ou
    de l’Office). Le toucher ouvre le guichet : télégrammes reçus et envoyés, et formulaire de rédaction. Les messages
    de la fusée elle-même s’impriment au journal de bord, pas ici.
  </p>
  <h3>Rédaction</h3>
  <ol>
    <li>Choisir les destinataires : MON SYSTÈME (ceux qui se trouvent dans le même système planétaire), UN JOUEUR (une fusée désignée par son nom), ou TOUT LE SYSTÈME solaire.</li>
    <li>Écrire le texte ({T.longueur} caractères au plus), ou toucher une phrase toute faite, comprise de tous.</li>
    <li>Presser ENVOYER.</li>
  </ol>
  <p>
    <b>{T.parJour} envois gratuits par 24 heures</b> (glissantes : chaque timbre utilisé se libère
    24 heures après son envoi). Hors de tout système planétaire, MON SYSTÈME n’est pas disponible.
  </p>
  <h3>Délai de transmission</h3>
  <p>
    Le télégramme voyage à la vitesse de la lumière depuis le point d’émission : chacun le reçoit à son heure, selon
    sa distance. Autour de la Terre : une seconde environ ; de la Terre à Mars : {minutes(0.37)} à {minutes(2.67)} minutes ;
    jusqu’à Jupiter : plus d’une demi-heure.
  </p>
  <h3>Phrases toutes faites</h3>
  <p class="phrases">{PHRASES.join(' · ')}</p>
  <p class="discret">Les télégrammes reçus restent affichés {T.gardesJours} jours.</p>
</Page>

<style>
  .phrases {
    font-family: 'Courier Prime', monospace;
    font-size: 8.5px;
    line-height: 1.4;
  }
</style>
