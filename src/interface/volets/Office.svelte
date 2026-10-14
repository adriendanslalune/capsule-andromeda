<script lang="ts">
  // Volet de l'Office : caisse, prochaine amélioration ; onglets Contrats, Atelier, Trophées.
  import { CONTRATS, INSTRUMENTS, TROPHEES } from '../../donnees/economie'
  import {
    abandonnerContrat,
    accepterContrat,
    acheterAmelioration,
    contratsProposes,
    coutAmelioration,
    destinationDuContrat,
    estInstalle,
    installer,
    primeContrat,
    prochainModule,
  } from '../../moteur/economie'
  import { choisirDestination, distance, optionsDeDepart, positionAstre } from '../../moteur/fusee'
  import { vitesseActuelle } from '../../moteur/partie'
  import { duree, heureLocale, nombre, ua } from '../format'
  import { jeu } from '../jeu.svelte'

  let onglet = $state<'contrats' | 'atelier' | 'trophees'>('contrats')
  let refus = $state<string | null>(null)

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const v = $derived(vitesseActuelle(etat))
  const proposes = $derived(contratsProposes(etat, t))
  const cout = $derived(coutAmelioration(etat.ameliorations))
  const module = $derived(prochainModule(etat))

  function resultat(r: { etat: typeof etat; refus: string | null }, message: string) {
    refus = r.refus
    if (!r.refus) jeu.remplacer(r.etat, [message])
  }
  const dureeVers = (astre: string) => {
    const o = optionsDeDepart(etat.fusee, { type: 'astre', astre }, t, v)
    return o.maintenant ? duree((o.maintenant.arrivee - t) / 1000) : '—'
  }
</script>

<div class="office">
  <div class="onglets" role="tablist">
    <button role="tab" aria-selected={onglet === 'contrats'} class:actif={onglet === 'contrats'} onclick={() => (onglet = 'contrats')}>CONTRATS</button>
    <button role="tab" aria-selected={onglet === 'atelier'} class:actif={onglet === 'atelier'} onclick={() => (onglet = 'atelier')}>ATELIER</button>
    <button role="tab" aria-selected={onglet === 'trophees'} class:actif={onglet === 'trophees'} onclick={() => (onglet = 'trophees')}>TROPHÉES</button>
  </div>

  <div class="caisse">
    <div class="col"><span class="etiquette">CAISSE</span><span class="montant">{etat.credits} CR</span></div>
    <div class="col droite"><span class="etiquette">PROCHAINE AMÉLIORATION</span><span class="fort">{cout} CR · +10 % de vitesse</span></div>
  </div>

  {#if refus}<p class="refus" role="alert">{refus}</p>{/if}

  <div class="liste">
    {#if onglet === 'contrats'}
      {#if etat.contrats.length}
        <h3>EN COURS ({etat.contrats.length}/{CONTRATS.maxEnCours})</h3>
        {#each etat.contrats as c}
          <article class="contrat encours">
            <span class="type">{c.type}</span>
            <span class="texte">{c.texte}</span>
            <div class="infos">
              <span class="prime">{c.prime} CR</span>
              <span class="chiffres">{ua(distance(etat.fusee.position, positionAstre(c.destination, t)))}</span>
              <span class="boutons">
                <button class="petit" onclick={() => jeu.remplacer({ ...etat, fusee: choisirDestination(etat.fusee, destinationDuContrat(c)) }, [`NOUVEAU CAP : ${c.destination.toUpperCase()}.`])}>Y ALLER</button>
                <button class="petit clair" onclick={() => resultat(abandonnerContrat(etat, c.id), 'CONTRAT ABANDONNÉ.')}>ABANDONNER</button>
              </span>
            </div>
          </article>
        {/each}
      {/if}
      <h3>PROPOSÉS</h3>
      {#each proposes as c}
        <article class="contrat">
          <span class="type">{c.type}</span>
          <span class="texte">{c.texte}</span>
          <div class="infos">
            <span class="prime">{primeContrat(etat, c, t)} CR</span>
            <span class="chiffres">{ua(distance(etat.fusee.position, positionAstre(c.destination, t)))} · {dureeVers(c.destination)}</span>
            <span class="boutons">
              <button class="petit" disabled={etat.contrats.length >= CONTRATS.maxEnCours}
                onclick={() => resultat(accepterContrat(etat, c.id, t), `CONTRAT ACCEPTÉ : ${c.texte.toUpperCase()}`)}>ACCEPTER</button>
            </span>
          </div>
        </article>
      {:else}
        <p class="vide">Plus de contrats cette semaine. Nouveaux contrats lundi.</p>
      {/each}
    {:else if onglet === 'atelier'}
      <article class="contrat">
        <span class="type">MOTEUR</span>
        <span class="texte">Amélioration n° {etat.ameliorations + 1} · vitesse ×{nombre(1.1 ** etat.ameliorations, 2)} → ×{nombre(1.1 ** (etat.ameliorations + 1), 2)}</span>
        <div class="infos"><span class="prime">{cout} CR</span>
          <span class="boutons"><button class="petit" disabled={etat.credits < cout} onclick={() => resultat(acheterAmelioration(etat, t), `ATELIER : AMÉLIORATION N° ${etat.ameliorations + 1} INSTALLÉE.`)}>AMÉLIORER</button></span>
        </div>
      </article>
      {#if module}
        <article class="contrat">
          <span class="type">MODULE</span>
          <span class="texte">{module.code} {module.nom}</span>
          <div class="infos"><span class="prime">{module.prix} CR</span>
            <span class="boutons"><button class="petit" disabled={etat.credits < module.prix} onclick={() => resultat(installer(etat, module.code, t), `ATELIER : MODULE ${module.code} INSTALLÉ.`)}>INSTALLER</button></span>
          </div>
        </article>
      {:else}
        <p class="vide">Tous les modules sont installés.</p>
      {/if}
      <h3>INSTRUMENTS DE CHASSE</h3>
      {#each INSTRUMENTS as i}
        <article class="contrat">
          <span class="type">{i.code}</span>
          <span class="texte">{i.nom}</span>
          <div class="infos">
            {#if estInstalle(etat, i.code)}<span class="installe">installé</span>
            {:else}
              <span class="prime">{i.prix} CR</span>
              <span class="boutons"><button class="petit" disabled={etat.credits < i.prix || (i.exige !== null && !estInstalle(etat, i.exige))}
                onclick={() => resultat(installer(etat, i.code, t), `ATELIER : ${i.code} INSTALLÉ.`)}>INSTALLER</button></span>
            {/if}
          </div>
        </article>
      {/each}
      <h3>JOURNAL</h3>
      {#each etat.journal.slice(0, 20) as j}
        <div class="journal"><span>{heureLocale(j.t)} {j.raison}</span><b class:gain={j.montant > 0}>{j.montant > 0 ? '+' : ''}{j.montant}</b></div>
      {:else}
        <p class="vide">Aucune opération.</p>
      {/each}
    {:else}
      {#each TROPHEES as tr}
        <div class="trophee" class:obtenu={etat.trophees.includes(tr.id)}><b>{tr.nom}</b><span>{tr.description}</span></div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .office {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .onglets {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin: 12px 16px 0;
    border-bottom: 3px solid var(--couleur-encre);
  }
  .onglets button {
    min-height: 40px;
    border: 2px solid var(--couleur-encre);
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    background: var(--couleur-papier-fonce);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .onglets button.actif {
    background: var(--cerise);
    color: #fff6e6;
  }
  .caisse {
    margin: 12px 16px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--moutarde);
    color: var(--couleur-encre);
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 14px;
    padding: 12px 16px;
    box-shadow: var(--ombre);
  }
  .col {
    display: flex;
    flex-direction: column;
  }
  .droite {
    align-items: flex-end;
  }
  .etiquette {
    font-size: 12px;
    letter-spacing: 1.5px;
    color: var(--couleur-texte-discret);
  }
  .montant {
    font-family: var(--police-titre);
    font-size: 24px;
  }
  .fort {
    font-size: 15px;
    font-weight: 700;
  }
  .refus {
    margin: 8px 16px 0;
    color: var(--couleur-danger);
    font-weight: 700;
  }
  .liste {
    flex: 1;
    overflow-y: auto;
    padding: 6px 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  h3 {
    margin: 10px 0 0;
    font-family: var(--police-titre);
    font-size: 15px;
    font-weight: 400;
    letter-spacing: 1px;
    color: var(--cerise);
  }
  .contrat {
    background: #fffaf0;
    background-image: repeating-linear-gradient(180deg, transparent 0 23px, rgba(31, 95, 168, 0.12) 23px 24px);
    border: 0;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 6px;
    box-shadow: var(--ombre);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .contrat.encours {
    border-color: var(--cerise);
    box-shadow: 3px 3px 0 var(--cerise);
  }
  .type {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #7a7062;
  }
  .texte {
    font-family: var(--police-machine);
    font-size: 16px;
    line-height: 1.3;
  }
  .infos {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .prime {
    padding: 2px 8px;
    border-radius: 2px;
    background: var(--moutarde);
    box-shadow: 0 0 0 1.5px var(--couleur-encre);
    font-size: 13px;
    font-weight: 700;
  }
  .chiffres {
    font-family: var(--police-chiffres);
    font-size: 12px;
    color: var(--couleur-encre-discrete);
  }
  .boutons {
    margin-left: auto;
    display: flex;
    gap: 6px;
  }
  .petit {
    min-height: 36px;
    padding: 0 12px;
    border-radius: 10px;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--sarcelle);
    color: var(--couleur-papier);
    box-shadow: 0 3px 0 var(--couleur-encre);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .petit.clair {
    background: var(--couleur-papier);
    color: var(--couleur-encre);
  }
  .petit:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--couleur-encre);
  }
  .petit:disabled {
    opacity: 0.35;
  }
  .installe {
    margin-left: auto;
    font-weight: 700;
    color: #4f7a4c;
  }
  .vide {
    color: var(--couleur-encre-discrete);
  }
  .journal {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    border-bottom: 1px dotted #c9bb98;
    padding-bottom: 4px;
  }
  .journal b {
    color: var(--couleur-danger);
  }
  .journal b.gain {
    color: #4f7a4c;
  }
  .trophee {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px dashed #c9bb98;
    opacity: 0.5;
  }
  .trophee.obtenu {
    opacity: 1;
    border: 2px solid var(--couleur-or);
    background: #fff4d6;
  }
</style>
