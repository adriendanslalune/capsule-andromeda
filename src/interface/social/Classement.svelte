<script lang="ts">
  // CLASSEMENT : tableau des commissionnaires aux trophées obtenus dans la semaine (depuis lundi), le mois, ou en
  // tout ; puis qui est en ligne en ce moment, et où.
  import type { PeriodeClassement } from '../../moteur/trophees'
  import { nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'
  import { autresFusees, classement, presence } from '../reseau'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  let periode = $state<PeriodeClassement>('semaine')
  const rangs = $derived(classement(etat, t, periode))
  const reseau = $derived(presence(etat, t))
  const enLigne = $derived(autresFusees(t).filter((f) => f.enLigne))
  const PERIODES: { id: PeriodeClassement; nom: string }[] = [
    { id: 'semaine', nom: 'SEMAINE' }, { id: 'mois', nom: 'MOIS' }, { id: 'general', nom: 'GÉNÉRAL' },
  ]
  const lieu = (f: { escale: string | null; systeme: string | null }) =>
    f.escale ? (f.escale === 'ISS' ? 'amarrée à l’ISS' : `autour de ${nomAstre(f.escale)}`) : f.systeme ? `près de ${nomAstre(f.systeme)}` : 'en route'
  const medaille = (r: number) => (r === 1 ? 'or' : r === 2 ? 'argent' : r === 3 ? 'bronze' : '')
</script>

<div class="classement">
  <div class="periodes" role="radiogroup" aria-label="Période">
    {#each PERIODES as p}
      <button role="radio" aria-checked={periode === p.id} class:enfoncee={periode === p.id} onclick={() => (periode = p.id)}>{p.nom}</button>
    {/each}
  </div>
  <p class="aide">{periode === 'semaine' ? 'Trophées obtenus depuis lundi.' : periode === 'mois' ? 'Trophées obtenus depuis le 1er du mois.' : 'Tous les trophées.'}</p>

  <!-- Tableau d'affichage. -->
  <ol class="tableau">
    {#each rangs as c}
      <li class:moi={c.moi}>
        <span class={`rang ${medaille(c.rang)}`}>{c.rang}</span>
        <span class="fanion" style={`background: ${c.couleur ?? 'var(--cerise)'}`}></span>
        <b>{c.nom}</b>{#if c.moi}<small>vous</small>{/if}
        <span class="score">{c.trophees}</span>
      </li>
    {/each}
  </ol>

  <h3>EN LIGNE <small>{reseau.total} commissionnaires{reseau.horsReseau ? ' · flotte simulée' : ''}</small></h3>
  <ul class="liste">
    {#each enLigne as f}
      <li><span class="fanion" style={`background: ${f.couleur}`}></span><b>{f.nom}</b><span>{lieu(f)}</span></li>
    {/each}
  </ul>
</div>

<style>
  .classement {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .periodes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .periodes button {
    min-height: 40px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--couleur-papier);
    box-shadow: 0 3px 0 var(--couleur-encre);
    font-family: var(--police-chiffres);
    font-weight: 700;
    letter-spacing: 1px;
  }
  .periodes button.enfoncee {
    transform: translateY(3px);
    box-shadow: none;
    background: var(--couleur-bandeau);
    color: var(--couleur-texte-clair);
  }
  .aide {
    margin: 0;
    font-size: 13px;
    color: var(--couleur-texte-discret);
  }
  ol,
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .tableau {
    border: 3px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--nuit);
    color: var(--couleur-texte-clair);
    overflow: hidden;
  }
  .tableau li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 0 10px;
    border-bottom: 1px solid rgba(250, 242, 220, 0.12);
  }
  .tableau li.moi {
    background: rgba(242, 181, 58, 0.25);
  }
  .tableau b {
    font-family: var(--police-script);
    font-weight: 400;
    font-size: 16px;
  }
  .tableau small {
    font-size: 11px;
    color: var(--moutarde);
  }
  .rang {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-family: var(--police-chiffres);
    font-weight: 700;
  }
  .rang.or {
    background: var(--moutarde);
    color: var(--couleur-encre);
  }
  .rang.argent {
    background: #c9ccd0;
    color: var(--couleur-encre);
  }
  .rang.bronze {
    background: #c98a4a;
    color: var(--couleur-encre);
  }
  .score {
    margin-left: auto;
    font-family: var(--police-chiffres);
    font-size: 17px;
    font-weight: 700;
    color: var(--menthe);
  }
  h3 {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 8px 0 0;
    padding-bottom: 3px;
    border-bottom: 1.5px solid var(--couleur-encre);
    font-family: var(--police-titre);
    font-weight: 400;
    font-size: 14px;
  }
  h3 small {
    font-family: var(--police-texte);
    font-size: 12px;
    color: var(--couleur-texte-discret);
  }
  .liste li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    border-bottom: 1px dashed var(--couleur-texte-eteint);
  }
  .liste b {
    font-family: var(--police-script);
    font-weight: 400;
    font-size: 16px;
  }
  .liste span:last-child {
    margin-left: auto;
    font-size: 13px;
    color: var(--couleur-texte-discret);
  }
  .fanion {
    flex: none;
    width: 11px;
    height: 8px;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }
</style>
