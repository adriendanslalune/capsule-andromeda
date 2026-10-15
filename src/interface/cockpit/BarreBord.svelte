<script lang="ts">
  // Barre de bord, dans la ligne de l'en-tête (toujours visible), entre C-58 et les crédits : vitesse, cap et heure
  // d'arrivée (ou heure actuelle), empilés sur un petit écran — les toucher ouvre les instruments en grand —, et
  // l'interrupteur MOTEUR.
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
  const reste = $derived(fusee.destination && !attente ? tempsRestant(fusee, t, croisiere) : null)
  const arrivee = $derived(reste !== null ? t + reste * 1000 : null)
  const plan = $derived(fusee.destination ? planDeVol(fusee, t, croisiere) : null)
  const vers = $derived(fusee.destination ? direction(fusee.position, plan?.point ?? positionDestination(fusee.destination, t)) : null)
  const pousse = $derived(!coupe && vitesse > 0)

  function basculer() {
    jeu.remplacer({ ...etat, fusee: basculerMoteur(fusee) }, [coupe ? 'MOTEUR RALLUMÉ.' : 'MOTEUR COUPÉ.'])
  }
</script>

<div class="barre-bord">
  <button class="valeurs" aria-label="Ouvrir les instruments" onclick={() => (jeu.volet = 'instruments')}>
    <span><b>{nombre(vitesse, 1)}</b><small>KM/S</small></span>
    <span>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        {#if vers !== null}<path d="M 6 0.5 l 1.4 2 h -2.8 Z" fill="var(--moutarde)" style={`transform: rotate(${90 - vers}deg); transform-origin: 6px 6px`} />{/if}
        <path d="M 6 2.5 L 7.5 8.5 L 6 7.5 L 4.5 8.5 Z" fill="var(--cerise)" style={`transform: rotate(${90 - fusee.cap}deg); transform-origin: 6px 6px`} />
      </svg>
      <b>{String(Math.round(fusee.cap) % 360).padStart(3, '0')}°</b>
    </span>
    <span><b>{heureLocale(arrivee ?? t)}</b><small>{arrivee !== null ? 'ARR.' : 'H.'}</small></span>
  </button>
  <button class="moteur" class:coupe aria-pressed={!coupe} aria-label={coupe ? 'Rallumer le moteur' : 'Couper le moteur'} onclick={basculer}>
    <span class="bascule"><span class="levier"></span></span>
    <small class:pousse>{coupe ? 'OFF' : 'ON'}</small>
  </button>
</div>

<style>
  .barre-bord {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: stretch;
    gap: 4px;
    max-width: 128px;
  }
  button {
    font: inherit;
    color: inherit;
    padding: 0;
  }
  .valeurs {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2px 5px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: #0d1a14;
    color: var(--menthe);
    text-shadow: 0 0 4px rgba(143, 207, 152, 0.5);
    line-height: 1.12;
  }
  .valeurs > span {
    display: flex;
    align-items: baseline;
    gap: 3px;
  }
  .valeurs b {
    font-family: var(--police-chiffres);
    font-size: 11.5px;
    font-weight: 700;
    white-space: nowrap;
  }
  .valeurs small {
    font-size: 7.5px;
    letter-spacing: 0.5px;
    opacity: 0.8;
  }
  .valeurs svg {
    width: 10px;
    height: 10px;
    align-self: center;
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
