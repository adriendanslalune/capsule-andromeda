<script lang="ts">
  // Pupitre du cockpit, à gauche : la radio, vivante. Petit écran des ondes, fréquence, force du signal, un bouton à
  // tourner directement (1,00 par tour) et ÉMETTRE. Toucher l'écran ouvre le poste complet (réglage fin, cadran,
  // haut-parleur). Le pupitre est muet : le son n'est que dans le poste complet.
  import { onMount } from 'svelte'
  import { RADIO } from '../../donnees/radio'
  import { ping, reglerRadioSur } from '../../moteur/chasse'
  import { bornerFrequence, capter } from '../../moteur/radio'
  import { nombre } from '../format'
  import { jeu } from '../jeu.svelte'
  import BoutonRotatif from '../radio/BoutonRotatif.svelte'
  import { dessinerOndes, texteRecu } from '../radio/ondes'

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
  let emissionDepuis = 0
  const recharge = $derived(Math.max(0, Math.ceil((etat.chasse.radioPrete - t) / 1000)))
  function emettre() {
    const r = ping(jeu.etat!, jeu.maintenant)
    jeu.remplacer(r.etat, r.messages)
    emissionDepuis = performance.now()
  }
  let grain = $state(0)
  const texte = $derived.by(() => {
    void grain
    return texteRecu(reception)
  })

  let toile = $state<HTMLCanvasElement>()
  onMount(() => {
    let image = 0
    let dernierGrain = 0
    const c = toile!.getContext('2d')!
    const dessiner = (horloge: number) => {
      image = requestAnimationFrame(dessiner)
      // Pas de dessin quand un volet couvre le cockpit.
      if (jeu.volet) return
      if (horloge - dernierGrain > 250) { grain++; dernierGrain = horloge }
      const W = (toile!.width = toile!.clientWidth * devicePixelRatio)
      const H = (toile!.height = toile!.clientHeight * devicePixelRatio)
      dessinerOndes(c, W, H, reception, horloge, Math.max(0, 1 - (horloge - emissionDepuis) / 700), 1.5)
    }
    image = requestAnimationFrame(dessiner)
    return () => cancelAnimationFrame(image)
  })
</script>

<div class="instrument radio">
  <button class="ecran" onclick={() => (jeu.volet = 'radio')} aria-label="Ouvrir le poste radio complet">
    <canvas bind:this={toile} aria-hidden="true"></canvas>
    <span class="haut"><span>RADIO</span><span class="barres" aria-label={`Signal : ${barres} sur 5`}>{#each [1, 2, 3, 4, 5] as b}<i class:allumee={b <= barres} style={`height: ${3 + b * 2}px`}></i>{/each}</span></span>
    <span class="bande">{texte || '…'}</span>
  </button>
  <div class="reglage">
    <BoutonRotatif parTour={1} taille={50} label="Accord de la radio" {changer} lacher={enregistrer} />
    <span class="freq">{nombre(reglage, 2)}</span>
    <button class="emettre" disabled={recharge > 0} onclick={emettre} aria-label="Émettre (ping)">
      {#if recharge > 0}{Math.floor(recharge / 60)}:{String(recharge % 60).padStart(2, '0')}{:else}ÉMET.{/if}
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
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--police-machine);
    font-size: 9.5px;
    color: var(--menthe);
    text-align: left;
    text-shadow: 0 0 4px rgba(143, 207, 152, 0.6);
  }
  .reglage {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }
  .freq {
    padding: 1px 5px;
    border: 2px solid var(--couleur-encre);
    border-radius: 5px;
    background: #0d1a14;
    color: var(--menthe);
    font-family: var(--police-chiffres);
    font-size: 16px;
    font-weight: 700;
    text-shadow: 0 0 5px rgba(143, 207, 152, 0.5);
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
