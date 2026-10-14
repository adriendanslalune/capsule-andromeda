<script lang="ts">
  // XVII. Recherche du visiteur : saisons, escales, moyens de repérage (données de la chasse).
  import { CHASSE } from '../../../donnees/chasse'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const C = CHASSE
  const virgule = (n: number) => String(n).replace('.', ',')
</script>

<Page {numero} chapitre="XVII." titre="RECHERCHE DU VISITEUR">
  <p>
    Le visiteur ne figure sur aucune carte. Un seul croise le système solaire à la fois, pendant une <b>saison d’un
    mois</b> (du 1er au dernier jour du mois) ; puis un autre lui succède. Tous les commissionnaires chassent le même.
  </p>
  <h3>Ses habitudes</h3>
  <p>
    Chaque saison, il fait une boucle de 3 ou 4 escales (une planète ou l’un de ses satellites), une journée à chacune. Chaque nuit à <b>00:00 UTC</b>, il quitte son escale et file en ligne
    droite vers la suivante, où il arrive à <b>06:00 UTC</b>. Pendant ce voyage, on peut le repérer, mais pas l’approcher.
  </p>
  <h3>Radio — le ping</h3>
  <p>
    Le visiteur ne répond que sur {virgule(C.frequencePing)}. Régler la radio (CARTE, onglet CHASSE), presser PING. L’écho revient au
    rythme de la lumière (aller et retour, depuis la position de l’émission). Un ping toutes les {C.rechargePingMinutes} min.
  </p>
  <p class="attention">distance (UA) = délai de l’écho (minutes) ÷ 16,6</p>
  <p>
    <b>Télescope (TEL).</b> Portée : {C.porteeTelescope} UA. Donne une direction, jamais une distance, à {C.erreurTelescopeDegres}° près, comptée
    comme le cap. Une visée toutes les {C.rechargeTelescopeMinutes} minutes.
  </p>
  <p><b>Détecteur (DET).</b> Signale le visiteur, avec sa distance, à moins de {virgule(C.porteeDetecteur)} UA de la fusée.</p>
  <h3>Observatoire et transmissions</h3>
  <p>
    Toutes les {C.bulletinHeures} heures, l’Observatoire signale le <b>système</b> (la planète) où le visiteur se
    trouvait {C.bulletinHeures} heures plus tôt ; l’astre exact n’est pas donné. Les transmissions interceptées
    (toutes les {C.transmissionHeures} heures) sont des témoignages non vérifiés.
  </p>
</Page>
