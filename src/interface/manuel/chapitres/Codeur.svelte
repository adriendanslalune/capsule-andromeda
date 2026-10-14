<script lang="ts">
  // VII. CO-1 Codeur : table des mots de code (données du jeu) et corrections.
  import { MOTS_CODEUR } from '../../../donnees/modules'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const mots = Object.entries(MOTS_CODEUR)
  const moitie = Math.ceil(mots.length / 2)
  const colonnes = [mots.slice(0, moitie), mots.slice(moitie)]
  const chiffres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
</script>

<Page {numero} chapitre="VII." titre="CO-1 — CODEUR">
  <div class="haut">
    <svg viewBox="0 0 120 120" class="disque" aria-label="Cadran à disque du codeur">
      <circle cx="60" cy="60" r="56" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.6" />
      <circle cx="60" cy="60" r="18" fill="none" stroke="#1d1916" stroke-width="1" />
      {#each chiffres as c, i}
        {@const a = ((140 + i * 26) * Math.PI) / 180}
        <circle cx={60 + Math.cos(a) * 40} cy={60 + Math.sin(a) * 40} r="9" fill="#f8f5ec" stroke="#1d1916" stroke-width="1" />
        <text x={60 + Math.cos(a) * 40} y={63 + Math.sin(a) * 40} text-anchor="middle" font-size="8" font-family="Courier Prime, monospace">{c}</text>
      {/each}
    </svg>
    <p>
      Symptôme : un mot de code apparaît sur la bande du codeur, bloc CO-1 en avarie. Le commissionnaire compose la
      réponse (quatre chiffres) sur le cadran à disque, puis presse ÉMETTRE.
    </p>
  </div>
  <div class="tables">
    {#each colonnes as colonne}
      <table>
        <thead><tr><th>MOT</th><th>CODE</th></tr></thead>
        <tbody>{#each colonne as [mot, code]}<tr><td>{mot}</td><td>{code}</td></tr>{/each}</tbody>
      </table>
    {/each}
  </div>
  <h3>Corrections (dans cet ordre)</h3>
  <ol>
    <li>Si le n° de série commence par une voyelle : inverser l’ordre des quatre chiffres.</li>
    <li>Si S-3 est en position basse : ajouter 1 au dernier chiffre (9 devient 0).</li>
  </ol>
  <p class="discret">Le bouton EFFACER remet la saisie à zéro. Un code faux est refusé : recommencer.</p>
</Page>

<style>
  .haut {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .disque {
    flex: none;
    width: 92px;
  }
  .tables {
    display: flex;
    gap: 14px;
    justify-content: center;
  }
  .tables td,
  .tables th {
    padding: 0 8px;
    font-size: 10px;
    line-height: 1.25;
  }
</style>
