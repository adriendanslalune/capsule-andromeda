<script lang="ts">
  // Page d'essai de la phase 0 : vérifie que toute la chaîne fonctionne.
  import { formaterHeureUTC, horlogeReelle } from '../moteur/horloge'

  let maintenant = $state(horlogeReelle())

  $effect(() => {
    const minuterie = setInterval(() => (maintenant = horlogeReelle()), 1000)
    return () => clearInterval(minuterie)
  })
</script>

<main>
  <p class="office">Office national des vols interplanétaires</p>
  <h1>C-58</h1>
  <p class="heure">{formaterHeureUTC(maintenant)}</p>
  <p class="etat">Mise en place — phase 0</p>
</main>

<style>
  main {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
  }
  .office {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--couleur-texte-discret);
  }
  h1 {
    margin: 0;
    font-family: var(--police-chiffres);
    font-size: 64px;
    letter-spacing: 0.05em;
  }
  .heure {
    margin: 0;
    font-family: var(--police-chiffres);
    font-size: 22px;
    color: var(--couleur-ok);
  }
  .etat {
    margin: 24px 0 0;
    font-size: 13px;
    color: var(--couleur-texte-discret);
  }
</style>
