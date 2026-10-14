<script lang="ts">
  // COMMUNICATION : le poste de transmissions du bord. En haut, l'écran des transmissions (télégrammes reçus et
  // envoyés, bulletins de la flotte), une ligne chacun, le plus récent en bas ; en bas, le pupitre d'émission
  // (destinataires, phrases toutes faites, ligne de saisie, timbres du quota).
  import { TELEGRAMMES } from '../../donnees/reglages'
  import { PHRASES } from '../../donnees/telegrammes'
  import {
    envoisRestants, envoyerTelegramme, estLu, marquerLus, prochainEnvoi, systemeDuJoueur, telegrammesDe, type Portee,
  } from '../../moteur/telegrammes'
  import { duree, heureLocale, nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'
  import { annonces, autresFusees, presence, telegrammesRecus } from '../reseau'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const recus = $derived(telegrammesRecus(etat, t))
  const envoyes = $derived(telegrammesDe(etat).envoyes.filter((m) => m.envoye > t - TELEGRAMMES.gardesJours * 86_400_000))
  const bulletins = $derived(annonces(t))
  const systeme = $derived(systemeDuJoueur(etat, t))
  const restants = $derived(envoisRestants(etat, t))
  const prochain = $derived(prochainEnvoi(etat, t))
  const reseau = $derived(presence(etat, t))
  const joueurs = $derived(autresFusees(t).map((f) => ({ serie: f.serie, nom: f.nom })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')))

  // Ce qui n'était pas lu à l'ouverture est marqué « nouveau » ; tout ce qui s'affiche est lu.
  const nouveaux = new Set(telegrammesRecus(jeu.etat!, jeu.maintenant).filter((m) => !estLu(jeu.etat!, m)).map((m) => m.id))
  $effect(() => {
    void recus
    const e = marquerLus(etat, recus)
    if (e !== etat) jeu.remplacer(e)
  })

  const lieu = (s: string | null) => (s ? (s === 'Terre' ? 'TERRE' : nomAstre(s).replace(/^la /, '').toUpperCase()) : 'ESPACE')
  const aQui = (p: Portee) => (p.type === 'tout' ? 'TOUS' : p.type === 'systeme' ? `SYSTÈME ${lieu(p.systeme)}` : p.nom.toUpperCase())

  /** Le fil des transmissions, le plus récent en bas (comme sur un téléscripteur). */
  type Ligne = { id: string; quand: number; sorte: 'recu' | 'envoye' | 'bulletin'; de: string; couleur?: string; meta: string; texte: string; nouveau?: boolean; majeur?: boolean }
  const fil = $derived<Ligne[]>([
    ...recus.map((m) => ({
      id: `r-${m.id}`, quand: m.arrivee, sorte: 'recu' as const, de: m.de.toUpperCase(), couleur: m.couleur,
      meta: `${m.serie === 'ONVI' ? 'TERRE' : lieu(m.systeme)}${m.arrivee - m.envoye >= 60_000 ? ` · ${duree((m.arrivee - m.envoye) / 1000).toUpperCase()}` : ''}`,
      texte: m.texte, nouveau: nouveaux.has(m.id),
    })),
    ...envoyes.map((m) => ({ id: `e-${m.id}`, quand: m.envoye, sorte: 'envoye' as const, de: `→ ${aQui(m.portee)}`, meta: '', texte: m.texte })),
    ...bulletins.map((a, i) => ({ id: `b-${i}-${a.t}`, quand: a.t, sorte: 'bulletin' as const, de: 'BULLETIN', couleur: a.couleur, meta: '', texte: a.texte.toUpperCase(), majeur: a.majeure })),
  ].sort((a, b) => a.quand - b.quand))

  // L'écran descend tout seul jusqu'au dernier message (à l'ouverture et à chaque nouveau).
  let filEl = $state<HTMLDivElement>()
  $effect(() => {
    void fil.length
    queueMicrotask(() => filEl?.scrollTo({ top: filEl.scrollHeight }))
  })

  // Pupitre d'émission.
  let texte = $state('')
  let choixPortee = $state<'systeme' | 'joueur' | 'tout'>('tout')
  let destinataire = $state('')
  const portee = $derived<Portee | null>(
    choixPortee === 'tout' ? { type: 'tout' }
      : choixPortee === 'systeme' ? (systeme ? { type: 'systeme', systeme } : null)
      : joueurs.find((j) => j.serie === destinataire) ? { type: 'joueur', serie: destinataire, nom: joueurs.find((j) => j.serie === destinataire)!.nom } : null,
  )
  const pret = $derived(texte.trim().length > 0 && portee !== null && restants > 0)
  function emettre() {
    if (!portee) return
    const e = envoyerTelegramme(etat, texte, portee, t)
    if (!e) return
    jeu.remplacer(e)
    texte = ''
  }
</script>

<div class="poste-com">
  <!-- Écran des transmissions. -->
  <div class="ecran-com">
    <div class="bandeau-ecran">
      <span>TRANSMISSIONS</span>
      <span>{reseau.total} EN LIGNE{reseau.horsReseau ? ' · SIMUL.' : ''}</span>
    </div>
    <div class="fil" bind:this={filEl}>
      {#each fil as l (l.id)}
        <p class={`tx ${l.sorte}`} class:nouveau={l.nouveau} class:majeur={l.majeur}>
          <span class="h">{heureLocale(l.quand)}</span>
          <span class="de" style={l.couleur && l.sorte !== 'bulletin' ? `color: ${l.couleur}` : ''}>{l.de}</span>
          {#if l.meta}<span class="meta">{l.meta}</span>{/if}
          {#if l.nouveau}<span class="neuf">NOUVEAU</span>{/if}
          <span class="txt">{l.texte}</span>
        </p>
      {:else}
        <p class="tx vide">AUCUNE TRANSMISSION.</p>
      {/each}
    </div>
  </div>

  <!-- Pupitre d'émission. -->
  <div class="pupitre">
    <div class="rangee">
      <span class="gravure">VERS</span>
      <div class="touches" role="radiogroup" aria-label="Destinataires">
        <button role="radio" aria-checked={choixPortee === 'systeme'} class:enfoncee={choixPortee === 'systeme'} disabled={!systeme} onclick={() => (choixPortee = 'systeme')}>SYSTÈME</button>
        <button role="radio" aria-checked={choixPortee === 'joueur'} class:enfoncee={choixPortee === 'joueur'} onclick={() => (choixPortee = 'joueur')}>UN JOUEUR</button>
        <button role="radio" aria-checked={choixPortee === 'tout'} class:enfoncee={choixPortee === 'tout'} onclick={() => (choixPortee = 'tout')}>TOUS</button>
      </div>
    </div>
    {#if choixPortee === 'joueur'}
      <select bind:value={destinataire} aria-label="Commissionnaire">
        <option value="" disabled>Choisir une fusée…</option>
        {#each joueurs as j}<option value={j.serie}>{j.nom}</option>{/each}
      </select>
    {/if}
    <div class="phrases pas-de-glisse" aria-label="Phrases toutes faites">
      {#each PHRASES as p}<button onclick={() => (texte = (texte ? `${texte.trim()} ` : '') + p)}>{p}</button>{/each}
    </div>
    <div class="saisie">
      <span class="invite">&gt;</span>
      <input bind:value={texte} maxlength={TELEGRAMMES.longueur} placeholder="VOTRE TÉLÉGRAMME" aria-label="Télégramme" />
      <button class="emettre" disabled={!pret} onclick={emettre}>ÉMETTRE</button>
    </div>
    <div class="rangee pied">
      <span class="quota" class:epuise={restants === 0}>
        {#each Array(TELEGRAMMES.parJour) as _, i}<span class="timbre" class:utilise={i >= restants}></span>{/each}
        {restants}/{TELEGRAMMES.parJour} · 24 H{#if restants === 0 && prochain} · PROCHAIN À {heureLocale(prochain)}{/if}
      </span>
      <span class="compteur-car">{texte.length}/{TELEGRAMMES.longueur}</span>
    </div>
  </div>
</div>

<style>
  .poste-com {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  /* Écran vert phosphore, cerné d'encre, lignes de balayage. */
  .ecran-com {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 3px solid var(--couleur-encre);
    border-radius: 12px;
    background: var(--nuit);
    box-shadow: 0 0 0 3px #0f1822 inset, 3px 3px 0 var(--couleur-encre);
    color: var(--menthe);
    font-family: var(--police-machine);
    text-shadow: 0 0 5px rgba(143, 207, 152, 0.5);
    overflow: hidden;
  }
  .ecran-com::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0 1px, transparent 1px 3px);
  }
  .bandeau-ecran {
    display: flex;
    justify-content: space-between;
    padding: 5px 10px;
    border-bottom: 1px solid rgba(143, 207, 152, 0.4);
    font-size: 11px;
    letter-spacing: 2px;
  }
  .fil {
    flex: 1;
    overflow-y: auto;
    padding: 4px 10px 8px;
  }
  .tx {
    margin: 0;
    padding: 5px 0;
    border-bottom: 1px dashed rgba(143, 207, 152, 0.18);
    font-size: 12.5px;
    line-height: 1.35;
  }
  .tx .h {
    color: #9cc7a4;
    margin-right: 6px;
  }
  .tx .de {
    font-weight: 700;
    color: var(--couleur-papier);
  }
  .tx .meta {
    margin-left: 6px;
    font-size: 10.5px;
    color: #6f9a78;
  }
  .tx .txt {
    display: block;
    padding-left: 44px;
    text-transform: uppercase;
  }
  .tx.envoye .de {
    color: #9cc7a4;
  }
  .tx.envoye .txt {
    color: #9cc7a4;
  }
  .tx.bulletin .de,
  .tx.bulletin .txt {
    color: var(--moutarde);
    text-shadow: 0 0 5px rgba(242, 181, 58, 0.5);
  }
  .tx.majeur .txt {
    font-weight: 700;
  }
  .neuf {
    margin-left: 6px;
    padding: 0 4px;
    background: var(--menthe);
    color: var(--nuit);
    font-size: 9.5px;
    text-shadow: none;
    animation: clignote 1s steps(1) infinite;
  }
  .vide {
    color: #6f9a78;
  }

  /* Pupitre : touches à l'ancienne, ligne de saisie. */
  .pupitre {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid var(--couleur-encre);
    border-radius: 6px;
    box-shadow: inset 0 0 0 3px var(--couleur-fond), inset 0 0 0 4px rgba(42, 30, 23, 0.5);
  }
  .rangee {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .gravure {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--couleur-encre-discrete);
  }
  .touches {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
  }
  .touches button,
  .phrases button,
  .emettre {
    min-height: 40px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--couleur-papier);
    box-shadow: 0 3px 0 var(--couleur-encre);
    font-family: var(--police-chiffres);
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 1px;
  }
  .touches button.enfoncee {
    transform: translateY(3px);
    box-shadow: none;
    background: var(--couleur-bandeau);
    color: var(--couleur-texte-clair);
  }
  .touches button:disabled {
    opacity: 0.4;
  }
  .phrases {
    display: flex;
    gap: 5px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .phrases button {
    flex: none;
    min-height: 32px;
    padding: 0 9px;
    font-family: var(--police-machine);
    font-weight: 400;
    font-size: 11px;
    letter-spacing: 0;
    box-shadow: 0 2px 0 var(--couleur-encre);
    white-space: nowrap;
  }
  select {
    min-height: 40px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--couleur-papier);
    font: inherit;
    font-size: 16px;
  }
  .saisie {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 3px 3px 9px;
    border: 3px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--nuit);
  }
  .invite {
    font-family: var(--police-machine);
    color: var(--menthe);
  }
  .saisie input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
    color: var(--menthe);
    font-family: var(--police-machine);
    font-size: 16px;
    text-transform: uppercase;
    outline: none;
  }
  .saisie input::placeholder {
    color: #4f7a58;
  }
  .emettre {
    padding: 0 12px;
    background: var(--cerise);
    color: var(--couleur-papier);
  }
  .emettre:disabled {
    background: var(--couleur-papier-fonce);
    color: var(--couleur-texte-eteint);
  }
  .pied {
    justify-content: space-between;
    font-family: var(--police-chiffres);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .quota {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .quota.epuise {
    color: var(--cerise);
  }
  .timbre {
    width: 11px;
    height: 13px;
    border: 1.5px dashed var(--couleur-encre);
    border-radius: 2px;
    background: var(--moutarde);
  }
  .timbre.utilise {
    background: linear-gradient(135deg, transparent 45%, var(--couleur-encre) 45% 55%, transparent 55%), var(--couleur-papier-fonce);
  }
  .compteur-car {
    color: var(--couleur-texte-discret);
  }
</style>
