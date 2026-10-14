<script lang="ts">
  // SX-1 Sextant : étoile de référence affichée, vue du ciel avec réticule, réglage azimut et hauteur, RELEVÉ.
  import { ETOILES } from '../../donnees/etoiles'
  import { mulberry32 } from '../../moteur/hasard'
  import { releve, reglerSextant } from '../../moteur/modules/sx1'
  import { jeu } from '../jeu.svelte'
  import { geste, Secousse } from './geste.svelte'

  const sx1 = $derived(jeu.etat!.modules.sx1)
  const s = new Secousse()
  const regler = (da: number, dh: number) => geste(s, (m) => { const r = reglerSextant(m.sx1, da, dh); return { modules: { ...m, sx1: r.etat }, evenements: r.evenements } })

  // Fond d'étoiles pâles (toujours les mêmes) et les 12 étoiles du tableau.
  const fond = (() => {
    const h = mulberry32(77)
    return Array.from({ length: 1400 }, () => ({ az: h() * 360, ht: (Math.asin(h() * 2 - 1) * 180) / Math.PI, b: h() }))
  })()
  const CHAMP = 12 // demi-champ de vue (degrés)
  const k = 130 / CHAMP
  function placer(az: number, ht: number) {
    const dl = ((az - sx1.azimut + 540) % 360) - 180
    return { x: 130 - dl * k * Math.cos((sx1.hauteur * Math.PI) / 180), y: 130 - (ht - sx1.hauteur) * k }
  }
  const visibles = $derived(
    [...fond.map((e) => ({ ...placer(e.az, e.ht), r: e.b > 0.96 ? 1.2 : 0.7, o: 0.35 + e.b * 0.5 })),
      ...ETOILES.map((e) => ({ ...placer(e.azimut, e.hauteur), r: 3.2, o: 1 }))].filter((p) => p.x > -5 && p.x < 265 && p.y > -5 && p.y < 265),
  )
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="mod-rang"><div class="mod-afficheur">{sx1.etoile ?? '· · · · ·'}</div></div>
  <svg viewBox="0 0 260 260" class="ciel" aria-hidden="true">
    <rect width="260" height="260" fill="#0e1a26" />
    {#each visibles as e}<circle cx={e.x} cy={e.y} r={e.r} fill="#fff3cf" opacity={e.o} />{/each}
    <circle cx="130" cy="130" r={1.5 * k} fill="none" stroke="rgba(212,105,60,.9)" stroke-width="1.2" />
    <path d="M130 8 L130 120 M130 140 L130 252 M8 130 L120 130 M140 130 L252 130" stroke="rgba(212,105,60,.9)" stroke-width="1.2" />
  </svg>
  <div class="lectures">
    <span>AZIMUT <b>{String(sx1.azimut).padStart(3, '0')}°</b></span>
    <span>HAUTEUR <b>{sx1.hauteur >= 0 ? '+' : '−'}{String(Math.abs(sx1.hauteur)).padStart(2, '0')}°</b></span>
  </div>
  <div class="reglages">
    <button class="mod-bouton" onclick={() => regler(-10, 0)}>AZ −10</button>
    <button class="mod-bouton" onclick={() => regler(-1, 0)}>AZ −1</button>
    <button class="mod-bouton" onclick={() => regler(1, 0)}>AZ +1</button>
    <button class="mod-bouton" onclick={() => regler(10, 0)}>AZ +10</button>
    <button class="mod-bouton" onclick={() => regler(0, -10)}>HT −10</button>
    <button class="mod-bouton" onclick={() => regler(0, -1)}>HT −1</button>
    <button class="mod-bouton" onclick={() => regler(0, 1)}>HT +1</button>
    <button class="mod-bouton" onclick={() => regler(0, 10)}>HT +10</button>
  </div>
  <div class="mod-rang">
    <button class="mod-bouton fort" onclick={() => {
      const ev = geste(s, (m, c) => { const r = releve(m.sx1, c); return { modules: { ...m, sx1: r.etat }, evenements: r.evenements } })
      if (ev.length === 0) s.declencher()
    }}>RELEVÉ</button>
  </div>
</div>

<style>
  .ciel {
    width: 230px;
    height: 230px;
    align-self: center;
    border-radius: 50%;
    box-shadow: 0 0 0 6px var(--laiton), 0 0 0 7px #3b2a10, 0 6px 12px 6px rgba(0, 0, 0, 0.35);
  }
  .lectures {
    display: flex;
    justify-content: space-around;
    font-size: 15px;
    letter-spacing: 1px;
  }
  .lectures b {
    font-family: var(--police-chiffres);
    font-size: 18px;
  }
  .reglages {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .reglages .mod-bouton {
    min-width: 0;
    padding: 0 4px;
    font-size: 14px;
  }
</style>
