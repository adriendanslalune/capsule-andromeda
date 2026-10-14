<script lang="ts">
  // CR-1 Chronomètre de bord : heure affichée, réglage H+ H− M+ M−, RECALER.
  import { heureAffichee, recaler, reglerChronometre } from '../../moteur/modules/cr1'
  import { jeu } from '../jeu.svelte'
  import { geste, Secousse } from './geste.svelte'

  const cr1 = $derived(jeu.etat!.modules.cr1)
  const h = $derived(heureAffichee(cr1, jeu.maintenant, jeu.etat!.serie))
  const s = new Secousse()
  const deux = (n: number) => String(n).padStart(2, '0')
  const regler = (min: number) => geste(s, (m) => { const r = reglerChronometre(m.cr1, min); return { modules: { ...m, cr1: r.etat }, evenements: r.evenements } })
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="mod-rang">
    <div class="cadran-chrono" aria-label="Heure du chronomètre">{deux(h.heures)}:{deux(h.minutes)}<small>:{deux(h.secondes)}</small></div>
  </div>
  <div class="reglages">
    <button class="mod-bouton" onclick={() => regler(60)}>H+</button>
    <button class="mod-bouton" onclick={() => regler(1)}>M+</button>
    <button class="mod-bouton" onclick={() => regler(-60)}>H−</button>
    <button class="mod-bouton" onclick={() => regler(-1)}>M−</button>
  </div>
  <div class="mod-rang">
    <button class="mod-bouton fort" onclick={() => {
      const ev = geste(s, (m) => { const r = recaler(m.cr1); return { modules: { ...m, cr1: r.etat }, evenements: r.evenements } })
      if (ev.length === 0) s.declencher()
    }}>RECALER</button>
  </div>
</div>

<style>
  /* Horloge de bord à tubes Nixie. */
  .cadran-chrono {
    font-family: var(--police-chiffres);
    font-size: 56px;
    font-weight: 600;
    padding: 12px 22px;
    border-radius: 12px;
    letter-spacing: 3px;
    background: radial-gradient(ellipse at 50% 40%, #2a1408, #0c0603 75%);
    color: #ffb04a;
    text-shadow: 0 0 4px #ff8a1f, 0 0 10px #ff6a00, 0 0 18px rgba(255, 90, 0, 0.6);
    box-shadow: 0 0 0 1px #000, 0 2px 4px rgba(255, 255, 255, 0.08) inset, 0 -6px 10px rgba(255, 120, 30, 0.08) inset;
    box-shadow: 0 0 0 4px var(--chrome), 0 0 0 5px #222, 0 4px 10px 5px rgba(0, 0, 0, 0.35);
  }
  .cadran-chrono small {
    font-size: 26px;
  }
  .reglages {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
</style>
