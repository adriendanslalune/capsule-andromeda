<script lang="ts">
  // Barre de bord, dans la ligne de l'en-tête (toujours visible), entre C-58 et les crédits : deux mini cadrans —
  // vitesse et cap (les toucher ouvre les instruments en grand) — et l'interrupteur MOTEUR. L'heure d'arrivée est
  // sur l'écran de la caméra.
  import { basculerMoteur, direction, planDeVol, positionDestination, vitesseDuMoment } from '../../moteur/fusee'
  import { vitesseActuelle } from '../../moteur/partie'
  import { nombre } from '../format'
  import { jeu } from '../jeu.svelte'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const fusee = $derived(etat.fusee)
  const croisiere = $derived(vitesseActuelle(etat))
  const vitesse = $derived(vitesseDuMoment(fusee, croisiere))
  const coupe = $derived(!!fusee.moteurCoupe)
  const plan = $derived(fusee.destination ? planDeVol(fusee, t, croisiere) : null)
  const vers = $derived(fusee.destination ? direction(fusee.position, plan?.point ?? positionDestination(fusee.destination, t)) : null)
  // Aiguille de vitesse : échelle qui grandit avec le moteur.
  const maxVitesse = $derived.by(() => {
    for (let p = 10; ; p *= 10) for (const m of [5, 10, 20]) if (m * p >= croisiere * 1.25) return m * p
  })
  const angleVitesse = $derived(-120 + (Math.min(maxVitesse, vitesse) / maxVitesse) * 240)

  function basculer() {
    jeu.remplacer({ ...etat, fusee: basculerMoteur(fusee) }, [coupe ? 'MOTEUR RALLUMÉ.' : 'MOTEUR COUPÉ.'])
  }
</script>

<div class="barre-bord">
  <button class="cadrans" aria-label="Ouvrir les instruments" onclick={() => (jeu.volet = 'instruments')}>
    <span class="cadran">
      <svg viewBox="0 0 30 30" aria-hidden="true">
        <circle cx="15" cy="15" r="13.5" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="2" />
        <path d="M 6.3 20 A 10 10 0 1 1 23.7 20" fill="none" stroke="var(--couleur-encre)" stroke-width="2.5" />
        <line x1="15" y1="15" x2="15" y2="5" stroke="var(--cerise)" stroke-width="2" stroke-linecap="round" style={`transform: rotate(${angleVitesse}deg); transform-origin: 15px 15px; transition: transform 1s linear`} />
        <circle cx="15" cy="15" r="2.2" fill="var(--couleur-encre)" />
      </svg>
      <b>{nombre(vitesse, 1)}</b>
    </span>
    <span class="cadran">
      <svg viewBox="0 0 30 30" aria-hidden="true">
        <circle cx="15" cy="15" r="13.5" fill="var(--nuit)" stroke="var(--couleur-encre)" stroke-width="2" />
        {#each [0, 90, 180, 270] as a}<line x1="15" y1="3" x2="15" y2="5.5" stroke="var(--couleur-papier)" stroke-width="1.5" style={`transform: rotate(${a}deg); transform-origin: 15px 15px`} />{/each}
        {#if vers !== null}<path d="M 15 2 l 2.2 3.2 h -4.4 Z" fill="var(--moutarde)" style={`transform: rotate(${90 - vers}deg); transform-origin: 15px 15px`} />{/if}
        <path d="M 15 6 L 17.3 15 L 15 13.3 L 12.7 15 Z" fill="var(--cerise)" style={`transform: rotate(${90 - fusee.cap}deg); transform-origin: 15px 15px; transition: transform 0.4s ease-out`} />
        <circle cx="15" cy="15" r="1.6" fill="var(--couleur-papier)" />
      </svg>
      <b>{String(Math.round(fusee.cap) % 360).padStart(3, '0')}°</b>
    </span>
  </button>
  <button class="moteur" class:coupe aria-pressed={!coupe} aria-label={coupe ? 'Rallumer le moteur' : 'Couper le moteur'} onclick={basculer}>
    <span class="bascule"><span class="levier"></span></span>
    <small class:pousse={!coupe && vitesse > 0}>{coupe ? 'OFF' : 'ON'}</small>
  </button>
</div>

<style>
  .barre-bord {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: stretch;
    gap: 4px;
    max-width: 132px;
  }
  button {
    font: inherit;
    color: inherit;
    padding: 0;
  }
  .cadrans {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2px;
    padding: 2px 3px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: rgba(13, 26, 20, 0.55);
    color: var(--couleur-texte-clair);
  }
  .cadran {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
    min-width: 0;
  }
  .cadran svg {
    width: 30px;
    height: 30px;
  }
  .cadran b {
    font-family: var(--police-chiffres);
    font-size: 10px;
    white-space: nowrap;
  }
  .moteur {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 34px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: repeating-linear-gradient(-45deg, var(--moutarde) 0 4px, var(--couleur-encre) 4px 8px);
  }
  .bascule {
    position: relative;
    width: 16px;
    height: 26px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--menthe);
  }
  .moteur.coupe .bascule {
    background: var(--couleur-papier);
  }
  .levier {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--couleur-encre);
    background: var(--cerise);
    transition: top 0.15s;
  }
  .moteur.coupe .levier {
    top: calc(100% - 12px);
  }
  .moteur small {
    padding: 0 3px;
    border-radius: 2px;
    background: var(--couleur-encre);
    color: var(--couleur-texte-clair);
    font-family: var(--police-chiffres);
    font-size: 8px;
    font-weight: 700;
  }
  .moteur small.pousse {
    color: var(--menthe);
  }
</style>
