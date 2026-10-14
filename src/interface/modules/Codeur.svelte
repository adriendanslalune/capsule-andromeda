<script lang="ts">
  // CO-1 Codeur : mot reçu, code composé, cadran à disque, EFFACER, ÉMETTRE.
  import { composer, effacer, emettre } from '../../moteur/modules/co1'
  import { jeu } from '../jeu.svelte'
  import { geste, Secousse } from './geste.svelte'

  const co1 = $derived(jeu.etat!.modules.co1)
  const s = new Secousse()
  const chiffres = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  const place = (i: number) => {
    const a = ((-60 - i * 28) * Math.PI) / 180
    return { x: 150 + 98 * Math.cos(a), y: 150 - 98 * Math.sin(a) }
  }
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="haut">
    <div class="mod-cellule large"><span class="mod-plaque">MOT REÇU</span><div class="mod-afficheur">{co1.mot ?? '· · · · ·'}</div></div>
    <div class="mod-cellule"><span class="mod-plaque">CODE</span>
      <div class="saisie">{#each [0, 1, 2, 3] as i}<span>{co1.saisie[i] ?? ''}</span>{/each}</div>
    </div>
  </div>

  <svg class="disque" viewBox="0 0 300 300" role="group" aria-label="Cadran à disque">
    <circle cx="150" cy="150" r="146" fill="#c9bb98" stroke="var(--couleur-encre)" stroke-width="4" />
    <circle cx="150" cy="150" r="134" fill="var(--couleur-encre)" />
    {#each chiffres as ch, i}
      {@const p = place(i)}
      <g role="button" tabindex="0" aria-label={`Chiffre ${ch}`} class="trou"
        onclick={() => geste(s, (m) => { const r = composer(m.co1, ch); return { modules: { ...m, co1: r.etat }, evenements: r.evenements } })}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') geste(s, (m) => { const r = composer(m.co1, ch); return { modules: { ...m, co1: r.etat }, evenements: r.evenements } }) }}>
        <circle cx={p.x} cy={p.y} r="24" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="3" />
        <text x={p.x} y={p.y + 8} text-anchor="middle" font-size="24" font-family="var(--police-chiffres)" fill="var(--couleur-encre)">{ch}</text>
      </g>
    {/each}
    <circle cx="150" cy="150" r="46" fill="#efe6d2" stroke="var(--couleur-encre)" stroke-width="3" />
    <text x="150" y="146" text-anchor="middle" font-size="13" fill="var(--couleur-encre)">O.N.V.I.</text>
    <text x="150" y="164" text-anchor="middle" font-size="13" fill="var(--couleur-encre)">CO-1</text>
  </svg>

  <div class="mod-rang">
    <button class="mod-bouton" style="flex: 1" onclick={() => geste(s, (m) => { const r = effacer(m.co1); return { modules: { ...m, co1: r.etat }, evenements: r.evenements } })}>EFFACER</button>
    <button class="mod-bouton fort" style="flex: 1.4" onclick={() => {
      const ev = geste(s, (m, c) => { const r = emettre(m.co1, c); return { modules: { ...m, co1: r.etat }, evenements: r.evenements } })
      if (ev.length === 0 && (!co1.mot || co1.saisie.length < 4)) s.declencher()
    }}>ÉMETTRE</button>
  </div>
</div>

<style>
  .haut {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }
  .large {
    flex: 1;
    align-items: stretch;
  }
  .saisie {
    display: flex;
    gap: 4px;
    background: var(--couleur-encre);
    padding: 5px;
    border-radius: 4px;
  }
  .saisie span {
    width: 28px;
    height: 40px;
    background: var(--couleur-papier);
    font-family: var(--police-chiffres);
    font-size: 24px;
    line-height: 40px;
    text-align: center;
  }
  .disque {
    width: 280px;
    height: 280px;
    align-self: center;
  }
  .trou {
    cursor: pointer;
  }
</style>
