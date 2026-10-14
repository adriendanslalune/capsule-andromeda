<script lang="ts">
  // Rapport de vol, au retour après une absence.
  import { duree, heureLocale, km, nombre, nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'

  const r = $derived(jeu.rapport!)
  const nomDestination = (d: { type: string; astre?: string }) =>
    d.type === 'point' ? 'un point libre' : d.type === 'visiteur' ? 'l’objet inconnu' : nomAstre(d.astre!)
</script>

<div class="voile"></div>
<div class="rapport" role="dialog" aria-label="Rapport de vol">
  <p class="office">Office national des vols interplanétaires</p>
  <h2>RAPPORT DE VOL</h2>
  <p class="sous">Absence de {duree((r.jusqua - r.depuis) / 1000)}</p>
  <ul>
    <li>Distance parcourue : <b>{km(r.distanceKm)}</b></li>
    <li>Vitesse actuelle : <b>{nombre(r.vitesse, 1)} km/s</b></li>
    {#each r.arrivees as a}<li>Arrivée : <b>{nomDestination(a.destination)}</b> ({heureLocale(a.t)})</li>{/each}
    {#if r.contratsRemplis}<li>Contrats remplis : <b>{r.contratsRemplis}</b></li>{/if}
    {#if r.credits}<li>Crédits : <b>{r.credits > 0 ? '+' : ''}{r.credits} CR</b></li>{/if}
    {#each r.avaries as a}<li class="alerte">Avarie {a.modules.join(' + ')} ({heureLocale(a.t)})</li>{/each}
    {#if r.enPanne.length}<li class="alerte">À réparer : <b>{r.enPanne.join(', ')}</b></li>{/if}
  </ul>
  <button onclick={() => (jeu.rapport = null)}>REPRENDRE LES COMMANDES</button>
</div>

<style>
  .voile {
    position: absolute;
    inset: 0;
    background: var(--couleur-fond);
    opacity: 0.7;
  }
  .rapport {
    position: absolute;
    left: 14px;
    right: 14px;
    top: 60px;
    max-height: calc(100% - 100px);
    overflow-y: auto;
    background: var(--couleur-papier);
    color: var(--couleur-encre);
    border-radius: 6px;
    padding: 20px 18px;
  }
  .office {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-bottom: 2px solid var(--couleur-encre);
    padding-bottom: 6px;
  }
  h2 {
    margin: 14px 0 0;
    letter-spacing: 3px;
  }
  .sous {
    margin: 2px 0 10px;
    color: var(--couleur-encre-discrete);
  }
  ul {
    padding-left: 18px;
    font-size: 17px;
    line-height: 1.5;
  }
  .alerte {
    color: var(--couleur-danger);
  }
  button {
    width: 100%;
    height: 52px;
    border: 0;
    border-radius: 14px;
    background: var(--couleur-encre);
    color: var(--couleur-texte);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
  }
</style>
