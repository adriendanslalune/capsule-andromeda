<script lang="ts">
  // Pupitre du cockpit, à gauche : la radio, complète. Petit écran des ondes (le message reçu y défile en entier),
  // deux boutons à tourner (GROS : 2,00 par tour ; FIN : 0,10 par tour), − et + au centième, la fréquence, ÉMETTRE,
  // et le haut-parleur (on l'allume ou on l'éteint ici ; réglage retenu). Toucher l'écran ouvre le poste en grand.
  import { onMount } from 'svelte'
  import { RADIO } from '../../donnees/radio'
  import { ping, reglerRadioSur } from '../../moteur/chasse'
  import { bornerFrequence, capter } from '../../moteur/radio'
  import { nombre } from '../format'
  import { jeu } from '../jeu.svelte'
  import BoutonRotatif from '../radio/BoutonRotatif.svelte'
  import { dessinerOndes, texteRecu } from '../radio/ondes'
  import { sonRadio } from '../sons'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  let reglage = $state(jeu.etat!.chasse.frequenceRadio)
  let brut = jeu.etat!.chasse.frequenceRadio
  let tourne = $state(false)
  $effect(() => {
    if (!tourne) { reglage = etat.chasse.frequenceRadio; brut = reglage }
  })
  const reception = $derived(capter(etat, t, reglage))
  const barres = $derived(Math.round((reception.emission ? reception.nettete : 0) * 5))
  function changer(ecart: number) {
    tourne = true
    brut = Math.max(RADIO.min, Math.min(RADIO.max, brut + ecart))
    reglage = bornerFrequence(brut)
  }
  function enregistrer() {
    tourne = false
    const e = reglerRadioSur(jeu.etat!, reglage)
    if (e !== jeu.etat) jeu.remplacer(e)
  }
  function pas(ecart: number) {
    reglage = bornerFrequence(reglage + ecart)
    brut = reglage
    enregistrer()
  }
  let emissionDepuis = 0
  const recharge = $derived(Math.max(0, Math.ceil((etat.chasse.radioPrete - t) / 1000)))
  function emettre() {
    enregistrer()
    const r = ping(jeu.etat!, jeu.maintenant)
    jeu.remplacer(r.etat, r.messages)
    emissionDepuis = performance.now()
  }
  let grain = $state(0)
  const texte = $derived.by(() => {
    void grain
    return texteRecu(reception)
  })
  /** Le message défile quand il ne tient pas sur l'écran (vitesse de lecture : environ 6 caractères par seconde). */
  const defile = $derived(texte.length > 26)

  let toile = $state<HTMLCanvasElement>()
  onMount(() => {
    let image = 0
    let dernierGrain = 0
    const c = toile!.getContext('2d')!
    const dessiner = (horloge: number) => {
      image = requestAnimationFrame(dessiner)
      // Quand un volet couvre le cockpit (le poste en grand, par exemple), c'est lui qui dessine et qui parle.
      if (jeu.volet) return
      if (horloge - dernierGrain > 250) { grain++; dernierGrain = horloge }
      const W = (toile!.width = toile!.clientWidth * devicePixelRatio)
      const H = (toile!.height = toile!.clientHeight * devicePixelRatio)
      const son = dessinerOndes(c, W, H, reception, horloge, Math.max(0, 1 - (horloge - emissionDepuis) / 700), 1.5)
      if (jeu.hautParleur && jeu.page === 'cockpit' && jeu.ecran.nom === 'fenetre') sonRadio.regler(son.souffle, son.ton, son.hauteur)
      else sonRadio.couper()
    }
    image = requestAnimationFrame(dessiner)
    return () => {
      cancelAnimationFrame(image)
      sonRadio.couper()
    }
  })
</script>

<div class="instrument radio">
  <button class="ecran" onclick={() => (jeu.volet = 'radio')} aria-label="Ouvrir le poste radio en grand">
    <canvas bind:this={toile} aria-hidden="true"></canvas>
    <span class="haut"><span>RADIO</span><span class="barres" aria-label={`Signal : ${barres} sur 5`}>{#each [1, 2, 3, 4, 5] as b}<i class:allumee={b <= barres} style={`height: ${3 + b * 2}px`}></i>{/each}</span></span>
    <span class="bande"><span class:defile style={defile ? `animation-duration: ${Math.max(6, texte.length / 6)}s` : ''}>{texte || '…'}</span></span>
  </button>
  <div class="rangee">
    <span class="molette"><BoutonRotatif parTour={2} taille={46} label="Réglage grossier" {changer} lacher={enregistrer} /><small>GROS</small></span>
    <span class="molette"><BoutonRotatif parTour={0.1} taille={36} label="Réglage fin" {changer} lacher={enregistrer} /><small>FIN</small></span>
    <button class="emettre" disabled={recharge > 0} onclick={emettre} aria-label="Émettre (ping)">
      {#if recharge > 0}{Math.floor(recharge / 60)}:{String(recharge % 60).padStart(2, '0')}{:else}ÉMET.{/if}
    </button>
  </div>
  <div class="rangee">
    <button class="pas" aria-label="Moins un centième" onclick={() => pas(-0.01)}>−</button>
    <span class="freq">{nombre(reglage, 2)}</span>
    <button class="pas" aria-label="Plus un centième" onclick={() => pas(0.01)}>+</button>
    <button class="hp" class:allume={jeu.hautParleur} aria-pressed={jeu.hautParleur} aria-label="Haut-parleur de la radio"
      onclick={() => jeu.basculerHautParleur()}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" />{#if jeu.hautParleur}<path d="M16 9 Q18 12 16 15 M18.5 7 Q22 12 18.5 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />{:else}<path d="M16 9 L21 15 M21 9 L16 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />{/if}</svg>
    </button>
  </div>
</div>

<style>
  .instrument {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .ecran {
    position: relative;
    height: 74px;
    padding: 0;
    border: 2.5px solid var(--couleur-encre);
    border-radius: 8px;
    overflow: hidden;
    background: #0d1a14;
    box-shadow: 0 0 0 2px #0f1822 inset;
  }
  .ecran::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0 1px, transparent 1px 3px);
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .haut {
    position: absolute;
    top: 3px;
    left: 6px;
    right: 6px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-family: var(--police-machine);
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--menthe);
  }
  .barres {
    display: flex;
    align-items: flex-end;
    gap: 1.5px;
  }
  .barres i {
    width: 4px;
    border: 1px solid var(--menthe);
    opacity: 0.5;
  }
  .barres i.allumee {
    background: var(--menthe);
    opacity: 1;
  }
  .bande {
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 3px;
    overflow: hidden;
    white-space: nowrap;
    font-family: var(--police-machine);
    font-size: 10px;
    color: var(--menthe);
    text-align: left;
    text-shadow: 0 0 4px rgba(143, 207, 152, 0.6), 0 1px 2px #000;
  }
  .bande span {
    display: inline-block;
  }
  /* Le message défile de droite à gauche, comme un bandeau de téléscripteur. */
  .bande .defile {
    padding-left: 100%;
    animation: defiler linear infinite;
  }
  @keyframes defiler {
    to {
      transform: translateX(-100%);
    }
  }
  .rangee {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }
  .molette {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }
  .molette small {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .freq {
    flex: 1;
    min-width: 0;
    padding: 1px 4px;
    border: 2px solid var(--couleur-encre);
    border-radius: 5px;
    background: #0d1a14;
    color: var(--menthe);
    font-family: var(--police-chiffres);
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    text-shadow: 0 0 5px rgba(143, 207, 152, 0.5);
  }
  .pas,
  .hp {
    flex: none;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 2px solid var(--couleur-encre);
    border-radius: 7px;
    background: var(--couleur-papier);
    color: var(--couleur-encre);
    box-shadow: 0 2px 0 var(--couleur-encre);
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
  }
  .hp {
    display: grid;
    place-items: center;
  }
  .hp.allume {
    background: var(--menthe);
  }
  .pas:active,
  .hp:active {
    transform: translateY(2px);
    box-shadow: none;
  }
  .emettre {
    flex: none;
    width: 46px;
    height: 46px;
    border: 2.5px solid var(--couleur-encre);
    border-radius: 50%;
    background: var(--cerise);
    color: var(--couleur-texte-clair);
    box-shadow: 0 3px 0 var(--couleur-encre);
    font-family: var(--police-chiffres);
    font-size: 10px;
    font-weight: 700;
  }
  .emettre:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: none;
  }
  .emettre:disabled {
    background: #6b5a55;
  }
</style>
