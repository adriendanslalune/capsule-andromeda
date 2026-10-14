<script lang="ts">
  // Les instruments de bord en grand : tachymètre, compas de cap, horloge d'arrivée, et les relevés (route parcourue,
  // distance au Soleil, délai radio jusqu'à la Terre). Toucher un cadran le montre en très grand.
  import { delaiLumiere } from '../../astro/lumiere'
  import { positionCorps } from '../../astro/corps'
  import { direction, enAttenteDeFenetre, planDeVol, positionDestination, tempsRestantAVitesse, vitesseDuMoment } from '../../moteur/fusee'
  import { vitesseActuelle } from '../../moteur/partie'
  import Compas from '../cockpit/Compas.svelte'
  import Horloge from '../cockpit/Horloge.svelte'
  import Tachymetre from '../cockpit/Tachymetre.svelte'
  import { km, nombre } from '../format'
  import { jeu } from '../jeu.svelte'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const fusee = $derived(etat.fusee)
  const croisiere = $derived(vitesseActuelle(etat))
  const vitesse = $derived(vitesseDuMoment(fusee, croisiere))
  const plan = $derived(fusee.destination ? planDeVol(fusee, t, croisiere) : null)
  const vers = $derived(fusee.destination ? direction(fusee.position, plan?.point ?? positionDestination(fusee.destination, t)) : null)
  const reste = $derived(fusee.destination && !enAttenteDeFenetre(fusee) && vitesse > 0 ? tempsRestantAVitesse(fusee, t, vitesse, croisiere) : null)
  const arrivee = $derived(reste !== null ? t + reste * 1000 : null)
  const ici = $derived({ x: fusee.position.x + (fusee.ecartOrbite?.x ?? 0), y: fusee.position.y + (fusee.ecartOrbite?.y ?? 0) })
  const delaiRadio = $derived.by(() => {
    const terre = positionCorps('Terre', t)
    const s = delaiLumiere(Math.hypot(ici.x - terre.x, ici.y - terre.y))
    return s < 60 ? `${nombre(s, 1)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`
  })
  let loupe = $state<'tachymetre' | 'compas' | 'horloge' | null>(null)
</script>

<div class="instruments">
  <div class="cadrans">
    <button class="grand" aria-label="Voir le tachymètre en très grand" onclick={() => (loupe = 'tachymetre')}><Tachymetre valeur={vitesse} {croisiere} /><small>TACHYMÈTRE T-58</small></button>
    <button aria-label="Voir le compas en très grand" onclick={() => (loupe = 'compas')}><Compas cap={fusee.cap} {vers} /><small>COMPAS C-4</small></button>
    <button aria-label="Voir l’horloge en très grand" onclick={() => (loupe = 'horloge')}><Horloge instant={arrivee ?? t} arrivee={arrivee !== null} maintenant={t} /><small>CHRONO H-2</small></button>
  </div>
  <div class="releves">
    <div><small>ROUTE PARCOURUE</small><b>{km(fusee.distanceParcourue)}</b></div>
    <div><small>DISTANCE AU SOLEIL</small><b>{nombre(Math.hypot(ici.x, ici.y), 3)} UA</b></div>
    <div><small>RADIO VERS LA TERRE</small><b>{delaiRadio}</b></div>
    <div><small>VITESSE DE CROISIÈRE</small><b>{nombre(croisiere, 1)} km/s</b></div>
  </div>
  {#if loupe}
    <div class="loupe" role="presentation" onclick={() => (loupe = null)}>
      <div class="loupe-cadran">
        {#if loupe === 'tachymetre'}<Tachymetre valeur={vitesse} {croisiere} />
        {:else if loupe === 'compas'}<Compas cap={fusee.cap} {vers} />
        {:else}<Horloge instant={arrivee ?? t} arrivee={arrivee !== null} maintenant={t} />{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .instruments {
    flex: 1;
    overflow-y: auto;
    padding: 10px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .cadrans {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .cadrans button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--couleur-encre);
    border-radius: 8px;
    background: none;
    font: inherit;
    color: inherit;
  }
  .cadrans button.grand {
    grid-column: 1 / -1;
  }
  .cadrans :global(svg) {
    max-width: 130px !important;
  }
  .cadrans .grand :global(svg) {
    max-width: 210px !important;
  }
  .cadrans small {
    font-family: var(--police-machine);
    font-size: 10px;
    color: var(--couleur-encre-discrete);
  }
  .releves {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .releves div {
    display: flex;
    flex-direction: column;
    padding: 6px 9px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--points), var(--couleur-papier);
  }
  .releves small {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--couleur-encre-discrete);
  }
  .releves b {
    font-family: var(--police-chiffres);
    font-size: 16px;
  }
  .loupe {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    background: rgba(42, 30, 23, 0.72);
  }
  .loupe-cadran {
    width: min(86vw, 380px);
  }
  .loupe-cadran :global(svg) {
    max-width: none !important;
    width: 100%;
  }
  .loupe-cadran :global(figcaption) {
    font-size: 22px;
    color: var(--couleur-texte-clair);
  }
</style>
