<script lang="ts">
  // Ouverture (première partie) : couverture façon magazine pulp, lettre de l'Office tapée à la machine,
  // baptême de la fusée, « Prendre les commandes ».
  import { CHASSE } from '../../donnees/chasse'
  import { jeu } from '../jeu.svelte'

  let nom = $state('')
  const nomPropre = $derived(nom.trim().replace(/\s+/g, ' '))
</script>

<main>
  <header class="couverture rayons">
    <p class="presente">L’Office national des vols interplanétaires présente</p>
    <h1 class="titre-pulp">MANUEL<br />DE VOL</h1>
    <!-- Une fusée qui file entre les planètes. -->
    <svg class="scene" viewBox="0 0 360 150" aria-hidden="true">
      <circle cx="300" cy="40" r="26" fill="#f2b33d" stroke="#22160f" stroke-width="3" />
      <ellipse cx="300" cy="40" rx="44" ry="9" fill="none" stroke="#22160f" stroke-width="3" transform="rotate(-15 300 40)" />
      <circle cx="40" cy="118" r="14" fill="#7fc4c8" stroke="#22160f" stroke-width="3" />
      <path d="M 20 140 Q 120 120 210 70" fill="none" stroke="#2a1e17" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" />
      <g transform="translate(225 62) rotate(-28)">
        <path d="M -52 0 L -78 -10 L -70 0 L -78 10 Z" fill="#ffb04a" />
        <path d="M -40 -12 Q 10 -14 40 0 Q 10 14 -40 12 Z" fill="#f4e6c3" stroke="#22160f" stroke-width="3" />
        <path d="M 22 -7 Q 34 -3 40 0 Q 34 3 22 7 Z" fill="#d93a2b" stroke="#22160f" stroke-width="2.5" />
        <path d="M -30 -11 L -50 -28 L -40 -11 Z M -30 11 L -50 28 L -40 11 Z" fill="#d93a2b" stroke="#22160f" stroke-width="2.5" />
        <circle cx="4" cy="0" r="5" fill="#7fc4c8" stroke="#c9a14a" stroke-width="2.5" />
      </g>
    </svg>
    <span class="macaron">C-58</span>
  </header>

  <article class="lettre panneau">
    <p class="entete">OFFICE NATIONAL DES VOLS INTERPLANÉTAIRES<br /><small>Service des commissions</small></p>
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
    <span class="tampon" aria-hidden="true">O.N.V.I.<br />OFFICIEL</span>
  </article>

  <form
    class="bapteme panneau"
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
    <button class="bouton cerise" type="submit" disabled={!nomPropre}>PRENDRE LES COMMANDES</button>
  </form>
</main>

<style>
  main {
    height: 100%;
    overflow-y: auto;
    padding: 0 0 28px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* Couverture. */
  .couverture {
    position: relative;
    padding: 22px var(--espace) 0;
    text-align: center;
    border-bottom: 3px solid var(--couleur-encre);
  }
  .presente {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--couleur-encre);
  }
  h1 {
    margin: 10px 0 0;
    font-size: 58px;
    line-height: 0.95;
    transform: rotate(-3deg);
  }
  .scene {
    display: block;
    width: 100%;
    margin-top: -4px;
  }
  .macaron {
    position: absolute;
    left: 16px;
    top: 150px;
    display: grid;
    place-items: center;
    width: 70px;
    height: 70px;
    font-family: var(--police-titre);
    font-size: 17px;
    color: var(--couleur-encre);
    background: var(--moutarde);
    /* Étoile à 16 branches. */
    border: var(--trait) solid var(--couleur-encre);
    clip-path: polygon(50% 0, 59% 15%, 75% 7%, 77% 25%, 93% 25%, 87% 41%, 100% 50%, 87% 59%, 93% 75%, 77% 75%, 75% 93%, 59% 85%, 50% 100%, 41% 85%, 25% 93%, 23% 75%, 7% 75%, 13% 59%, 0 50%, 13% 41%, 7% 25%, 23% 25%, 25% 7%, 41% 15%);
    transform: rotate(12deg);
  }

  /* Lettre tapée à la machine. */
  .lettre {
    position: relative;
    margin: 0 var(--espace);
    padding: 20px 18px;
    border-radius: 2px;
    font-family: var(--police-machine);
    font-size: 16px;
    line-height: 1.45;
    transform: rotate(0.6deg);
  }
  .entete {
    margin-top: 0;
    font-family: var(--police-texte);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2px;
    border-bottom: 3px double var(--couleur-encre);
    padding-bottom: 8px;
  }
  .entete small {
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--couleur-encre-discrete);
  }
  ol {
    padding-left: 20px;
  }
  li {
    margin-bottom: 8px;
  }
  .tampon {
    position: absolute;
    right: 16px;
    bottom: 14px;
    padding: 6px 10px;
    border: 3px solid rgba(201, 44, 32, 0.75);
    border-radius: 6px;
    color: rgba(201, 44, 32, 0.75);
    font-family: var(--police-titre);
    font-size: 13px;
    line-height: 1.1;
    text-align: center;
    transform: rotate(-12deg);
  }

  /* Baptême. */
  .bapteme {
    margin: 0 var(--espace);
    padding: 16px;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  label {
    align-self: flex-start;
    padding: 2px 8px 1px;
    border-radius: 2px;
    background: var(--couleur-encre);
    color: var(--couleur-papier);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  input {
    height: 54px;
    border-radius: 8px;
    border: var(--trait) solid var(--couleur-encre);
    background: #fffaf0;
    color: var(--couleur-encre);
    font-family: var(--police-script);
    font-size: 24px;
    padding: 0 14px;
  }
  input::placeholder {
    color: rgba(34, 22, 15, 0.35);
  }
  button {
    height: 58px;
    font-family: var(--police-titre);
    font-size: 17px;
    letter-spacing: 1px;
  }
  button:disabled {
    filter: saturate(0.3) brightness(0.8);
  }
</style>
