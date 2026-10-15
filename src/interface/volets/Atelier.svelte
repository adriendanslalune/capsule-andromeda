<script lang="ts">
  // ATELIER, lisible d'un coup d'œil, comme les contrats : un bandeau de résumé (caisse, moteur, modules), puis des
  // fiches toutes bâties pareil — à gauche la pièce, au centre son nom en gros, à droite le prix en gros, dessous ce
  // qu'elle change et l'unique bouton utile (ou ce qu'il manque pour l'acheter).
  import { DESCRIPTIONS_ATELIER, INSTRUMENTS, MODULES_A_INSTALLER, MODULES_DE_BASE, MODULES_PAR_AMELIORATIONS } from '../../donnees/economie'
  import { PANNES } from '../../donnees/reglages'
  import { acheterAmelioration, coutAmelioration, estInstalle, installer, prochainModule } from '../../moteur/economie'
  import { optionsDeDepart, vitesse as vitesseMoteur } from '../../moteur/fusee'
  import { duree, nombre, nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const cout = $derived(coutAmelioration(etat.ameliorations))
  const module = $derived(prochainModule(etat))
  const tousModules = [...MODULES_DE_BASE, ...MODULES_A_INSTALLER.map((m) => m.code)]
  const installes = $derived(tousModules.filter((c) => estInstalle(etat, c)).length)
  const aVenir = $derived(MODULES_A_INSTALLER.filter((m) => !estInstalle(etat, m.code) && m.code !== module?.code))
  const dejaInstalles = $derived(MODULES_A_INSTALLER.filter((m) => estInstalle(etat, m.code)))

  // Effet de la prochaine amélioration : vitesse de croisière avant / après, et un voyage d'exemple.
  const avant = $derived(vitesseMoteur({ ameliorations: etat.ameliorations, levierAAbaisse: false, avarie: false }))
  const apres = $derived(vitesseMoteur({ ameliorations: etat.ameliorations + 1, levierAAbaisse: false, avarie: false }))
  const exemple = $derived(etat.fusee.destination?.type === 'astre' ? etat.fusee.destination.astre : 'Mars')
  const voyage = (v: number) => {
    const o = optionsDeDepart(etat.fusee, { type: 'astre', astre: exemple }, t, v)
    return o.maintenant ? (o.maintenant.arrivee - t) / 1000 : null
  }
  const voyageAvant = $derived(voyage(avant))
  const voyageApres = $derived(voyage(apres))
  /** Prochain palier de cascade (nombre d'améliorations), s'il en reste un. */
  const palier = $derived(PANNES.paliersCascade.find((n) => n > etat.ameliorations) ?? null)
  const manque = (prix: number) => Math.max(0, prix - etat.credits)

  let refus = $state<string | null>(null)
  function resultat(r: { etat: typeof etat; refus: string | null }, message: string) {
    refus = r.refus
    if (r.refus) return
    // Un module débloqué par cette amélioration ?
    const debloques = r.etat.modulesInstalles.filter((c) => !etat.modulesInstalles.includes(c) && MODULES_A_INSTALLER.some((m) => m.code === c))
    jeu.remplacer(r.etat, [message, ...debloques.map((c) => `ATELIER : NOUVEAU MODULE ${c} DÉBLOQUÉ ET INSTALLÉ AU TABLEAU DE BORD.`)])
  }
</script>

{#snippet bouton(libelle: string, prix: number, action: () => void, bloque: string | null = null)}
  {#if bloque}<span class="bloque">{bloque}</span>
  {:else if manque(prix) > 0}<span class="manque">il manque {manque(prix)} CR</span>
  {:else}<button class="principal" onclick={action}>{libelle}</button>{/if}
{/snippet}

<div class="atelier">
  <!-- Résumé. -->
  <div class="resume">
    <button onclick={() => (jeu.volet = 'portefeuille')}><small>CAISSE ›</small><b>{etat.credits}<span> CR</span></b></button>
    <div><small>MOTEUR</small><b>{nombre(avant, 1)}<span> km/s</span></b></div>
    <div><small>MODULES</small><b>{installes}<span>/{tousModules.length}</span></b></div>
  </div>
  {#if refus}<p class="refus" role="alert">{refus}</p>{/if}

  <!-- Moteur. -->
  <h3>MOTEUR <small>{etat.ameliorations} amélioration{etat.ameliorations > 1 ? 's' : ''}</small></h3>
  <div class="fiche">
    <span class="piece">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M13 2 L5 13 H11 L10 22 L19 10 H13 Z" /></svg>
      <small>N° {etat.ameliorations + 1}</small>
    </span>
    <span class="nom">Amélioration</span>
    <span class="prix">{cout}<small> CR</small></span>
    <span class="effet"><b>{nombre(avant, 1)} → {nombre(apres, 1)} km/s</b> (+10 %){#if voyageAvant !== null && voyageApres !== null} · vers {nomAstre(exemple)} : {duree(voyageAvant)} → <b>{duree(voyageApres)}</b>{/if}</span>
    {#if palier !== null}<span class="note">À {palier} améliorations, les avaries pourront arriver en cascade (plusieurs à la fois).</span>{/if}
    {#if module && module.ameliorations === etat.ameliorations + 1}<span class="note">Cette amélioration débloque le module <b>{module.code}</b> ({module.nom}).</span>{/if}
    <span class="actions">{@render bouton('AMÉLIORER', cout, () => resultat(acheterAmelioration(etat, t), `ATELIER : AMÉLIORATION N° ${etat.ameliorations + 1} INSTALLÉE.`))}</span>
  </div>

  <!-- Modules. -->
  <h3>MODULES <small>{installes} sur {tousModules.length} au tableau de bord · un toutes les {MODULES_PAR_AMELIORATIONS} améliorations du moteur</small></h3>
  {#if module}
    {@const reste = module.ameliorations - etat.ameliorations}
    <div class="fiche">
      <span class="piece"><span class="code">{module.code}</span><small>SUIVANT</small></span>
      <span class="nom">{module.nom}</span>
      <span class="prix palier">{module.ameliorations}<small>ᵉ amél.</small></span>
      <span class="effet">{DESCRIPTIONS_ATELIER[module.code]}</span>
      <span class="actions"><span class="bloque">débloqué à la {module.ameliorations}ᵉ amélioration · encore {reste}</span></span>
    </div>
    {#each aVenir as m}
      <div class="ligne-a-venir">
        <span class="code petit">{m.code}</span><span class="nom-a-venir">{m.nom}</span>
        <span class="apres">à la</span><b>{m.ameliorations}ᵉ amél.</b>
      </div>
    {/each}
  {:else}
    <p class="complet">Tous les modules sont installés.</p>
  {/if}
  {#if dejaInstalles.length}
    <p class="installes"><small>INSTALLÉS</small>{#each [...MODULES_DE_BASE, ...dejaInstalles.map((m) => m.code)] as c}<span class="code petit ok">{c}</span>{/each}</p>
  {/if}

  <!-- Instruments de chasse. -->
  <h3>INSTRUMENTS DE CHASSE</h3>
  {#each INSTRUMENTS as i}
    {@const ok = estInstalle(etat, i.code)}
    {@const exige = i.exige !== null && !estInstalle(etat, i.exige) ? i.exige : null}
    <div class="fiche" class:grise={ok}>
      <span class="piece"><span class="code">{i.code}</span></span>
      <span class="nom">{i.nom}</span>
      <span class="prix">{#if ok}<span class="pose">INSTALLÉ</span>{:else}{i.prix}<small> CR</small>{/if}</span>
      <span class="effet">{DESCRIPTIONS_ATELIER[i.code]}</span>
      {#if !ok}<span class="actions">{@render bouton('INSTALLER', i.prix, () => resultat(installer(etat, i.code, t), `ATELIER : ${i.code} INSTALLÉ.`), exige ? `installer ${exige} d’abord` : null)}</span>{/if}
    </div>
  {/each}
</div>

<style>
  .atelier {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px var(--espace) 16px;
  }
  .resume {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 3px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--nuit);
    color: var(--couleur-texte-clair);
    overflow: hidden;
  }
  .resume > * {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    border: 0;
    border-right: 1px solid rgba(250, 242, 220, 0.15);
    background: none;
    color: inherit;
    font: inherit;
  }
  .resume > :last-child {
    border-right: 0;
  }
  .resume small {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #9cc7a4;
  }
  .resume b {
    font-family: var(--police-chiffres);
    font-size: 22px;
    color: var(--moutarde);
  }
  .resume b span {
    font-size: 13px;
    color: var(--couleur-texte-clair);
  }
  h3 {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0 0;
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
  /* Fiche : pièce | nom | prix ; effet ; note ; bouton. */
  .fiche {
    display: grid;
    grid-template-columns: 44px 1fr auto;
    grid-template-areas: 'piece nom prix' 'piece effet effet' 'piece note note' 'actions actions actions';
    column-gap: 8px;
    row-gap: 3px;
    align-items: center;
    padding: 8px 10px;
    border: 2px solid var(--couleur-encre);
    border-left: 6px solid var(--couleur-bandeau);
    border-radius: 8px;
    background: var(--couleur-papier);
    box-shadow: 2px 2px 0 var(--couleur-encre);
  }
  .fiche.grise {
    border-left-color: var(--menthe);
    opacity: 0.75;
  }
  .piece {
    grid-area: piece;
    align-self: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .piece svg {
    width: 28px;
    height: 28px;
  }
  .piece small {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--couleur-encre-discrete);
  }
  .code {
    padding: 2px 4px;
    border: 2px solid var(--couleur-encre);
    border-radius: 5px;
    background: var(--couleur-papier-fonce);
    font-family: var(--police-chiffres);
    font-weight: 700;
    font-size: 12px;
  }
  .code.petit {
    border-width: 1.5px;
    font-size: 11px;
  }
  .code.ok {
    background: var(--menthe);
  }
  .nom {
    grid-area: nom;
    font-family: var(--police-titre);
    font-size: 17px;
    line-height: 1.1;
  }
  .prix {
    grid-area: prix;
    font-family: var(--police-chiffres);
    font-weight: 700;
    font-size: 22px;
    color: var(--cerise);
  }
  .prix small {
    font-size: 12px;
  }
  .pose {
    padding: 3px 7px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--menthe);
    color: var(--couleur-encre);
    font-size: 12px;
    letter-spacing: 1px;
  }
  .effet {
    grid-area: effet;
    font-size: 13px;
  }
  .note {
    grid-area: note;
    font-size: 12px;
    color: var(--couleur-texte-discret);
  }
  .actions {
    grid-area: actions;
    display: flex;
    justify-content: flex-end;
    margin-top: 3px;
  }
  .principal {
    min-height: 40px;
    padding: 0 16px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--couleur-bandeau);
    color: var(--couleur-texte-clair);
    box-shadow: 0 3px 0 var(--couleur-encre);
    font-family: var(--police-chiffres);
    font-weight: 700;
    letter-spacing: 1px;
  }
  .principal:active {
    transform: translateY(3px);
    box-shadow: none;
  }
  .manque,
  .bloque {
    display: flex;
    align-items: center;
    min-height: 40px;
    padding: 0 10px;
    border: 1.5px dashed var(--couleur-texte-eteint);
    border-radius: 8px;
    font-family: var(--police-chiffres);
    font-weight: 700;
    color: var(--couleur-texte-discret);
  }
  .ligne-a-venir {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 0 6px;
    border-bottom: 1px dashed var(--couleur-texte-eteint);
    color: var(--couleur-texte-discret);
    font-size: 13px;
  }
  .nom-a-venir {
    flex: 1;
    min-width: 0;
  }
  .apres {
    font-size: 11px;
  }
  .ligne-a-venir b {
    font-family: var(--police-chiffres);
  }
  .installes {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin: 0;
  }
  .installes small {
    margin-right: 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--couleur-encre-discrete);
  }
  .complet {
    margin: 0;
    font-weight: 700;
    color: #3d7a46;
  }
  .refus {
    margin: 0;
    color: var(--cerise);
    font-weight: 700;
  }
</style>
