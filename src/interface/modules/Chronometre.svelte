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
  /* Horloge de bord à chiffres lumineux. */
  .cadran-chrono {
    font-family: var(--police-chiffres);
    font-size: 56px;
    font-weight: 700;
    padding: 10px 22px;
    border: 3px solid var(--couleur-encre);
    border-radius: 14px;
    letter-spacing: 3px;
    background: var(--couleur-encre);
    color: #ffa93a;
    box-shadow: var(--ombre);
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
