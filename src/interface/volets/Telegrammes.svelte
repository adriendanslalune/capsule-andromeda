<script lang="ts">
  // Télégrammes : rédiger (texte libre ou phrase toute faite, 3 envois par 24 heures), choisir à qui l'adresser
  // (son système, un commissionnaire, tout le système solaire), et lire ceux qui sont arrivés, au vrai délai de la
  // lumière. À ne pas confondre avec le journal de bord (les messages de la fusée elle-même).
  import { TELEGRAMMES } from '../../donnees/reglages'
  import { PHRASES } from '../../donnees/telegrammes'
  import {
    envoisRestants, envoyerTelegramme, estLu, marquerLus, prochainEnvoi, systemeDuJoueur, telegrammesDe, type Portee, type Telegramme, type TelegrammeRecu,
  } from '../../moteur/telegrammes'
  import { duree, heureLocale, nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'
  import { autresFusees, telegrammesRecus } from '../reseau'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const recus = $derived(telegrammesRecus(etat, t))
  const envoyes = $derived(telegrammesDe(etat).envoyes.filter((m) => m.envoye > t - TELEGRAMMES.gardesJours * 86_400_000))
  const systeme = $derived(systemeDuJoueur(etat, t))
  const restants = $derived(envoisRestants(etat, t))
  const prochain = $derived(prochainEnvoi(etat, t))
  const joueurs = $derived(autresFusees(t).map((f) => ({ serie: f.serie, nom: f.nom, couleur: f.couleur })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')))

  // Ce qui était déjà lu à l'ouverture : le reste est marqué « nouveau ». Tout ce qui arrive volet ouvert est lu.
  const nouveauxALOuverture = new Set(telegrammesRecus(jeu.etat!, jeu.maintenant).filter((m) => !estLu(jeu.etat!, m)).map((m) => m.id))
  function marquerLu() {
    const e = marquerLus(etat, recus)
    if (e !== etat) jeu.remplacer(e)
  }
  $effect(() => { void recus; marquerLu() })

  /** Le fil : reçus et envoyés, le plus récent en haut. */
  type Ligne = { recu: true; m: TelegrammeRecu; quand: number } | { recu: false; m: Telegramme; quand: number }
  const fil = $derived<Ligne[]>([
    ...recus.map((m) => ({ recu: true as const, m, quand: m.arrivee })),
    ...envoyes.map((m) => ({ recu: false as const, m, quand: m.envoye })),
  ].sort((a, b) => b.quand - a.quand))

  // Rédaction.
  let texte = $state('')
  let choixPortee = $state<'systeme' | 'joueur' | 'tout'>('tout')
  let destinataire = $state('')
  const portee = $derived<Portee | null>(
    choixPortee === 'tout' ? { type: 'tout' }
      : choixPortee === 'systeme' ? (systeme ? { type: 'systeme', systeme } : null)
      : joueurs.find((j) => j.serie === destinataire) ? { type: 'joueur', serie: destinataire, nom: joueurs.find((j) => j.serie === destinataire)!.nom } : null,
  )
  const pret = $derived(texte.trim().length > 0 && portee !== null && restants > 0)
  function envoyer() {
    if (!portee) return
    const e = envoyerTelegramme(etat, texte, portee, t)
    if (!e) return
    jeu.remplacer(e)
    texte = ''
  }

  /** Heure, précédée de « hier » ou de la date si ce n'est pas aujourd'hui. */
  function quand(x: number): string {
    const jour = (d: number) => new Date(d).toDateString()
    if (jour(x) === jour(t)) return heureLocale(x)
    if (jour(x) === jour(t - 86_400_000)) return `hier ${heureLocale(x)}`
    return `${new Date(x).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${heureLocale(x)}`
  }
  const lieu = (s: string | null) => (s ? (s === 'Terre' ? 'autour de la Terre' : `près de ${nomAstre(s)}`) : 'entre les planètes')
  const aQui = (p: Portee) => (p.type === 'tout' ? 'À TOUT LE SYSTÈME SOLAIRE' : p.type === 'systeme' ? `AU SYSTÈME DE ${nomAstre(p.systeme).replace(/^la /, '').toUpperCase()}` : `À ${p.nom.toUpperCase()}`)
</script>

<div class="telegrammes">
  <!-- Formulaire de rédaction, comme au guichet du télégraphe. -->
  <section class="redaction panneau">
    <div class="ligne">
      <span class="etiquette-encre">RÉDIGER</span>
      <span class="quota" class:epuise={restants === 0}>
        {#each Array(TELEGRAMMES.parJour) as _, i}<span class="timbre" class:utilise={i >= restants}></span>{/each}
        {restants} / {TELEGRAMMES.parJour} · 24 H
      </span>
    </div>
    <div class="portees" role="radiogroup" aria-label="Destinataires">
      <button role="radio" aria-checked={choixPortee === 'systeme'} class:actif={choixPortee === 'systeme'} disabled={!systeme} onclick={() => (choixPortee = 'systeme')}>
        MON SYSTÈME<small>{systeme ? nomAstre(systeme) : 'hors système'}</small>
      </button>
      <button role="radio" aria-checked={choixPortee === 'joueur'} class:actif={choixPortee === 'joueur'} onclick={() => (choixPortee = 'joueur')}>UN JOUEUR<small>au choix</small></button>
      <button role="radio" aria-checked={choixPortee === 'tout'} class:actif={choixPortee === 'tout'} onclick={() => (choixPortee = 'tout')}>TOUT LE SYSTÈME<small>solaire</small></button>
    </div>
    {#if choixPortee === 'joueur'}
      <select bind:value={destinataire} aria-label="Commissionnaire">
        <option value="" disabled>Choisir une fusée…</option>
        {#each joueurs as j}<option value={j.serie}>{j.nom} ({j.serie})</option>{/each}
      </select>
    {/if}
    <div class="phrases" aria-label="Phrases toutes faites">
      {#each PHRASES as p}<button onclick={() => (texte = (texte ? `${texte.trim()} ` : '') + p)}>{p}</button>{/each}
    </div>
    <textarea bind:value={texte} maxlength={TELEGRAMMES.longueur} rows="2" placeholder="Votre télégramme…"></textarea>
    <div class="ligne">
      <small class="discret">{texte.length} / {TELEGRAMMES.longueur}{#if restants === 0 && prochain} · prochain envoi à {heureLocale(prochain)}{/if}</small>
      <button class="bouton envoyer" disabled={!pret} onclick={envoyer}>ENVOYER</button>
    </div>
  </section>

  <!-- Télégrammes reçus et envoyés. -->
  {#each fil as l (l.recu + l.m.id)}
    {#if l.recu}
      <article class="telegramme" class:nouveau={nouveauxALOuverture.has(l.m.id)}>
        <header>
          <span class="de"><span class="fanion" style={`background: ${l.m.couleur ?? 'var(--couleur-bandeau)'}`}></span>{l.m.de}</span>
          <span class="heure">{quand(l.m.arrivee)}</span>
        </header>
        <p class="bande">{l.m.texte}</p>
        <footer>
          {l.m.serie === 'ONVI' ? 'Office, sur Terre' : lieu(l.m.systeme)} · {l.m.portee.type === 'joueur' ? 'à vous seul' : l.m.portee.type === 'systeme' ? 'à son système' : 'à tous'}
          {#if l.m.arrivee - l.m.envoye >= 1000} · {duree((l.m.arrivee - l.m.envoye) / 1000)} de trajet{/if}
        </footer>
      </article>
    {:else}
      <article class="telegramme envoye">
        <header><span class="de">{aQui(l.m.portee)}</span><span class="heure">{quand(l.m.envoye)}</span></header>
        <p class="bande">{l.m.texte}</p>
        <footer>Envoyé {lieu(l.m.systeme)}</footer>
      </article>
    {/if}
  {:else}
    <p class="discret vide">Aucun télégramme.</p>
  {/each}
</div>

<style>
  .telegrammes {
    flex: 1;
    overflow-y: auto;
    padding: 10px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .redaction {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ligne {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .quota {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .quota.epuise {
    color: var(--cerise);
  }
  /* Un timbre par envoi permis : barré quand il est utilisé. */
  .timbre {
    width: 12px;
    height: 14px;
    border: 1.5px dashed var(--couleur-encre);
    border-radius: 2px;
    background: var(--moutarde);
  }
  .timbre.utilise {
    background: linear-gradient(135deg, transparent 45%, var(--couleur-encre) 45% 55%, transparent 55%), var(--couleur-papier-fonce);
  }
  .portees {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .portees button {
    min-height: 46px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--couleur-papier);
    font-family: var(--police-titre);
    font-size: 10px;
  }
  .portees small {
    font-family: var(--police-texte);
    font-size: 11px;
    color: var(--couleur-texte-discret);
  }
  .portees button.actif {
    background: var(--couleur-bandeau);
    color: var(--couleur-texte-clair);
  }
  .portees button.actif small {
    color: var(--couleur-texte-clair);
  }
  .portees button:disabled {
    opacity: 0.4;
  }
  select,
  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 8px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--couleur-papier);
    font: inherit;
    font-size: 16px;
  }
  textarea {
    font-family: var(--police-machine);
    text-transform: uppercase;
    resize: none;
  }
  .phrases {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .phrases button {
    flex: none;
    min-height: 34px;
    padding: 0 10px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 17px;
    background: var(--couleur-papier-fonce);
    font-family: var(--police-machine);
    font-size: 12px;
    white-space: nowrap;
  }
  .envoyer {
    min-height: 44px;
    padding: 0 18px;
  }
  .envoyer:disabled {
    opacity: 0.4;
  }

  /* Télégramme : formule de l'Office, bandes de texte collées. */
  .telegramme {
    position: relative;
    padding: 8px 10px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 3px;
    background: var(--points), var(--couleur-papier);
    box-shadow: 2px 2px 0 var(--couleur-encre);
  }
  .telegramme.nouveau {
    border-width: 2.5px;
    border-color: var(--cerise);
  }
  .telegramme.nouveau::after {
    content: 'NOUVEAU';
    position: absolute;
    top: -8px;
    right: 10px;
    padding: 0 6px;
    background: var(--cerise);
    color: var(--couleur-papier);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .telegramme.envoye {
    margin-left: 28px;
    background: var(--couleur-papier-fonce);
  }
  .telegramme header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--couleur-encre);
  }
  .de {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--police-script);
    font-size: 17px;
  }
  /* Fanion à la couleur de la fusée émettrice. */
  .fanion {
    width: 12px;
    height: 9px;
    border: 1.5px solid var(--couleur-encre);
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }
  .envoye .de {
    font-family: var(--police-texte);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    -webkit-text-stroke: 0;
  }
  .heure {
    font-family: var(--police-chiffres);
    font-weight: 700;
  }
  .bande {
    margin: 6px 0;
    padding: 3px 6px;
    background: #f6e7a8;
    border: 1px solid rgba(42, 30, 23, 0.25);
    font-family: var(--police-machine);
    font-size: 14px;
    text-transform: uppercase;
    line-height: 1.35;
  }
  .telegramme footer {
    font-size: 12px;
    color: var(--couleur-texte-discret);
  }
  .vide {
    text-align: center;
  }
</style>
