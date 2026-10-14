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
    border-radius: 10px;
    background: linear-gradient(180deg, var(--bakelite-clair), var(--bakelite));
    box-shadow: 0 0 0 3px var(--chrome-sombre), 0 4px 8px rgba(0, 0, 0, 0.4);
  }
  /* Porte-fusible en céramique, avec ses pinces en laiton. */
  .fusible {
    height: 92px;
    border: 0;
    border-radius: 8px;
    background: linear-gradient(90deg, #d9cfb8, #fbf6ea 40%, #e2d8c0 70%, #c8bc9f);
    box-shadow: 0 2px 0 rgba(255, 255, 255, 0.6) inset, 0 3px 6px rgba(0, 0, 0, 0.5);
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
  /* Tube de verre, filament visible. */
  .verre {
    position: relative;
    width: 22px;
    height: 32px;
    border-radius: 6px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.85), rgba(200, 225, 235, 0.5) 40%, rgba(255, 255, 255, 0.9) 60%, rgba(170, 190, 200, 0.6));
    box-shadow: 0 0 0 2px #b38a3c, 0 0 0 3px #6d5216;
  }
  .verre::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 3px;
    bottom: 3px;
    width: 2px;
    margin-left: -1px;
    background: #7b6a55;
  }
  .grille .verre {
    background: radial-gradient(circle at 50% 50%, #3a2a1a, #120b06 70%);
  }
  .grille .verre::after {
    background: linear-gradient(180deg, #7b6a55 0 35%, transparent 35% 62%, #7b6a55 62%);
  }
  .bague {
    width: 30px;
    height: 10px;
    border-radius: 3px;
    box-shadow: 0 0 0 1.5px var(--couleur-encre), 0 2px 0 rgba(255, 255, 255, 0.45) inset, 0 -2px 0 rgba(0, 0, 0, 0.3) inset;
  }
  .fusible.vide {
    background: radial-gradient(ellipse at 50% 50%, #1a120c, #3b2b20 70%);
    color: var(--couleur-texte-discret);
  }
  /* Boîte de fusibles de rechange. */
  .rechange {
    display: flex;
    justify-content: center;
    gap: 14px;
    padding: 12px;
    border-radius: 12px;
    background: var(--grain), linear-gradient(180deg, #8a6a3e, #5a4024);
    box-shadow: 0 2px 0 rgba(255, 255, 255, 0.2) inset, 0 4px 8px rgba(0, 0, 0, 0.45);
  }
  .neuf {
    width: 52px;
    height: 52px;
    border: 0;
    border-radius: 10px;
    background: var(--c);
    box-shadow: 0 0 0 2px #22160f, 0 3px 0 rgba(255, 255, 255, 0.5) inset, 0 -4px 0 rgba(0, 0, 0, 0.3) inset, 0 4px 6px rgba(0, 0, 0, 0.5);
  }
  .neuf.choisi {
    transform: translateY(-4px);
    box-shadow: 0 0 0 2px #22160f, 0 0 0 5px var(--moutarde), 0 0 16px 4px rgba(242, 179, 61, 0.8);
  }
</style>
