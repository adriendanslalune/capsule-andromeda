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
  import Icone from '../cockpit/Icone.svelte'
  import Tachymetre from '../cockpit/Tachymetre.svelte'
  import { onMount } from 'svelte'
  import { dateLocale, duree, dureePrecise, heureLocale, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'
  import { presence } from '../reseau'
  import { basculerSon, sonActif } from '../sons'

  const TOUS_LES_MODULES = ['CH-1', 'TU-1', 'AL-1', ...MODULES_A_INSTALLER.map((m) => m.code)]

  let son = $state(sonActif())
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

  function etatTuile(code: string): 'ok' | 'avarie' | 'scelle' {
    if (!estInstalle(etat, code)) return 'scelle'
    return enPanne.includes(code) ? 'avarie' : 'ok'
  }

  /** Crédits sur le compteur (au moins 4 chiffres). */
  const tambours = $derived(String(Math.max(0, Math.floor(etat.credits))).padStart(4, '0').split(''))
</script>

<main>
  <div class="defile">
  <!-- En-tête : nom de la fusée, compteur de crédits, saison, son. -->
  <header>
    <div class="identite">
      <span class="c58 titre-pulp">C-58</span>
      <span class="nom">{etat.nom || etat.serie}</span>
    </div>
    <div class="instruments">
      <button class="credits" aria-label={`${etat.credits} crédits : ouvrir le portefeuille`} onclick={() => (jeu.volet = 'portefeuille')}>
        <span class="compteur">{#each tambours as c}<span>{c}</span>{/each}</span>
        <span class="unite">CR</span>
      </button>
      <span class="etiquette-encre">SAISON {saison}</span>
      <button class="interrupteur" class:coupe={!son} aria-label={son ? 'Couper le son' : 'Remettre le son'} onclick={() => (son = basculerSon())}>
        <span class="bascule"></span><span class="mot">{son ? 'SON' : 'MUET'}</span>
      </button>
    </div>
  </header>

  <!-- Hublot de la fusée, boulonné. Le toucher fait sortir en vue extérieure. -->
  <div class="hublot" role="button" tabindex="0" aria-label="Regarder dehors (vue extérieure)"
    onclick={regarderDehors} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') regarderDehors() }}>
    <div class="boulons-h"></div>
    <div class="boulons-v"></div>
    <div class="vitre">
      <!-- Le hublot (et three.js) se charge sans retarder l'affichage du tableau de bord. -->
      {#await import('../vue3d/Hublot.svelte') then { default: Hublot }}<Hublot />{/await}
      <!-- Présence des autres commissionnaires, inscrite au bas de la vitre. -->
      <p class="reseau">
        <span class="antenne" aria-hidden="true"></span>
        <b>{reseau.total}</b> en vol dans le système solaire{#if reseau.systeme && reseau.ici !== null} · <b>{reseau.ici}</b> autour {reseau.systeme === 'Terre' ? 'de la Terre' : `de ${reseau.systeme}`}{/if}
        {#if reseau.horsReseau}<span class="hors">HORS RÉSEAU</span>{/if}
      </p>
    </div>
  </div>


  <!-- Console : instruments, navigation, voyants. -->
  <section class="console">
    <div class="moteur">
      <button class="interrupteur-moteur" class:coupe aria-pressed={!coupe} aria-label={coupe ? 'Rallumer le moteur' : 'Couper le moteur'} onclick={basculer}>
        <span class="position on">ON</span>
        <span class="levier-moteur"></span>
        <span class="position off">OFF</span>
      </button>
      <span class="etiquette-encre">MOTEUR</span>
      <span class="regime" class:actif={!coupe && vitesse > 0}>{regime}</span>
    </div>
    <div class="cadrans">
      <div class="grand-cadran"><Tachymetre valeur={vitesse} {croisiere} /></div>
      <div class="petits-cadrans">
        <Compas cap={fusee.cap} {vers} />
        <Horloge instant={arrivee ?? maintenantDirect} arrivee={arrivee !== null} maintenant={maintenantDirect} />
      </div>
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
              <span><small>ARRIVÉE</small> {arrivee !== null ? heureLocale(arrivee) : '—'}</span>
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
        <div class="sous">Choisis une destination sur la carte.</div>
      {:else}
        <div class="ligne"><span class="etiquette-encre">À L’ARRÊT</span></div>
        <div class="ligne"><span class="grand">Point libre</span></div>
        <div class="sous">Moteur coupé. Choisis une destination sur la carte.</div>
      {/if}
    </div>

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
    <div class="plaque-constructeur"><span>O.N.V.I. · C-58</span><b>N° SÉRIE {etat.serie}</b></div>
  </section>

  <!-- Chasse au visiteur. -->
  <button class="chasse panneau" onclick={() => (jeu.volet = 'carte')}>
    <span class="radar" aria-hidden="true"><span class="balayage"></span>{#if detecte !== null || trouve}<span class="echo"></span>{/if}</span>
    <span class="texte">
      <span class="etat">{trouve ? 'VISITEUR PHOTOGRAPHIÉ' : detecte !== null ? `DÉTECTÉ À ${ua(detecte)}` : 'VISITEUR INTROUVABLE'}</span>
      <span class="indice">{dernierIndice ? `${dernierIndice.texte.toLowerCase()} (${heureLocale(dernierIndice.t)})` : 'Aucun indice pour l’instant.'}</span>
    </span>
    <span class="jours">{Math.ceil((finSaison(saison) - t) / 86_400_000)} j</span>
  </button>

  <!-- Téléscripteur. -->
  <section class="telex" aria-label="Téléscripteur">
    {#each jeu.telex.slice(-6).reverse() as l}
      <div><span class="heure" class:alerte={l.alerte}>{heureLocale(l.t)}</span> {l.texte}</div>
    {/each}
  </section>

  </div>

  <!-- Les cinq boutons du bas, toujours fixés : chacun avec son dessin. -->
  <nav>
    <button class="bouton cerise" onclick={() => (jeu.volet = 'carte')}><Icone nom="carte" /><span>CARTE</span></button>
    <button class="bouton moutarde" onclick={() => { jeu.ongletOffice = 'contrats'; jeu.volet = 'office' }}><Icone nom="contrats" /><span>CONTRATS</span></button>
    <button class="bouton tole" onclick={() => { jeu.ongletOffice = 'atelier'; jeu.volet = 'office' }}><Icone nom="atelier" /><span>ATELIER</span></button>
    <button class="bouton moutarde" onclick={() => { jeu.ongletOffice = 'trophees'; jeu.volet = 'office' }}><Icone nom="trophees" /><span>TROPHÉES</span></button>
    <button class="bouton clair" onclick={() => (jeu.volet = 'manuel')}><Icone nom="manuel" /><span>MANUEL</span></button>
  </nav>
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

  /* En-tête. */
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding-top: 6px;
  }
  .identite {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .c58 {
    font-size: 24px;
    line-height: 1;
  }
  .nom {
    font-family: var(--police-script);
    font-size: 17px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  .instruments {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .credits {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
  }
  .credits:active {
    transform: translateY(2px);
  }
  .credits .compteur {
    font-size: 17px;
  }
  .unite {
    font-size: 12px;
    font-weight: 700;
  }
  .interrupteur {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 44px;
    border: 0;
    background: none;
    padding: 0;
  }
  .bascule {
    position: relative;
    width: 20px;
    height: 30px;
    border-radius: 10px;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--menthe);
  }
  .bascule::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 2px solid var(--couleur-encre);
    background: var(--couleur-papier);
    transition: top 0.12s;
  }
  .interrupteur.coupe .bascule {
    background: var(--couleur-papier-fonce);
  }
  .interrupteur.coupe .bascule::after {
    top: 13px;
  }
  .interrupteur .mot {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  /* Hublot : épais cadre tôle boulonné, vitre cernée d'encre. */
  .hublot {
    position: relative;
    height: clamp(130px, 24vh, 210px);
    padding: 12px;
    border: 3px solid var(--couleur-encre);
    border-radius: 34px;
    background: var(--traits), var(--couleur-papier-fonce);
    box-shadow: var(--ombre);
    cursor: pointer;
  }
  .hublot:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--couleur-encre);
  }
  /* Boulons : une rangée en haut et en bas, une colonne de chaque côté. */
  .boulons-h,
  .boulons-v {
    position: absolute;
    pointer-events: none;
    --boulon: radial-gradient(circle, var(--couleur-papier) 0 2.2px, var(--couleur-encre) 2.7px 3.7px, transparent 4.1px);
  }
  .boulons-h {
    left: 30px;
    right: 30px;
    top: 0;
    bottom: 0;
    background: var(--boulon) top / 32px 12px space no-repeat, var(--boulon) bottom / 32px 12px space no-repeat;
  }
  .boulons-v {
    top: 30px;
    bottom: 30px;
    left: 0;
    right: 0;
    background: var(--boulon) left / 12px 30px no-repeat space, var(--boulon) right / 12px 30px no-repeat space;
  }
  .vitre {
    position: relative;
    height: 100%;
    overflow: hidden;
    border: 3px solid var(--couleur-encre);
    border-radius: 22px;
    background: var(--nuit);
  }

  /* Présence en ligne. */
  .reseau {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    margin: 0;
    font-size: 11.5px;
    color: rgba(250, 242, 220, 0.75);
    pointer-events: none;
  }
  .reseau b {
    color: var(--couleur-papier);
  }
  .reseau .hors {
    border-color: rgba(250, 242, 220, 0.5);
    font-size: 9.5px;
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
    background: var(--moutarde);
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
  .cadrans {
    display: grid;
    grid-template-columns: 1.55fr 1fr;
    gap: 10px;
    align-items: center;
  }
  .grand-cadran :global(svg) {
    max-width: 200px;
  }
  .petits-cadrans {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .petits-cadrans :global(figure) {
    flex-direction: row;
    gap: 8px;
  }
  .petits-cadrans :global(svg) {
    max-width: 82px;
  }
  .petits-cadrans :global(figcaption) {
    flex-direction: column;
    align-items: flex-start;
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
    padding: 5px 12px;
    text-align: left;
  }
  .radar {
    position: relative;
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--tole);
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
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .chasse .indice {
    font-size: 14px;
    color: var(--couleur-texte-discret);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chasse .jours {
    font-family: var(--police-titre);
    font-size: 15px;
  }
  .chasse:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--couleur-encre);
  }

  /* Téléscripteur. */
  /* Journal de bord : les derniers messages, le plus récent en haut. */
  .telex {
    padding: 4px 10px;
    border-top: 2px dashed var(--couleur-encre);
    border-bottom: 2px dashed var(--couleur-encre);
    font-family: var(--police-machine);
    font-size: 13px;
    line-height: 1.45;
  }
  .heure {
    color: var(--couleur-texte-discret);
  }
  .heure.alerte {
    color: var(--cerise);
  }

  nav {
    flex: none;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 7px;
    padding: 8px var(--espace) 10px;
    border-top: 3px solid var(--couleur-encre);
    background: var(--points), var(--couleur-fond);
  }
  nav button {
    height: 56px;
    min-width: 0;
    padding: 4px 0 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border-radius: 12px;
    font-family: var(--police-titre);
    font-size: 9.5px;
    font-weight: 400;
    letter-spacing: 0.3px;
  }
</style>
