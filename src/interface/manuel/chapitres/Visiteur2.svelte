<script lang="ts">
  // XVII (suite). Traçage sur la carte, approche et photographie du visiteur.
  import { CHASSE } from '../../../donnees/chasse'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const C = CHASSE
  const km = (n: number) => n.toLocaleString('fr-FR')
</script>

<Page {numero} chapitre="XVII." titre="RECHERCHE DU VISITEUR (SUITE)">
  <h3>Traçage</h3>
  <p>
    Sur la carte, le bouton TRACÉS DE CHASSE donne accès au traçage : un cercle autour du point du dernier ping (rayon
    en UA), une droite depuis le point de la dernière visée (angle en degrés). Le visiteur se trouve à leur croisement.
  </p>
  <svg class="planche" viewBox="0 0 344 120" aria-label="Exemple de traçage">
    <circle cx="140" cy="62" r="48" fill="none" stroke="#1d1916" stroke-width="1.2" stroke-dasharray="5 3" />
    <circle cx="140" cy="62" r="2.5" fill="#1d1916" />
    <text x="146" y="66" font-size="8" font-family="Courier Prime, monospace">ping</text>
    <line x1="290" y1="110" x2="160" y2="10" stroke="#1d1916" stroke-width="1.2" stroke-dasharray="5 3" />
    <circle cx="290" cy="110" r="2.5" fill="#1d1916" />
    <text x="254" y="114" font-size="8" font-family="Courier Prime, monospace">visée</text>
    <circle cx="183" cy="28" r="6" fill="none" stroke="#1d1916" stroke-width="1.6" />
    <text x="194" y="24" font-size="8" font-weight="700" font-family="Courier Prime, monospace">ici</text>
  </svg>
  <h3>Approche et photographie</h3>
  <ol>
    <li>Se rendre à l’escale supposée du visiteur.</li>
    <li>
      Ouvrir la vue extérieure (toucher le hublot) et le chercher à l’œil : une soucoupe des années 50, ou sa lueur au
      loin. On ne peut la toucher qu’à moins de {km(C.distanceReperageKm)} km.
    </li>
    <li>La toucher : la fusée l’approche à environ {Math.round(C.distanceApprocheKm * 1000)} m, puis reste à côté d’elle tant qu’elle ne change pas d’escale.</li>
    <li>Presser PHOTO. La photographie n’est valable qu’à moins de {Math.round(C.distancePhotoKm * 1000)} m.</li>
  </ol>
  <p>
    La photographie est transmise à l’Office, qui verse {C.primeTrouvaille} CR. Chaque commissionnaire peut trouver le
    visiteur une fois par saison.
  </p>
  <p class="discret">Si le visiteur change d’escale pendant l’approche, celle-ci est abandonnée : la fusée s’arrête où elle se trouve.</p>
</Page>
