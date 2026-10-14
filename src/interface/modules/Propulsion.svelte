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
  /* Molette crantée, chiffre au centre. */
  .molette {
    display: grid;
    place-items: center;
    width: 86px;
    height: 86px;
    padding: 0;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 50%;
    background: repeating-conic-gradient(var(--couleur-papier-fonce) 0 8deg, var(--couleur-papier) 8deg 16deg);
    box-shadow: var(--ombre);
    font-family: var(--police-titre);
    font-size: 26px;
  }
  .molette span {
    display: grid;
    place-items: center;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--couleur-papier);
    color: var(--couleur-encre);
  }
  .molette:active span {
    transform: rotate(25deg);
  }
  /* Gros bouton P rouge. */
  .bouton-p {
    width: 76px;
    height: 76px;
    border: 3px solid var(--couleur-encre);
    border-radius: 50%;
    background: var(--cerise);
    box-shadow: 0 5px 0 var(--couleur-encre);
    color: var(--couleur-papier);
    font-family: var(--police-titre);
    font-size: 28px;
    transition: transform 0.06s, box-shadow 0.06s;
  }
  .bouton-p:active {
    transform: translateY(4px);
    box-shadow: 0 1px 0 var(--couleur-encre);
  }
</style>
