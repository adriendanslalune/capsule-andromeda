<script lang="ts">
  // CONTRATS, lisibles d'un coup d'œil : un bandeau de résumé (places, primes à toucher, caisse), puis des fiches
  // toutes bâties pareil — à gauche le genre de mission, au centre la destination en gros, à droite la prime en gros,
  // dessous la distance, la durée du voyage et l'unique bouton utile. Toucher une fiche montre la destination sur un
  // aperçu de la carte.
  import { CONTRATS } from '../../donnees/economie'
  import {
    abandonnerContrat, accepterContrat, contratSurPlace, contratsProposes, destinationDuContrat, primeContrat,
  } from '../../moteur/economie'
  import type { OffreContrat } from '../../moteur/etat'
  import { choisirDestination, distance, lieuDArrivee, optionsDeDepart, positionAstre } from '../../moteur/fusee'
  import { vitesseActuelle } from '../../moteur/partie'
  import { dateLocale, duree, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'
  import ApercuCarte from '../volets/ApercuCarte.svelte'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const v = $derived(vitesseActuelle(etat))
  const pleins = $derived(etat.contrats.length >= CONTRATS.maxEnCours)
  const aToucher = $derived(etat.contrats.reduce((s, c) => s + c.prime, 0))

  /** Durée du voyage vers une destination (s), ou null si elle est hors de portée. */
  function voyage(astre: string): number | null {
    const o = optionsDeDepart(etat.fusee, { type: 'astre', astre: lieuDArrivee(astre) }, t, v)
    return o.maintenant ? (o.maintenant.arrivee - t) / 1000 : null
  }
  // Propositions, de la plus rapide à atteindre à la plus lointaine.
  const proposes = $derived(
    contratsProposes(etat, t)
      .map((c) => ({ c, prime: primeContrat(etat, c, t), duree: voyage(c.destination), surPlace: contratSurPlace(etat, c, t) }))
      .sort((a, b) => (a.duree ?? Infinity) - (b.duree ?? Infinity)),
  )
  const enRoute = (astre: string) => etat.fusee.destination?.type === 'astre' && etat.fusee.destination.astre === lieuDArrivee(astre)
  const nom = (astre: string) => nomAstre(astre).replace(/^./, (c) => c.toUpperCase())
  const km = (astre: string) => ua(distance(etat.fusee.position, positionAstre(lieuDArrivee(astre), t)))

  let refus = $state<string | null>(null)
  function accepter(c: OffreContrat) {
    const r = accepterContrat(etat, c.id, t)
    refus = r.refus
    if (!r.refus) jeu.remplacer(r.etat, [`CONTRAT ACCEPTÉ : ${c.texte.toUpperCase()}`])
  }
  function yAller(c: OffreContrat) {
    jeu.remplacer({ ...etat, fusee: choisirDestination(etat.fusee, destinationDuContrat(c)) }, [`NOUVEAU CAP : ${nom(c.destination).toUpperCase()}.`])
  }
  function abandonner(c: OffreContrat) {
    const r = abandonnerContrat(etat, c.id)
    if (!r.refus) jeu.remplacer(r.etat, ['CONTRAT ABANDONNÉ.'])
  }

  let apercu = $state<{ astre: string; titre: string } | null>(null)
  function montrer(e: Event, c: OffreContrat) {
    if ((e.target as Element).closest('button')) return
    apercu = { astre: lieuDArrivee(c.destination), titre: c.texte }
  }
</script>

{#snippet genre(type: string)}
  <!-- Pictogramme du genre de mission. -->
  <svg class="genre" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
    {#if type === 'LIVRAISON'}<path d="M3 8 L12 3 L21 8 V17 L12 22 L3 17 Z M3 8 L12 13 L21 8 M12 13 V22" />
    {:else if type === 'RELEVÉ'}<path d="M12 14 V4 M9 5 H12 M9 8 H12 M9 11 H12" /><circle cx="12" cy="17" r="4" />
    {:else if type === 'REMORQUAGE'}<path d="M12 2 V10 M12 10 Q6 10 6 15 Q6 20 11 20 Q15 20 15 16" /><circle cx="12" cy="2.5" r="1" />
    {:else}<path d="M3 6 H21 V18 H3 Z M3 6 L12 13 L21 6" />{/if}
  </svg>
{/snippet}

<div class="contrats">
  {#if apercu}<ApercuCarte astre={apercu.astre} titre={apercu.titre} fermer={() => (apercu = null)} />{/if}

  <!-- Résumé. -->
  <div class="resume">
    <div><small>EN COURS</small><b>{etat.contrats.length}<span>/{CONTRATS.maxEnCours}</span></b></div>
    <div><small>À TOUCHER</small><b>{aToucher}<span> CR</span></b></div>
    <button onclick={() => (jeu.volet = 'portefeuille')}><small>CAISSE ›</small><b>{etat.credits}<span> CR</span></b></button>
  </div>
  {#if refus}<p class="refus" role="alert">{refus}</p>{/if}

  <!-- Contrats en cours. -->
  {#if etat.contrats.length}
    <h3>EN COURS <small>sans limite de temps</small></h3>
    {#each etat.contrats as c (c.id)}
      {@const d = voyage(c.destination)}
      <div class="fiche encours" role="presentation" onclick={(e) => montrer(e, c)}>
        <span class="type">{@render genre(c.type)}<small>{c.type}</small></span>
        <span class="dest">{nom(c.destination)}</span>
        <span class="prime">{c.prime}<small> CR</small></span>
        <span class="texte">{c.texte}</span>
        <span class="infos">{km(c.destination)} · {d !== null ? duree(d) : 'hors de portée'}</span>
        <span class="actions">
          {#if enRoute(c.destination)}<span class="cap">EN ROUTE ▸</span>
          {:else}<button class="principal" onclick={() => yAller(c)}>Y ALLER</button>{/if}
          <button class="lien" onclick={() => abandonner(c)}>abandonner</button>
        </span>
      </div>
    {/each}
  {/if}

  <!-- Propositions de la semaine. -->
  <h3>PROPOSÉS <small>{pleins ? `${CONTRATS.maxEnCours} contrats en cours au plus : remplissez-en un d’abord` : 'du plus proche au plus lointain'}</small></h3>
  {#each proposes as p (p.c.id)}
    <div class="fiche" class:grise={pleins} role="presentation" onclick={(e) => montrer(e, p.c)}>
      <span class="type">{@render genre(p.c.type)}<small>{p.c.type}</small></span>
      <span class="dest">{nom(p.c.destination)}</span>
      <span class="prime">{p.prime}<small> CR</small></span>
      <span class="texte">{p.c.texte}</span>
      <span class="infos">{p.surPlace ? 'sur place · prime réduite' : `${km(p.c.destination)} · ${p.duree !== null ? duree(p.duree) : 'hors de portée'}`}</span>
      <span class="actions"><button class="principal" disabled={pleins} onclick={() => accepter(p.c)}>ACCEPTER</button></span>
    </div>
  {:else}
    <p class="vide">Plus de contrats cette semaine. Nouveaux contrats lundi.</p>
  {/each}

  <!-- Contrats accomplis. -->
  {#if etat.contratsAccomplis?.length}
    <details class="accomplis">
      <summary>ACCOMPLIS <small>{etat.contratsAccomplis.length} · {etat.contratsAccomplis.reduce((s, c) => s + c.prime, 0)} CR gagnés</small></summary>
      <ul>
        {#each etat.contratsAccomplis as c}
          <li><span>{dateLocale(c.t)}</span><b>{nom(c.destination)}</b><span class="gain">+{c.prime} CR</span></li>
        {/each}
      </ul>
    </details>
  {/if}
</div>

<style>
  .contrats {
    display: flex;
    flex-direction: column;
    gap: 8px;
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
  /* Fiche : genre | destination | prime ; texte ; infos | bouton. */
  .fiche {
    display: grid;
    grid-template-columns: 44px 1fr auto;
    grid-template-areas: 'type dest prime' 'type texte texte' 'infos infos actions';
    column-gap: 8px;
    row-gap: 2px;
    align-items: center;
    padding: 8px 10px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--couleur-papier);
    box-shadow: 2px 2px 0 var(--couleur-encre);
  }
  .fiche.encours {
    border-left: 6px solid var(--moutarde);
    background: var(--points), var(--couleur-papier);
  }
  .fiche.grise {
    opacity: 0.65;
  }
  .type {
    grid-area: type;
    align-self: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }
  .genre {
    width: 28px;
    height: 28px;
  }
  .type small {
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--couleur-encre-discrete);
  }
  .dest {
    grid-area: dest;
    font-family: var(--police-titre);
    font-size: 18px;
    line-height: 1.1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .prime {
    grid-area: prime;
    font-family: var(--police-chiffres);
    font-weight: 700;
    font-size: 22px;
    color: var(--cerise);
  }
  .prime small {
    font-size: 12px;
  }
  .texte {
    grid-area: texte;
    font-size: 13px;
    color: var(--couleur-texte-discret);
  }
  .infos {
    grid-area: infos;
    font-family: var(--police-chiffres);
    font-size: 13px;
    font-weight: 700;
  }
  .actions {
    grid-area: actions;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .principal {
    min-height: 40px;
    padding: 0 14px;
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
  .principal:disabled {
    background: var(--couleur-papier-fonce);
    color: var(--couleur-texte-eteint);
  }
  .cap {
    padding: 4px 8px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--menthe);
    font-family: var(--police-chiffres);
    font-weight: 700;
    letter-spacing: 1px;
  }
  .lien {
    min-height: 40px;
    border: 0;
    background: none;
    text-decoration: underline;
    color: var(--couleur-texte-discret);
    font: inherit;
    font-size: 12px;
  }
  .refus {
    margin: 0;
    color: var(--cerise);
    font-weight: 700;
  }
  .vide {
    color: var(--couleur-texte-discret);
  }
  .accomplis summary {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-height: 40px;
    padding-top: 8px;
    border-top: 1.5px solid var(--couleur-encre);
    font-family: var(--police-titre);
    font-size: 14px;
    cursor: pointer;
  }
  .accomplis summary small {
    font-family: var(--police-texte);
    font-size: 12px;
    color: var(--couleur-texte-discret);
  }
  .accomplis ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .accomplis li {
    display: flex;
    gap: 8px;
    min-height: 30px;
    align-items: center;
    border-bottom: 1px dashed var(--couleur-texte-eteint);
    font-size: 13px;
  }
  .accomplis .gain {
    margin-left: auto;
    font-family: var(--police-chiffres);
    font-weight: 700;
    color: #3d7a46;
  }
</style>
