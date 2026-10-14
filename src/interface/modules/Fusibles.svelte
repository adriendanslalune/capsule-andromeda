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
    padding: 10px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 14px;
    background: var(--sarcelle);
    box-shadow: var(--ombre);
  }
  /* Porte-fusible. */
  .fusible {
    height: 92px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--couleur-papier);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px;
    color: var(--couleur-encre);
  }
  .fusible small {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  /* Tube de verre et son filament. */
  .verre {
    position: relative;
    width: 22px;
    height: 32px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--ciel);
  }
  .verre::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 2px;
    bottom: 2px;
    width: 2px;
    margin-left: -1px;
    background: var(--couleur-encre);
  }
  .grille .verre {
    background: var(--couleur-encre);
  }
  .grille .verre::after {
    background: linear-gradient(180deg, var(--cerise) 0 35%, transparent 35% 62%, var(--cerise) 62%);
  }
  .bague {
    width: 30px;
    height: 10px;
    border: 2px solid var(--couleur-encre);
    border-radius: 3px;
  }
  .fusible.vide {
    background: repeating-linear-gradient(45deg, var(--couleur-papier-fonce) 0 5px, var(--couleur-papier) 5px 10px);
  }
  /* Boîte de fusibles de rechange. */
  .rechange {
    display: flex;
    justify-content: center;
    gap: 14px;
    padding: 12px;
    border: var(--trait) dashed var(--couleur-encre);
    border-radius: 14px;
  }
  .neuf {
    width: 52px;
    height: 52px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--c);
    box-shadow: var(--ombre-bouton);
  }
  .neuf.choisi {
    transform: translateY(-4px);
    box-shadow: 0 0 0 4px var(--moutarde), 0 8px 0 var(--couleur-encre);
  }
</style>
