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
  /* Grosse pompe sarcelle. */
  .pompe {
    width: 112px;
    height: 112px;
    border: 3px solid var(--couleur-encre);
    border-radius: 50%;
    background: var(--sarcelle);
    box-shadow: 0 6px 0 var(--couleur-encre);
    color: var(--couleur-papier);
    font-family: var(--police-titre);
    font-size: 18px;
    letter-spacing: 1px;
    transition: transform 0.06s, box-shadow 0.06s;
  }
  .pompe:active {
    transform: translateY(5px);
    box-shadow: 0 1px 0 var(--couleur-encre);
  }
</style>
