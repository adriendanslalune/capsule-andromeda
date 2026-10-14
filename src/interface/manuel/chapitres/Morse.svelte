<script lang="ts">
  // XII. MO-1 Morse : procédure, annuaire des stations et alphabet (données du jeu).
  import { ALPHABET_MORSE, MORSE, STATIONS_MORSE } from '../../../donnees/modules'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const stations = Object.entries(STATIONS_MORSE)
  const lettres = Object.entries(ALPHABET_MORSE)
  const virgule = (n: number) => n.toFixed(2).replace('.', ',')
  const signes = (code: string) => code.replaceAll('.', '•').replaceAll('-', '—')
  const colonnes = [lettres.slice(0, 9), lettres.slice(9, 18), lettres.slice(18)]
</script>

<Page {numero} chapitre="XII." titre="MO-1 — MORSE">
  <p>
    Symptôme : la lampe du bloc MO-1 répète un indicatif en morse, avec le son. Le déchiffrer, trouver la station dans
    l’annuaire, régler la fréquence d’émission au centième (boutons −1, −0,1, −0,01, +0,01, +0,1, +1), puis presser ÉMETTRE.
  </p>
  <p class="discret">
    Un point dure {virgule(MORSE.point)} s, un trait trois points. Trois points de silence séparent deux lettres ;
    l’indicatif reprend après un long silence.
  </p>
  <p class="exception">si S-1 est en position basse, ajouter {virgule(MORSE.correctionS1)} à la fréquence de l’annuaire.</p>
  <h3>Annuaire des stations</h3>
  <table class="annuaire">
    <thead><tr><th>INDICATIF</th><th>FRÉQ.</th><th>INDICATIF</th><th>FRÉQ.</th></tr></thead>
    <tbody>
      {#each stations.slice(0, 5) as [nom, f], i}
        {@const autre = stations[i + 5]}
        <tr><td>{nom}</td><td>{virgule(f)}</td><td>{autre?.[0] ?? ''}</td><td>{autre ? virgule(autre[1]) : ''}</td></tr>
      {/each}
    </tbody>
  </table>
  <h3>Alphabet morse</h3>
  <div class="alphabet">
    {#each colonnes as colonne}
      <table>
        <tbody>{#each colonne as [l, code]}<tr><td class="lettre">{l}</td><td class="code">{signes(code)}</td></tr>{/each}</tbody>
      </table>
    {/each}
  </div>
</Page>

<style>
  .annuaire {
    width: 100%;
  }
  .alphabet {
    display: flex;
    justify-content: space-between;
  }
  .alphabet td {
    border: 0;
    padding: 0 4px;
    font-size: 10.5px;
    line-height: 1.3;
  }
  .lettre {
    font-weight: 700;
  }
  .code {
    letter-spacing: 1px;
  }
</style>
