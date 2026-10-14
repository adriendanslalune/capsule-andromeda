<script lang="ts">
  // Un module en plein écran : retour à la fenêtre, renvoi au manuel, commandes du module, avarie suivante.
  import { modulesEnPanne } from '../../moteur/modules'
  import { glisserPourFermer } from '../glisser'
  import { jeu } from '../jeu.svelte'
  import { pageDuChapitre } from '../volets/pages-manuel'
  import Antenne from '../modules/Antenne.svelte'
  import Bricolage from '../modules/Bricolage.svelte'
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

<main class="papier" bind:this={ecran}>
  <Bricolage graine={code} />
  <!-- Tirer depuis le bord gauche, ou par le bandeau du haut, ramène au tableau de bord. -->
  <div class="bord" use:glisserPourFermer={glisser}></div>
  <header use:glisserPourFermer={glisser}>
    <button class="retour bouton" onclick={() => jeu.fermer()}>‹ TABLEAU DE BORD</button>
    <button class="manuel bouton clair" onclick={() => { jeu.pageManuel = pageDuChapitre(FICHES[code].chapitre); jeu.volet = 'manuel' }}>MANUEL · {FICHES[code].chapitre}</button>
  </header>
  <div class="titre panneau">
    {#each affiche as c}<span class="code">{c}</span>{/each}
    <span class="nom">{propulsion ? 'PROPULSION' : FICHES[code].nom}</span>
    {#if avarie}<span class="avarie"><span class="lampe"></span>AVARIE</span>{/if}
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
    <button class="suivante bouton cerise" onclick={() => (jeu.ecran = { nom: 'module', code: autre })}>
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
  }
  header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 14px 0;
  }
  .retour,
  .manuel {
    min-height: 40px;
    padding: 0 13px;
    font-size: 14px;
  }
  .titre {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 14px 14px 0;
    padding: 9px 12px;
  }
  .code {
    padding: 1px 7px;
    border-radius: 4px;
    background: var(--couleur-encre);
    color: var(--couleur-papier);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
  }
  .nom {
    font-family: var(--police-titre);
    font-size: 17px;
    letter-spacing: 0.5px;
    line-height: 1.1;
  }
  .avarie {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 1px 8px;
    border-radius: 4px;
    background: var(--cerise);
    color: var(--couleur-papier);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .lampe {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--couleur-papier);
    animation: clignote 0.8s steps(1) infinite;
  }
  /* Le contenu passe devant le décor. */
  header,
  .titre,
  .contenu,
  .suivante {
    position: relative;
    z-index: 1;
  }
  .suivante {
    position: absolute;
  }
  .contenu {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 96px;
  }
  .suivante {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 22px;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .pastille {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--couleur-encre);
    background: var(--couleur-papier);
    margin-right: 10px;
    animation: clignote 0.8s steps(1) infinite;
  }
</style>
