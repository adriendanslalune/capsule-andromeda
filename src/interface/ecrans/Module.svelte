<script lang="ts">
  // Un module en plein écran. Les écrans de chaque module arrivent à l'étape suivante.
  import { modulesEnPanne } from '../../moteur/modules'
  import { jeu } from '../jeu.svelte'

  let { code }: { code: string } = $props()
  const enPanne = $derived(modulesEnPanne(jeu.etat!.modules))
  const autre = $derived(enPanne.find((c) => c !== code) ?? null)
</script>

<main>
  <header>
    <button class="retour" onclick={() => (jeu.ecran = { nom: 'fenetre' })}>‹ FENÊTRE</button>
    <button class="manuel" onclick={() => (jeu.volet = 'manuel')}>MANUEL</button>
  </header>
  <div class="titre">
    <span class="code">{code}</span>
    {#if enPanne.includes(code)}<span class="avarie">AVARIE</span>{/if}
  </div>
  <p class="bientot">Ce module arrive à la prochaine étape.</p>
  {#if autre}
    <button class="suivante" onclick={() => (jeu.ecran = { nom: 'module', code: autre })}>
      <span><span class="pastille"></span>Autre avarie : <b>{autre}</b></span><span>›</span>
    </button>
  {/if}
</main>

<style>
  main {
    position: relative;
    height: 100%;
    background: var(--couleur-papier-fonce);
    color: var(--couleur-encre);
  }
  header {
    display: flex;
    justify-content: space-between;
    padding: 14px 14px 0;
  }
  .retour {
    height: 40px;
    padding: 0 14px;
    border-radius: 20px;
    border: 0;
    background: var(--couleur-encre);
    color: var(--couleur-texte);
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .manuel {
    height: 40px;
    padding: 0 14px;
    border-radius: 20px;
    border: 2px solid var(--couleur-encre);
    background: none;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .titre {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px 0;
  }
  .code {
    background: var(--couleur-encre);
    color: var(--couleur-texte);
    padding: 3px 8px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .avarie {
    margin-left: auto;
    background: var(--couleur-avarie);
    color: var(--couleur-papier);
    padding: 3px 9px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    animation: clignote 0.8s steps(1) infinite;
  }
  .bientot {
    padding: 40px 18px;
    font-size: 18px;
  }
  .suivante {
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 24px;
    height: 52px;
    border-radius: 14px;
    border: 0;
    background: var(--couleur-encre);
    color: var(--couleur-texte);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    font-size: 15px;
  }
  .pastille {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--couleur-avarie);
    margin-right: 10px;
  }
</style>
