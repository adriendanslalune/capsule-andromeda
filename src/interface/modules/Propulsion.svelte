<script lang="ts">
  // CH-1 Chambre de combustion et TU-1 Tuyère : leviers L-A et L-B, molette R, bouton P, aiguilles M-1 et T-2,
  // témoins V-1 (surchauffe) et V-2 (pression).
  import { basculerLevierA, basculerLevierB, presserP, tournerMolette } from '../../moteur/modules/propulsion'
  import { jeu } from '../jeu.svelte'
  import Cadran from './Cadran.svelte'
  import { geste, Secousse } from './geste.svelte'
  import Levier from './Levier.svelte'

  const p = $derived(jeu.etat!.modules.propulsion)
  const s = new Secousse()
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="mod-rang">
    <div class="mod-cellule">
      <Cadran valeur={p.pression} nom="M-1" zones={[[0, 15, '#7fa4cf'], [90, 100, '#c9452f']]} />
      <span class="mod-plaque">PRESSION</span>
    </div>
    <div class="mod-cellule">
      <Cadran valeur={p.temperature} nom="T-2" zones={[[60, 100, '#c9452f']]} />
      <span class="mod-plaque">TUYÈRE</span>
    </div>
  </div>

  <div class="mod-rang temoins">
    <div class="mod-cellule"><span class="mod-temoin" class:allume={p.surchauffe}></span><span class="mod-plaque">V-1</span></div>
    <div class="mod-cellule"><span class="mod-temoin clignote" class:allume={p.avariePression !== null}></span><span class="mod-plaque">V-2</span></div>
  </div>

  <div class="mod-rang commandes">
    <Levier haut={p.levierAHaut} nom="L-A" onbascule={() => geste(s, (m, c) => { const r = basculerLevierA(m.propulsion, c.t); return { modules: { ...m, propulsion: r.etat }, evenements: r.evenements } })} />
    <div class="mod-cellule">
      <button class="molette" aria-label={`Molette R sur ${p.molette}`} onclick={() => geste(s, (m) => { const r = tournerMolette(m.propulsion); return { modules: { ...m, propulsion: r.etat }, evenements: r.evenements } })}>
        <span>{p.molette}</span>
      </button>
      <span class="mod-plaque">R</span>
    </div>
    <div class="mod-cellule">
      <button class="bouton-p" aria-label="Bouton P" onclick={() => geste(s, (m) => { const r = presserP(m.propulsion); return { modules: { ...m, propulsion: r.etat }, evenements: r.evenements } })}>P</button>
      <span class="mod-plaque">P</span>
    </div>
    <Levier haut={p.levierBHaut} nom="L-B" onbascule={() => geste(s, (m) => { const r = basculerLevierB(m.propulsion); return { modules: { ...m, propulsion: r.etat }, evenements: r.evenements } })} />
  </div>
</div>

<style>
  .temoins {
    gap: 40px;
  }
  .commandes {
    align-items: flex-end;
    gap: 16px;
  }
  .molette {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    border: 4px solid var(--couleur-encre);
    background: repeating-conic-gradient(var(--couleur-papier) 0 10deg, #d8cbab 10deg 20deg);
    font-family: var(--police-chiffres);
    font-size: 30px;
    font-weight: 700;
    color: var(--couleur-encre);
  }
  .molette span {
    background: var(--couleur-papier);
    border-radius: 50%;
    padding: 4px 12px;
  }
  .bouton-p {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 4px solid var(--couleur-encre);
    background: var(--couleur-danger);
    color: var(--couleur-papier);
    font-size: 26px;
    font-weight: 700;
  }
  .bouton-p:active {
    transform: translateY(2px);
  }
</style>
