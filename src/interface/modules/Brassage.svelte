<script lang="ts">
  // PB-1 Tableau de brassage : prises A-1 à A-5 (haut), B-1 à B-5 (bas), trois câbles et leurs témoins.
  import type { CouleurCable } from '../../donnees/modules'
  import { toucherPrise } from '../../moteur/modules/pb1'
  import { jeu } from '../jeu.svelte'
  import { geste, Secousse } from './geste.svelte'

  const TEINTES: Record<CouleurCable, string> = { rouge: '#c9452f', bleu: '#5e7d96', jaune: '#d9a94a' }
  const pb1 = $derived(jeu.etat!.modules.pb1)
  const s = new Secousse()
  const x = (n: number) => 36 + (n - 1) * 72

  function toucher(rang: 'a' | 'b', n: number) {
    geste(s, (m, c) => { const r = toucherPrise(m.pb1, rang, n, c); return { modules: { ...m, pb1: r.etat }, evenements: r.evenements } })
  }
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="mod-rang temoins">
    {#each ['rouge', 'bleu', 'jaune'] as const as c}
      <div class="mod-cellule">
        <span class="temoin" class:clignote={pb1.panne === c} style={`--c: ${TEINTES[c]}`}></span>
        <span class="mod-plaque">{c.toUpperCase()}</span>
      </div>
    {/each}
  </div>

  <svg viewBox="0 0 360 260" class="tableau" role="group" aria-label="Tableau de brassage">
    <rect x="2" y="2" width="356" height="256" rx="14" fill="var(--sarcelle)" stroke="var(--couleur-encre)" stroke-width="3" />
    {#each pb1.cables as c}
      <path d={`M ${x(c.a)} 60 C ${x(c.a)} 140, ${x(c.b)} 120, ${x(c.b)} 200`} fill="none" stroke={TEINTES[c.couleur]} stroke-width="7" stroke-linecap="round" />
    {/each}
    {#each [1, 2, 3, 4, 5] as n}
      {#each ['a', 'b'] as const as rang}
        {@const y = rang === 'a' ? 60 : 200}
        {@const cable = pb1.cables.find((c) => c[rang] === n)}
        <g role="button" tabindex="0" aria-label={`Prise ${rang.toUpperCase()}-${n}`} class="prise"
          onclick={() => toucher(rang, n)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toucher(rang, n) }}>
          <circle cx={x(n)} cy={y} r="22" fill="var(--couleur-encre)" stroke="var(--couleur-papier)" stroke-width="3" />
          <circle cx={x(n)} cy={y} r="9" fill="#0d0b0a" />
          {#if cable}<circle cx={x(n)} cy={y} r="13" fill={TEINTES[cable.couleur]} stroke="var(--couleur-encre)" stroke-width="2.5" />{/if}
          {#if rang === 'a' && pb1.enMain?.a === n}<circle cx={x(n)} cy={y} r="13" fill={TEINTES[pb1.enMain.couleur]} stroke="var(--couleur-avarie)" stroke-width="3" />{/if}
        </g>
        <text x={x(n)} y={rang === 'a' ? 26 : 246} text-anchor="middle" font-size="15" font-weight="700" fill="var(--couleur-papier)">{rang.toUpperCase()}-{n}</text>
      {/each}
    {/each}
  </svg>

  <p class="main">{pb1.enMain ? `Câble ${pb1.enMain.couleur} en main.` : ' '}</p>
</div>

<style>
  .temoins {
    gap: 30px;
  }
  .temoin {
    position: relative;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--c);
    box-shadow: 2px 2px 0 var(--couleur-encre);
    opacity: 0.45;
  }
  .temoin.clignote {
    opacity: 1;
    animation: clignote 0.6s steps(1) infinite;
  }
  .temoin.clignote::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 4px;
    width: 7px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
    transform: rotate(-30deg);
  }
  .tableau {
    width: 100%;
    filter: drop-shadow(3px 3px 0 var(--couleur-encre));
  }
  .prise {
    cursor: pointer;
  }
  .main {
    margin: 0;
    text-align: center;
    font-family: var(--police-machine);
    font-size: 15px;
    min-height: 20px;
  }
</style>
