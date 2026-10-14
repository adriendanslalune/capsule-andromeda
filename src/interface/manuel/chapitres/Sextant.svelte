<script lang="ts">
  // XIV. SX-1 Sextant : table des étoiles (données du jeu).
  import { ETOILES } from '../../../donnees/etoiles'
  import { SEXTANT } from '../../../donnees/modules'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const signe = (h: number) => (h > 0 ? `+${h}` : `${h}`)
  const premiere = ETOILES[0].nom
  const derniere = ETOILES[ETOILES.length - 1].nom
</script>

<Page {numero} chapitre="XIV." titre="SX-1 — SEXTANT">
  <div class="haut">
    <svg viewBox="0 0 100 100" class="viseur" aria-label="Réticule du sextant">
      <circle cx="50" cy="50" r="46" fill="#f8f5ec" stroke="#1d1916" stroke-width="2" />
      <line x1="50" y1="6" x2="50" y2="94" stroke="#1d1916" stroke-width="0.7" />
      <line x1="6" y1="50" x2="94" y2="50" stroke="#1d1916" stroke-width="0.7" />
      <circle cx="50" cy="50" r="8" fill="none" stroke="#1d1916" stroke-width="1" />
      <circle cx="50" cy="50" r="2" fill="#1d1916" />
    </svg>
    <p>
      Symptôme : le bloc SX-1 affiche le nom d’une étoile de référence (dérive de navigation). Le commissionnaire vise
      l’étoile avec les boutons AZ et HT, puis presse RELEVÉ.
    </p>
  </div>
  <ol>
    <li>Lire le nom de l’étoile affichée.</li>
    <li>Si le dernier chiffre du n° de série est IMPAIR, viser plutôt l’étoile qui la suit dans le tableau (après {derniere} : {premiere}).</li>
    <li>Régler l’azimut et la hauteur du sextant sur les coordonnées du tableau : l’étoile apparaît au centre du réticule.</li>
    <li>Presser RELEVÉ.</li>
  </ol>
  <table class="etoiles">
    <thead><tr><th>N°</th><th>ÉTOILE</th><th>AZIMUT</th><th>HAUTEUR</th></tr></thead>
    <tbody>{#each ETOILES as e, i}<tr><td>{i + 1}</td><td>{e.nom}</td><td>{e.azimut}°</td><td>{signe(e.hauteur)}°</td></tr>{/each}</tbody>
  </table>
  <p class="discret">
    Coordonnées écliptiques réelles. Azimut compté comme le cap ; hauteur positive au-dessus du plan des planètes.
    Tolérance : {String(SEXTANT.tolerance).replace('.', ',')}°.
  </p>
</Page>

<style>
  .haut {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .viseur {
    flex: none;
    width: 70px;
  }
  .etoiles td,
  .etoiles th {
    padding: 0 8px;
    line-height: 1.25;
  }
</style>
