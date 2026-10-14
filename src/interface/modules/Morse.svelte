<script lang="ts">
  // MO-1 Morse : lampe qui répète l'indicatif capté, fréquence d'émission réglable, ÉMETTRE.
  import { emettreMorse, reglerFrequence, sequenceMorse } from '../../moteur/modules/mo1'
  import { nombre } from '../format'
  import { jeu } from '../jeu.svelte'
  import { geste, Secousse } from './geste.svelte'

  const mo1 = $derived(jeu.etat!.modules.mo1)
  const s = new Secousse()
  let allume = $state(false)

  // La lampe joue la séquence en boucle tant qu'un indicatif est capté.
  $effect(() => {
    const indicatif = mo1.indicatif
    if (!indicatif) { allume = false; return }
    const seq = sequenceMorse(indicatif)
    let i = 0
    let minuterie: ReturnType<typeof setTimeout>
    const suivant = () => {
      const [on, d] = seq[i]
      allume = on
      i = (i + 1) % seq.length
      minuterie = setTimeout(suivant, d * 1000)
    }
    suivant()
    return () => clearTimeout(minuterie)
  })

  const regler = (ecart: number) => geste(s, (m) => { const r = reglerFrequence(m.mo1, ecart); return { modules: { ...m, mo1: r.etat }, evenements: r.evenements } })
</script>

<div class="mod-zone" class:mod-secoue={s.active}>
  <div class="mod-rang">
    <div class="mod-cellule">
      <span class="lampe" class:allume></span>
      <span class="mod-plaque">RÉCEPTION</span>
    </div>
  </div>
  <div class="mod-rang">
    <div class="mod-cellule">
      <span class="mod-plaque">FRÉQUENCE D’ÉMISSION</span>
      <div class="mod-afficheur">{nombre(mo1.frequence, 2)}</div>
    </div>
  </div>
  <div class="reglages">
    {#each [-1, -0.1, -0.01, 0.01, 0.1, 1] as d}
      <button class="mod-bouton" onclick={() => regler(d)}>{d > 0 ? '+' : '−'}{nombre(Math.abs(d), Math.abs(d) < 0.1 ? 2 : Math.abs(d) < 1 ? 1 : 0)}</button>
    {/each}
  </div>
  <div class="mod-rang">
    <button class="mod-bouton fort" onclick={() => {
      const ev = geste(s, (m, c) => { const r = emettreMorse(m.mo1, c); return { modules: { ...m, mo1: r.etat }, evenements: r.evenements } })
      if (ev.length === 0) s.declencher()
    }}>ÉMETTRE</button>
  </div>
</div>

<style>
  /* Projecteur de signalisation : lentille de Fresnel dans une lunette chromée. */
  .lampe {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: repeating-radial-gradient(circle, rgba(255, 255, 255, 0.07) 0 3px, rgba(0, 0, 0, 0.12) 3px 6px), radial-gradient(circle at 40% 35%, #6b5e4c, #2f2820 70%);
    box-shadow: 0 0 0 7px var(--chrome), 0 0 0 8px #222, 0 6px 12px 6px rgba(0, 0, 0, 0.35);
  }
  .lampe.allume {
    background: repeating-radial-gradient(circle, rgba(255, 255, 255, 0.25) 0 3px, rgba(255, 170, 40, 0.15) 3px 6px), radial-gradient(circle at 45% 40%, #fffbe0, #ffd27a 40%, #e08a1a);
    box-shadow: 0 0 0 7px var(--chrome), 0 0 0 8px #222, 0 0 40px 14px rgba(255, 200, 90, 0.75);
  }
  .reglages {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
</style>
