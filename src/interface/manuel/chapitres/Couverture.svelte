<script lang="ts">
  // Couverture du manuel.
  import Page from '../Page.svelte'
</script>

<Page numero={null}>
  <div class="couverture">
    <div class="cadre">
      <p class="haut">RÉPUBLIQUE FRANÇAISE<br />OFFICE NATIONAL DES VOLS INTERPLANÉTAIRES</p>
      <hr />
      <h1>MANUEL<br />DE VOL</h1>
      <p class="type">Fusée de croisière type C-58</p>
      <p class="sous">Manuel d’entretien et de dépannage<br />à l’usage des commissionnaires de l’Office</p>
      <!-- Profil de la fusée, en dessin technique, avec sa cote. -->
      <svg viewBox="0 0 300 120" class="profil" aria-label="Profil de la fusée C-58">
        <path d="M 40 60 Q 60 44 120 44 L 190 44 Q 240 44 268 60 Q 240 76 190 76 L 120 76 Q 60 76 40 60 Z" fill="none" stroke="#1d1916" stroke-width="1.6" />
        <path d="M 70 48 L 40 22 L 58 22 L 100 46 M 70 72 L 40 98 L 58 98 L 100 74" fill="none" stroke="#1d1916" stroke-width="1.4" stroke-linejoin="round" />
        <path d="M 40 60 L 28 52 L 28 68 Z" fill="none" stroke="#1d1916" stroke-width="1.2" />
        {#each [150, 170, 190] as x}<circle cx={x} cy="60" r="5" fill="none" stroke="#1d1916" stroke-width="1.2" />{/each}
        <line x1="120" y1="44" x2="120" y2="76" stroke="#1d1916" stroke-width="0.7" stroke-dasharray="3 2" />
        <line x1="210" y1="44" x2="210" y2="76" stroke="#1d1916" stroke-width="0.7" stroke-dasharray="3 2" />
        <line x1="10" y1="60" x2="290" y2="60" stroke="#1d1916" stroke-width="0.4" stroke-dasharray="10 3 2 3" />
        <!-- Cote : 30 m. -->
        <line x1="28" y1="110" x2="268" y2="110" stroke="#1d1916" stroke-width="0.7" />
        <path d="M 28 110 l 6 -3 v 6 Z M 268 110 l -6 -3 v 6 Z" fill="#1d1916" />
        <text x="148" y="106" text-anchor="middle" font-size="9" font-family="Courier Prime, monospace">30 m</text>
      </svg>
      <p class="edition">Édition de 1961 — révision en vigueur</p>
      <p class="bas">EXEMPLAIRE DE BORD<br /><small>Ne pas retirer de l’appareil.</small></p>
    </div>
  </div>
</Page>

<style>
  .couverture {
    flex: 1;
    display: flex;
  }
  .cadre {
    flex: 1;
    border: 2px solid #1d1916;
    outline: 1px solid #1d1916;
    outline-offset: -6px;
    padding: 22px 18px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .haut {
    font-family: 'Special Elite', monospace;
    font-size: 11px;
    line-height: 1.5;
  }
  hr {
    width: 50%;
    border: 0;
    border-top: 1px solid #1d1916;
    margin: 2px 0;
  }
  h1 {
    margin: 18px 0 4px;
    font-family: 'Special Elite', monospace;
    font-weight: 400;
    font-size: 40px;
    line-height: 1.05;
  }
  .type {
    font-family: 'Special Elite', monospace;
    font-size: 14px;
  }
  .sous {
    font-size: 11px;
  }
  .profil {
    width: 100%;
    margin: 14px 0;
  }
  .edition {
    font-size: 10px;
  }
  .bas {
    margin-top: auto;
    font-family: 'Special Elite', monospace;
    font-size: 11px;
  }
</style>
