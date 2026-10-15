<script lang="ts">
  // POSTE RADIO : l'écran des ondes (souffle, porteuse, bips, morse…), le cadran gradué de 0 à 12 avec son aiguille,
  // deux boutons à tourner au doigt (GROS : 2,00 par tour ; FIN : 0,10 par tour) et le bouton ÉMETTRE (ping de
  // chasse). Le poste ne nomme jamais ce qu'il capte : la table des fréquences est dans le manuel.
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

  // Réglage en direct pendant qu'on tourne un bouton ; enregistré quand on lâche.
  let reglage = $state(jeu.etat!.chasse.frequenceRadio)
  let brut = jeu.etat!.chasse.frequenceRadio
  let tourne = $state(false)
  $effect(() => {
    if (!tourne) { reglage = etat.chasse.frequenceRadio; brut = reglage }
  })
  const reception = $derived(capter(etat, t, reglage))
  function enregistrer() {
    tourne = false
    const e = reglerRadioSur(jeu.etat!, reglage)
    if (e !== jeu.etat) jeu.remplacer(e)
  }
  function changer(ecart: number) {
    tourne = true
    brut = Math.max(RADIO.min, Math.min(RADIO.max, brut + ecart))
    reglage = bornerFrequence(brut)
  }
  function pas(ecart: number) {
    reglage = bornerFrequence(reglage + ecart)
    brut = reglage
    enregistrer()
  }

  // ÉMETTRE : le ping (sur la fréquence du visiteur, il revient en écho).
  let emissionDepuis = 0
  const recharge = $derived(Math.max(0, Math.ceil((etat.chasse.radioPrete - t) / 1000)))
  function emettre() {
    enregistrer()
    const r = ping(jeu.etat!, jeu.maintenant)
    jeu.remplacer(r.etat, r.messages)
    emissionDepuis = performance.now()
  }

  // Ce qui s'entend, en clair (net) ou mangé par le souffle (brouillé) ; le brouillage change 4 fois par seconde.
  let grain = $state(0)
  const texte = $derived.by(() => {
    void grain
    return texteRecu(reception)
  })

  // Écran des ondes et haut-parleur, à chaque image.
  let toile = $state<HTMLCanvasElement>()
  onMount(() => {
    let image = 0
    let dernierGrain = 0
    const c = toile!.getContext('2d')!
    const dessiner = (horloge: number) => {
      image = requestAnimationFrame(dessiner)
      if (horloge - dernierGrain > 250) { grain++; dernierGrain = horloge }
      const W = (toile!.width = toile!.clientWidth * devicePixelRatio)
      const H = (toile!.height = toile!.clientHeight * devicePixelRatio)
      const son = dessinerOndes(c, W, H, reception, horloge, Math.max(0, 1 - (horloge - emissionDepuis) / 700))
      sonRadio.regler(son.souffle, son.ton, son.hauteur)
    }
    image = requestAnimationFrame(dessiner)
    return () => {
      cancelAnimationFrame(image)
      sonRadio.couper()
    }
  })

  // Cadran : graduations tous les 0,1, chiffres tous les 1.
  const GRADUATIONS = Array.from({ length: 121 }, (_, i) => i / 10)
  const xCadran = (f: number) => 10 + (f / RADIO.max) * 280
  const barres = $derived(Math.round((reception.emission ? reception.nettete : 0) * 5))
</script>

<div class="radio">
  <div class="poste">
    <div class="ecran">
      <canvas bind:this={toile} aria-label="Écran des ondes"></canvas>
      <div class="mesure" aria-label={`Signal : ${barres} sur 5`}>
        <span>SIGNAL</span>
        {#each [1, 2, 3, 4, 5] as b}<i class:allumee={b <= barres}></i>{/each}
      </div>
    </div>
    <p class="bande" aria-live="polite">{texte || '…'}</p>

    <!-- Cadran gradué et aiguille. -->
    <div class="cadran">
      <svg viewBox="0 0 300 54" aria-hidden="true">
        {#each GRADUATIONS as g, i}
          <line x1={xCadran(g)} x2={xCadran(g)} y1={i % 10 === 0 ? 8 : i % 5 === 0 ? 13 : 16} y2="24" stroke="currentColor" stroke-width={i % 10 === 0 ? 1.4 : 0.7} />
          {#if i % 10 === 0}<text x={xCadran(g)} y="38" text-anchor="middle" font-size="10">{g}</text>{/if}
        {/each}
        <line class="aiguille" x1={xCadran(reglage)} x2={xCadran(reglage)} y1="2" y2="50" />
      </svg>
      <span class="affichage">{nombre(reglage, 2)}</span>
    </div>

    <div class="commandes">
      <div class="molette">
        <BoutonRotatif parTour={2} taille={84} label="Réglage grossier" {changer} lacher={enregistrer} />
        <small>GROS</small>
      </div>
      <div class="molette">
        <BoutonRotatif parTour={0.1} taille={64} label="Réglage fin" {changer} lacher={enregistrer} />
        <small>FIN</small>
        <span class="pas">
          <button aria-label="Moins un centième" onclick={() => pas(-0.01)}>−</button>
          <button aria-label="Plus un centième" onclick={() => pas(0.01)}>+</button>
        </span>
      </div>
      <div class="molette">
        <button class="emettre" disabled={recharge > 0} onclick={emettre}>
          {#if recharge > 0}{Math.floor(recharge / 60)}:{String(recharge % 60).padStart(2, '0')}{:else}ÉMETTRE{/if}
        </button>
        <small>{recharge > 0 ? 'RECHARGE' : 'ÉMISSION'}</small>
      </div>
    </div>
    <div class="plaque">POSTE RADIO R-12 · O.N.V.I. · 0 — 12</div>
  </div>
</div>

<style>
  .radio {
    flex: 1;
    overflow-y: auto;
    padding: 10px 16px 24px;
  }
  .poste {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 3px solid var(--couleur-encre);
    border-radius: 14px;
    background: var(--couleur-bandeau);
    box-shadow: 4px 4px 0 var(--couleur-encre);
    color: var(--couleur-texte-clair);
  }
  .ecran {
    position: relative;
    height: 150px;
    border: 3px solid var(--couleur-encre);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 0 0 3px #0f1822 inset;
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
  .mesure {
    position: absolute;
    top: 6px;
    right: 8px;
    display: flex;
    align-items: flex-end;
    gap: 2px;
    font-family: var(--police-machine);
    font-size: 9px;
    color: var(--menthe);
  }
  .mesure span {
    margin-right: 4px;
  }
  .mesure i {
    width: 5px;
    height: 10px;
    border: 1px solid var(--menthe);
    opacity: 0.6;
  }
  .mesure i.allumee {
    background: var(--menthe);
    opacity: 1;
  }
  .bande {
    min-height: 44px;
    margin: 0;
    padding: 6px 10px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: #0d1a14;
    color: var(--menthe);
    font-family: var(--police-machine);
    font-size: 12.5px;
    line-height: 1.35;
    text-shadow: 0 0 5px rgba(143, 207, 152, 0.5);
    word-break: break-word;
  }
  .cadran {
    position: relative;
    padding: 4px 6px 2px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--couleur-papier);
    color: var(--couleur-encre);
    font-family: var(--police-chiffres);
  }
  .cadran svg {
    display: block;
    width: 100%;
  }
  .aiguille {
    stroke: var(--cerise);
    stroke-width: 2.5;
  }
  .affichage {
    position: absolute;
    right: 8px;
    bottom: 2px;
    font-size: 15px;
    font-weight: 700;
  }
  .commandes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: start;
    gap: 8px;
  }
  .molette {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .molette small {
    font-family: var(--police-chiffres);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .pas {
    display: flex;
    gap: 6px;
  }
  .pas button {
    width: 44px;
    height: 44px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--couleur-papier);
    color: var(--couleur-encre);
    box-shadow: 0 3px 0 var(--couleur-encre);
    font-size: 20px;
    font-weight: 700;
  }
  .emettre {
    width: 84px;
    height: 84px;
    border: 3px solid var(--couleur-encre);
    border-radius: 50%;
    background: var(--cerise);
    color: var(--couleur-texte-clair);
    box-shadow: 0 5px 0 var(--couleur-encre);
    font-family: var(--police-chiffres);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .emettre:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: 0 1px 0 var(--couleur-encre);
  }
  .emettre:disabled {
    background: #6b5a55;
  }
  .plaque {
    align-self: center;
    padding: 2px 10px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 4px;
    background: var(--moutarde);
    color: var(--couleur-encre);
    font-family: var(--police-chiffres);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
  }
</style>
