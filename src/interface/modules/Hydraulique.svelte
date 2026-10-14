<script lang="ts">
  // HY-1 Circuit hydraulique : grille de tuyaux pivotants, source à gauche, réservoirs R-1 à R-3, manomètre H, VANNE.
  import { ouverts, ouvrirVanne, tournerTuyau, tuyauxMouilles } from './hydraulique'
  import { jeu } from '../jeu.svelte'
  import Cadran from './Cadran.svelte'
  import { geste, Secousse } from './geste.svelte'

  const hy1 = $derived(jeu.etat!.modules.hy1)
  const mouilles = $derived(tuyauxMouilles(hy1.tuyaux))
  const s = new Secousse()
  const T = 64, OX = 34, OY = 14
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="mod-rang">
    <div class="mod-cellule">
      <Cadran valeur={hy1.manometre} nom="H" zones={[[0, 35, '#a9bccb'], [70, 100, '#e0743f']]} taille={110} />
    </div>
  </div>

  <svg viewBox="0 0 360 220" class="grille" role="group" aria-label="Circuit hydraulique">
    <rect x="2" y="2" width="356" height="216" rx="8" fill="#e6dbc1" stroke="var(--couleur-encre)" stroke-width="3" />
    <path d={`M 4 ${OY + T * 1.5} L ${OX} ${OY + T * 1.5}`} stroke="#5e7d96" stroke-width="12" />
    {#each [0, 1, 2] as r}
      {@const y = OY + T * r + T / 2}
      <path d={`M ${OX + 4 * T} ${y} L ${OX + 4 * T + 20} ${y}`} stroke="var(--couleur-encre)" stroke-width="12" />
      <rect x={OX + 4 * T + 18} y={y - 16} width="46" height="32" rx="3" fill="#d8cbab" stroke="var(--couleur-encre)" stroke-width="2" />
      <text x={OX + 4 * T + 41} y={y + 5} text-anchor="middle" font-size="13" font-weight="700" fill="var(--couleur-encre)">R-{r + 1}</text>
    {/each}
    {#each hy1.tuyaux as tuyau, k}
      {@const rr = Math.floor(k / 4)}
      {@const cc = k % 4}
      {@const x0 = OX + cc * T}
      {@const y0 = OY + rr * T}
      {@const cx = x0 + T / 2}
      {@const cy = y0 + T / 2}
      {@const m = ouverts(tuyau)}
      <g role="button" tabindex="0" aria-label={`Tuyau ${k + 1}`} class="tuile"
        onclick={() => geste(s, (mm) => { const r = tournerTuyau(mm.hy1, k); return { modules: { ...mm, hy1: r.etat }, evenements: r.evenements } })}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') geste(s, (mm) => { const r = tournerTuyau(mm.hy1, k); return { modules: { ...mm, hy1: r.etat }, evenements: r.evenements } }) }}>
        <rect x={x0 + 2} y={y0 + 2} width={T - 4} height={T - 4} rx="6" fill="#f6efdc" stroke="#c9bb98" />
        {#each [[1, cx, y0 + 2], [4, cx, y0 + T - 2], [2, x0 + T - 2, cy], [8, x0 + 2, cy]] as [bit, ex, ey]}
          {#if m & bit}
            <path d={`M ${cx} ${cy} L ${ex} ${ey}`} stroke="var(--couleur-encre)" stroke-width="18" />
            <path d={`M ${cx} ${cy} L ${ex} ${ey}`} stroke={mouilles.has(k) ? '#5e7d96' : '#efe6d2'} stroke-width="11" />
          {/if}
        {/each}
      </g>
    {/each}
  </svg>

  <div class="mod-rang">
    <button class="mod-bouton fort" onclick={() => {
      const ev = geste(s, (m, c) => { const r = ouvrirVanne(m.hy1, c); return { modules: { ...m, hy1: r.etat }, evenements: r.evenements } })
      if (ev.length === 0) s.declencher()
    }}>VANNE</button>
  </div>
</div>

<style>
  .grille {
    width: 100%;
  }
  .tuile {
    cursor: pointer;
  }
</style>
