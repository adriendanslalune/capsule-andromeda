<script lang="ts">
  // Barre de bord, dans l'en-tête (toujours visible) : les trois cadrans de pilotage en miniature — vitesse, cap,
  // heure d'arrivée (ou heure actuelle) — et l'interrupteur MOTEUR avec son régime. Toucher les cadrans ouvre les
  // instruments en grand.
  import { basculerMoteur, direction, enAttenteDeFenetre, planDeVol, positionDestination, tempsRestant, vitesseDuMoment } from '../../moteur/fusee'
  import { vitesseActuelle } from '../../moteur/partie'
  import { heureLocale, nombre } from '../format'
  import { jeu } from '../jeu.svelte'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const fusee = $derived(etat.fusee)
  const croisiere = $derived(vitesseActuelle(etat))
  const vitesse = $derived(vitesseDuMoment(fusee, croisiere))
  const coupe = $derived(!!fusee.moteurCoupe)
  const attente = $derived(enAttenteDeFenetre(fusee))
  const regime = $derived(
    coupe ? (vitesse > 0 ? 'RALENTIT' : 'ARRÊT')
      : !fusee.destination || attente ? 'ATTENTE'
      : vitesse < croisiere - 0.01 ? 'ACCÉLÈRE' : vitesse > croisiere + 0.01 ? 'RALENTIT' : 'POUSSÉE',
  )
  const reste = $derived(fusee.destination && !attente ? tempsRestant(fusee, t, croisiere) : null)
  const arrivee = $derived(reste !== null ? t + reste * 1000 : null)
  const plan = $derived(fusee.destination ? planDeVol(fusee, t, croisiere) : null)
  const vers = $derived(fusee.destination ? direction(fusee.position, plan?.point ?? positionDestination(fusee.destination, t)) : null)
  // Aiguille de vitesse : échelle qui grandit avec le moteur.
  const maxVitesse = $derived.by(() => {
    for (let p = 10; ; p *= 10) for (const m of [5, 10, 20]) if (m * p >= croisiere * 1.25) return m * p
  })
  const angleVitesse = $derived(-120 + (Math.min(maxVitesse, vitesse) / maxVitesse) * 240)
  const instant = $derived(new Date(arrivee ?? t))
  const angleHeures = $derived(((instant.getHours() % 12) + instant.getMinutes() / 60) * 30)
  const angleMinutes = $derived(instant.getMinutes() * 6)

  function basculer() {
    jeu.remplacer({ ...etat, fusee: basculerMoteur(fusee) }, [coupe ? 'MOTEUR RALLUMÉ.' : 'MOTEUR COUPÉ.'])
  }
</script>

<div class="barre-bord">
  <button class="cadrans" aria-label="Ouvrir les instruments" onclick={() => (jeu.volet = 'instruments')}>
    <span class="cadran">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="1.5" />
        <line x1="12" y1="12" x2="12" y2="4" stroke="var(--cerise)" stroke-width="1.8" stroke-linecap="round" style={`transform: rotate(${angleVitesse}deg); transform-origin: 12px 12px`} />
        <circle cx="12" cy="12" r="1.8" fill="var(--couleur-encre)" />
      </svg>
      <span><b>{nombre(vitesse, 1)}</b><small>KM/S</small></span>
    </span>
    <span class="cadran">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="var(--nuit)" stroke="var(--couleur-encre)" stroke-width="1.5" />
        {#if vers !== null}<path d="M 12 1.5 l 2 3 h -4 Z" fill="var(--moutarde)" style={`transform: rotate(${90 - vers}deg); transform-origin: 12px 12px`} />{/if}
        <path d="M 12 4.5 L 14 12 L 12 10.8 L 10 12 Z" fill="var(--cerise)" style={`transform: rotate(${90 - fusee.cap}deg); transform-origin: 12px 12px`} />
      </svg>
      <span><b>{String(Math.round(fusee.cap) % 360).padStart(3, '0')}°</b><small>CAP</small></span>
    </span>
    <span class="cadran">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="1.5" />
        <line x1="12" y1="12" x2="12" y2="6.5" stroke="var(--couleur-encre)" stroke-width="1.8" stroke-linecap="round" style={`transform: rotate(${angleHeures}deg); transform-origin: 12px 12px`} />
        <line x1="12" y1="12" x2="12" y2="3.5" stroke="var(--couleur-encre)" stroke-width="1.2" stroke-linecap="round" style={`transform: rotate(${angleMinutes}deg); transform-origin: 12px 12px`} />
      </svg>
      <span><b>{heureLocale(arrivee ?? t)}</b><small>{arrivee !== null ? 'ARRIVÉE' : 'HEURE'}</small></span>
    </span>
  </button>
  <button class="moteur" class:coupe aria-pressed={!coupe} aria-label={coupe ? 'Rallumer le moteur' : 'Couper le moteur'} onclick={basculer}>
    <span class="bascule"><span class="levier"></span></span>
    <span class="texte"><b>MOTEUR {coupe ? 'OFF' : 'ON'}</b><small class:actif={!coupe && vitesse > 0}>{regime}</small></span>
  </button>
</div>

<style>
  .barre-bord {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 var(--espace) 6px;
    padding: 3px 4px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: rgba(13, 26, 20, 0.55);
    color: var(--couleur-texte-clair);
  }
  button {
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    padding: 0;
  }
  .cadrans {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
  }
  .cadran {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .cadran svg {
    flex: none;
    width: 26px;
    height: 26px;
  }
  .cadran > span {
    display: flex;
    flex-direction: column;
    line-height: 1.05;
    min-width: 0;
    text-align: left;
  }
  .cadran b {
    font-family: var(--police-chiffres);
    font-size: 14px;
    white-space: nowrap;
  }
  .cadran small {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 1px;
    opacity: 0.8;
  }
  .moteur {
    flex: none;
    display: flex;
    align-items: center;
    gap: 5px;
    min-height: 40px;
    padding: 2px 6px 2px 3px !important;
    border-radius: 6px;
    background: repeating-linear-gradient(-45deg, var(--moutarde) 0 4px, var(--couleur-encre) 4px 8px) !important;
  }
  .bascule {
    position: relative;
    width: 34px;
    height: 20px;
    border: 2px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--menthe);
  }
  .moteur.coupe .bascule {
    background: var(--couleur-papier);
  }
  .levier {
    position: absolute;
    top: 1px;
    left: calc(100% - 15px);
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--couleur-encre);
    background: var(--cerise);
    transition: left 0.15s;
  }
  .moteur.coupe .levier {
    left: 1px;
  }
  .texte {
    display: flex;
    flex-direction: column;
    line-height: 1.05;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--couleur-encre);
    text-align: left;
  }
  .texte b {
    font-family: var(--police-chiffres);
    font-size: 11px;
    letter-spacing: 0.5px;
  }
  .texte small {
    font-size: 8px;
    letter-spacing: 1px;
    opacity: 0.7;
  }
  .texte small.actif {
    color: var(--menthe);
    opacity: 1;
  }
</style>
