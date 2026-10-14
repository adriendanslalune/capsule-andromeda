<script lang="ts">
  // RE-1 Recycleur d'air : aiguilles O2 et CO2, vanne de purge V-C, POMPE.
  import { basculerVanne, pomper } from '../../moteur/modules/re1'
  import { jeu } from '../jeu.svelte'
  import Cadran from './Cadran.svelte'
  import { geste, Secousse } from './geste.svelte'
  import Levier from './Levier.svelte'

  const re1 = $derived(jeu.etat!.modules.re1)
  const s = new Secousse()
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="mod-rang">
    <div class="mod-cellule">
      <Cadran valeur={re1.o2} nom="O2" zones={[[0, 25, '#c9452f'], [60, 90, '#6f9a6c']]} />
      <span class="mod-plaque">OXYGÈNE</span>
    </div>
    <div class="mod-cellule">
      <Cadran valeur={re1.co2} nom="CO2" zones={[[0, 40, '#6f9a6c'], [75, 100, '#c9452f']]} />
      <span class="mod-plaque">GAZ CARBONIQUE</span>
    </div>
  </div>
  <div class="mod-rang commandes">
    <Levier haut={!re1.vanneOuverte} nom="V-C" onbascule={() => geste(s, (m) => { const r = basculerVanne(m.re1); return { modules: { ...m, re1: r.etat }, evenements: r.evenements } })} />
    <div class="mod-cellule">
      <button class="pompe" onclick={() => geste(s, (m) => { const r = pomper(m.re1); return { modules: { ...m, re1: r.etat }, evenements: r.evenements } })}>POMPE</button>
    </div>
  </div>
</div>

<style>
  .commandes {
    align-items: center;
    gap: 40px;
  }
  .pompe {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    border: 4px solid var(--couleur-encre);
    background: #5e7d96;
    color: var(--couleur-papier);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 2px;
  }
  .pompe:active {
    transform: scale(0.96);
  }
</style>
