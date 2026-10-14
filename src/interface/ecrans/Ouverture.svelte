<script lang="ts">
  // Ouverture (première partie) : lettre de l'Office, baptême de la fusée, « Prendre les commandes ».
  import { CHASSE } from '../../donnees/chasse'
  import { jeu } from '../jeu.svelte'

  let nom = $state('')
  const nomPropre = $derived(nom.trim().replace(/\s+/g, ' '))
</script>

<main>
  <article class="lettre">
    <p class="office">Office national des vols interplanétaires</p>
    <p>Commissionnaire,</p>
    <p>
      L’Office vous confie la fusée de croisière <b>C-58</b>. Elle est vieille, lente, et elle tombe en panne.
    </p>
    <ol>
      <li><b>Réparez.</b> Chaque avarie réparée est payée. Le manuel de vol est votre seul guide.</li>
      <li><b>Améliorez.</b> Les crédits rendent la fusée plus rapide. Le système solaire est immense.</li>
      <li>
        <b>Ouvrez l’œil.</b> Quelque chose rôde entre les planètes. Le premier qui le photographie entre dans
        l’histoire.
      </li>
    </ol>
    <p>Bon vol.</p>
  </article>

  <form
    class="bapteme"
    onsubmit={(e) => {
      e.preventDefault()
      if (nomPropre) jeu.nouvellePartie(nomPropre)
    }}
  >
    <label for="nom">Baptisez votre fusée</label>
    <input
      id="nom"
      bind:value={nom}
      maxlength={CHASSE.longueurNomFusee}
      autocomplete="off"
      placeholder="Par exemple : La Pie voleuse"
    />
    <button type="submit" disabled={!nomPropre}>PRENDRE LES COMMANDES</button>
  </form>
</main>

<style>
  main {
    height: 100%;
    overflow-y: auto;
    padding: 28px var(--espace) 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .lettre {
    background: var(--couleur-papier);
    color: var(--couleur-encre);
    border-radius: 4px;
    padding: 22px 20px;
    font-size: 18px;
    line-height: 1.35;
  }
  .office {
    margin-top: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-bottom: 2px solid var(--couleur-encre);
    padding-bottom: 8px;
  }
  ol {
    padding-left: 20px;
  }
  li {
    margin-bottom: 8px;
  }
  .bapteme {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  label {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--couleur-texte-discret);
  }
  input {
    height: 52px;
    border-radius: var(--rayon);
    border: 1px solid var(--couleur-bordure-forte);
    background: var(--couleur-surface);
    color: var(--couleur-texte);
    font: inherit;
    font-size: 20px;
    padding: 0 14px;
  }
  button {
    height: 56px;
    border: 0;
    border-radius: var(--rayon-grand);
    background: var(--couleur-texte);
    color: var(--couleur-encre);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 2px;
  }
  button:disabled {
    opacity: 0.4;
  }
</style>
