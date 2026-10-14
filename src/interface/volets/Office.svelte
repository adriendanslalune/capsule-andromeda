<script lang="ts">
  // Volet de l'Office : caisse, prochaine amélioration ; une page à la fois (contrats, atelier ou trophées), choisie
  // par le bouton du cockpit.
  import { CONTRATS, DESCRIPTIONS_ATELIER, INSTRUMENTS, MODULES_A_INSTALLER, PRIMES_REPARATION } from '../../donnees/economie'
  import { PANNES } from '../../donnees/reglages'
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
  import { choisirDestination, distance, optionsDeDepart, positionAstre, vitesse as vitesseMoteur } from '../../moteur/fusee'
  import { vitesseActuelle } from '../../moteur/partie'
  import { dateLocale, duree, heureLocale, nombre, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'
  import ApercuCarte from './ApercuCarte.svelte'
  import Trophees from './Trophees.svelte'

  let { onglet }: { onglet: 'contrats' | 'atelier' | 'trophees' } = $props()

  let refus = $state<string | null>(null)
  /** Aperçu de la carte pour un contrat touché (hors de ses boutons). */
  let apercu = $state<{ astre: string; titre: string } | null>(null)
  function montrer(e: MouseEvent, astre: string, titre: string) {
    if ((e.target as Element).closest('button')) return
    apercu = { astre, titre }
  }

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const v = $derived(vitesseActuelle(etat))
  const proposes = $derived(contratsProposes(etat, t))
  const cout = $derived(coutAmelioration(etat.ameliorations))
  const module = $derived(prochainModule(etat))

  // Effet de la prochaine amélioration : vitesse de croisière avant / après, et un voyage d'exemple.
  const vitesseAvant = $derived(vitesseMoteur({ ameliorations: etat.ameliorations, levierAAbaisse: false, avarie: false }))
  const vitesseApres = $derived(vitesseMoteur({ ameliorations: etat.ameliorations + 1, levierAAbaisse: false, avarie: false }))
  const exemple = $derived(etat.fusee.destination?.type === 'astre' ? etat.fusee.destination.astre : 'Mars')
  const voyage = (vitesseKmS: number) => {
    const o = optionsDeDepart(etat.fusee, { type: 'astre', astre: exemple }, t, vitesseKmS)
    return o.maintenant ? (o.maintenant.arrivee - t) / 1000 : null
  }
  const voyageAvant = $derived(onglet === 'atelier' ? voyage(vitesseAvant) : null)
  const voyageApres = $derived(onglet === 'atelier' ? voyage(vitesseApres) : null)
  /** Prochain palier de cascade (nombre d'améliorations), s'il en reste un. */
  const palier = $derived(PANNES.paliersCascade.find((n) => n > etat.ameliorations) ?? null)
  const aVenir = $derived(MODULES_A_INSTALLER.filter((m) => !estInstalle(etat, m.code) && m.code !== module?.code))

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
  {#if apercu}<ApercuCarte astre={apercu.astre} titre={apercu.titre} fermer={() => (apercu = null)} />{/if}

  {#if onglet !== 'trophees'}
    <button class="caisse" onclick={() => (jeu.volet = 'portefeuille')}>
      <div class="col"><span class="etiquette">CAISSE · PORTEFEUILLE ›</span><span class="montant">{etat.credits} CR</span></div>
      <div class="col droite"><span class="etiquette">PROCHAINE AMÉLIORATION</span><span class="fort">{cout} CR · +10 % de vitesse</span></div>
    </button>
    {/if}

  {#if refus}<p class="refus" role="alert">{refus}</p>{/if}

  <div class="liste">
    {#if onglet === 'contrats'}
      {#if etat.contrats.length}
        <h3>EN COURS ({etat.contrats.length}/{CONTRATS.maxEnCours})</h3>
        {#each etat.contrats as c}
          <article class="contrat encours" role="presentation" onclick={(e) => montrer(e, c.destination, c.texte)}>
            <span class="type">{c.type}</span>
            <span class="texte">{c.texte}</span>
            <div class="infos">
              <span class="prime">{c.prime} CR</span>
              <span class="chiffres">{ua(distance(etat.fusee.position, positionAstre(c.destination, t)))}</span>
              <span class="boutons">
                {#if etat.fusee.destination?.type === 'astre' && etat.fusee.destination.astre === c.destination}
                  <!-- La fusée y va déjà. -->
                  <span class="en-route">EN ROUTE</span>
                {:else}
                  <button class="petit" onclick={() => jeu.remplacer({ ...etat, fusee: choisirDestination(etat.fusee, destinationDuContrat(c)) }, [`NOUVEAU CAP : ${c.destination.toUpperCase()}.`])}>Y ALLER</button>
                {/if}
                <button class="petit clair" onclick={() => resultat(abandonnerContrat(etat, c.id), 'CONTRAT ABANDONNÉ.')}>ABANDONNER</button>
              </span>
            </div>
          </article>
        {/each}
      {/if}
      <h3>PROPOSÉS</h3>
      {#each proposes as c}
        <article class="contrat" role="presentation" onclick={(e) => montrer(e, c.destination, c.texte)}>
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
      {#if etat.contratsAccomplis?.length}
        <h3>ACCOMPLIS ({etat.contratsAccomplis.length})</h3>
        {#each etat.contratsAccomplis as c}
          <article class="contrat accompli">
            <span class="type">{c.type} · {dateLocale(c.t)}, {heureLocale(c.t)}</span>
            <span class="texte">{c.texte}</span>
            <div class="infos"><span class="prime">+{c.prime} CR</span><span class="paye">PAYÉ</span></div>
          </article>
        {/each}
      {/if}
    {:else if onglet === 'atelier'}
      <h3>MOTEUR</h3>
      <article class="contrat">
        <span class="type">AMÉLIORATION N° {etat.ameliorations + 1}</span>
        <div class="vitesses">
          <span><small>AUJOURD’HUI</small><b>{nombre(vitesseAvant, 1)} km/s</b></span>
          <span class="fleche">→</span>
          <span><small>APRÈS</small><b class="mieux">{nombre(vitesseApres, 1)} km/s</b></span>
        </div>
        {#if voyageAvant !== null && voyageApres !== null}
          <span class="detail">Voyage vers {nomAstre(exemple)} : {duree(voyageAvant)} → <b>{duree(voyageApres)}</b> (−{duree(voyageAvant - voyageApres)})</span>
        {/if}
        {#if palier !== null}
          <span class="detail">À {palier} améliorations, les avaries pourront arriver en cascade (plusieurs à la fois, mieux payées).</span>
        {/if}
        <div class="infos"><span class="prime">{cout} CR</span>
          <span class="boutons"><button class="petit" disabled={etat.credits < cout} onclick={() => resultat(acheterAmelioration(etat, t), `ATELIER : AMÉLIORATION N° ${etat.ameliorations + 1} INSTALLÉE.`)}>AMÉLIORER</button></span>
        </div>
      </article>

      <h3>MODULES</h3>
      {#if module}
        <article class="contrat">
          <span class="type">{module.code} · PROCHAIN MODULE</span>
          <span class="nom-piece">{module.nom}</span>
          <span class="texte">{DESCRIPTIONS_ATELIER[module.code]}</span>
          <span class="detail">Ajoute un module au tableau de bord. Ses avaries rapportent <b>{PRIMES_REPARATION[module.code]} CR</b> (CH-1 : {PRIMES_REPARATION['CH-1']} CR).</span>
          <div class="infos"><span class="prime">{module.prix} CR</span>
            <span class="boutons"><button class="petit" disabled={etat.credits < module.prix} onclick={() => resultat(installer(etat, module.code, t), `ATELIER : MODULE ${module.code} INSTALLÉ.`)}>INSTALLER</button></span>
          </div>
        </article>
        {#each aVenir as m}
          <div class="a-venir"><span><b>{m.code}</b> {m.nom}</span><span>{m.prix} CR · avaries {PRIMES_REPARATION[m.code]} CR</span></div>
        {/each}
      {:else}
        <p class="vide">Tous les modules sont installés.</p>
      {/if}

      <h3>INSTRUMENTS DE CHASSE</h3>
      {#each INSTRUMENTS as i}
        <article class="contrat">
          <span class="type">{i.code}</span>
          <span class="nom-piece">{i.nom}</span>
          <span class="texte">{DESCRIPTIONS_ATELIER[i.code]}</span>
          <div class="infos">
            {#if estInstalle(etat, i.code)}<span class="installe">INSTALLÉ</span>
            {:else}
              <span class="prime">{i.prix} CR</span>
              {#if i.exige !== null && !estInstalle(etat, i.exige)}<span class="chiffres">exige {i.exige}</span>{/if}
              <span class="boutons"><button class="petit" disabled={etat.credits < i.prix || (i.exige !== null && !estInstalle(etat, i.exige))}
                onclick={() => resultat(installer(etat, i.code, t), `ATELIER : ${i.code} INSTALLÉ.`)}>INSTALLER</button></span>
            {/if}
          </div>
        </article>
      {/each}
    {:else}
      <Trophees />
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
  .caisse {
    margin: 12px 16px 0;
    width: calc(100% - 32px);
    text-align: left;
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
    background: var(--tole);
    color: var(--couleur-papier);
    box-shadow: 0 3px 0 var(--couleur-encre);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .contrat.accompli {
    opacity: 0.75;
  }
  .paye {
    margin-left: auto;
    padding: 0 8px;
    border: 2.5px solid var(--cerise);
    border-radius: 6px;
    color: var(--cerise);
    font-family: var(--police-titre);
    font-size: 14px;
    transform: rotate(-6deg);
  }
  .en-route {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 10px;
    border-radius: 10px;
    border: var(--trait) dashed var(--tole);
    color: var(--tole);
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
  .vitesses {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .vitesses span {
    display: flex;
    flex-direction: column;
  }
  .vitesses small {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--couleur-texte-discret);
  }
  .vitesses b {
    font-family: var(--police-titre);
    font-size: 20px;
    font-weight: 400;
  }
  .vitesses .mieux {
    color: var(--tole);
  }
  .fleche {
    font-size: 22px;
    font-weight: 700;
  }
  .detail {
    font-size: 14px;
    line-height: 1.3;
    color: var(--couleur-encre-discrete);
  }
  .nom-piece {
    font-family: var(--police-titre);
    font-size: 18px;
  }
  .a-venir {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    border: 2px dashed var(--couleur-texte-eteint);
    border-radius: 8px;
    font-size: 14px;
    color: var(--couleur-encre-discrete);
  }
  .installe {
    margin-left: auto;
    font-weight: 700;
    color: #4f7a4c;
  }
  .vide {
    color: var(--couleur-encre-discrete);
  }
</style>
