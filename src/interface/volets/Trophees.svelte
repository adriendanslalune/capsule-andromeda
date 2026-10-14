<script lang="ts">
  // Vitrine des trophées, par rubriques repliables (voyages, astres, satellites, engins, collections, mécanique,
  // Office, bord, chasse), chacune avec sa progression. Les 452 satellites sont rangés par planète, en pastilles.
  import { CATALOGUE_TROPHEES, type CategorieTrophee, type Trophee } from '../../moteur/trophees'
  import { jeu } from '../jeu.svelte'
  import Medaille from './Medaille.svelte'

  const etat = $derived(jeu.etat!)
  const obtenus = $derived(new Set(etat.trophees))
  const total = $derived(CATALOGUE_TROPHEES.filter((t) => obtenus.has(t.id)).length)

  const RUBRIQUES: { id: CategorieTrophee; titre: string }[] = [
    { id: 'voyages', titre: 'VOYAGES' },
    { id: 'astres', titre: 'ASTRES' },
    { id: 'satellites', titre: 'SATELLITES' },
    { id: 'engins', titre: 'ENGINS' },
    { id: 'collections', titre: 'COLLECTIONS' },
    { id: 'mecanique', titre: 'MÉCANIQUE' },
    { id: 'office', titre: 'OFFICE' },
    { id: 'bord', titre: 'VIE À BORD' },
    { id: 'chasse', titre: 'CHASSE' },
  ]
  const deLaRubrique = (c: CategorieTrophee) => CATALOGUE_TROPHEES.filter((t) => t.categorie === c)
  const compte = (l: readonly Trophee[]) => l.filter((t) => obtenus.has(t.id)).length
  /** Satellites groupés par planète. */
  const groupes = $derived.by(() => {
    const g = new Map<string, Trophee[]>()
    for (const t of deLaRubrique('satellites')) g.set(t.groupe!, [...(g.get(t.groupe!) ?? []), t])
    return [...g.entries()]
  })
</script>

<div class="vitrine">
  <p class="bilan"><b>{total}</b> trophée{total > 1 ? 's' : ''} sur {CATALOGUE_TROPHEES.length}</p>

  {#each RUBRIQUES as r}
    {@const liste = deLaRubrique(r.id)}
    {@const n = compte(liste)}
    <details class="rubrique" open={r.id !== 'satellites'}>
      <summary>
        <span class="titre">{r.titre}</span>
        <span class="jauge"><span style={`width: ${(n / liste.length) * 100}%`}></span></span>
        <span class="compte">{n} / {liste.length}</span>
      </summary>
      {#if r.id === 'satellites'}
        {#each groupes as [planete, sats]}
          {@const m = compte(sats)}
          <details class="groupe">
            <summary>Satellites de {planete} <span class="compte">{m} / {sats.length}</span></summary>
            <div class="pastilles">
              {#each sats as s}<span class="pastille" class:ok={obtenus.has(s.id)}>{s.nom}</span>{/each}
            </div>
          </details>
        {/each}
      {:else}
        <div class="grille">
          {#each liste as t}
            {@const ok = obtenus.has(t.id)}
            <div class="trophee" class:ok>
              <Medaille {t} {ok} />
              <b>{t.nom}</b>
              <span>{ok ? 'OBTENU' : t.description}</span>
            </div>
          {/each}
        </div>
      {/if}
    </details>
  {/each}
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
  .rubrique {
    border-top: 2px solid var(--couleur-encre);
    padding-top: 6px;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .titre {
    font-family: var(--police-titre);
    font-size: 14px;
    letter-spacing: 1px;
  }
  .jauge {
    flex: 1;
    height: 8px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 4px;
    overflow: hidden;
  }
  .jauge span {
    display: block;
    height: 100%;
    background: var(--menthe);
  }
  .compte {
    font-family: var(--police-chiffres);
    font-weight: 700;
    font-size: 14px;
  }
  .grille {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 4px 0 8px;
  }
  .trophee {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px 8px;
    border: 2px dashed var(--couleur-texte-eteint);
    border-radius: 10px;
    text-align: center;
    color: var(--couleur-texte-discret);
  }
  .trophee :global(svg) {
    width: 52px;
    opacity: 0.55;
  }
  .trophee b {
    font-family: var(--police-titre);
    font-weight: 400;
    font-size: 11px;
    line-height: 1.15;
  }
  .trophee span {
    font-size: 11px;
    line-height: 1.2;
  }
  .trophee.ok {
    border: 2px solid var(--couleur-encre);
    background: var(--points), var(--couleur-papier);
    box-shadow: 2px 2px 0 var(--couleur-encre);
    color: var(--couleur-encre);
  }
  .trophee.ok :global(svg) {
    opacity: 1;
  }
  .trophee.ok span {
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--cerise);
  }
  .groupe summary {
    min-height: 40px;
    justify-content: space-between;
    padding: 0 4px;
    border-bottom: 1px dashed var(--couleur-encre-discrete);
    font-weight: 700;
  }
  .pastilles {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px 0 10px;
  }
  .pastille {
    padding: 2px 7px;
    border: 1.5px dashed var(--couleur-texte-eteint);
    border-radius: 10px;
    font-size: 12px;
    color: var(--couleur-texte-discret);
  }
  .pastille.ok {
    border: 1.5px solid var(--couleur-encre);
    background: var(--ciel);
    color: var(--couleur-encre);
    font-weight: 700;
  }
</style>
