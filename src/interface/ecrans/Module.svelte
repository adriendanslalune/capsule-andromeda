<script lang="ts">
  // Un module en plein écran : retour à la fenêtre, renvoi au manuel, commandes du module, avarie suivante.
  import { modulesEnPanne } from '../../moteur/modules'
  import { glisserPourFermer } from '../glisser'
  import { jeu } from '../jeu.svelte'
  import { pageDuChapitre } from '../volets/pages-manuel'
  import Antenne from '../modules/Antenne.svelte'
  import Brassage from '../modules/Brassage.svelte'
  import Chronometre from '../modules/Chronometre.svelte'
  import Codeur from '../modules/Codeur.svelte'
  import Fusibles from '../modules/Fusibles.svelte'
  import Hydraulique from '../modules/Hydraulique.svelte'
  import Lampes from '../modules/Lampes.svelte'
  import Morse from '../modules/Morse.svelte'
  import Propulsion from '../modules/Propulsion.svelte'
  import Recycleur from '../modules/Recycleur.svelte'
  import Sextant from '../modules/Sextant.svelte'

  let { code }: { code: string } = $props()
  let ecran = $state<HTMLElement>()
  const glisser = { sens: 'droite' as const, cible: () => ecran, fermer: () => jeu.fermer() }

  /** Nom du module et chapitre du manuel qui le décrit. */
  const FICHES: Record<string, { nom: string; chapitre: string }> = {
    'CH-1': { nom: 'CHAMBRE DE COMBUSTION', chapitre: 'III' },
    'TU-1': { nom: 'TUYÈRE', chapitre: 'III' },
    'AL-1': { nom: 'FUSIBLES', chapitre: 'VII' },
    'CO-1': { nom: 'CODEUR', chapitre: 'VIII' },
    'PB-1': { nom: 'TABLEAU DE BRASSAGE', chapitre: 'IX' },
    'LP-1': { nom: 'LAMPES À VIDE', chapitre: 'XI' },
    'HY-1': { nom: 'CIRCUIT HYDRAULIQUE', chapitre: 'XII' },
    'RE-1': { nom: 'RECYCLEUR D’AIR', chapitre: 'XIII' },
    'MO-1': { nom: 'MORSE', chapitre: 'XIV' },
    'CR-1': { nom: 'CHRONOMÈTRE DE BORD', chapitre: 'XV' },
    'SX-1': { nom: 'SEXTANT', chapitre: 'XVI' },
    'AN-1': { nom: 'ANTENNE ORIENTABLE', chapitre: 'XVII' },
  }

  const enPanne = $derived(modulesEnPanne(jeu.etat!.modules))
  const propulsion = $derived(code === 'CH-1' || code === 'TU-1')
  const affiche = $derived(propulsion ? ['CH-1', 'TU-1'] : [code])
  const avarie = $derived(affiche.some((c) => enPanne.includes(c)))
  const autre = $derived(enPanne.find((c) => !affiche.includes(c)) ?? null)
</script>

<main bind:this={ecran}>
  <!-- Tirer depuis le bord gauche, ou par le bandeau du haut, ramène au tableau de bord. -->
  <div class="bord" use:glisserPourFermer={glisser}></div>
  <header use:glisserPourFermer={glisser}>
    <button class="retour" onclick={() => jeu.fermer()}>‹ TABLEAU DE BORD</button>
    <button class="manuel" onclick={() => { jeu.pageManuel = pageDuChapitre(FICHES[code].chapitre); jeu.volet = 'manuel' }}>MANUEL · {FICHES[code].chapitre}</button>
  </header>
  <div class="titre">
    {#each affiche as c}<span class="code">{c}</span>{/each}
    <span class="nom">{propulsion ? 'PROPULSION' : FICHES[code].nom}</span>
    {#if avarie}<span class="avarie">AVARIE</span>{/if}
  </div>

  <div class="contenu">
    {#if propulsion}<Propulsion />
    {:else if code === 'AL-1'}<Fusibles />
    {:else if code === 'CO-1'}<Codeur />
    {:else if code === 'PB-1'}<Brassage />
    {:else if code === 'LP-1'}<Lampes />
    {:else if code === 'HY-1'}<Hydraulique />
    {:else if code === 'RE-1'}<Recycleur />
    {:else if code === 'MO-1'}<Morse />
    {:else if code === 'CR-1'}<Chronometre />
    {:else if code === 'AN-1'}<Antenne />
    {:else if code === 'SX-1'}<Sextant />
    {/if}
  </div>

  {#if autre}
    <button class="suivante" onclick={() => (jeu.ecran = { nom: 'module', code: autre })}>
      <span><span class="pastille"></span>Autre avarie : <b>{autre} {FICHES[autre].nom}</b></span><span>›</span>
    </button>
  {/if}
</main>

<style>
  .bord {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 22px;
    z-index: 5;
  }
  main {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
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
    gap: 8px;
    padding: 12px 18px 0;
  }
  .code {
    background: var(--couleur-encre);
    color: var(--couleur-texte);
    padding: 3px 8px;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .nom {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 2px;
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
  .contenu {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 90px;
  }
  .suivante {
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 20px;
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
    box-shadow: 0 0 8px var(--couleur-avarie);
    margin-right: 10px;
  }
</style>
