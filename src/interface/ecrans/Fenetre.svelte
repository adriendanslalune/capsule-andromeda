<script lang="ts">
  // Écran principal : le cockpit. Il répond à trois questions : où je vais, qu'est-ce qui ne va pas, quel est mon but.
  // En haut, la fenêtre ; dessous, le tableau de bord : navigation, voyants des modules, chasse, téléscripteur et
  // les trois gros boutons.
  import { MODULES_A_INSTALLER } from '../../donnees/economie'
  import { finSaison, numeroSaison, visiteurDetecte } from '../../moteur/chasse'
  import { estInstalle } from '../../moteur/economie'
  import { distanceRestante, enAttenteDeFenetre, planDeVol, tempsRestant, type Destination } from '../../moteur/fusee'
  import { modulesEnPanne } from '../../moteur/modules'
  import { vitesseActuelle } from '../../moteur/partie'
  import { dateLocale, duree, heureLocale, nombre, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'
  import { basculerSon, sonActif } from '../sons'

  const TOUS_LES_MODULES = ['CH-1', 'TU-1', 'AL-1', ...MODULES_A_INSTALLER.map((m) => m.code)]

  let son = $state(sonActif())
  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const fusee = $derived(etat.fusee)
  const enPanne = $derived(modulesEnPanne(etat.modules))
  const vitesse = $derived(vitesseActuelle(etat))

  function nomDestination(d: Destination): string {
    if (d.type === 'point') return 'Point libre'
    if (d.type === 'visiteur') return 'Objet inconnu'
    return nomAstre(d.astre).replace(/^./, (c) => c.toUpperCase())
  }

  // Distance au départ, pour la barre de progression (retenue tant que la destination ne change pas).
  let cleDepart = ''
  let distanceDepart = 0
  const progression = $derived.by(() => {
    if (!fusee.destination || enAttenteDeFenetre(fusee)) return null
    const cle = JSON.stringify(fusee.destination)
    const d = distanceRestante(fusee, t) ?? 0
    if (cle !== cleDepart) { cleDepart = cle; distanceDepart = d }
    return distanceDepart > 0 ? Math.max(0, Math.min(1, 1 - d / distanceDepart)) : 0
  })

  const plan = $derived(fusee.destination ? planDeVol(fusee, t, vitesse) : null)
  const reste = $derived(fusee.destination ? tempsRestant(fusee, t, vitesse) : null)

  /** Vue extérieure ; un toucher arrivé juste après un changement d'écran est ignoré (toucher « fantôme »). */
  function regarderDehors() {
    if (Date.now() - jeu.dernierChangement < 500) return
    jeu.ecran = { nom: 'dehors' }
  }

  // Chasse.
  const saison = $derived(numeroSaison(t))
  const trouve = $derived(etat.chasse.trouvailles.some((x) => x.saison === saison))
  const detecte = $derived(visiteurDetecte(etat, t))
  const dernierIndice = $derived(etat.chasse.indices[0] ?? null)

  function etatTuile(code: string): 'ok' | 'avarie' | 'scelle' {
    if (!estInstalle(etat, code)) return 'scelle'
    return enPanne.includes(code) ? 'avarie' : 'ok'
  }

  /** Crédits sur le compteur à tambours (au moins 4 chiffres). */
  const tambours = $derived(String(Math.max(0, Math.floor(etat.credits))).padStart(4, '0').split(''))
</script>

<main>
  <!-- En-tête : nom de la fusée, compteur de crédits, saison, son. -->
  <header>
    <div class="identite">
      <span class="c58 titre-pulp">C-58</span>
      <span class="nom">{etat.nom || etat.serie}</span>
    </div>
    <div class="instruments">
      <div class="credits" aria-label={`${etat.credits} crédits`}>
        <span class="compteur">{#each tambours as c}<span>{c}</span>{/each}</span>
        <span class="unite">CR</span>
      </div>
      <span class="etiquette-encre">SAISON {saison}</span>
      <button class="interrupteur" class:coupe={!son} aria-label={son ? 'Couper le son' : 'Remettre le son'} onclick={() => (son = basculerSon())}>
        <span class="bascule"></span><span class="mot">{son ? 'SON' : 'MUET'}</span>
      </button>
    </div>
  </header>

  <!-- La fenêtre du cockpit. -->
  <div class="fenetre">
    <!-- Le hublot (et three.js) se charge sans retarder l'affichage du tableau de bord. -->
    {#await import('../vue3d/Hublot.svelte') then { default: Hublot }}<Hublot />{/await}
    <button class="dehors bouton clair" onclick={regarderDehors}>VUE EXTÉRIEURE</button>
  </div>

  <!-- Navigation. -->
  <section class="navigation panneau">
    {#if fusee.destination && enAttenteDeFenetre(fusee) && plan}
      <div class="ligne"><span class="etiquette-encre">FENÊTRE DE TIR</span><span class="discret">départ dans {duree((plan.depart - t) / 1000)}</span></div>
      <div class="ligne"><span class="grand">{nomDestination(fusee.destination)}</span><span class="moyen">le {dateLocale(plan.arrivee)}</span></div>
      <div class="sous">En orbite en attendant le meilleur moment pour partir.</div>
    {:else if fusee.destination}
      <div class="ligne"><span class="etiquette-encre">EN ROUTE VERS</span><span class="discret">{ua(distanceRestante(fusee, t) ?? 0)}</span></div>
      <div class="ligne"><span class="grand">{nomDestination(fusee.destination)}</span><span class="moyen">{reste !== null ? duree(reste) : '—'}</span></div>
      <div class="barre"><div style={`width: ${Math.round((progression ?? 0) * 100)}%`}></div></div>
      <div class="sous" class:alerte={enPanne.length > 0 || !etat.modules.propulsion.levierAHaut}>
        {nombre(vitesse, 1)} km/s{#if enPanne.length} · ralentie par {enPanne.length} avarie{enPanne.length > 1 ? 's' : ''}{/if}{#if !etat.modules.propulsion.levierAHaut} · levier L-A abaissé{/if}
      </div>
    {:else if fusee.orbite}
      <div class="ligne"><span class="etiquette-encre">{fusee.presDuVisiteur ? 'À CÔTÉ DE L’OBJET INCONNU' : 'EN ORBITE'}</span><span class="discret">0 km/s</span></div>
      <div class="ligne"><span class="grand">{nomAstre(fusee.orbite).replace(/^./, (c) => c.toUpperCase())}</span></div>
      <div class="sous">Choisis une destination sur la carte.</div>
    {:else}
      <div class="ligne"><span class="etiquette-encre">À L’ARRÊT</span><span class="discret">0 km/s</span></div>
      <div class="ligne"><span class="grand">Point libre</span></div>
      <div class="sous">Moteur coupé. Choisis une destination sur la carte.</div>
    {/if}
  </section>

  <!-- Voyants des modules. -->
  <section class="tableau panneau">
    <div class="ligne">
      <span class="etiquette-encre">TABLEAU DE BORD</span>
      {#if enPanne.length}<span class="etiquette-encre cerise clignotant">{enPanne.length} AVARIE{enPanne.length > 1 ? 'S' : ''}</span>{/if}
    </div>
    <div class="grille">
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
    {#each jeu.telex.slice(-2).reverse() as l}
      <div><span class="heure" class:alerte={l.alerte}>{heureLocale(l.t)}</span> {l.texte}</div>
    {/each}
  </section>

  <nav>
    <button class="bouton cerise" onclick={() => (jeu.volet = 'carte')}>CARTE</button>
    <button class="bouton moutarde" onclick={() => (jeu.volet = 'office')}>OFFICE</button>
    <button class="bouton clair" onclick={() => (jeu.volet = 'manuel')}>MANUEL</button>
  </nav>
</main>

<style>
  main {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    padding: 0 var(--espace) 18px;
  }
  main > :global(*) {
    flex: none;
  }

  /* En-tête. */
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding-top: 10px;
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
  }
  .credits .compteur {
    font-size: 17px;
  }
  .unite {
    font-size: 12px;
    font-weight: 700;
  }
  /* Interrupteur à bascule, à plat. */
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

  /* Fenêtre du cockpit : basse, pour laisser la place au tableau de bord. */
  .fenetre {
    position: relative;
    flex: 1 1 auto !important;
    min-height: 140px;
    max-height: 230px;
    border: 3px solid var(--couleur-encre);
    border-radius: 22px;
    overflow: hidden;
    box-shadow: var(--ombre);
    background: var(--nuit);
  }
  .dehors {
    position: absolute;
    right: 10px;
    bottom: 10px;
    min-height: 36px;
    padding: 0 12px;
    font-size: 12px;
    border-radius: 10px;
  }

  /* Navigation. */
  .navigation {
    padding: 9px 13px 10px;
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
    font-size: 25px;
    line-height: 1.2;
    margin-top: 2px;
  }
  .moyen {
    font-size: 18px;
    font-weight: 700;
  }
  .barre {
    height: 12px;
    margin-top: 5px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--couleur-papier-fonce);
    overflow: hidden;
  }
  .barre div {
    height: 100%;
    background: repeating-linear-gradient(-45deg, var(--moutarde) 0 6px, #f6c867 6px 12px);
    border-right: 2px solid var(--couleur-encre);
  }
  .sous {
    margin-top: 5px;
    font-size: 15px;
    color: var(--couleur-texte-discret);
  }
  .alerte {
    color: var(--cerise);
    font-weight: 700;
  }

  /* Voyants. */
  .tableau {
    padding: 9px 12px 10px;
  }
  .clignotant {
    animation: clignote 0.8s steps(1) infinite;
  }
  .grille {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px 4px;
    margin-top: 9px;
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--menthe);
    box-shadow: 2px 2px 0 var(--couleur-encre);
  }
  /* Petit éclat blanc, à plat, façon bande dessinée. */
  .voyant::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 5px;
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
    gap: 11px;
    align-items: center;
    padding: 8px 12px;
    text-align: left;
  }
  .radar {
    position: relative;
    flex: none;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: var(--trait) solid var(--couleur-encre);
    background: var(--sarcelle);
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

  /* Téléscripteur : bande de papier tapée à la machine. */
  .telex {
    min-height: 44px;
    padding: 5px 10px;
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

  /* Les trois gros boutons. */
  nav {
    display: flex;
    gap: 12px;
    margin-top: 2px;
  }
  nav button {
    flex: 1;
    height: 54px;
    font-family: var(--police-titre);
    font-size: 17px;
    font-weight: 400;
    letter-spacing: 1px;
  }
</style>
