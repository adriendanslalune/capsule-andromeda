<script lang="ts">
  // AN-1 Antenne orientable : cadran gradué, molette de l'antenne, VERROUILLER, état de la liaison.
  import { tournerAntenne, verrouiller } from '../../moteur/modules/an1'
  import { jeu } from '../jeu.svelte'
  import { geste, Secousse } from './geste.svelte'

  const an1 = $derived(jeu.etat!.modules.an1)
  const s = new Secousse()
  const tourner = (d: number) => geste(s, (m) => { const r = tournerAntenne(m.an1, d); return { modules: { ...m, an1: r.etat }, evenements: r.evenements } })
  const graduations = Array.from({ length: 36 }, (_, i) => i * 10)
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="mod-rang">
    <span class="liaison" class:perdue={an1.avarie}>{an1.avarie ? 'LIAISON PERDUE' : 'LIAISON TERRE'}</span>
  </div>
  <svg viewBox="0 0 200 200" class="cadran" role="img" aria-label={`Antenne orientée à ${an1.orientation}°`}>
    <circle cx="100" cy="100" r="94" fill="#d8cbab" stroke="var(--couleur-encre)" stroke-width="3" />
    <circle cx="100" cy="100" r="80" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="2" />
    {#each graduations as a}
      {@const r = (a * Math.PI) / 180}
      <line x1={100 + Math.cos(r) * (a % 30 === 0 ? 66 : 72)} y1={100 - Math.sin(r) * (a % 30 === 0 ? 66 : 72)}
        x2={100 + Math.cos(r) * 79} y2={100 - Math.sin(r) * 79} stroke="var(--couleur-encre)" stroke-width={a % 30 === 0 ? 2.2 : 1} />
      {#if a % 90 === 0}<text x={100 + Math.cos(r) * 54} y={100 - Math.sin(r) * 54 + 5} text-anchor="middle" font-size="13" font-family="var(--police-chiffres)" fill="var(--couleur-encre)">{a}</text>{/if}
    {/each}
    <g transform={`rotate(${-an1.orientation} 100 100)`}>
      <line x1="100" y1="100" x2="170" y2="100" stroke="var(--couleur-danger)" stroke-width="5" stroke-linecap="round" />
      <path d="M 166 88 Q 182 100 166 112" fill="none" stroke="var(--couleur-encre)" stroke-width="4" />
    </g>
    <circle cx="100" cy="100" r="7" fill="var(--couleur-encre)" />
  </svg>
  <div class="mod-rang"><div class="mod-afficheur">{String(an1.orientation).padStart(3, '0')}°</div></div>
  <div class="reglages">
    <button class="mod-bouton" onclick={() => tourner(-10)}>−10</button>
    <button class="mod-bouton" onclick={() => tourner(-1)}>−1</button>
    <button class="mod-bouton" onclick={() => tourner(1)}>+1</button>
    <button class="mod-bouton" onclick={() => tourner(10)}>+10</button>
  </div>
  <div class="mod-rang">
    <button class="mod-bouton fort" onclick={() => {
      const ev = geste(s, (m, c) => { const r = verrouiller(m.an1, jeu.etat!.fusee.position, c); return { modules: { ...m, an1: r.etat }, evenements: r.evenements } })
      if (ev.length === 0) s.declencher()
    }}>VERROUILLER</button>
  </div>
</div>

<style>
  .liaison {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 1px 10px;
    border-radius: 4px;
    background: var(--couleur-encre);
    color: var(--couleur-papier);
  }
  .liaison.perdue {
    background: var(--cerise);
    animation: clignote 0.8s steps(1) infinite;
  }
  .cadran {
    width: 230px;
    height: 230px;
    align-self: center;
    border-radius: 50%;
    box-shadow: var(--ombre);
  }
  .reglages {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
</style>
