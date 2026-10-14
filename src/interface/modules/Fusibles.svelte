<script lang="ts">
  // AL-1 Fusibles : 8 fusibles F-1 à F-8, boîte de rechange (4 couleurs), interrupteurs S-1 à S-4.
  import type { CouleurFusible } from '../../donnees/modules'
  import { COULEURS_FUSIBLES } from '../../donnees/modules'
  import { insererFusible, retirerFusible } from '../../moteur/modules/al1'
  import type { NumeroInterrupteur } from '../../moteur/interrupteurs'
  import { jeu } from '../jeu.svelte'
  import { geste, Secousse } from './geste.svelte'
  import Levier from './Levier.svelte'

  const TEINTES: Record<CouleurFusible, string> = { bleu: '#5e7d96', rouge: '#c9452f', vert: '#6f9a6c', jaune: '#d9a94a' }
  const al1 = $derived(jeu.etat!.modules.al1)
  const inters = $derived(jeu.etat!.interrupteurs)
  const s = new Secousse()
  let neuf = $state<CouleurFusible | null>(null)

  function toucher(i: number) {
    const f = al1.fusibles[i]
    if (f.etat === 'vide') {
      if (!neuf) return
      const couleur = neuf
      geste(s, (m, c) => { const r = insererFusible(m.al1, i, couleur, c); return { modules: { ...m, al1: r.etat }, evenements: r.evenements } })
      neuf = null
      return
    }
    if (f.etat === 'bon') { s.declencher(); return }
    geste(s, (m, c) => { const r = retirerFusible(m.al1, i, c); return { modules: { ...m, al1: r.etat }, evenements: r.evenements } })
  }
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="fusibles">
    {#each al1.fusibles as f, i}
      <button class={`fusible ${f.etat}`} aria-label={`Fusible F-${i + 1}, ${f.etat === 'vide' ? 'emplacement vide' : `${f.couleur}${f.etat === 'grille' ? ', grillé' : ''}`}`} onclick={() => toucher(i)}>
        <small>F-{i + 1}</small>
        {#if f.etat !== 'vide'}
          <span class="verre"></span>
          <span class="bague" style={`background: ${TEINTES[f.couleur]}`}></span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="rechange" aria-label="Boîte de rechange">
    {#each COULEURS_FUSIBLES as c}
      <button class="neuf" class:choisi={neuf === c} style={`--c: ${TEINTES[c]}`} aria-label={`Fusible neuf ${c}`} aria-pressed={neuf === c} onclick={() => (neuf = neuf === c ? null : c)}></button>
    {/each}
  </div>

  <div class="mod-rang">
    {#each [1, 2, 3, 4] as n}
      <Levier petit haut={inters[n - 1] === 'haut'} nom={`S-${n}`} onbascule={() => jeu.interrupteur(n as NumeroInterrupteur)} />
    {/each}
  </div>
</div>

<style>
  .fusibles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .fusible {
    height: 86px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: #d8cbab;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px;
  }
  .fusible small {
    font-size: 12px;
    font-weight: 700;
  }
  .verre {
    width: 22px;
    height: 30px;
    border-radius: 6px;
    border: 2px solid var(--couleur-encre);
    background: #f6efdc;
  }
  .grille .verre {
    background: #2b2723;
  }
  .bague {
    width: 30px;
    height: 10px;
    border: 2px solid var(--couleur-encre);
    border-radius: 3px;
  }
  .fusible.vide {
    background: repeating-linear-gradient(135deg, #cfc1a0 0 4px, #d8cbab 4px 8px);
  }
  .rechange {
    display: flex;
    justify-content: center;
    gap: 14px;
    padding: 10px;
    border: 2px dashed var(--couleur-encre);
    border-radius: 12px;
  }
  .neuf {
    width: 52px;
    height: 52px;
    border-radius: 10px;
    border: 3px solid var(--couleur-encre);
    background: var(--c);
  }
  .neuf.choisi {
    outline: 4px solid var(--couleur-avarie);
    outline-offset: 2px;
  }
</style>
