<script lang="ts">
  // Écran principal : le cockpit. Il répond à trois questions : où je vais, qu'est-ce qui ne va pas, quel est mon but.
  // En haut, la cloison et le hublot à trois vitres ; dessous, le tableau de bord : écran de navigation, voyants
  // des modules, radar de chasse, téléscripteur et les trois gros poussoirs.
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

<main class="tole">
  <!-- Cloison du haut : plaque de la fusée, compteur de crédits, saison, son. -->
  <header class="rivets">
    <div class="plaque">
      <span class="c58">C-58</span>
      <span class="nom">{etat.nom || etat.serie}</span>
    </div>
    <div class="instruments">
      <div class="credits" aria-label={`${etat.credits} crédits`}>
        <span class="compteur">{#each tambours as c}<span>{c}</span>{/each}</span>
        <span class="unite">CR</span>
      </div>
      <span class="ruban">SAISON {saison}</span>
      <button class="interrupteur" class:coupe={!son} aria-label={son ? 'Couper le son' : 'Remettre le son'} onclick={() => (son = basculerSon())}>
        <span class="bascule"></span><span class="mot">{son ? 'SON' : 'MUET'}</span>
      </button>
    </div>
  </header>

  <!-- Le hublot : trois vitres cerclées de chrome. -->
  <div class="verriere chrome">
    <div class="vitre">
      <!-- Le hublot (et three.js) se charge sans retarder l'affichage du tableau de bord. -->
      {#await import('../vue3d/Hublot.svelte') then { default: Hublot }}<Hublot />{/await}
      <div class="reflet"></div>
      <button class="dehors poussoir ivoire" onclick={regarderDehors}>VUE EXTÉRIEURE</button>
    </div>
  </div>

  <!-- Écran de navigation. -->
  <section class="navigation phosphore">
    {#if fusee.destination && enAttenteDeFenetre(fusee) && plan}
      <div class="ligne"><span class="etiquette">FENÊTRE DE TIR</span><span class="discret">départ dans {duree((plan.depart - t) / 1000)}</span></div>
      <div class="ligne"><span class="grand">{nomDestination(fusee.destination)}</span><span>arrivée le {dateLocale(plan.arrivee)}</span></div>
      <div class="sous">En orbite en attendant le meilleur moment pour partir.</div>
    {:else if fusee.destination}
      <div class="ligne"><span class="etiquette">EN ROUTE VERS</span><span class="discret">{ua(distanceRestante(fusee, t) ?? 0)}</span></div>
      <div class="ligne"><span class="grand">{nomDestination(fusee.destination)}</span><span class="moyen">{reste !== null ? duree(reste) : '—'}</span></div>
      <div class="barre"><div style={`width: ${Math.round((progression ?? 0) * 100)}%`}></div></div>
      <div class="sous" class:alerte={enPanne.length > 0 || !etat.modules.propulsion.levierAHaut}>
        {nombre(vitesse, 1)} km/s{#if enPanne.length} · ralentie par {enPanne.length} avarie{enPanne.length > 1 ? 's' : ''}{/if}{#if !etat.modules.propulsion.levierAHaut} · levier L-A abaissé{/if}
      </div>
    {:else if fusee.orbite}
      <div class="ligne"><span class="etiquette">{fusee.presDuVisiteur ? 'À CÔTÉ DE L’OBJET INCONNU' : 'EN ORBITE'}</span><span class="discret">0 km/s</span></div>
      <div class="ligne"><span class="grand">{nomAstre(fusee.orbite).replace(/^./, (c) => c.toUpperCase())}</span></div>
      <div class="sous">Choisis une destination sur la carte.</div>
    {:else}
      <div class="ligne"><span class="etiquette">À L’ARRÊT</span><span class="discret">0 km/s</span></div>
      <div class="ligne"><span class="grand">Point libre</span></div>
      <div class="sous">Moteur coupé. Choisis une destination sur la carte.</div>
    {/if}
  </section>

  <!-- Voyants des modules. -->
  <section class="tableau rivets">
    <div class="ligne">
      <span class="ruban">TABLEAU DE BORD</span>
      {#if enPanne.length}<span class="ruban rouge clignotant">{enPanne.length} AVARIE{enPanne.length > 1 ? 'S' : ''}</span>{/if}
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
          <span class="lunette chrome"><span class="voyant"></span></span>
          <span class="code">{code}</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- Radar de chasse. -->
  <button class="chasse" onclick={() => (jeu.volet = 'carte')}>
    <span class="radar chrome" aria-hidden="true"><span class="ecran"><span class="balayage"></span>{#if detecte !== null || trouve}<span class="echo"></span>{/if}</span></span>
    <span class="texte phosphore">
      <span class="etat">{trouve ? 'VISITEUR PHOTOGRAPHIÉ' : detecte !== null ? `DÉTECTÉ À ${ua(detecte)}` : 'VISITEUR INTROUVABLE'}</span>
      <span class="indice">{dernierIndice ? `${dernierIndice.texte.toLowerCase()} (${heureLocale(dernierIndice.t)})` : 'Aucun indice pour l’instant.'}</span>
      <span class="jours">{Math.ceil((finSaison(saison) - t) / 86_400_000)} j</span>
    </span>
  </button>

  <!-- Téléscripteur : le ruban de papier sort de la fente. -->
  <section class="telex" aria-label="Téléscripteur">
    <div class="fente"></div>
    <div class="papier">
      {#each jeu.telex.slice(-2).reverse() as l}
        <div><span class="heure" class:alerte={l.alerte}>{heureLocale(l.t)}</span> {l.texte}</div>
      {/each}
    </div>
  </section>

  <nav>
    <button class="poussoir cerise" onclick={() => (jeu.volet = 'carte')}>CARTE</button>
    <button class="poussoir moutarde" onclick={() => (jeu.volet = 'office')}>OFFICE</button>
    <button class="poussoir ivoire" onclick={() => (jeu.volet = 'manuel')}>MANUEL</button>
  </nav>
</main>

<style>
  /* Le hublot prend toute la hauteur que le tableau de bord laisse libre. */
  main {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding-bottom: 18px;
    border: 0;
    box-shadow: none;
  }
  main > :global(*) {
    flex: none;
  }

  /* Cloison du haut. */
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 10px 14px 8px;
  }
  .plaque {
    display: flex;
    flex-direction: column;
    padding: 3px 12px 4px;
    border-radius: 5px;
    background: linear-gradient(160deg, #f1d58a, var(--laiton) 45%, #8e6c25 100%);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.5) inset, 0 2px 5px rgba(0, 0, 0, 0.5);
    color: var(--couleur-encre);
    min-width: 0;
  }
  .c58 {
    font-family: var(--police-titre);
    font-size: 18px;
    line-height: 1;
    letter-spacing: 2px;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45);
  }
  .nom {
    font-family: var(--police-script);
    font-size: 15px;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
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
    color: var(--couleur-texte-discret);
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
    width: 18px;
    height: 26px;
    border-radius: 9px;
    background: linear-gradient(90deg, #2a2a2a, #0d0d0d);
    box-shadow: 0 0 0 2px var(--chrome), 0 2px 3px rgba(0, 0, 0, 0.6);
  }
  .bascule::after {
    content: '';
    position: absolute;
    left: 3px;
    top: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff, var(--chrome) 45%, var(--chrome-sombre));
    transition: top 0.12s;
  }
  .interrupteur.coupe .bascule::after {
    top: 12px;
  }
  .interrupteur .mot {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  /* Le hublot. */
  .verriere {
    position: relative;
    flex: 1 0 170px;
    margin: 0 10px;
    padding: 5px;
    border-radius: 34px 34px 10px 10px;
  }
  .vitre {
    position: absolute;
    inset: 5px;
    overflow: hidden;
    border-radius: 30px 30px 7px 7px;
    background: #03060a;
    box-shadow: 0 0 0 2px #000 inset;
  }
  .dehors {
    position: absolute;
    right: 10px;
    bottom: 10px;
    min-height: 38px;
    padding: 0 12px;
    font-size: 12px;
  }

  /* Écran de navigation. */
  .navigation {
    position: relative;
    margin: 12px var(--espace) 0;
    border-radius: 12px;
    padding: 9px 13px 10px;
    font-family: var(--police-chiffres);
  }
  .ligne {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .etiquette {
    font-size: 12px;
    letter-spacing: 2.5px;
    font-weight: 700;
  }
  .discret {
    font-size: 13px;
    opacity: 0.75;
  }
  .grand {
    font-family: var(--police-titre);
    font-size: 25px;
    letter-spacing: 1px;
    line-height: 1.15;
  }
  .moyen {
    font-size: 18px;
    font-weight: 700;
  }
  .barre {
    height: 7px;
    margin-top: 6px;
    border-radius: 4px;
    background: rgba(141, 255, 176, 0.15);
    overflow: hidden;
  }
  .barre div {
    height: 100%;
    background: var(--phosphore);
    box-shadow: 0 0 8px var(--phosphore);
  }
  .sous {
    margin-top: 5px;
    font-size: 14px;
    opacity: 0.85;
  }
  .alerte {
    color: #ffb347;
    text-shadow: 0 0 6px rgba(255, 140, 50, 0.8);
    opacity: 1;
  }

  /* Voyants des modules. */
  .tableau {
    margin: 12px var(--espace) 0;
    padding: 10px 12px 12px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.16);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.12), 0 2px 6px rgba(0, 0, 0, 0.4) inset;
  }
  .clignotant {
    animation: clignote 0.8s steps(1) infinite;
  }
  .grille {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px 8px;
    margin-top: 10px;
  }
  .tuile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 2px 0;
    border: 0;
    background: none;
  }
  .lunette {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
  .voyant {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #d9ffe2 0 8%, #7dff9a 25%, #1e8f40 70%, #0b3d1b);
    box-shadow: 0 0 10px rgba(125, 255, 154, 0.55), 0 0 0 2px rgba(0, 0, 0, 0.6) inset;
  }
  .tuile:active .lunette {
    transform: scale(0.94);
  }
  .tuile .code {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    padding: 0 5px;
    border-radius: 2px;
    background: #0b0b0b;
    color: #f2f2f2;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
  }
  .tuile.avarie .voyant {
    background: radial-gradient(circle at 35% 30%, #fff1e0 0 8%, #ff7a52 25%, #c8221a 70%, #4d0805);
    box-shadow: 0 0 18px 4px rgba(255, 70, 40, 0.75), 0 0 0 2px rgba(0, 0, 0, 0.6) inset;
    animation: clignote 0.8s steps(1) infinite;
  }
  .tuile.avarie .code {
    background: var(--cerise);
  }
  .tuile.scelle {
    cursor: default;
  }
  .tuile.scelle .lunette {
    filter: saturate(0) brightness(0.7);
  }
  .tuile.scelle .voyant {
    /* Plomb de scellé : disque gris traversé d'un fil. */
    background: linear-gradient(35deg, transparent 46%, #2b2b2b 47% 53%, transparent 54%),
      radial-gradient(circle at 40% 35%, #a9a9a9, #5d5d5d 60%, #333);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.6) inset;
  }
  .tuile.scelle .code {
    opacity: 0.45;
  }

  /* Radar de chasse. */
  .chasse {
    display: flex;
    gap: 10px;
    align-items: stretch;
    margin: 12px var(--espace) 0;
    padding: 0;
    border: 0;
    background: none;
    text-align: left;
  }
  .radar {
    flex: none;
    width: 62px;
    height: 62px;
    padding: 4px;
    border-radius: 50%;
  }
  .radar .ecran {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    background: radial-gradient(circle, transparent 0 30%, rgba(141, 255, 176, 0.25) 31% 32%, transparent 33% 62%, rgba(141, 255, 176, 0.25) 63% 64%, transparent 65%),
      var(--phosphore-fond);
  }
  .balayage {
    position: absolute;
    inset: 0;
    background: conic-gradient(from 0deg, rgba(141, 255, 176, 0.7), rgba(141, 255, 176, 0) 70deg, transparent);
    animation: tourne 3s linear infinite;
  }
  .echo {
    position: absolute;
    left: 62%;
    top: 30%;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--phosphore);
    box-shadow: 0 0 8px var(--phosphore);
    animation: clignote 1.2s steps(1) infinite;
  }
  @keyframes tourne {
    to {
      transform: rotate(360deg);
    }
  }
  .chasse .texte {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
    padding: 6px 44px 6px 12px;
    border-radius: 10px;
  }
  .chasse .etat {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .chasse .indice {
    font-size: 13px;
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chasse .jours {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    font-weight: 700;
  }

  /* Téléscripteur. */
  .telex {
    margin: 12px var(--espace) 0;
  }
  .fente {
    height: 6px;
    margin: 0 6px;
    border-radius: 3px;
    background: #050505;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
  }
  .papier {
    margin: -2px 12px 0;
    min-height: 44px;
    padding: 6px 10px 6px;
    background-color: var(--couleur-papier);
    background-image: var(--grain);
    color: var(--couleur-encre);
    font-family: var(--police-machine);
    font-size: 12.5px;
    line-height: 1.45;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
    /* Bord bas déchiré. */
    clip-path: polygon(0 0, 100% 0, 100% 92%, 96% 100%, 91% 93%, 85% 100%, 79% 94%, 72% 100%, 66% 93%, 59% 100%, 52% 94%, 45% 100%, 38% 93%, 31% 100%, 24% 94%, 17% 100%, 10% 93%, 4% 100%, 0 94%);
  }
  .heure {
    color: var(--couleur-encre-discrete);
  }
  .heure.alerte {
    color: var(--cerise);
    text-shadow: none;
  }

  /* Les trois gros poussoirs. */
  nav {
    display: flex;
    gap: 12px;
    margin: 16px var(--espace) 0;
  }
  nav button {
    flex: 1;
    height: 56px;
    font-family: var(--police-titre);
    font-size: 17px;
    letter-spacing: 1.5px;
  }
</style>
