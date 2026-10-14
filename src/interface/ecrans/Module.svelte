<script lang="ts">
  // Un module en plein écran : retour à la fenêtre, renvoi au manuel, commandes du module, avarie suivante.
  // On passe au module voisin en glissant le doigt (à gauche : le suivant, à droite : le précédent) ; leurs noms sont
  // indiqués sur les bords de l'écran.
  import { fly } from 'svelte/transition'
  import { MODULES_A_INSTALLER } from '../../donnees/economie'
  import { estInstalle } from '../../moteur/economie'
  import { modulesEnPanne } from '../../moteur/modules'
  import { glisserPourFermer } from '../glisser'
  import { jeu } from '../jeu.svelte'
  import { CHAPITRE_DU_MODULE, pageDuChapitre } from '../manuel/pages'
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

  /** Nom de chaque module (son chapitre du manuel : manuel/pages.ts). */
  const NOMS: Record<string, string> = {
    'CH-1': 'CHAMBRE DE COMBUSTION',
    'TU-1': 'TUYÈRE',
    'AL-1': 'FUSIBLES',
    'CO-1': 'CODEUR',
    'PB-1': 'TABLEAU DE BRASSAGE',
    'LP-1': 'LAMPES À VIDE',
    'HY-1': 'CIRCUIT HYDRAULIQUE',
    'RE-1': 'RECYCLEUR D’AIR',
    'MO-1': 'MORSE',
    'CR-1': 'CHRONOMÈTRE DE BORD',
    'SX-1': 'SEXTANT',
    'AN-1': 'ANTENNE ORIENTABLE',
  }

  const enPanne = $derived(modulesEnPanne(jeu.etat!.modules))
  const propulsion = $derived(code === 'CH-1' || code === 'TU-1')
  const affiche = $derived(propulsion ? ['CH-1', 'TU-1'] : [code])
  const avarie = $derived(affiche.some((c) => enPanne.includes(c)))
  const autre = $derived(enPanne.find((c) => !affiche.includes(c)) ?? null)

  // Modules installés, dans l'ordre du tableau de bord (CH-1 et TU-1 ne font qu'un écran : la propulsion).
  const ordre = $derived(['CH-1', 'AL-1', ...MODULES_A_INSTALLER.map((m) => m.code)].filter((c) => estInstalle(jeu.etat!, c)))
  const ici = $derived(ordre.indexOf(propulsion ? 'CH-1' : code))
  const precedent = $derived(ici > 0 ? ordre[ici - 1] : null)
  const suivant = $derived(ici >= 0 && ici < ordre.length - 1 ? ordre[ici + 1] : null)
  const nomCourt = (c: string) => (c === 'CH-1' ? 'PROPULSION' : NOMS[c])
  let sens = $state(1)
  function aller(c: string | null, s: number) {
    if (!c) return
    sens = s
    jeu.ecran = { nom: 'module', code: c }
  }
  // Glisser : geste rapide et franchement horizontal, hors du bord gauche (qui ramène au tableau de bord).
  let depart: { x: number; y: number; t: number } | null = null
  function toucher(e: TouchEvent) {
    const cible = e.target as Element
    depart = e.touches.length === 1 && !cible.closest('.bord, header, input, select')
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null
  }
  function lacher(e: TouchEvent) {
    const d = e.changedTouches[0]
    if (!depart || !d) return
    const dx = d.clientX - depart.x, dy = d.clientY - depart.y
    const vite = Date.now() - depart.t < 700
    depart = null
    if (!vite || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6) return
    if (dx < 0) aller(suivant, 1)
    else aller(precedent, -1)
  }
</script>

<main class="papier" bind:this={ecran} ontouchstart={toucher} ontouchend={lacher} ontouchcancel={() => (depart = null)}>
  <Bricolage graine={code} />
  <!-- Tirer depuis le bord gauche, ou par le bandeau du haut, ramène au tableau de bord. -->
  <div class="bord" use:glisserPourFermer={glisser}></div>
  <header use:glisserPourFermer={glisser}>
    <button class="retour bouton" onclick={() => jeu.fermer()}>‹ TABLEAU DE BORD</button>
    <button class="manuel bouton clair" onclick={() => { jeu.pageManuel = pageDuChapitre(CHAPITRE_DU_MODULE[code]); jeu.volet = 'manuel' }}>MANUEL · {CHAPITRE_DU_MODULE[code]}</button>
  </header>
  <div class="titre panneau">
    {#each affiche as c}<span class="code">{c}</span>{/each}
    <span class="nom">{propulsion ? 'PROPULSION' : NOMS[code]}</span>
    {#if avarie}<span class="avarie"><span class="lampe"></span>AVARIE</span>{/if}
  </div>

  <!-- Modules voisins, sur les bords : les toucher y mène aussi. -->
  {#if precedent}<button class="voisin gauche" aria-label={`Module précédent : ${precedent}`} onclick={() => aller(precedent, -1)}><span>‹ {precedent} · {nomCourt(precedent)}</span></button>{/if}
  {#if suivant}<button class="voisin droite" aria-label={`Module suivant : ${suivant}`} onclick={() => aller(suivant, 1)}><span>{suivant} · {nomCourt(suivant)} ›</span></button>{/if}

  {#key code}
  <div class="contenu" in:fly={{ x: sens * 80, duration: 180 }}>
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
  {/key}

  {#if autre}
    <button class="suivante bouton cerise" onclick={() => (jeu.ecran = { nom: 'module', code: autre })}>
      <span><span class="pastille"></span>Autre avarie : <b>{autre} {NOMS[autre]}</b></span><span>›</span>
    </button>
  {/if}
</main>

<style>
  /* Étiquettes des modules voisins, debout sur les bords de l'écran. */
  .voisin {
    position: absolute;
    top: 50%;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    min-width: 0;
    min-height: 0;
    height: 170px;
    padding: 0;
    border: 1.5px solid var(--couleur-encre);
    background: var(--couleur-papier-fonce);
    color: var(--couleur-encre-discrete);
    transform: translateY(-50%);
  }
  .voisin span {
    writing-mode: vertical-rl;
    white-space: nowrap;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .voisin.gauche {
    left: 0;
    border-left: 0;
    border-radius: 0 8px 8px 0;
  }
  .voisin.gauche span {
    transform: rotate(180deg);
  }
  .voisin.droite {
    right: 0;
    border-right: 0;
    border-radius: 8px 0 0 8px;
  }
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
    display: flex;
    flex-direction: column;
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
