<script lang="ts">
  // Vitrine des trophées : une médaille dessinée par trophée (planète, sceau, sonde, soucoupe couronnée…).
  // Obtenu : en couleurs, avec son ruban ; pas encore : en silhouette pointillée.
  import { TROPHEES } from '../../donnees/economie'
  import { jeu } from '../jeu.svelte'

  const etat = $derived(jeu.etat!)
  const obtenus = $derived(TROPHEES.filter((t) => etat.trophees.includes(t.id)).length)
</script>

<div class="vitrine">
  <p class="bilan"><b>{obtenus}</b> trophée{obtenus > 1 ? 's' : ''} sur {TROPHEES.length}</p>
  <div class="grille">
    {#each TROPHEES as t}
      {@const ok = etat.trophees.includes(t.id)}
      <div class="trophee" class:ok>
        <svg viewBox="0 0 80 96" aria-hidden="true">
          <!-- Ruban. -->
          <path d="M 28 4 L 36 40 L 44 40 L 52 4 Z" fill={ok ? 'var(--cerise)' : 'none'} stroke="var(--couleur-encre)" stroke-width="2" />
          <path d="M 36 4 L 40 40 L 44 4" fill="none" stroke={ok ? 'var(--couleur-papier)' : 'var(--couleur-encre)'} stroke-width="1.5" />
          <!-- Médaille. -->
          <circle cx="40" cy="62" r="28" fill={ok ? 'var(--moutarde)' : 'none'} stroke="var(--couleur-encre)" stroke-width="2.5" />
          <circle cx="40" cy="62" r="22" fill={ok ? 'var(--couleur-papier)' : 'none'} stroke="var(--couleur-encre)" stroke-width="1.5" stroke-dasharray={ok ? '' : '3 2'} />
          <g fill="none" stroke="var(--couleur-encre)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
            {#if t.id === 'premier'}
              <!-- Contrat et son sceau. -->
              <path d="M 31 50 H 45 L 50 55 V 74 H 31 Z" />
              <path d="M 35 58 H 45 M 35 63 H 45" stroke-width="1.4" />
              <circle cx="46" cy="72" r="5" fill={ok ? 'var(--cerise)' : 'none'} />
            {:else if t.id === 'mars'}
              <circle cx="40" cy="62" r="13" fill={ok ? '#e07a5c' : 'none'} />
              <path d="M 31 57 Q 38 60 46 55 M 33 68 Q 40 66 48 70" stroke-width="1.4" />
            {:else if t.id === 'jupiter'}
              <circle cx="40" cy="62" r="14" fill={ok ? '#dcb184' : 'none'} />
              <path d="M 27 57 H 53 M 26 63 H 54 M 28 69 H 52" stroke-width="1.4" />
              <ellipse cx="45" cy="66" rx="3.5" ry="2" fill={ok ? 'var(--cerise)' : 'none'} stroke-width="1.2" />
            {:else if t.id === 'neptune'}
              <circle cx="40" cy="62" r="13" fill={ok ? '#7f9fd6' : 'none'} />
              <path d="M 30 60 Q 40 56 50 60" stroke-width="1.4" />
            {:else if t.id === 'kuiper'}
              <!-- Ceinture de petits corps. -->
              <ellipse cx="40" cy="62" rx="17" ry="7" stroke-width="1.4" stroke-dasharray="2 3" />
              <circle cx="40" cy="62" r="3" fill={ok ? 'var(--moutarde)' : 'none'} />
              <circle cx="26" cy="60" r="2" /><circle cx="54" cy="65" r="2.5" /><circle cx="46" cy="55" r="1.6" />
            {:else if t.id === 'helio'}
              <!-- Soleil et la bulle de son vent. -->
              <circle cx="40" cy="62" r="5" fill={ok ? 'var(--moutarde)' : 'none'} />
              <circle cx="40" cy="62" r="16" stroke-width="1.4" stroke-dasharray="4 2" />
              <path d="M 40 52 V 49 M 40 72 V 75 M 30 62 H 27 M 50 62 H 53" stroke-width="1.4" />
            {:else if t.id === 'voyager'}
              <!-- La sonde, son antenne. -->
              <path d="M 33 56 Q 40 46 47 56 Z" fill={ok ? 'var(--couleur-papier)' : 'none'} />
              <rect x="37" y="57" width="6" height="7" />
              <path d="M 40 64 L 40 72 M 30 66 L 50 66 M 27 64 L 27 68 M 53 64 L 53 68" stroke-width="1.4" />
            {:else}
              <!-- Soucoupe couronnée : le premier contact. -->
              <ellipse cx="40" cy="66" rx="16" ry="5" fill={ok ? 'var(--menthe)' : 'none'} />
              <path d="M 31 64 Q 40 52 49 64" fill={ok ? 'var(--ciel)' : 'none'} />
              <path d="M 32 50 L 34 43 L 37 48 L 40 41 L 43 48 L 46 43 L 48 50 Z" fill={ok ? 'var(--moutarde)' : 'none'} stroke-width="1.6" />
            {/if}
          </g>
        </svg>
        <b>{t.nom}</b>
        <span>{ok ? 'OBTENU' : t.description}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .vitrine {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bilan {
    margin: 4px 0 0;
    font-size: 16px;
    text-align: center;
  }
  .bilan b {
    font-family: var(--police-titre);
    font-size: 22px;
    color: var(--cerise);
  }
  .grille {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .trophee {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 6px 10px;
    border: 2px dashed var(--couleur-texte-eteint);
    border-radius: 12px;
    text-align: center;
    color: var(--couleur-texte-discret);
  }
  .trophee svg {
    width: 70px;
    opacity: 0.55;
  }
  .trophee b {
    font-family: var(--police-titre);
    font-weight: 400;
    font-size: 13px;
    line-height: 1.15;
  }
  .trophee span {
    font-size: 12px;
  }
  .trophee.ok {
    border: var(--trait) solid var(--couleur-encre);
    background: var(--points), var(--couleur-papier);
    box-shadow: var(--ombre);
    color: var(--couleur-encre);
  }
  .trophee.ok svg {
    opacity: 1;
  }
  .trophee.ok span {
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--cerise);
  }
</style>
