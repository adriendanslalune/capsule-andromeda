<script lang="ts">
  // Le cockpit, sur un seul écran, répond à quatre questions, de haut en bas :
  //  1. Où je vais ?              le hublot, puis le panneau de pilotage (destination, temps restant, jour d'arrivée,
  //                               trois petits cadrans, interrupteur MOTEUR) ;
  //  2. Qu'est-ce qui ne va pas ? les voyants des blocs, en grand, avec une phrase d'état et la plaque constructeur ;
  //  3. Quel est mon but ?        la mission en cours et le radar du visiteur ;
  //  4. Qui est autour ?          les transmissions (les 3 derniers messages ; ouvre COMMUNICATION).
  // En pied, la dernière ligne du journal de bord. Les instruments détaillés s'ouvrent d'un toucher sur les cadrans.
  import { onMount } from 'svelte'
  import { MODULES_A_INSTALLER } from '../../donnees/economie'
  import { finSaison, numeroSaison, visiteurDetecte } from '../../moteur/chasse'
  import { estInstalle } from '../../moteur/economie'
  import {
    avancementTrajet, basculerMoteur, direction, distance, distanceRestante, enAttenteDeFenetre, planDeVol, positionAstre,
    positionDestination, tempsRestantAVitesse, vitesseDuMoment, type Destination,
  } from '../../moteur/fusee'
  import { modulesEnPanne } from '../../moteur/modules'
  import { vitesseActuelle } from '../../moteur/partie'
  import { duree, dureePrecise, heureLocale, jourEtHeure, nombre, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'
  import { presence } from '../reseau'
  import { filDesTransmissions } from '../social/fil'
  import Pictogramme from '../cockpit/Pictogramme.svelte'
  import { estEngin } from '../../astro/engins'

  const TOUS_LES_MODULES = ['CH-1', 'TU-1', 'AL-1', ...MODULES_A_INSTALLER.map((m) => m.code)]

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const fusee = $derived(etat.fusee)
  const enPanne = $derived(modulesEnPanne(etat.modules))
  const croisiere = $derived(vitesseActuelle(etat))
  const attente = $derived(enAttenteDeFenetre(fusee))
  /** Vitesse du moment : elle suit la rampe d'accélération (20 s), et tombe à 0 moteur coupé. */
  const vitesse = $derived(vitesseDuMoment(fusee, croisiere))
  const coupe = $derived(!!fusee.moteurCoupe)
  const regime = $derived(
    coupe ? (vitesse > 0 ? 'RALENTIT' : 'À L’ARRÊT')
      : !fusee.destination || attente ? 'EN ATTENTE'
      : vitesse < croisiere - 0.01 ? 'ACCÉLÈRE' : vitesse > croisiere + 0.01 ? 'RALENTIT' : 'EN POUSSÉE',
  )
  function basculer() {
    jeu.remplacer({ ...etat, fusee: basculerMoteur(fusee) }, [coupe ? 'MOTEUR RALLUMÉ.' : 'MOTEUR COUPÉ.'])
  }

  const majuscule = (s: string) => s.replace(/^./, (c) => c.toUpperCase())
  function nomDestination(d: Destination): string {
    if (d.type === 'point') return 'Point libre'
    if (d.type === 'visiteur') return 'Objet inconnu'
    return majuscule(nomAstre(d.astre))
  }

  const plan = $derived(fusee.destination ? planDeVol(fusee, t, croisiere) : null)
  // Temps restant en direct, à la vitesse du moment : il fond pendant une accélération et grimpe pendant un
  // freinage. Le moteur donne, à chaque pas (une fois par seconde), le temps restant à la vitesse de croisière ; entre
  // deux pas, on le fait glisser linéairement, et on le corrige à chaque image par la vitesse du moment.
  const resteCroisiere = $derived(fusee.destination && !attente ? tempsRestantAVitesse(fusee, t, croisiere, croisiere) : null)
  let resteAvant: number | null = null
  let resteApres: number | null = null
  let cleReste = ''
  $effect(() => {
    const cle = JSON.stringify(fusee.destination)
    resteAvant = cle === cleReste ? resteApres : resteCroisiere
    resteApres = resteCroisiere
    cleReste = cle
  })
  let resteDirect = $state<number | null>(null)
  let maintenantDirect = $state(Date.now())
  onMount(() => {
    let image = 0
    const boucle = () => {
      image = requestAnimationFrame(boucle)
      const vue = jeu.affichage()
      maintenantDirect = vue.t
      const v = vitesseDuMoment(vue.etat.fusee, croisiere)
      if (resteApres === null || v <= 0.001) { resteDirect = null; return }
      const a = jeu.fraction()
      const base = resteAvant === null ? resteApres : resteAvant + (resteApres - resteAvant) * a
      resteDirect = (base * croisiere) / v
    }
    image = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(image)
  })
  const arrivee = $derived(resteDirect !== null ? maintenantDirect + resteDirect * 1000 : null)
  const vers = $derived(fusee.destination ? direction(fusee.position, plan?.point ?? positionDestination(fusee.destination, t)) : null)
  const avancement = $derived(avancementTrajet(fusee, t))

  /** Vue extérieure ; un toucher arrivé juste après un changement d'écran est ignoré (toucher « fantôme »). */
  function regarderDehors() {
    if (Date.now() - jeu.dernierChangement < 500) return
    jeu.ecran = { nom: 'dehors' }
  }

  // Petits cadrans : vitesse (échelle qui grandit avec le moteur), cap, heure (d'arrivée, ou actuelle).
  const maxVitesse = $derived.by(() => {
    for (let p = 10; ; p *= 10) for (const m of [5, 10, 20]) if (m * p >= croisiere * 1.25) return m * p
  })
  const angleVitesse = $derived(-120 + (Math.min(maxVitesse, vitesse) / maxVitesse) * 240)
  const instant = $derived(new Date(arrivee ?? maintenantDirect))
  const angleHeures = $derived(((instant.getHours() % 12) + instant.getMinutes() / 60) * 30)
  const angleMinutes = $derived(instant.getMinutes() * 6)

  // État du bord.
  function etatTuile(code: string): 'ok' | 'avarie' | 'scelle' {
    if (!estInstalle(etat, code)) return 'scelle'
    return enPanne.includes(code) ? 'avarie' : 'ok'
  }
  const levierBas = $derived(!etat.modules.propulsion.levierAHaut)
  const phraseBord = $derived(
    enPanne.length ? `${enPanne.length} avarie${enPanne.length > 1 ? 's' : ''} : touchez un voyant rouge.`
      : levierBas ? 'Levier L-A abaissé : vitesse réduite.' : 'Tout est en ordre.',
  )

  // Mission : le contrat vers la destination actuelle, sinon le premier en cours.
  const mission = $derived(
    etat.contrats.find((c) => fusee.destination?.type === 'astre' && fusee.destination.astre === c.destination) ?? etat.contrats[0] ?? null,
  )

  // Visiteur.
  const saison = $derived(numeroSaison(t))
  const trouve = $derived(etat.chasse.trouvailles.some((x) => x.saison === saison))
  const detecte = $derived(visiteurDetecte(etat, t))
  const joursSaison = $derived(Math.ceil((finSaison(saison) - t) / 86_400_000))

  // Transmissions : les trois derniers messages (le plus récent en bas, comme sur l'écran COMMUNICATION).
  const reseau = $derived(presence(etat, t))
  const fil = $derived(filDesTransmissions(etat, t))
  const derniers = $derived(fil.slice(-3))
  const aLire = $derived(fil.filter((l) => l.nouveau).length)
  const ligneJournal = $derived(jeu.telex.at(-1) ?? null)
</script>

<main>
  <div class="defile">
    <!-- Hublot : le toucher fait sortir en vue extérieure. -->
    <div class="hublot" role="button" tabindex="0" aria-label="Regarder dehors (vue extérieure)"
      onclick={regarderDehors} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') regarderDehors() }}>
      <div class="boulons-h"></div>
      <div class="boulons-v"></div>
      <div class="vitre">
        {#await import('../vue3d/Hublot.svelte') then { default: Hublot }}<Hublot />{/await}
      </div>
    </div>

    <!-- 1. Où je vais ? -->
    <section class="panneau-fin" data-titre="PILOTAGE" data-ref="réf. TB-12">
      <div class="ecran">
        {#if fusee.destination && attente && plan}
          <div class="ligne"><span class="etiquette-encre">FENÊTRE DE TIR</span><span class="discret">départ dans {duree((plan.depart - t) / 1000)}</span></div>
          <div class="ligne"><span class="grand">{nomDestination(fusee.destination)}</span></div>
          <div class="sous">Départ {jourEtHeure(plan.depart, t)} · arrivée <b>{jourEtHeure(plan.arrivee, t)}</b></div>
        {:else if fusee.destination}
          <div class="ligne"><span class="etiquette-encre">EN ROUTE VERS</span><span class="discret">reste {ua(distanceRestante(fusee, t) ?? 0)}</span></div>
          <div class="ligne">
            <span class="grand">{nomDestination(fusee.destination)}</span>
            <!-- Dessin de la destination, au milieu, au-dessus de la frise. -->
            <span class="picto"><Pictogramme destination={fusee.destination} /></span>
            <span class="compte">{resteDirect !== null ? dureePrecise(resteDirect) : coupe ? 'MOTEUR COUPÉ' : '—'}</span>
          </div>
          <div class="sous">Arrivée <b>{arrivee !== null ? jourEtHeure(arrivee, maintenantDirect) : '—'}</b></div>
          {#if avancement !== null}
            <div class="piste"><div class="fait" style={`width: ${avancement * 100}%`}></div></div>
          {/if}
        {:else if fusee.orbite}
          <div class="ligne"><span class="etiquette-encre">{fusee.presDuVisiteur ? 'À CÔTÉ DE L’OBJET INCONNU' : estEngin(fusee.orbite) || fusee.orbite === 'ISS' ? 'AUPRÈS DE' : 'EN ORBITE'}</span></div>
          <div class="ligne"><span class="grand">{majuscule(nomAstre(fusee.orbite))}</span></div>
          <div class="sous">Choisis une destination (page NAVIGATION).</div>
        {:else}
          <div class="ligne"><span class="etiquette-encre">À L’ARRÊT</span></div>
          <div class="ligne"><span class="grand">Point libre</span></div>
          <div class="sous">Choisis une destination (page NAVIGATION).</div>
        {/if}
      </div>

      <div class="commandes">
        <!-- Trois petits cadrans ; les toucher ouvre les instruments en grand. -->
        <button class="cadrans" aria-label="Ouvrir les instruments" onclick={() => (jeu.volet = 'instruments')}>
          <span class="mini">
            <svg viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="27" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="2.5" />
              <path d="M 12.7 40 A 20 20 0 1 1 47.3 40" fill="none" stroke="var(--couleur-encre)" stroke-width="5" />
              <line x1="30" y1="30" x2="30" y2="11" stroke="var(--cerise)" stroke-width="2.6" stroke-linecap="round" style={`transform: rotate(${angleVitesse}deg); transform-origin: 30px 30px; transition: transform 1s linear`} />
              <circle cx="30" cy="30" r="3.5" fill="var(--couleur-encre)" />
            </svg>
            <b>{nombre(vitesse, 1)}</b><small>KM/S</small>
          </span>
          <span class="mini">
            <svg viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="27" fill="var(--nuit)" stroke="var(--couleur-encre)" stroke-width="2.5" />
              {#each [0, 90, 180, 270] as a}<line x1="30" y1="5" x2="30" y2="10" stroke="var(--couleur-papier)" stroke-width="2" style={`transform: rotate(${a}deg); transform-origin: 30px 30px`} />{/each}
              {#if vers !== null}<path d="M 30 4 l 4 6 h -8 Z" fill="var(--moutarde)" style={`transform: rotate(${90 - vers}deg); transform-origin: 30px 30px`} />{/if}
              <path d="M 30 12 L 34 30 L 30 27 L 26 30 Z" fill="var(--cerise)" style={`transform: rotate(${90 - fusee.cap}deg); transform-origin: 30px 30px; transition: transform 0.4s ease-out`} />
              <circle cx="30" cy="30" r="3" fill="var(--couleur-papier)" />
            </svg>
            <b>{String(Math.round(fusee.cap) % 360).padStart(3, '0')}°</b><small>CAP</small>
          </span>
          <span class="mini">
            <svg viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="27" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="2.5" />
              {#each Array.from({ length: 12 }, (_, i) => i * 30) as a}<line x1="30" y1="5" x2="30" y2={a % 90 ? 8 : 10} stroke="var(--couleur-encre)" stroke-width="1.6" style={`transform: rotate(${a}deg); transform-origin: 30px 30px`} />{/each}
              <line x1="30" y1="30" x2="30" y2="17" stroke="var(--couleur-encre)" stroke-width="3" stroke-linecap="round" style={`transform: rotate(${angleHeures}deg); transform-origin: 30px 30px`} />
              <line x1="30" y1="30" x2="30" y2="10" stroke="var(--couleur-encre)" stroke-width="1.8" stroke-linecap="round" style={`transform: rotate(${angleMinutes}deg); transform-origin: 30px 30px`} />
              <circle cx="30" cy="30" r="3" fill="var(--cerise)" />
            </svg>
            <b>{heureLocale(arrivee ?? maintenantDirect)}</b><small>{arrivee !== null ? 'ARRIVÉE' : 'HEURE'}</small>
          </span>
        </button>
        <!-- Interrupteur MOTEUR, cerné de rayures jaunes et noires. -->
        <div class="moteur">
          <button class="interrupteur-moteur" class:coupe aria-pressed={!coupe} aria-label={coupe ? 'Rallumer le moteur' : 'Couper le moteur'} onclick={basculer}>
            <span class="position on">ON</span><span class="levier-moteur"></span><span class="position off">OFF</span>
          </button>
          <span class="regime" class:actif={!coupe && vitesse > 0}>{regime}</span>
        </div>
      </div>
      <div class="danger" aria-hidden="true"><span>ATTENTION · PIÈCES EN MOUVEMENT</span></div>
    </section>

    <!-- 2. Qu'est-ce qui ne va pas ? -->
    <section class="panneau-fin bord" class:alerte={enPanne.length > 0} data-titre="BLOCS DU BORD"
      data-ref={`${TOUS_LES_MODULES.filter((c) => estInstalle(etat, c)).length} / ${TOUS_LES_MODULES.length} installés`}>
      <p class="phrase" class:rouge={enPanne.length > 0 || levierBas}><span class="lampe-etat"></span>{phraseBord}</p>
      <div class="grille">
        <!-- CH-1 et TU-1 forment ensemble la propulsion : un trait fin les relie. -->
        <span class="lien" aria-hidden="true"><span>PROPULSION</span></span>
        {#each TOUS_LES_MODULES as code}
          {@const e = etatTuile(code)}
          <button class={`tuile ${e}`} disabled={e === 'scelle'}
            aria-label={`${code} : ${e === 'ok' ? 'en ordre' : e === 'avarie' ? 'avarie' : 'scellé'}`}
            onclick={() => (jeu.ecran = { nom: 'module', code })}>
            <span class="voyant"></span><span class="code">{code}</span>
          </button>
        {/each}
      </div>
      <!-- Plaque constructeur, vissée sur le panneau : le numéro de série de l'appareil. -->
      <div class="rangee-plaque">
        <span class="tampon" aria-hidden="true">CONTRÔLÉ<small>O.N.V.I.</small></span>
        <div class="plaque-constructeur"><span>O.N.V.I. · C-58</span><b>N° SÉRIE {etat.serie}</b></div>
      </div>
    </section>

    <!-- 3. Quel est mon but ? -->
    <div class="buts">
      <button class="carte mission" onclick={() => jeu.ouvrirSocial('contrats')}>
        <small>MISSION</small>
        {#if mission}
          <b>{majuscule(nomAstre(mission.destination))}</b>
          <span>{mission.prime} CR · {ua(distance(fusee.position, positionAstre(mission.destination, t)))}</span>
          {#if etat.contrats.length > 1}<span class="discret-papier">+ {etat.contrats.length - 1} autre{etat.contrats.length > 2 ? 's' : ''}</span>{/if}
        {:else}
          <b>Aucune</b><span>Voir les contrats ›</span>
        {/if}
      </button>
      <button class="carte visiteur" onclick={() => (jeu.page = 'carte')}>
        <span class="radar" aria-hidden="true"><span class="balayage"></span>{#if detecte !== null || trouve}<span class="echo"></span>{/if}</span>
        <span class="texte">
          <small>VISITEUR</small>
          <b>{trouve ? 'Photographié' : detecte !== null ? `À ${ua(detecte)}` : 'Introuvable'}</b>
          <span>{joursSaison} j de saison</span>
        </span>
      </button>
    </div>

    <!-- 4. Qui est autour ? -->
    <button class="transmissions" onclick={() => jeu.ouvrirSocial('communication')} aria-label="Transmissions : ouvrir COMMUNICATION">
      <span class="bandeau-tx">
        <span><span class="antenne" aria-hidden="true"></span>TRANSMISSIONS</span>
        {#if aLire}<span class="a-lire">{aLire} NOUVEAU{aLire > 1 ? 'X' : ''}</span>{/if}
        <span>{reseau.total} EN LIGNE</span>
      </span>
      {#each derniers as l (l.id)}
        <span class={`tx ${l.sorte}`} class:nouveau={l.nouveau} class:majeur={l.majeur}>
          <span class="h">{heureLocale(l.quand)}</span>
          <span class="de" style={l.couleur && l.sorte !== 'bulletin' ? `color: ${l.couleur}` : ''}>{l.de}</span>
          <span class="txt">{l.texte}</span>
        </span>
      {:else}
        <span class="tx vide">AUCUNE TRANSMISSION.</span>
      {/each}
    </button>

    <!-- Journal de bord : la dernière ligne ; le toucher déroule la bande. -->
    <button class="journal" onclick={() => (jeu.volet = 'journal')} aria-label="Journal de bord">
      {#if ligneJournal}<span class="heure" class:alerte={ligneJournal.alerte}>{heureLocale(ligneJournal.t)}</span><span class="texte-journal">{ligneJournal.texte}</span>{:else}Journal de bord vierge.{/if}
      <span class="derouler">▾</span>
    </button>
  </div>
</main>

<style>
  main {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .defile {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 0 var(--espace) 8px;
  }
  .defile > :global(*) {
    flex: none;
  }
  button {
    font: inherit;
    color: inherit;
  }

  /* Hublot : d'un bord à l'autre de l'écran, cadre fin boulonné. */
  .hublot {
    position: relative;
    height: clamp(76px, 11vh, 120px);
    margin: 0 calc(-1 * var(--espace));
    padding: 7px;
    border-top: 2px solid var(--couleur-encre);
    border-bottom: 2px solid var(--couleur-encre);
    background: var(--traits), var(--couleur-papier-fonce);
    cursor: pointer;
  }
  .hublot:active .vitre {
    filter: brightness(1.15);
  }
  .boulons-h,
  .boulons-v {
    position: absolute;
    pointer-events: none;
    --boulon: radial-gradient(circle, var(--couleur-papier) 0 1.2px, var(--couleur-encre) 1.6px 2.2px, transparent 2.5px);
  }
  .boulons-h {
    inset: 0 16px;
    background: var(--boulon) top / 26px 7px space no-repeat, var(--boulon) bottom / 26px 7px space no-repeat;
  }
  .boulons-v {
    inset: 14px 0;
    background: var(--boulon) left / 7px 26px no-repeat space, var(--boulon) right / 7px 26px no-repeat space;
  }
  .vitre {
    position: relative;
    height: 100%;
    overflow: hidden;
    border: 2px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--nuit);
  }

  /* Panneaux : double filet d'encre, vis aux coins, légende gravée dans le cadre. */
  .panneau-fin {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
    padding: 12px 10px 7px;
    border: 1px solid var(--couleur-encre);
    border-radius: 6px;
    box-shadow: inset 0 0 0 3px var(--couleur-fond), inset 0 0 0 4px rgba(42, 30, 23, 0.5);
    --vis: radial-gradient(circle, var(--couleur-papier) 0 1.6px, var(--couleur-encre) 2px 2.7px, transparent 3px);
    background: var(--vis) left 6px top 6px / 8px 8px no-repeat, var(--vis) right 6px top 6px / 8px 8px no-repeat,
      var(--vis) left 6px bottom 6px / 8px 8px no-repeat, var(--vis) right 6px bottom 6px / 8px 8px no-repeat;
  }
  .panneau-fin::before,
  .panneau-fin::after {
    position: absolute;
    top: -7px;
    padding: 0 5px;
    background: var(--couleur-fond);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    line-height: 13px;
    color: var(--couleur-encre-discrete);
  }
  .panneau-fin::before {
    content: attr(data-titre);
    left: 18px;
  }
  .panneau-fin::after {
    content: attr(data-ref);
    right: 18px;
    font-family: var(--police-machine);
    font-weight: 400;
    letter-spacing: 0.5px;
  }

  /* Écran de navigation : vert phosphore, lignes de balayage. */
  .ecran {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 11px 8px;
    border: 3px solid var(--couleur-encre);
    border-radius: 10px;
    background-color: var(--nuit);
    box-shadow: 0 0 0 3px #0f1822 inset;
    color: var(--menthe);
    overflow: hidden;
    text-shadow: 0 0 5px rgba(143, 207, 152, 0.55);
  }
  .ecran::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.28) 0 1px, transparent 1px 3px);
  }
  .ligne {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .ecran .etiquette-encre {
    background: none;
    border: 1.5px solid var(--menthe);
    color: var(--menthe);
    font-size: 11px;
  }
  .grand {
    font-family: var(--police-titre);
    font-size: 21px;
    line-height: 1.1;
    color: var(--couleur-papier);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .picto {
    flex: none;
    align-self: center;
    display: flex;
    color: var(--menthe);
    filter: drop-shadow(0 0 3px rgba(143, 207, 152, 0.6));
  }
  .compte {
    font-family: var(--police-chiffres);
    font-variant-numeric: tabular-nums;
    font-size: 21px;
    font-weight: 700;
    color: var(--moutarde);
    text-shadow: 0 0 6px rgba(242, 181, 58, 0.7);
    white-space: nowrap;
  }
  .discret,
  .sous {
    font-size: 13px;
    color: #9cc7a4;
  }
  .sous b {
    color: var(--couleur-papier);
  }
  .piste {
    margin-top: 3px;
    height: 7px;
    border: 1.5px solid var(--menthe);
    border-radius: 4px;
    background: repeating-linear-gradient(90deg, transparent 0 8px, rgba(143, 207, 152, 0.25) 8px 10px);
  }
  .fait {
    height: 100%;
    background: var(--menthe);
  }

  /* Commandes : trois petits cadrans, interrupteur MOTEUR. */
  .commandes {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cadrans {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
  }
  .cadrans:active {
    transform: scale(0.98);
  }
  .mini {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.05;
  }
  .mini svg {
    width: 50px;
    height: 50px;
  }
  .mini b {
    font-family: var(--police-chiffres);
    font-size: 15px;
  }
  .mini small {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--couleur-encre-discrete);
  }
  .moteur {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 5px;
    border: 1px solid var(--couleur-encre);
    border-radius: 6px;
    background: repeating-linear-gradient(-45deg, var(--moutarde) 0 5px, var(--couleur-encre) 5px 10px);
  }
  .interrupteur-moteur {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100px;
    height: 44px;
    padding: 0 9px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 22px;
    background: var(--menthe);
  }
  .interrupteur-moteur.coupe {
    background: var(--couleur-papier);
  }
  .position {
    font-family: var(--police-titre);
    font-size: 12px;
  }
  .interrupteur-moteur:not(.coupe) .off,
  .interrupteur-moteur.coupe .on {
    opacity: 0.35;
  }
  .levier-moteur {
    position: absolute;
    top: 4px;
    left: calc(100% - 39px);
    width: 31px;
    height: 31px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--cerise);
    transition: left 0.15s;
  }
  .interrupteur-moteur.coupe .levier-moteur {
    left: 4px;
    background: var(--couleur-papier-fonce);
  }
  .regime {
    padding: 1px 6px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 4px;
    background: var(--nuit);
    color: #9cc7a4;
    font-family: var(--police-chiffres);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .regime.actif {
    color: var(--menthe);
  }
  .danger {
    display: flex;
    justify-content: center;
    height: 11px;
    border: 1px solid var(--couleur-encre);
    background: repeating-linear-gradient(-45deg, var(--moutarde) 0 6px, var(--couleur-encre) 6px 12px);
  }
  .danger span {
    padding: 0 6px;
    background: var(--moutarde);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 1.5px;
    line-height: 9px;
  }

  /* État du bord. */
  .bord.alerte {
    border-color: var(--cerise);
  }
  .phrase {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }
  .phrase.rouge {
    color: var(--cerise);
  }
  .lampe-etat {
    flex: none;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 1.5px solid var(--couleur-encre);
    background: var(--menthe);
  }
  .phrase.rouge .lampe-etat {
    background: var(--cerise);
    animation: clignote 0.8s steps(1) infinite;
  }
  .grille {
    position: relative;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    row-gap: 6px;
    padding-top: 9px;
  }
  .lien {
    position: absolute;
    top: 2px;
    left: calc(100% / 12);
    width: calc(100% / 6);
    height: 6px;
    border: 1px solid var(--couleur-encre);
    border-bottom: 0;
  }
  .lien span {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    padding: 0 3px;
    background: var(--couleur-fond);
    font-size: 7px;
    font-weight: 700;
    letter-spacing: 1px;
    line-height: 9px;
  }
  .tuile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
  }
  .voyant {
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--menthe);
    box-shadow: 2px 2px 0 var(--couleur-encre);
  }
  .tuile:active .voyant {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
  .code {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .tuile.avarie .voyant {
    background: var(--cerise);
    animation: clignote 0.8s steps(1) infinite;
  }
  .tuile.avarie .code {
    color: var(--cerise);
  }
  .tuile.scelle .voyant {
    border-style: dashed;
    border-color: var(--couleur-texte-eteint);
    background: repeating-linear-gradient(45deg, transparent 0 4px, rgba(42, 30, 23, 0.12) 4px 6px);
    box-shadow: none;
  }
  .tuile.scelle .code {
    color: var(--couleur-texte-eteint);
  }
  .rangee-plaque {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
  }
  .plaque-constructeur {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 2px 11px;
    border: 2px solid var(--couleur-encre);
    border-radius: 4px;
    --rivet: radial-gradient(circle, var(--couleur-encre) 0 1.5px, transparent 2px);
    background: var(--rivet) left 3px center / 5px 5px no-repeat, var(--rivet) right 3px center / 5px 5px no-repeat, var(--moutarde);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .plaque-constructeur b {
    font-family: var(--police-machine);
    font-size: 13px;
    letter-spacing: 2px;
  }
  .tampon {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1px 4px;
    border: 2px solid var(--cerise);
    border-radius: 4px;
    color: var(--cerise);
    font-family: var(--police-titre);
    font-size: 7px;
    line-height: 1.1;
    opacity: 0.7;
    transform: rotate(-12deg);
  }
  .tampon small {
    font-family: var(--police-machine);
    font-size: 6px;
  }

  /* Cartes : mission, visiteur, liaison. */
  .buts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .carte {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    min-height: 56px;
    padding: 5px 10px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--couleur-papier);
    box-shadow: 2px 2px 0 var(--couleur-encre);
    text-align: left;
    line-height: 1.2;
    min-width: 0;
  }
  .carte:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
  .carte small {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--couleur-encre-discrete);
  }
  .carte b {
    font-family: var(--police-titre);
    font-weight: 400;
    font-size: 15px;
  }
  .carte span {
    font-size: 13px;
  }
  .discret-papier {
    color: var(--couleur-texte-discret);
  }
  .mission {
    border-left: 6px solid var(--moutarde);
  }
  .visiteur {
    flex-direction: row;
    align-items: center;
    gap: 9px;
    background: var(--nuit);
    color: var(--menthe);
  }
  .visiteur small {
    color: #9cc7a4;
  }
  .visiteur .texte {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .radar {
    position: relative;
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid var(--moutarde);
    background: #10331f;
    overflow: hidden;
  }
  .radar::before {
    content: '';
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    border: 1.5px solid rgba(250, 242, 220, 0.5);
  }
  .balayage {
    position: absolute;
    inset: 0;
    background: conic-gradient(from 0deg, rgba(250, 242, 220, 0.65) 0 40deg, transparent 40deg);
    animation: tourne 3s linear infinite;
  }
  .echo {
    position: absolute;
    left: 60%;
    top: 26%;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--moutarde);
    border: 1.5px solid var(--couleur-encre);
    animation: clignote 1.2s steps(1) infinite;
  }
  @keyframes tourne {
    to {
      transform: rotate(360deg);
    }
  }
  /* Transmissions : petit écran vert phosphore, comme celui de COMMUNICATION. */
  .transmissions {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0 0 4px;
    border: 2.5px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--nuit);
    box-shadow: 0 0 0 2px #0f1822 inset, 3px 3px 0 var(--couleur-encre);
    color: var(--menthe);
    font-family: var(--police-machine);
    text-align: left;
    text-shadow: 0 0 5px rgba(143, 207, 152, 0.5);
    overflow: hidden;
  }
  .transmissions::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0 1px, transparent 1px 3px);
  }
  .bandeau-tx {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 9px;
    border-bottom: 1px solid rgba(143, 207, 152, 0.4);
    font-size: 10.5px;
    letter-spacing: 1px;
  }
  .bandeau-tx > span:first-child {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bandeau-tx > span:last-child {
    margin-left: auto;
  }
  .a-lire {
    padding: 0 5px;
    border-radius: 3px;
    background: var(--moutarde);
    color: var(--couleur-encre);
    text-shadow: none;
    font-weight: 700;
  }
  .transmissions .tx {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    padding: 3px 9px;
    border-bottom: 1px dashed rgba(143, 207, 152, 0.18);
    font-size: 12px;
    line-height: 1.3;
  }
  .transmissions .tx:last-child {
    border-bottom: none;
  }
  .transmissions .h {
    flex: none;
    opacity: 0.7;
  }
  .transmissions .de {
    flex: none;
    max-width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 700;
  }
  .transmissions .txt {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .transmissions .envoye {
    opacity: 0.75;
  }
  .transmissions .bulletin {
    color: var(--moutarde);
  }
  .transmissions .bulletin.majeur .txt {
    color: #ff8f7a;
  }
  .transmissions .nouveau .txt {
    color: #eafff0;
  }
  .transmissions .vide {
    opacity: 0.6;
  }
  .antenne {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid var(--couleur-encre);
    background: var(--menthe);
    animation: clignote 1.6s steps(1) infinite;
  }

  /* Journal : une ligne, sur papier de téléscripteur. */
  .journal {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--couleur-encre);
    border-left: 4px dotted var(--couleur-encre);
    border-right: 4px dotted var(--couleur-encre);
    background: var(--couleur-papier);
    font-family: var(--police-machine);
    font-size: 12px;
    text-align: left;
    min-width: 0;
  }
  .texte-journal {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .heure {
    flex: none;
    color: var(--couleur-texte-discret);
  }
  .heure.alerte {
    color: var(--cerise);
  }
  .derouler {
    margin-left: auto;
    color: var(--couleur-encre-discrete);
  }
</style>
