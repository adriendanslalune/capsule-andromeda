<script lang="ts">
  // Portefeuille : ce que l'on possède (crédits, moteur, modules, instruments, trophées) et le journal des
  // opérations (gains et dépenses).
  import { INSTRUMENTS, MODULES_A_INSTALLER, MODULES_DE_BASE, TROPHEES } from '../../donnees/economie'
  import { estInstalle } from '../../moteur/economie'
  import { vitesse } from '../../moteur/fusee'
  import { dateLocale, heureLocale, nombre } from '../format'
  import { jeu } from '../jeu.svelte'

  const etat = $derived(jeu.etat!)
  const journal = $derived(etat.journal)
  const gagne = $derived(journal.filter((j) => j.montant > 0).reduce((s, j) => s + j.montant, 0))
  const depense = $derived(journal.filter((j) => j.montant < 0).reduce((s, j) => s - j.montant, 0))
  const croisiere = $derived(vitesse({ ameliorations: etat.ameliorations, levierAAbaisse: false, avarie: false }))
  const modules = $derived([...MODULES_DE_BASE, ...MODULES_A_INSTALLER.map((m) => m.code)])
  const tambours = $derived(String(Math.max(0, Math.floor(etat.credits))).padStart(5, '0').split(''))

  /** Opérations groupées par jour (les plus récentes d'abord). */
  const jours = $derived.by(() => {
    const groupes: { jour: string; lignes: typeof journal }[] = []
    for (const j of journal) {
      const jour = dateLocale(j.t)
      const dernier = groupes.at(-1)
      if (dernier?.jour === jour) dernier.lignes.push(j)
      else groupes.push({ jour, lignes: [j] })
    }
    return groupes
  })
</script>

<div class="portefeuille">
  <section class="solde panneau">
    <span class="etiquette-encre">SOLDE</span>
    <span class="compteur grand">{#each tambours as c}<span>{c}</span>{/each}</span>
    <span class="unite">CRÉDITS</span>
    <div class="bilan">
      <span>Gagné <b class="gain">+{gagne}</b></span>
      <span>Dépensé <b class="perte">−{depense}</b></span>
    </div>
    <small>{journal.length > 1 ? `sur les ${journal.length} dernières opérations` : 'sur la dernière opération'}</small>
  </section>

  <h3>CE QUE VOUS POSSÉDEZ</h3>
  <section class="avoirs panneau">
    <div class="ligne"><span>Moteur</span><b>{etat.ameliorations} amélioration{etat.ameliorations > 1 ? 's' : ''} · {nombre(croisiere, 1)} km/s</b></div>
    <div class="ligne colonne">
      <span>Modules</span>
      <div class="pastilles">
        {#each modules as code}<span class="pastille" class:non={!estInstalle(etat, code)}>{code}</span>{/each}
      </div>
    </div>
    <div class="ligne colonne">
      <span>Instruments de chasse</span>
      <div class="pastilles">
        {#each INSTRUMENTS as i}<span class="pastille" class:non={!estInstalle(etat, i.code)}>{i.code} {i.nom}</span>{/each}
      </div>
    </div>
    <div class="ligne"><span>Trophées</span><b>{etat.trophees.length} / {TROPHEES.length}</b></div>
    <div class="ligne"><span>Contrats remplis</span><b>{etat.stats.contrats}</b></div>
    <div class="ligne"><span>Avaries réparées</span><b>{etat.stats.pannes}</b></div>
  </section>

  <h3>JOURNAL</h3>
  {#each jours as g}
    <p class="jour">{g.jour}</p>
    {#each g.lignes as j}
      <div class="operation"><span class="heure">{heureLocale(j.t)}</span><span class="raison">{j.raison}</span><b class:gain={j.montant > 0} class:perte={j.montant < 0}>{j.montant > 0 ? '+' : ''}{j.montant}</b></div>
    {/each}
  {:else}
    <p class="vide">Aucune opération pour l’instant.</p>
  {/each}
</div>

<style>
  .portefeuille {
    flex: 1;
    overflow-y: auto;
    padding: 10px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .solde {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px;
    background: var(--moutarde);
  }
  .grand {
    font-size: 34px;
  }
  .unite {
    font-family: var(--police-titre);
    font-size: 15px;
  }
  .bilan {
    display: flex;
    gap: 18px;
    font-size: 16px;
  }
  .solde small {
    font-size: 12px;
  }
  h3 {
    margin: 10px 0 0;
    font-family: var(--police-titre);
    font-size: 15px;
    font-weight: 400;
    letter-spacing: 1px;
    color: var(--cerise);
  }
  .avoirs {
    padding: 6px 12px;
  }
  .ligne {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 0;
    border-bottom: 1.5px dashed var(--couleur-papier-fonce);
    font-size: 15px;
  }
  .ligne:last-child {
    border-bottom: 0;
  }
  .colonne {
    flex-direction: column;
  }
  .pastilles {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .pastille {
    padding: 1px 7px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--menthe);
    font-size: 13px;
    font-weight: 700;
  }
  .pastille.non {
    border-style: dashed;
    border-color: var(--couleur-texte-eteint);
    background: none;
    color: var(--couleur-texte-eteint);
  }
  .jour {
    margin: 6px 0 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--couleur-texte-discret);
  }
  .operation {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    padding: 4px 0;
    border-bottom: 1px dotted var(--couleur-texte-eteint);
    font-family: var(--police-machine);
    font-size: 14px;
  }
  .heure {
    color: var(--couleur-texte-discret);
  }
  .gain {
    color: var(--tole);
  }
  .perte {
    color: var(--cerise);
  }
  .vide {
    color: var(--couleur-texte-discret);
  }
</style>
