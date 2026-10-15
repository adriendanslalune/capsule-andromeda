<script lang="ts">
  // POSTE RADIO : l'écran des ondes (souffle, porteuse, bips, morse…), le cadran gradué de 0 à 12 avec son aiguille,
  // deux boutons à tourner au doigt (GROS : 2,00 par tour ; FIN : 0,10 par tour) et le bouton ÉMETTRE (ping de
  // chasse). Le poste ne nomme jamais ce qu'il capte : la table des fréquences est dans le manuel.
  import { onMount } from 'svelte'
  import { RADIO } from '../../donnees/radio'
  import { ping, reglerRadioSur } from '../../moteur/chasse'
  import { sequenceMorse } from '../../moteur/modules/mo1'
  import { ALPHABET_MORSE } from '../../donnees/modules'
  import { bornerFrequence, capter, type Emission } from '../../moteur/radio'
  import { nombre } from '../format'
  import { jeu } from '../jeu.svelte'
  import { sonRadio } from '../sons'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)

  // Réglage en direct pendant qu'on tourne un bouton ; enregistré quand on lâche.
  let reglage = $state(jeu.etat!.chasse.frequenceRadio)
  let tourne = $state(false)
  $effect(() => {
    if (!tourne) reglage = etat.chasse.frequenceRadio
  })
  const reception = $derived(capter(etat, t, reglage))
  function enregistrer() {
    const e = reglerRadioSur(etat, reglage)
    if (e !== etat) jeu.remplacer(e)
  }
  function pas(ecart: number) {
    reglage = bornerFrequence(reglage + ecart)
    enregistrer()
  }

  // Boutons rotatifs : l'angle parcouru autour du centre fait varier la fréquence.
  let angleGros = $state(0)
  let angleFin = $state(0)
  function tourner(e: PointerEvent, parTour: number, quel: 'gros' | 'fin') {
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    let precedent = Math.atan2(e.clientY - cy, e.clientX - cx)
    let brut = reglage
    tourne = true
    const bouger = (m: PointerEvent) => {
      const a = Math.atan2(m.clientY - cy, m.clientX - cx)
      let d = a - precedent
      if (d > Math.PI) d -= 2 * Math.PI
      if (d < -Math.PI) d += 2 * Math.PI
      precedent = a
      brut = Math.max(RADIO.min, Math.min(RADIO.max, brut + (d / (2 * Math.PI)) * parTour))
      reglage = bornerFrequence(brut)
      if (quel === 'gros') angleGros += (d * 180) / Math.PI
      else angleFin += (d * 180) / Math.PI
    }
    const lacher = () => {
      el.removeEventListener('pointermove', bouger)
      el.removeEventListener('pointerup', lacher)
      el.removeEventListener('pointercancel', lacher)
      tourne = false
      enregistrer()
    }
    el.addEventListener('pointermove', bouger)
    el.addEventListener('pointerup', lacher)
    el.addEventListener('pointercancel', lacher)
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

  // Ce qui s'entend, en clair (net) ou mangé par le souffle (brouillé).
  const heureTU = (ms: number) => {
    const d = new Date(ms)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getUTCHours())} H ${p(d.getUTCMinutes())} MIN ${p(d.getUTCSeconds())} S TU`
  }
  /** Le signal des monolithes : des groupes d'impulsions de 2, 3, 5, 7 et 11. */
  const PREMIERS = [2, 3, 5, 7, 11]
  const enMorse = (indicatif: string) => [...indicatif].map((l) => ALPHABET_MORSE[l].replaceAll('.', '·').replaceAll('-', '−')).join('   ')
  function texteClair(e: Emission): string {
    switch (e.sorte) {
      case 'radio-terre': return `ICI RADIO-TERRE. ${e.texte} TOP : ${heureTU(e.topHoraire)}.`
      case 'observatoire': return `${e.texte} FIN DU BULLETIN.`
      case 'transmissions': return e.texte
      case 'morse': return enMorse(e.indicatif)
      case 'detresse': return e.texte
      case 'monolithe': return PREMIERS.map((n) => '▮'.repeat(n)).join('  ')
    }
  }
  let grain = $state(0)
  const texte = $derived.by(() => {
    void grain
    const e = reception.emission
    if (!e) return ''
    const clair = texteClair(e)
    const n = reception.nettete
    if (n >= 1) return clair
    const perte = Math.pow(1 - n, 0.6)
    return [...clair].map((c) => (c === ' ' || Math.random() > perte ? c : '#%&*?/'[Math.floor(Math.random() * 6)])).join('')
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
      const s = horloge / 1000
      const r = reception
      const n = r.emission ? r.nettete : 0
      // Le signal du moment : porteuse allumée ou non, sa forme, sa hauteur (son).
      let allume = 0, hauteur = 600, forme = (x: number) => Math.sin(x)
      const e = r.emission
      if (e?.sorte === 'morse') {
        const seq = sequenceMorse(e.indicatif)
        const total = seq.reduce((a, [, d]) => a + d, 0)
        let k = s % total
        for (const [on, d] of seq) { if (k < d) { allume = on ? 1 : 0; break } k -= d }
        hauteur = 700
      } else if (e?.sorte === 'observatoire') {
        allume = s % 1 < 0.18 ? 1 : 0
        hauteur = 880
        forme = (x) => (Math.sin(x) > 0 ? 1 : -1) * 0.8
      } else if (e?.sorte === 'transmissions') {
        const bloc = Math.floor(s / 0.14)
        allume = ((bloc * 2654435761) >>> 0) % 7 < 4 ? 0.9 : 0.15
        hauteur = 420 + (((bloc * 40503) >>> 0) % 5) * 40
        forme = (x) => Math.sin(x) * 0.7 + Math.sin(x * 2.3) * 0.3
      } else if (e?.sorte === 'detresse') {
        // Veille : une porteuse faible et régulière, sans appel.
        allume = 0.25
        hauteur = 520
      } else if (e?.sorte === 'monolithe') {
        // Groupes d'impulsions (2, 3, 5, 7, 11), une impulsion toutes les 0,25 s, une pause entre deux groupes.
        const sequence = PREMIERS.flatMap((n) => [...Array(n).fill(1), 0, 0, 0])
        const k = Math.floor(s / 0.25) % sequence.length
        allume = sequence[k] && s % 0.25 < 0.12 ? 1 : 0
        hauteur = 1320
        forme = (x) => Math.sin(x) * 0.6 + Math.sin(x * 3) * 0.4
      } else if (e?.sorte === 'radio-terre') {
        allume = 0.55 + 0.45 * Math.abs(Math.sin(s * 2.1) * Math.sin(s * 0.7 + 1))
        hauteur = 330 + 60 * Math.sin(s * 1.3)
        forme = (x) => Math.sin(x) * 0.6 + Math.sin(x * 1.5 + s * 3) * 0.4
      }
      const ping = Math.max(0, 1 - (horloge - emissionDepuis) / 700)
      // Fond, quadrillage.
      c.fillStyle = '#0d1a14'
      c.fillRect(0, 0, W, H)
      c.strokeStyle = 'rgba(143, 207, 152, 0.15)'
      c.lineWidth = 1
      for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo((W * i) / 10, 0); c.lineTo((W * i) / 10, H); c.stroke() }
      for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, (H * i) / 4); c.lineTo(W, (H * i) / 4); c.stroke() }
      // L'onde : du souffle, plus le signal capté (d'autant plus net qu'on est près de la fréquence).
      c.strokeStyle = '#8fcf98'
      c.shadowColor = '#8fcf98'
      c.shadowBlur = 6 * devicePixelRatio
      c.lineWidth = 2 * devicePixelRatio
      c.beginPath()
      const souffle = 0.08 + 0.32 * (1 - n)
      for (let x = 0; x <= W; x += 2) {
        const u = x / W
        let y = (Math.random() * 2 - 1) * souffle
        y += n * allume * 0.75 * forme(u * 40 + s * 18)
        if (ping) y = (Math.sin(u * 90 - s * 40) > 0 ? 1 : -1) * 0.9 * ping + y * (1 - ping)
        const py = H / 2 - y * H * 0.42
        if (x === 0) c.moveTo(x, py)
        else c.lineTo(x, py)
      }
      c.stroke()
      c.shadowBlur = 0
      sonRadio.regler(souffle, n * allume + ping, ping ? 1200 : hauteur)
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
        <div class="bouton-rotatif gros" role="slider" tabindex="0" aria-label="Réglage grossier" aria-valuemin={RADIO.min} aria-valuemax={RADIO.max} aria-valuenow={reglage}
          onpointerdown={(e) => tourner(e, 2, 'gros')} style={`--angle: ${angleGros}deg`}><span class="repere"></span></div>
        <small>GROS</small>
      </div>
      <div class="molette">
        <div class="bouton-rotatif fin" role="slider" tabindex="0" aria-label="Réglage fin" aria-valuemin={RADIO.min} aria-valuemax={RADIO.max} aria-valuenow={reglage}
          onpointerdown={(e) => tourner(e, 0.1, 'fin')} style={`--angle: ${angleFin}deg`}><span class="repere"></span></div>
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
  .bouton-rotatif {
    position: relative;
    width: 84px;
    height: 84px;
    border: 3px solid var(--couleur-encre);
    border-radius: 50%;
    background: repeating-conic-gradient(var(--couleur-encre) 0 6deg, #2b3440 6deg 12deg);
    box-shadow: 3px 3px 0 var(--couleur-encre);
    transform: rotate(var(--angle));
    touch-action: none;
    cursor: grab;
  }
  .bouton-rotatif::before {
    content: '';
    position: absolute;
    inset: 12px;
    border-radius: 50%;
    background: var(--couleur-papier);
    border: 2px solid var(--couleur-encre);
  }
  .bouton-rotatif.fin {
    width: 64px;
    height: 64px;
  }
  .bouton-rotatif.fin::before {
    inset: 9px;
  }
  .repere {
    position: absolute;
    left: 50%;
    top: 14px;
    width: 4px;
    height: 16px;
    margin-left: -2px;
    border-radius: 2px;
    background: var(--cerise);
  }
  .fin .repere {
    top: 11px;
    height: 12px;
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
