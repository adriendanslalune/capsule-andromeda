<script lang="ts">
  // Écran principal : le cockpit. Il répond à trois questions : où je vais, qu'est-ce qui ne va pas, quel est mon but.
  // En haut, le hublot (le toucher fait sortir en vue extérieure) ; dessous, la console : instruments à aiguilles
  // (vitesse, cap, heure d'arrivée), navigation et frise du trajet, voyants des modules, chasse, téléscripteur.
  import { MODULES_A_INSTALLER } from '../../donnees/economie'
  import { finSaison, numeroSaison, visiteurDetecte } from '../../moteur/chasse'
  import { estInstalle } from '../../moteur/economie'
  import {
    avancementTrajet,
    basculerMoteur,
    direction,
    distanceRestante,
    enAttenteDeFenetre,
    planDeVol,
    positionDestination,
    tempsRestantAVitesse,
    vitesseDuMoment,
    type Destination,
  } from '../../moteur/fusee'
  import { modulesEnPanne } from '../../moteur/modules'
  import { vitesseActuelle } from '../../moteur/partie'
  import Compas from '../cockpit/Compas.svelte'
  import Horloge from '../cockpit/Horloge.svelte'
  import Tachymetre from '../cockpit/Tachymetre.svelte'
  import { onMount } from 'svelte'
  import { delaiLumiere } from '../../astro/lumiere'
  import { positionCorps } from '../../astro/corps'
  import { dateLocale, duree, dureePrecise, heureLocale, jourEtHeure, km, nombre, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'
  import { presence } from '../reseau'

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
  /** État du moteur, pour la plaque à côté du bouton. */
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
      // Le dessin a une seconde de retard sur le moteur : on part de la valeur du pas précédent.
      const base = resteAvant === null ? resteApres : resteAvant + (resteApres - resteAvant) * a
      resteDirect = (base * croisiere) / v
    }
    image = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(image)
  })
  /** Instant d'arrivée prévu à la vitesse du moment (ms), ou null. */
  const arrivee = $derived(resteDirect !== null ? maintenantDirect + resteDirect * 1000 : null)
  /** Direction de la destination (point de rencontre), pour le compas. */
  const vers = $derived(fusee.destination ? direction(fusee.position, plan?.point ?? positionDestination(fusee.destination, t)) : null)
  const avancement = $derived(avancementTrajet(fusee, t))
  const origine = $derived(fusee.trajet?.origine ? majuscule(nomAstre(fusee.trajet.origine)) : 'En vol')

  /** Vue extérieure ; un toucher arrivé juste après un changement d'écran est ignoré (toucher « fantôme »). */
  function regarderDehors() {
    if (Date.now() - jeu.dernierChangement < 500) return
    jeu.ecran = { nom: 'dehors' }
  }

  // Chasse et présence des autres commissionnaires.
  const saison = $derived(numeroSaison(t))
  const trouve = $derived(etat.chasse.trouvailles.some((x) => x.saison === saison))
  const detecte = $derived(visiteurDetecte(etat, t))
  const dernierIndice = $derived(etat.chasse.indices[0] ?? null)
  const reseau = $derived(presence(etat, t))
  /** Délai d'un message radio jusqu'à la Terre (vrai délai de la lumière). */
  const delaiRadio = $derived.by(() => {
    const terre = positionCorps('Terre', t)
    const s = delaiLumiere(Math.hypot(fusee.position.x - terre.x, fusee.position.y - terre.y))
    return s < 60 ? `${nombre(s, 1)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`
  })

  /** Cadran montré en grand (loupe), ou null. */
  let loupe = $state<'tachymetre' | 'compas' | 'horloge' | null>(null)

  function etatTuile(code: string): 'ok' | 'avarie' | 'scelle' {
    if (!estInstalle(etat, code)) return 'scelle'
    return enPanne.includes(code) ? 'avarie' : 'ok'
  }

</script>

<main>
  <div class="defile">

  <!-- Hublot de la fusée, boulonné. Le toucher fait sortir en vue extérieure. -->
  <div class="hublot" role="button" tabindex="0" aria-label="Regarder dehors (vue extérieure)"
    onclick={regarderDehors} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') regarderDehors() }}>
    <div class="boulons-h"></div>
    <div class="boulons-v"></div>
    <div class="vitre">
      <!-- Le hublot (et three.js) se charge sans retarder l'affichage du tableau de bord. -->
      {#await import('../vue3d/Hublot.svelte') then { default: Hublot }}<Hublot />{/await}
    </div>
  </div>


  <!-- Console : instruments, navigation, voyants. -->
  <section class="console">
    <!-- Conduites de câbles, le long des deux bords de la console (décor). -->
    <span class="conduite gauche" aria-hidden="true"></span>
    <span class="conduite droite" aria-hidden="true"></span>
    <div class="panneau-fin" data-titre="PANNEAU A · PILOTAGE" data-ref="réf. TB-12">
    <div class="moteur">
      <button class="interrupteur-moteur" class:coupe aria-pressed={!coupe} aria-label={coupe ? 'Rallumer le moteur' : 'Couper le moteur'} onclick={basculer}>
        <span class="position on">ON</span>
        <span class="levier-moteur"></span>
        <span class="position off">OFF</span>
      </button>
      <span class="etiquette-encre">MOTEUR</span>
      <span class="regime" class:actif={!coupe && vitesse > 0}>{regime}</span>
    </div>
    <!-- Cadrans : le toucher les montre en grand (loupe). -->
    <div class="cadrans">
      <button class="cadran grand-cadran" aria-label="Voir le tachymètre en grand" onclick={() => (loupe = 'tachymetre')}>
        <Tachymetre valeur={vitesse} {croisiere} />
        <span class="gravure" aria-hidden="true">TACHYMÈTRE T-58</span>
      </button>
      <div class="petits-cadrans">
        <button class="cadran" aria-label="Voir le compas en grand" onclick={() => (loupe = 'compas')}><Compas cap={fusee.cap} {vers} /></button>
        <button class="cadran" aria-label="Voir l’horloge en grand" onclick={() => (loupe = 'horloge')}>
          <Horloge instant={arrivee ?? maintenantDirect} arrivee={arrivee !== null} maintenant={maintenantDirect} />
        </button>
      </div>
    </div>
    <span class="reglet" aria-hidden="true"></span>

    <!-- Radar du visiteur : petit écran du panneau ; le toucher ouvre la carte. -->
    <button class="chasse" onclick={() => (jeu.page = 'carte')}>
      <span class="radar" aria-hidden="true"><span class="balayage"></span>{#if detecte !== null || trouve}<span class="echo"></span>{/if}</span>
      <span class="texte">
        <span class="etat">{trouve ? 'VISITEUR PHOTOGRAPHIÉ' : detecte !== null ? `DÉTECTÉ À ${ua(detecte)}` : 'VISITEUR INTROUVABLE'}</span>
        <span class="indice">{dernierIndice ? `${dernierIndice.texte.toLowerCase()} (${heureLocale(dernierIndice.t)})` : 'Aucun indice pour l’instant.'}</span>
      </span>
      <span class="jours"><b>{Math.ceil((finSaison(saison) - t) / 86_400_000)}</b><small>JOURS</small></span>
    </button>
    <div class="danger" aria-hidden="true"><span>ATTENTION · PIÈCES EN MOUVEMENT</span></div>
    </div>

    <div class="navigation ecran">
      {#if fusee.destination && attente && plan}
        <div class="ligne"><span class="etiquette-encre">FENÊTRE DE TIR</span><span class="discret">départ dans {duree((plan.depart - t) / 1000)}</span></div>
        <div class="ligne"><span class="grand">{nomDestination(fusee.destination)}</span><span class="moyen">{heureLocale(plan.depart)}</span></div>
        <div class="sous">En orbite en attendant le meilleur moment pour partir. Arrivée le {dateLocale(plan.arrivee)}.</div>
      {:else if fusee.destination}
        <div class="ligne"><span class="etiquette-encre">EN ROUTE VERS</span><span class="discret">reste {ua(distanceRestante(fusee, t) ?? 0)}</span></div>
        <div class="ligne"><span class="grand">{nomDestination(fusee.destination)}</span><span class="moyen compte">{resteDirect !== null ? dureePrecise(resteDirect) : coupe ? 'MOTEUR COUPÉ' : '—'}</span></div>
        <!-- Frise du trajet : du départ à l'arrivée ; la fusée avance avec la route faite. -->
        {#if avancement !== null && fusee.trajet}
          <div class="frise">
            <div class="bouts">
              <span><small>DÉPART</small> {origine} · {heureLocale(fusee.trajet.depart)}</span>
              <span><small>ARRIVÉE</small> {arrivee !== null ? jourEtHeure(arrivee, maintenantDirect) : '—'}</span>
            </div>
            <div class="piste">
              <div class="fait" style={`width: ${avancement * 100}%`}></div>
              <svg class="fusee" style={`left: ${avancement * 100}%`} viewBox="-14 -8 30 16" aria-hidden="true">
                <path d="M -6 -5 L 6 -5 Q 14 0 6 5 L -6 5 Z" fill="var(--couleur-papier)" stroke="var(--couleur-encre)" stroke-width="2" />
                <path d="M -4 -5 L -10 -8 L -8 -5 Z M -4 5 L -10 8 L -8 5 Z" fill="var(--cerise)" stroke="var(--couleur-encre)" stroke-width="1.5" />
              </svg>
            </div>
          </div>
        {/if}
        {#if enPanne.length || !etat.modules.propulsion.levierAHaut}
          <div class="sous alerte">
            Vitesse réduite{#if enPanne.length} : {enPanne.length} avarie{enPanne.length > 1 ? 's' : ''}{/if}{#if !etat.modules.propulsion.levierAHaut} · levier L-A abaissé{/if}
          </div>
        {/if}
      {:else if fusee.orbite}
        <div class="ligne"><span class="etiquette-encre">{fusee.presDuVisiteur ? 'À CÔTÉ DE L’OBJET INCONNU' : 'EN ORBITE'}</span></div>
        <div class="ligne"><span class="grand">{majuscule(nomAstre(fusee.orbite))}</span></div>
        <div class="sous">Choisis une destination (page NAVIGATION).</div>
      {:else}
        <div class="ligne"><span class="etiquette-encre">À L’ARRÊT</span></div>
        <div class="ligne"><span class="grand">Point libre</span></div>
        <div class="sous">Moteur coupé. Choisis une destination (page NAVIGATION).</div>
      {/if}
    </div>

    <!-- Instruments de bord : petites lucarnes à chiffres. -->
    <div class="rubrique"><span>INSTRUMENTS DE BORD</span></div>
    <div class="lucarnes">
      <div class="lucarne"><small>ROUTE</small><b>{km(fusee.distanceParcourue)}</b></div>
      <div class="lucarne"><small>SOLEIL</small><b>{nombre(Math.hypot(fusee.position.x + (fusee.ecartOrbite?.x ?? 0), fusee.position.y + (fusee.ecartOrbite?.y ?? 0)), 3)} UA</b></div>
      <div class="lucarne"><small>RADIO TERRE</small><b>{delaiRadio}</b></div>
      <div class="lucarne en-ligne">
        <small><span class="antenne" aria-hidden="true"></span>EN LIGNE{#if reseau.horsReseau} · <i>FLOTTE SIMULÉE</i>{/if}</small>
        <b>{reseau.total} en vol{#if reseau.systeme && reseau.ici !== null} · {reseau.ici} {reseau.systeme === 'Terre' ? 'autour de la Terre' : `près de ${reseau.systeme}`}{/if}</b>
      </div>
    </div>

    <div class="rubrique"><span>BLOCS DU BORD</span></div>
    <div class="tableau plaque-papier">
      <div class="ligne">
        <span class="etiquette-encre">MODULES</span>
        {#if enPanne.length}<span class="etiquette-encre cerise clignotant">{enPanne.length} AVARIE{enPanne.length > 1 ? 'S' : ''}</span>{/if}
      </div>
      <div class="grille">
        <!-- CH-1 et TU-1 forment ensemble la propulsion : un trait fin les relie. -->
        <span class="lien" aria-hidden="true"><span>PROPULSION</span></span>
        {#each TOUS_LES_MODULES as code}
          {@const e = etatTuile(code)}
          <button
            class={`tuile ${e}`}
            disabled={e === 'scelle'}
            aria-label={`${code} : ${e === 'ok' ? 'en ordre' : e === 'avarie' ? 'avarie' : 'scellé'}`}
            onclick={() => (jeu.ecran = { nom: 'module', code })}
          >
            <span class="voyant"></span>
            <span class="code">{code}</span>
          </button>
        {/each}
      </div>
    </div>
    <!-- Plaque constructeur, vissée sur la console : le numéro de série de l'appareil. -->
    <div class="rangee-plaque">
      <span class="tampon" aria-hidden="true">CONTRÔLÉ<small>O.N.V.I.</small></span>
      <div class="plaque-constructeur"><span>O.N.V.I. · C-58</span><b>N° SÉRIE {etat.serie}</b></div>
    </div>
  </section>

  <!-- Téléscripteur. -->
  <div class="rubrique"><span>JOURNAL DE BORD</span></div>
  <!-- La bande s'imprime par le haut : la fin de bande est au-dessus de la dernière ligne. La toucher la déroule. -->
  <button class="telex" aria-label="Téléscripteur : dérouler tout le journal" onclick={() => (jeu.volet = 'journal')}>
    <div class="fin-bande">— FIN DE BANDE —</div>
    {#each jeu.telex.slice(-6).reverse() as l}
      <div><span class="heure" class:alerte={l.alerte}>{heureLocale(l.t)}</span> {l.texte}</div>
    {/each}
    {#if jeu.telex.length > 6}<div class="derouler">▾ DÉROULER LA BANDE · {jeu.telex.length} LIGNES</div>{/if}
  </button>

  </div>

  {#if loupe}
    <div class="loupe" role="presentation" onclick={() => (loupe = null)}>
      <div class="loupe-cadran">
        {#if loupe === 'tachymetre'}<Tachymetre valeur={vitesse} {croisiere} />
        {:else if loupe === 'compas'}<Compas cap={fusee.cap} {vers} />
        {:else}<Horloge instant={arrivee ?? maintenantDirect} arrivee={arrivee !== null} maintenant={maintenantDirect} />
        {/if}
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  /* Tout le cockpit défile au-dessus des boutons, qui restent fixés. */
  .defile {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 var(--espace) 12px;
  }
  .defile > :global(*) {
    flex: none;
  }


  /* Hublot : épais cadre tôle boulonné, vitre cernée d'encre. */
  /* Hublot : d'un bord à l'autre de l'écran, cadre fin. */
  .hublot {
    position: relative;
    height: clamp(80px, 13vh, 120px);
    margin: 0 calc(-1 * var(--espace));
    padding: 7px 7px;
    border-top: 2px solid var(--couleur-encre);
    border-bottom: 2px solid var(--couleur-encre);
    background: var(--traits), var(--couleur-papier-fonce);
    cursor: pointer;
  }
  .hublot:active .vitre {
    filter: brightness(1.15);
  }
  /* Boulons : une rangée en haut et en bas, une colonne de chaque côté. */
  .boulons-h,
  .boulons-v {
    position: absolute;
    pointer-events: none;
    --boulon: radial-gradient(circle, var(--couleur-papier) 0 1.2px, var(--couleur-encre) 1.6px 2.2px, transparent 2.5px);
  }
  .boulons-h {
    left: 16px;
    right: 16px;
    top: 0;
    bottom: 0;
    background: var(--boulon) top / 26px 7px space no-repeat, var(--boulon) bottom / 26px 7px space no-repeat;
  }
  .boulons-v {
    top: 14px;
    bottom: 14px;
    left: 0;
    right: 0;
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

  .antenne {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--couleur-encre);
    background: var(--menthe);
    animation: clignote 1.6s steps(1) infinite;
  }
  .hors {
    margin-left: auto;
    padding: 0 6px;
    border: 1.5px dashed var(--couleur-texte-discret);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  /* Console : plaque de bord, vis aux coins. */
  .console {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  /* Bouton MOTEUR : interrupteur à bascule, ON à gauche, OFF à droite. */
  .moteur {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .interrupteur-moteur {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 112px;
    height: 44px;
    padding: 0 10px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 22px;
    background: var(--menthe);
    box-shadow: var(--ombre-bouton);
  }
  .interrupteur-moteur.coupe {
    background: var(--couleur-papier);
  }
  .position {
    font-family: var(--police-titre);
    font-size: 13px;
  }
  .interrupteur-moteur:not(.coupe) .off,
  .interrupteur-moteur.coupe .on {
    opacity: 0.35;
  }
  .levier-moteur {
    position: absolute;
    top: 4px;
    left: calc(100% - 40px);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--cerise);
    transition: left 0.15s;
    z-index: 1;
  }
  .interrupteur-moteur.coupe .levier-moteur {
    left: 4px;
    background: var(--couleur-papier-fonce);
  }
  .interrupteur-moteur:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--couleur-encre);
  }
  .regime {
    margin-left: auto;
    padding: 2px 8px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--nuit);
    color: #9cc7a4;
    font-family: var(--police-chiffres);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .regime.actif {
    color: var(--menthe);
  }
  .plaque-constructeur {
    align-self: center;
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 2px 12px;
    border: 2px solid var(--couleur-encre);
    border-radius: 4px;
    --rivet: radial-gradient(circle, var(--couleur-encre) 0 1.5px, transparent 2px);
    background: var(--rivet) left 3px center / 5px 5px no-repeat, var(--rivet) right 3px center / 5px 5px no-repeat, var(--moutarde);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    line-height: 1.25;
  }
  .plaque-constructeur b {
    font-family: var(--police-machine);
    font-size: 14px;
    letter-spacing: 2px;
  }
  /* Cadrans : le grand tachymètre à gauche, compas et horloge empilés à droite, légendes dessous. */
  .cadrans {
    display: grid;
    grid-template-columns: 1.45fr 1fr;
    gap: 4px;
    align-items: stretch;
    margin-right: 10px; /* place du réglet */
  }
  .cadran {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .cadran:active {
    transform: scale(0.97);
  }
  .grand-cadran :global(svg) {
    max-width: 196px;
  }
  .gravure {
    font-family: var(--police-machine);
    font-size: 9px;
    color: var(--couleur-encre-discrete);
  }
  .petits-cadrans {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
  }
  .petits-cadrans :global(svg) {
    max-width: 80px;
  }
  .petits-cadrans :global(figcaption) {
    font-size: 13px;
  }
  .petits-cadrans :global(figcaption .etiquette-encre) {
    font-size: 10px;
  }

  /* Loupe : un cadran en grand, au centre de l'écran. */
  .loupe {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    background: rgba(42, 30, 23, 0.72);
    animation: apparait 0.2s ease-out;
  }
  .loupe-cadran {
    width: min(86vw, 380px);
  }
  .loupe-cadran :global(svg) {
    max-width: none !important;
    width: 100%;
  }
  .loupe-cadran :global(figcaption) {
    font-size: 22px;
    color: var(--couleur-texte-clair);
  }
  @keyframes apparait {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
  }

  /* Écran de navigation : vitre sombre dans un cadre d'encre, texte vert lumineux, compte à rebours ambré. */
  .ecran {
    position: relative;
    padding: 6px 11px 7px;
    border: 3px solid var(--couleur-encre);
    border-radius: 12px;
    background-color: var(--nuit);
    background-image: repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 3px);
    box-shadow: 0 0 0 3px #0f1822 inset, 3px 3px 0 var(--couleur-encre);
    color: var(--menthe);
    overflow: hidden;
    /* Ce qui est affiché fait écran : lueur des caractères, léger scintillement. */
    text-shadow: 0 0 5px rgba(143, 207, 152, 0.55);
    animation: scintille 0.12s steps(2) infinite;
  }
  /* Lignes de balayage par-dessus l'affichage, et bande de rafraîchissement qui descend. */
  .ecran::before,
  .ecran::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .ecran::before {
    background: repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.28) 0 1px, transparent 1px 3px);
  }
  .ecran::after {
    background: linear-gradient(180deg, transparent 0%, rgba(143, 207, 152, 0.1) 45%, rgba(143, 207, 152, 0.16) 50%, transparent 56%);
    background-size: 100% 300%;
    animation: rafraichit 3.2s linear infinite;
  }
  @keyframes rafraichit {
    from {
      background-position: 0 100%;
    }
    to {
      background-position: 0 -200%;
    }
  }
  @keyframes scintille {
    50% {
      opacity: 0.94;
    }
  }
  .ecran .compte {
    text-shadow: 0 0 6px rgba(242, 181, 58, 0.7);
  }
  .ecran .grand {
    text-shadow: 0 0 6px rgba(250, 242, 220, 0.45);
  }
  .ecran .etiquette-encre {
    background: none;
    border: 1.5px solid var(--menthe);
    color: var(--menthe);
  }
  .ecran .grand {
    color: var(--couleur-papier);
  }
  .ecran .discret,
  .ecran .sous,
  .ecran .bouts small {
    color: #9cc7a4;
  }
  .ecran .alerte {
    color: #ff8a6e;
  }
  .compte {
    font-family: var(--police-chiffres);
    font-variant-numeric: tabular-nums;
    font-size: 21px;
    color: var(--moutarde);
    letter-spacing: 1px;
  }
  .ecran .piste {
    border-color: var(--menthe);
    background: repeating-linear-gradient(90deg, transparent 0 8px, rgba(143, 207, 152, 0.25) 8px 10px);
  }
  .ecran .fait {
    background: var(--menthe);
  }
  /* Plaque de papier vissée sur la console (voyants des blocs). */
  .plaque-papier {
    position: relative;
  }
  .defile > .rubrique,
  .rubrique {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2.5px;
    color: var(--couleur-encre-discrete);
  }
  .rubrique::before,
  .rubrique::after {
    content: '';
    flex: 1;
    height: 4px;
    border-top: 1px solid var(--couleur-encre);
    border-bottom: 1px solid var(--couleur-encre);
  }
  .rubrique::before {
    flex: 0 0 14px;
  }
  .lucarnes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  .lucarne {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 4px 7px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--points), var(--couleur-papier);
    box-shadow: 2px 2px 0 var(--couleur-encre);
    min-width: 0;
  }
  .lucarne small {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--couleur-encre-discrete);
  }
  .lucarne b {
    font-family: var(--police-chiffres);
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lucarne.en-ligne {
    grid-column: 1 / -1;
  }
  .lucarne i {
    font-style: normal;
    color: var(--cerise);
  }
  .plaque-papier .lien span {
    background: var(--couleur-fond);
  }
  .ligne {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .discret {
    font-size: 14px;
    color: var(--couleur-texte-discret);
  }
  .grand {
    font-family: var(--police-titre);
    font-size: 23px;
    line-height: 1.2;
    margin-top: 2px;
  }
  .moyen {
    font-size: 18px;
    font-weight: 700;
  }
  .sous {
    margin-top: 4px;
    font-size: 14px;
    color: var(--couleur-texte-discret);
  }
  .alerte {
    color: var(--cerise);
    font-weight: 700;
  }

  /* Frise du trajet. */
  .frise {
    margin-top: 3px;
  }
  .bouts {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
  }
  .bouts small {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--couleur-texte-discret);
  }
  .piste {
    position: relative;
    height: 12px;
    margin: 6px 10px 2px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: repeating-linear-gradient(90deg, var(--couleur-papier) 0 8px, var(--couleur-papier-fonce) 8px 10px);
  }
  .fait {
    height: 100%;
    border-radius: 4px 0 0 4px;
    background: var(--moutarde);
  }
  .fusee {
    position: absolute;
    top: 50%;
    width: 30px;
    height: 16px;
    transform: translate(-50%, -50%);
  }

  /* Voyants des modules. */
  .clignotant {
    animation: clignote 0.8s steps(1) infinite;
  }
  .grille {
    position: relative;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 4px 4px;
    margin-top: 15px;
  }
  /* Crochet au-dessus des voyants CH-1 et TU-1 (les deux premières colonnes). */
  .lien {
    position: absolute;
    top: -9px;
    left: calc((100% - 20px) / 12);
    width: calc((100% - 20px) / 6 + 4px);
    height: 12px;
    border: 1.5px solid var(--couleur-encre);
    border-bottom: 0;
    border-radius: 4px 4px 0 0;
    pointer-events: none;
  }
  .lien span {
    position: absolute;
    left: 50%;
    top: -7px;
    transform: translateX(-50%);
    padding: 0 3px;
    background: var(--couleur-papier-fonce);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    line-height: 1.2;
  }
  .tuile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 0;
    border: 0;
    background: none;
    min-width: 0;
  }
  .voyant {
    position: relative;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--menthe);
    box-shadow: 2px 2px 0 var(--couleur-encre);
  }
  .voyant::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 4px;
    width: 8px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.75);
    transform: rotate(-30deg);
  }
  .tuile:active .voyant {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
  .tuile .code {
    font-size: 13px;
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
  .tuile.scelle {
    cursor: default;
  }
  .tuile.scelle .voyant {
    border-style: dashed;
    border-color: var(--couleur-texte-eteint);
    background: repeating-linear-gradient(45deg, transparent 0 4px, rgba(42, 30, 23, 0.12) 4px 6px);
    box-shadow: none;
  }
  .tuile.scelle .voyant::after {
    display: none;
  }
  .tuile.scelle .code {
    color: var(--couleur-texte-eteint);
  }

  /* Chasse. */
  .chasse {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 6px 10px 6px 6px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--hachures-claires), var(--nuit);
    color: #9cc7a4;
    text-align: left;
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.06);
  }
  .radar {
    position: relative;
    flex: none;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 3px solid var(--moutarde);
    outline: 1.5px solid var(--couleur-encre);
    background: #10331f;
    overflow: hidden;
  }
  .radar::before {
    content: '';
    position: absolute;
    inset: 9px;
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
  .chasse .texte {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .chasse .etat {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--menthe);
  }
  .chasse .indice {
    font-size: 13px;
    color: #9cc7a4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chasse .jours {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-left: 8px;
    border-left: 1px solid rgba(156, 199, 164, 0.4);
    line-height: 1;
  }
  .chasse .jours b {
    font-family: var(--police-chiffres);
    font-size: 20px;
    color: var(--moutarde);
  }
  .chasse .jours small {
    font-size: 8px;
    letter-spacing: 1px;
  }
  .chasse:active {
    filter: brightness(1.15);
  }

  /* Téléscripteur. */
  /* Journal de bord : les derniers messages, le plus récent en haut. */
  .telex {
    padding: 6px 22px;
    border: 1px solid var(--couleur-encre);
    border-radius: 2px;
    /* Bande de téléscripteur : papier clair, trous d'entraînement des deux côtés. */
    --trou: radial-gradient(circle, var(--couleur-fond) 0 2.4px, var(--couleur-encre) 2.9px 3.4px, transparent 3.8px);
    background: var(--trou) left 4px top 4px / 10px 14px repeat-y, var(--trou) right 4px top 4px / 10px 14px repeat-y,
      linear-gradient(90deg, transparent 17px, rgba(42, 30, 23, 0.35) 17px 18px, transparent 18px calc(100% - 18px), rgba(42, 30, 23, 0.35) calc(100% - 18px) calc(100% - 17px), transparent calc(100% - 17px)),
      var(--couleur-papier);
    font-family: var(--police-machine);
    font-size: 13px;
    line-height: 1.45;
  }
  .heure {
    color: var(--couleur-texte-discret);
  }
  .telex {
    display: block;
    width: 100%;
    text-align: left;
    color: inherit;
  }
  .telex:active {
    filter: brightness(0.96);
  }
  .derouler {
    margin-top: 3px;
    text-align: center;
    font-size: 10px;
    letter-spacing: 1.5px;
    color: var(--couleur-encre-discrete);
  }
  .fin-bande {
    margin-bottom: 2px;
    text-align: center;
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--couleur-texte-eteint);
  }

  /* Décors au trait fin. */
  /* Panneau : double filet d'encre, vis aux quatre coins, légende gravée dans le cadre. */
  .panneau-fin {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 6px;
    padding: 14px 12px 8px;
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
  /* Réglet gradué le long du bord droit du panneau. */
  .reglet {
    position: absolute;
    right: 9px;
    top: 66px;
    bottom: 52px;
    width: 7px;
    border-left: 1px solid rgba(42, 30, 23, 0.5);
    background: repeating-linear-gradient(180deg, rgba(42, 30, 23, 0.55) 0 1px, transparent 1px 6px) left / 4px 100% no-repeat,
      repeating-linear-gradient(180deg, rgba(42, 30, 23, 0.7) 0 1px, transparent 1px 30px) left / 7px 100% no-repeat;
    pointer-events: none;
  }
  /* Bande « danger » jaune et noire, avec sa consigne. */
  .danger {
    display: flex;
    justify-content: center;
    height: 12px;
    border: 1px solid var(--couleur-encre);
    background: repeating-linear-gradient(-45deg, var(--moutarde) 0 6px, var(--couleur-encre) 6px 12px);
  }
  .danger span {
    padding: 0 6px;
    background: var(--moutarde);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 1.5px;
    line-height: 10px;
  }
  /* Conduites de câbles : deux filets, avec un collier tous les 70 px. */
  .conduite {
    position: absolute;
    top: 30px;
    bottom: 40px;
    width: 5px;
    border-left: 1px solid rgba(42, 30, 23, 0.55);
    border-right: 1px solid rgba(42, 30, 23, 0.55);
    background: repeating-linear-gradient(180deg, transparent 0 62px, var(--couleur-encre) 62px 63px, transparent 63px 66px, var(--couleur-encre) 66px 67px, transparent 67px 70px);
    pointer-events: none;
  }
  .conduite.gauche {
    left: -11px;
  }
  .conduite.droite {
    right: -11px;
  }
  /* Plaque constructeur, cote et tampon de contrôle. */
  .rangee-plaque {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
  }
  .tampon {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1px 5px;
    border: 2px solid var(--cerise);
    border-radius: 4px;
    color: var(--cerise);
    font-family: var(--police-titre);
    font-size: 7.5px;
    line-height: 1.1;
    letter-spacing: 0.5px;
    opacity: 0.7;
    transform: rotate(-12deg);
  }
  .tampon small {
    font-family: var(--police-machine);
    font-size: 6px;
  }
  .heure.alerte {
    color: var(--cerise);
  }

</style>
