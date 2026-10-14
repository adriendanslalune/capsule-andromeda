<script lang="ts">
  // XV. AN-1 Antenne orientable.
  import { ANTENNE } from '../../../donnees/modules'
  import { UA_KM } from '../../../astro/temps'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const millions = Math.round((ANTENNE.distanceMinTerre * UA_KM) / 1e6)
</script>

<Page {numero} chapitre="XV." titre="AN-1 — ANTENNE ORIENTABLE">
  <svg class="planche" viewBox="0 0 344 150" aria-label="Cadran de l'antenne">
    <circle cx="172" cy="74" r="66" fill="#f8f5ec" stroke="#1d1916" stroke-width="2" />
    {#each Array.from({ length: 36 }, (_, i) => i * 10) as a}
      {@const r = (a * Math.PI) / 180}
      <line x1={172 + Math.cos(r) * (a % 30 === 0 ? 50 : 56)} y1={74 - Math.sin(r) * (a % 30 === 0 ? 50 : 56)} x2={172 + Math.cos(r) * 62} y2={74 - Math.sin(r) * 62} stroke="#1d1916" stroke-width={a % 90 === 0 ? 1.6 : 0.7} />
      {#if a % 90 === 0}<text x={172 + Math.cos(r) * 38} y={78 - Math.sin(r) * 38} text-anchor="middle" font-size="10" font-family="Courier Prime, monospace">{a}</text>{/if}
    {/each}
    <line x1="172" y1="74" x2={172 + Math.cos(0.7) * 46} y2={74 - Math.sin(0.7) * 46} stroke="#1d1916" stroke-width="2.4" stroke-linecap="round" />
    <circle cx="172" cy="74" r="4" fill="#1d1916" />
    <path d="M 252 70 A 10 10 0 0 1 252 78" fill="none" stroke="#1d1916" stroke-width="1" />
    <text x="262" y="78" font-size="9" font-family="Courier Prime, monospace">sens des angles</text>
  </svg>
  <p>
    L’antenne maintient la liaison avec la Terre. Quand elle décroche, le bloc AN-1 passe en avarie : il faut la
    réorienter vers la Terre, dont la direction change au fil du voyage.
  </p>
  <ol>
    <li>Trouver la direction de la Terre vue de la fusée : sur la carte, tracer la ligne de la C-58 vers la Terre et la lire sur le cadran gradué autour de la C-58.</li>
    <li>Si S-3 est en position basse, l’antenne est montée à l’envers : ajouter 180° (retirer 360° si besoin).</li>
    <li>Régler l’orientation (−10, −1, +1, +10), puis presser VERROUILLER. Tolérance : {ANTENNE.tolerance}°.</li>
  </ol>
  <p class="discret">
    0° vers la droite de la carte ; les angles croissent dans le sens inverse des aiguilles d’une montre, comme pour le
    cap. La liaison ne décroche jamais à moins de {String(ANTENNE.distanceMinTerre).replace('.', ',')} UA ({millions} millions de km) de la Terre.
  </p>
</Page>
