<script lang="ts">
  // XVII (suite). Mode d'emploi de la chasse, pas à pas, avec un exemple chiffré.
  import { CHASSE } from '../../../donnees/chasse'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const C = CHASSE
  const virgule = (n: number) => String(n).replace('.', ',')
</script>

<Page {numero} chapitre="XVII." titre="CHASSE : MODE D’EMPLOI PAS À PAS">
  <ol class="etapes">
    <li><b>Régler la radio.</b> NAVIGATION, onglet CHASSE, ligne RADIO : amener la fréquence sur {virgule(C.frequencePing)} avec les boutons.</li>
    <li>
      <b>Pinger.</b> Presser PING. Le téléscripteur répond « PING ÉMIS SUR {virgule(C.frequencePing)}. ÉCOUTE EN COURS… ». La
      carte retient l’endroit où se trouvait la fusée.
    </li>
    <li>
      <b>Attendre l’écho.</b> Exemple : « ÉCHO REÇU APRÈS 24 MIN 54 S ». Pas d’écho : la fréquence était fausse.
    </li>
    <li><b>Lire la distance.</b> Le calculateur de l’onglet CHASSE l’affiche (24 min 54 s → <b>1,5 UA</b> ; à la main : 24,9 ÷ 16,6).</li>
    <li>
      <b>Tracer le cercle.</b> Presser TRACER sur le calculateur (ou écrire 1,5 dans « rayon (UA) » et presser CERCLE). Le visiteur
      se trouvait quelque part sur ce cercle.
    </li>
    <li>
      <b>Recommencer ailleurs.</b> Se déplacer, attendre {C.rechargePingMinutes} minutes, pinger de nouveau. Deux cercles se
      coupent en deux points ; un troisième lève le doute.
    </li>
    <li>
      <b>Viser (si TEL est installé).</b> Presser TÉLESCOPE : « OBJET VISÉ À 47° ». Écrire 47 dans « angle (°) », presser
      DROITE. Le visiteur est sur cette droite, là où elle croise un cercle.
    </li>
    <li>
      <b>Y aller.</b> Toucher sur la carte l’astre le plus proche du croisement. Arrivé, ouvrir la vue extérieure et
      chercher la soucoupe (page précédente).
    </li>
  </ol>
  <svg class="planche schema" viewBox="0 0 344 154" aria-label="Exemple : deux cercles et une droite">
    <circle cx="110" cy="80" r="46" fill="none" stroke="#1d1916" stroke-width="1.2" stroke-dasharray="5 3" />
    <circle cx="110" cy="80" r="2.5" fill="#1d1916" />
    <text x="62" y="140" font-size="8" font-family="Courier Prime, monospace">ping n° 1 (1,5 UA)</text>
    <circle cx="214" cy="74" r="70" fill="none" stroke="#1d1916" stroke-width="1.2" stroke-dasharray="2 2" />
    <circle cx="214" cy="74" r="2.5" fill="#1d1916" />
    <text x="222" y="78" font-size="8" font-family="Courier Prime, monospace">ping n° 2</text>
    <line x1="330" y1="128" x2="96" y2="30" stroke="#1d1916" stroke-width="1" />
    <text x="286" y="126" font-size="8" font-family="Courier Prime, monospace">visée 47°</text>
    <circle cx="147" cy="53" r="6" fill="none" stroke="#1d1916" stroke-width="2" />
    <text x="120" y="20" font-size="8" font-weight="700" font-family="Courier Prime, monospace">LE VISITEUR</text>
    <line x1="140" y1="23" x2="146" y2="46" stroke="#1d1916" stroke-width="0.7" />
  </svg>
  <p class="discret">
    Le visiteur suit son astre : un tracé ancien vieillit. EFFACER retire tous les tracés. Le bulletin de
    l’Observatoire (toutes les {C.bulletinHeures} h) aide à choisir le système où commencer.
  </p>
</Page>

<style>
  .schema {
    width: 80% !important;
    align-self: center;
  }
  .etapes {
    font-size: 10px;
    line-height: 1.27;
  }
  .etapes li {
    margin: 2px 0;
  }
</style>
