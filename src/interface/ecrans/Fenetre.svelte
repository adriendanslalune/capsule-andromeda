<script lang="ts">
  // Écran principal : la fenêtre. Il répond à trois questions : où je vais, qu'est-ce qui ne va pas, quel est mon but.
  import { MODULES_A_INSTALLER } from '../../donnees/economie'
  import { finSaison, numeroSaison, visiteurDetecte } from '../../moteur/chasse'
  import { estInstalle } from '../../moteur/economie'
  import {
    direction,
    distanceRestante,
    enAttenteDeFenetre,
    planDeVol,
    positionDestination,
    tempsRestant,
    type Destination,
  } from '../../moteur/fusee'
  import { mulberry32 } from '../../moteur/hasard'
  import { modulesEnPanne } from '../../moteur/modules'
  import { vitesseActuelle } from '../../moteur/partie'
  import { dateLocale, duree, heureLocale, nombre, nomAstre, ua } from '../format'
  import { jeu } from '../jeu.svelte'
  import { basculerSon, sonActif } from '../sons'

  const TOUS_LES_MODULES = ['CH-1', 'TU-1', 'AL-1', ...MODULES_A_INSTALLER.map((m) => m.code)]

  // Étoiles du décor (toujours les mêmes).
  const etoiles = (() => {
    const h = mulberry32(58)
    return Array.from({ length: 160 }, () => ({ x: h() * 390, y: h() * 360, r: 0.4 + h(), o: 0.3 + h() * 0.6 }))
  })()

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
  const visee = $derived.by(() => {
    if (!fusee.destination) return null
    const cible = plan?.point ?? positionDestination(fusee.destination, t)
    return direction(fusee.position, cible)
  })

  // Chasse.
  const saison = $derived(numeroSaison(t))
  const trouve = $derived(etat.chasse.trouvailles.some((x) => x.saison === saison))
  const detecte = $derived(visiteurDetecte(etat, t))
  const dernierIndice = $derived(etat.chasse.indices[0] ?? null)

  function etatTuile(code: string): 'ok' | 'avarie' | 'scelle' {
    if (!estInstalle(etat, code)) return 'scelle'
    return enPanne.includes(code) ? 'avarie' : 'ok'
  }
</script>

<main>
  <button class="ouvrir-vue" aria-label="Regarder dehors (vue 3D)" onclick={() => (jeu.ecran = { nom: 'dehors' })}></button>
  <svg class="vue" viewBox="0 0 390 360" aria-hidden="true">
    <rect width="390" height="360" fill="var(--couleur-fond)" />
    {#each etoiles as e}
      <circle cx={e.x} cy={e.y} r={e.r} fill="var(--couleur-texte)" opacity={e.o} />
    {/each}
    {#if visee !== null}
      {@const a = (visee * Math.PI) / 180}
      <line
        x1="195" y1="168" x2={195 + Math.cos(a) * 150} y2={168 - Math.sin(a) * 150}
        stroke="var(--couleur-avarie)" stroke-width="1.5" stroke-dasharray="5 5"
      />
    {/if}
    <g transform={`translate(195 168) rotate(${-fusee.cap})`}>
      <path d="M-46 0 L-62 -9 L-62 9 Z" fill="#ffd27a" opacity={fusee.destination && !enAttenteDeFenetre(fusee) ? 0.9 : 0} />
      <path d="M-38 -11 L22 -11 Q48 0 22 11 L-38 11 Z" fill="var(--couleur-texte)" stroke="var(--couleur-encre)" stroke-width="2" />
      <rect x="-10" y="-11" width="7" height="22" fill="var(--couleur-avarie)" stroke="var(--couleur-encre)" stroke-width="1.5" />
      <circle cx="12" cy="0" r="5" fill="#7f9db4" stroke="#b8893b" stroke-width="2" />
      <path d="M-30 -11 L-42 -24 L-22 -11 Z M-30 11 L-42 24 L-22 11 Z" fill="var(--couleur-avarie)" stroke="var(--couleur-encre)" stroke-width="1.5" />
    </g>
  </svg>

  <header>
    <div class="ident">
      <span class="c58">C-58</span>
      <span class="nom">{etat.nom || etat.serie}</span>
    </div>
    <div class="pastilles">
      <span class="pastille chiffres">{etat.credits} CR</span>
      <span class="pastille">SAISON {saison}</span>
      <button class="pastille son" aria-label={son ? 'Couper le son' : 'Remettre le son'} onclick={() => (son = basculerSon())}>{son ? 'SON' : 'MUET'}</button>
    </div>
  </header>

  <section class="voyage">
    {#if fusee.destination && enAttenteDeFenetre(fusee) && plan}
      <div class="ligne"><span class="etiquette">FENÊTRE DE TIR</span><span class="chiffres discret">départ dans {duree((plan.depart - t) / 1000)}</span></div>
      <div class="ligne"><span class="grand">{nomDestination(fusee.destination)}</span><span class="chiffres">arrivée le {dateLocale(plan.arrivee)}</span></div>
      <div class="sous">En orbite en attendant le meilleur moment pour partir.</div>
    {:else if fusee.destination}
      <div class="ligne"><span class="etiquette">EN ROUTE VERS</span><span class="chiffres discret">{ua(distanceRestante(fusee, t) ?? 0)}</span></div>
      <div class="ligne"><span class="grand">{nomDestination(fusee.destination)}</span><span class="chiffres moyen">{reste !== null ? duree(reste) : '—'}</span></div>
      <div class="barre"><div style={`width: ${Math.round((progression ?? 0) * 100)}%`}></div></div>
      <div class="sous" class:alerte={enPanne.length > 0 || !etat.modules.propulsion.levierAHaut}>
        {nombre(vitesse, 1)} km/s{#if enPanne.length} · ralentie par {enPanne.length} avarie{enPanne.length > 1 ? 's' : ''}{/if}{#if !etat.modules.propulsion.levierAHaut} · levier L-A abaissé{/if}
      </div>
    {:else if fusee.orbite}
      <div class="ligne"><span class="etiquette">{fusee.presDuVisiteur ? 'À CÔTÉ DE L’OBJET INCONNU' : 'EN ORBITE'}</span></div>
      <div class="ligne"><span class="grand">{nomAstre(fusee.orbite).replace(/^./, (c) => c.toUpperCase())}</span><span class="chiffres discret">0 km/s</span></div>
      <div class="sous">Choisis une destination sur la carte.</div>
    {:else}
      <div class="ligne"><span class="etiquette">À L’ARRÊT</span></div>
      <div class="ligne"><span class="grand">Point libre</span><span class="chiffres discret">0 km/s</span></div>
      <div class="sous">Moteur coupé. Choisis une destination sur la carte.</div>
    {/if}
  </section>

  <section class="tableau">
    <div class="ligne">
      <span class="titre">TABLEAU DE BORD</span>
      {#if enPanne.length}<span class="alerte petit">{enPanne.length} avarie{enPanne.length > 1 ? 's' : ''} — touche un voyant</span>{/if}
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
          <span class="mot">{e === 'ok' ? 'OK' : e === 'avarie' ? 'AVARIE' : 'SCELLÉ'}</span>
        </button>
      {/each}
    </div>
  </section>

  <button class="chasse" onclick={() => (jeu.volet = 'carte')}>
    <svg aria-hidden="true" width="38" height="24" viewBox="0 0 38 24"><ellipse cx="19" cy="15" rx="17" ry="6" fill="var(--couleur-ok)" opacity=".85" /><path d="M10 13 Q19 0 28 13 Z" fill="var(--couleur-ok)" /></svg>
    <span class="texte">
      <span class="etat">{trouve ? 'VISITEUR PHOTOGRAPHIÉ' : detecte !== null ? `DÉTECTÉ À ${ua(detecte)}` : 'VISITEUR INTROUVABLE'}</span>
      <span class="indice">{dernierIndice ? `${dernierIndice.texte.toLowerCase()} (${heureLocale(dernierIndice.t)})` : 'Aucun indice pour l’instant.'}</span>
    </span>
    <span class="jours">{Math.ceil((finSaison(saison) - t) / 86_400_000)} j</span>
  </button>

  <section class="telex" aria-label="Téléscripteur">
    {#each jeu.telex.slice(-2).reverse() as l}
      <div><span class:alerte={l.alerte}>{heureLocale(l.t)}</span> {l.texte}</div>
    {/each}
  </section>

  <nav>
    <button onclick={() => (jeu.volet = 'carte')}>CARTE</button>
    <button onclick={() => (jeu.volet = 'office')}>OFFICE</button>
    <button class="clair" onclick={() => (jeu.volet = 'manuel')}>MANUEL</button>
  </nav>
</main>

<style>
  main {
    position: relative;
    height: 100%;
    min-height: 700px;
    overflow-y: auto;
  }
  .ouvrir-vue {
    position: absolute;
    top: 52px;
    left: 0;
    width: 100%;
    height: 190px;
    border: 0;
    background: none;
    z-index: 1;
  }
  .vue {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 360px;
  }
  header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px 0;
  }
  .ident {
    display: flex;
    flex-direction: column;
  }
  .c58 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
  }
  .nom {
    font-size: 12px;
    letter-spacing: 1px;
    color: var(--couleur-texte-discret);
  }
  .pastilles {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .son {
    min-width: 52px;
    min-height: 44px;
    background: none;
    color: var(--couleur-texte);
  }
  .pastille {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    padding: 4px 9px;
    border: 1px solid var(--couleur-bordure-forte);
    border-radius: 14px;
  }
  .chiffres {
    font-family: var(--police-chiffres);
  }
  .discret {
    font-size: 12px;
    color: var(--couleur-texte-discret);
  }
  .voyage {
    position: relative;
    margin: 196px var(--espace) 0;
    background: rgba(15, 26, 36, 0.86);
    border: 1px solid var(--couleur-bordure-forte);
    border-radius: var(--rayon);
    padding: 12px 14px;
  }
  .ligne {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .etiquette {
    font-size: 12px;
    letter-spacing: 2px;
    color: var(--couleur-texte-discret);
  }
  .grand {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .moyen {
    font-size: 17px;
  }
  .barre {
    height: 6px;
    background: #2a3a4a;
    border-radius: 3px;
    margin-top: 8px;
    overflow: hidden;
  }
  .barre div {
    height: 6px;
    background: var(--couleur-texte);
  }
  .sous {
    margin-top: 7px;
    font-size: 13px;
    color: var(--couleur-texte-discret);
  }
  .alerte {
    color: var(--couleur-avarie);
  }
  .petit {
    font-size: 12px;
  }
  .tableau {
    margin: 14px var(--espace) 0;
  }
  .titre {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
  }
  .grille {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-top: 8px;
  }
  .tuile {
    height: 62px;
    border-radius: 10px;
    border: 1px solid var(--couleur-bordure);
    background: var(--couleur-surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 0;
  }
  .voyant {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--couleur-ok);
    opacity: 0.55;
  }
  .code {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .mot {
    font-size: 10px;
    letter-spacing: 1.2px;
    color: var(--couleur-texte-discret);
  }
  .tuile.avarie {
    background: var(--couleur-surface-alerte);
    border: 1.5px solid var(--couleur-avarie);
  }
  .tuile.avarie .voyant {
    background: var(--couleur-avarie);
    opacity: 1;
    box-shadow: 0 0 10px var(--couleur-avarie);
    animation: clignote 0.8s steps(1) infinite;
  }
  .tuile.avarie .mot {
    color: var(--couleur-avarie);
  }
  .tuile.scelle {
    background: repeating-linear-gradient(135deg, #16222e 0 4px, #1a2836 4px 8px);
    border-color: #2a3a4a;
    cursor: default;
  }
  .tuile.scelle .voyant {
    border-radius: 3px;
    border: 1px dashed #4a5b6b;
    background: none;
  }
  .tuile.scelle .code,
  .tuile.scelle .mot {
    color: var(--couleur-texte-eteint);
  }
  .chasse {
    margin: 14px var(--espace) 0;
    width: calc(100% - 2 * var(--espace));
    display: flex;
    gap: 12px;
    align-items: center;
    background: var(--couleur-surface);
    border: 1px solid var(--couleur-bordure);
    border-radius: var(--rayon);
    padding: 10px 12px;
    text-align: left;
  }
  .chasse .texte {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .chasse .etat {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }
  .chasse .indice {
    font-size: 13px;
    color: var(--couleur-texte-discret);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chasse .jours {
    font-size: 12px;
    color: var(--couleur-texte-discret);
  }
  .telex {
    margin: 12px var(--espace) 0;
    min-height: 40px;
    font-family: var(--police-chiffres);
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--couleur-texte-discret);
  }
  nav {
    display: flex;
    gap: 10px;
    margin: 10px var(--espace) 22px;
  }
  nav button {
    flex: 1;
    height: 54px;
    border-radius: 14px;
    background: var(--couleur-surface);
    border: 1px solid var(--couleur-bordure-forte);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
  }
  nav button.clair {
    background: var(--couleur-texte);
    color: var(--couleur-encre);
    border: 0;
  }
</style>
