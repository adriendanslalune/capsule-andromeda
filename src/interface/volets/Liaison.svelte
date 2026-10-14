<script lang="ts">
  // La liaison : la vie des autres commissionnaires. Qui est en ligne et où, le classement (trophées), les annonces
  // des dernières 48 heures, et l'accès aux télégrammes.
  import { heureLocale, nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'
  import { annonces, autresFusees, classement, nonLus, presence, telegrammesRecus } from '../reseau'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const reseau = $derived(presence(etat, t))
  const rangs = $derived(classement(etat, t))
  const fil = $derived(annonces(t))
  const enLigne = $derived(autresFusees(t).filter((f) => f.enLigne))
  const nouveaux = $derived(nonLus(etat, telegrammesRecus(etat, t)))
  const lieu = (f: { escale: string | null; systeme: string | null }) =>
    f.escale ? (f.escale === 'ISS' ? 'amarrée à l’ISS' : `autour de ${nomAstre(f.escale)}`) : f.systeme ? `près de ${nomAstre(f.systeme)}` : 'en route'
</script>

<div class="liaison">
  <button class="telegrammes" onclick={() => (jeu.volet = 'telegrammes')}>
    <span>TÉLÉGRAMMES</span>{#if nouveaux}<b>{nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}</b>{:else}<small>écrire, lire</small>{/if} ›
  </button>

  <h3>EN LIGNE <small>{reseau.total} commissionnaires{reseau.horsReseau ? ' · flotte simulée' : ''}</small></h3>
  <ul class="liste">
    <li class="moi"><span class="fanion" style="background: var(--cerise)"></span><b>{etat.nom || etat.serie}</b><span>vous</span></li>
    {#each enLigne as f}
      <li><span class="fanion" style={`background: ${f.couleur}`}></span><b>{f.nom}</b><span>{lieu(f)}</span></li>
    {/each}
  </ul>

  <h3>CLASSEMENT <small>aux trophées</small></h3>
  <ol class="classement">
    {#each rangs as c}
      <li class:moi={c.moi}>
        <span class="rang">{c.rang}</span>
        <span class="fanion" style={`background: ${c.couleur ?? 'var(--cerise)'}`}></span>
        <b>{c.nom}</b>
        <span class="score">{c.trophees}</span>
      </li>
    {/each}
  </ol>

  <h3>ANNONCES <small>48 dernières heures</small></h3>
  <ul class="annonces">
    {#each fil as a}
      <li class:majeure={a.majeure}><span class="heure">{heureLocale(a.t)}</span><span class="fanion" style={`background: ${a.couleur}`}></span>{a.texte}</li>
    {:else}
      <li class="vide">Rien à signaler.</li>
    {/each}
  </ul>
</div>

<style>
  .liaison {
    flex: 1;
    overflow-y: auto;
    padding: 10px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
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
    letter-spacing: 1px;
  }
  h3 small {
    font-family: var(--police-texte);
    font-size: 12px;
    letter-spacing: 0;
    color: var(--couleur-texte-discret);
  }
  .telegrammes {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 14px;
    border: 2px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--couleur-bandeau);
    color: var(--couleur-texte-clair);
    font: inherit;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .telegrammes b {
    color: var(--moutarde);
  }
  .telegrammes small {
    opacity: 0.75;
    font-weight: 400;
  }
  ul,
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    border-bottom: 1px dashed var(--couleur-texte-eteint);
    font-size: 14px;
  }
  li b {
    font-family: var(--police-script);
    font-weight: 400;
    font-size: 16px;
  }
  .liste li span:last-child {
    margin-left: auto;
    color: var(--couleur-texte-discret);
    font-size: 13px;
  }
  .moi {
    background: rgba(242, 181, 58, 0.25);
  }
  .rang {
    width: 22px;
    text-align: right;
    font-family: var(--police-chiffres);
    font-weight: 700;
  }
  .score {
    margin-left: auto;
    font-family: var(--police-chiffres);
    font-weight: 700;
  }
  .annonces li {
    font-family: var(--police-machine);
    font-size: 13px;
  }
  .annonces li.majeure {
    color: var(--cerise);
  }
  .heure {
    color: var(--couleur-texte-discret);
  }
  .fanion {
    flex: none;
    width: 11px;
    height: 8px;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }
  .vide {
    color: var(--couleur-texte-discret);
  }
</style>
