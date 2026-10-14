<script lang="ts">
  // Annonce d'un contrat accompli : télégramme de l'Office, tampon PAYÉ, prime. Les annonces se suivent si plusieurs
  // contrats ont été remplis d'un coup.
  import { dateLocale, heureLocale, nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'

  const c = $derived(jeu.annonces[0])
  const reste = $derived(jeu.annonces.length - 1)
  const suivant = () => (jeu.annonces = jeu.annonces.slice(1))
</script>

<div class="voile"></div>
<div class="annonce panneau" role="dialog" aria-label="Contrat accompli">
  <p class="office">Office national des vols interplanétaires · télégramme</p>
  <h2 class="titre-pulp">CONTRAT<br />ACCOMPLI !</h2>
  <p class="type">{c.type.toUpperCase()} — {nomAstre(c.destination).toUpperCase()}</p>
  <p class="texte">« {c.texte} »</p>
  <p class="quand">Rempli le {dateLocale(c.t)} à {heureLocale(c.t)}.</p>
  <div class="prime">
    <span>PRIME VERSÉE</span>
    <b>+{c.prime} CR</b>
  </div>
  <span class="tampon" aria-hidden="true">PAYÉ</span>
  <button class="bouton cerise" onclick={suivant}>{reste > 0 ? `SUIVANT (${reste})` : 'MERCI, L’OFFICE'}</button>
</div>

<style>
  .voile {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: var(--couleur-encre);
    opacity: 0.45;
  }
  .annonce {
    position: absolute;
    z-index: 20;
    left: 16px;
    right: 16px;
    top: 90px;
    padding: 18px 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-radius: 4px;
    box-shadow: 5px 5px 0 var(--couleur-encre);
    transform: rotate(-1deg);
    animation: arrive 0.35s cubic-bezier(0.3, 1.5, 0.6, 1);
  }
  @keyframes arrive {
    from {
      transform: rotate(-6deg) scale(0.6);
      opacity: 0;
    }
  }
  .office {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-bottom: 2px solid var(--couleur-encre);
    padding-bottom: 6px;
  }
  h2 {
    margin: 4px 0 0;
    font-size: 34px;
    line-height: 1;
  }
  .type {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .texte {
    margin: 0;
    font-family: var(--police-machine);
    font-size: 16px;
    line-height: 1.35;
  }
  .quand {
    margin: 0;
    font-size: 13px;
    color: var(--couleur-texte-discret);
  }
  .prime {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--moutarde);
    font-weight: 700;
    letter-spacing: 1px;
  }
  .prime b {
    font-family: var(--police-titre);
    font-size: 24px;
    font-weight: 400;
  }
  .tampon {
    position: absolute;
    right: 18px;
    top: 52px;
    padding: 4px 12px;
    border: 4px solid var(--cerise);
    border-radius: 8px;
    color: var(--cerise);
    font-family: var(--police-titre);
    font-size: 26px;
    transform: rotate(14deg);
    opacity: 0.85;
  }
  button {
    margin-top: 4px;
    height: 54px;
    font-family: var(--police-titre);
    font-size: 16px;
  }
</style>
