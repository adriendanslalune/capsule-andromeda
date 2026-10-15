<script lang="ts">
  // Le poste de pilotage : une barre fixe en haut (nom de la fusée, crédits, saison, son, manuel), les cinq onglets
  // (CARTE, CONTRATS, COCKPIT au milieu, ATELIER, TROPHÉES), et la page choisie. On passe d'une page à sa voisine
  // en glissant le doigt vers la gauche ou la droite.
  import { fly } from 'svelte/transition'
  import { numeroSaison } from '../../moteur/chasse'
  import { modulesEnPanne } from '../../moteur/modules'
  import Icone from '../cockpit/Icone.svelte'
  import { jeu, PAGES_POSTE, type PagePoste } from '../jeu.svelte'
  import { nonLus, telegrammesRecus } from '../reseau'
  import { basculerSon, sonActif } from '../sons'
  import Carte from '../volets/Carte.svelte'
  import Atelier from '../volets/Atelier.svelte'
  import Trophees from '../volets/Trophees.svelte'
  import BarreBord from '../cockpit/BarreBord.svelte'
  import Social from '../social/Social.svelte'
  import Fenetre from './Fenetre.svelte'

  const NOMS: Record<PagePoste, string> = { carte: 'NAVIGATION', social: 'SOCIAL', cockpit: 'COCKPIT', atelier: 'ATELIER', trophees: 'TROPHÉES' }

  let son = $state(sonActif())
  const etat = $derived(jeu.etat!)
  const saison = $derived(numeroSaison(jeu.maintenant))
  /** Télégrammes arrivés et pas encore lus. */
  const nouveaux = $derived(nonLus(etat, telegrammesRecus(etat, jeu.maintenant)))
  const avaries = $derived(modulesEnPanne(etat.modules).length)
  const tambours = $derived(String(Math.max(0, Math.floor(etat.credits))).padStart(4, '0').split(''))

  // Sens de l'animation : la nouvelle page arrive du côté vers lequel on va.
  let sens = $state(1)
  function aller(page: PagePoste) {
    if (page === jeu.page) return
    sens = PAGES_POSTE.indexOf(page) > PAGES_POSTE.indexOf(jeu.page) ? 1 : -1
    jeu.page = page
  }

  // Glisser à gauche ou à droite : page voisine (sauf sur la carte elle-même, qui se déplace au doigt).
  // Sur téléphone, on écoute les évènements tactiles : ceux du « pointeur » sont annulés par le navigateur dès que
  // la page commence à défiler, si bien que le geste n'arrivait jamais. La souris passe par le pointeur.
  let depart: { x: number; y: number; t: number } | null = null
  function commencer(x: number, y: number, cible: EventTarget | null) {
    depart = (cible as Element | null)?.closest('.plan, input, .pas-de-glisse') ? null : { x, y, t: Date.now() }
  }
  function finir(x: number, y: number) {
    if (!depart) return
    const dx = x - depart.x
    const dy = y - depart.y
    const vite = Date.now() - depart.t < 800
    depart = null
    if (!vite || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    const i = PAGES_POSTE.indexOf(jeu.page) + (dx < 0 ? 1 : -1)
    if (i >= 0 && i < PAGES_POSTE.length) aller(PAGES_POSTE[i])
  }
  const toucher = (e: TouchEvent) => { if (e.touches.length === 1) commencer(e.touches[0].clientX, e.touches[0].clientY, e.target); else depart = null }
  const lacher = (e: TouchEvent) => { const d = e.changedTouches[0]; if (d) finir(d.clientX, d.clientY) }
  const appuyer = (e: PointerEvent) => { if (e.pointerType === 'mouse') commencer(e.clientX, e.clientY, e.target) }
  const relacher = (e: PointerEvent) => { if (e.pointerType === 'mouse') finir(e.clientX, e.clientY) }
</script>

<div class="poste">
  <div class="bandeau">
  <!-- Barre fixe : identité de la fusée et instruments de bord. -->
  <header>
    <div class="identite">
      <span class="c58 titre-pulp">C-58</span>
      <span class="nom">{etat.nom || etat.serie}</span>
    </div>
    <div class="instruments">
      <div class="caisse">
        <button class="credits" aria-label={`${etat.credits} crédits : ouvrir le portefeuille`} onclick={() => (jeu.volet = 'portefeuille')}>
          <span class="compteur">{#each tambours as c}<span>{c}</span>{/each}</span>
          <span class="unite">CR</span>
        </button>
        <span class="saison">SAISON {saison}</span>
      </div>
      <button class="interrupteur" class:coupe={!son} aria-label={son ? 'Couper le son' : 'Remettre le son'} onclick={() => (son = basculerSon())}>
        <span class="bascule"></span><span class="mot">{son ? 'SON' : 'MUET'}</span>
      </button>
      <button class="manuel" aria-label="Ouvrir le manuel" onclick={() => (jeu.volet = 'manuel')}><Icone nom="manuel" /></button>
    </div>
  </header>
  <!-- Pilotage en miniature : vitesse, cap, arrivée, moteur. -->
  <BarreBord />

  <!-- Onglets : celui de la page affichée ressort, comme un intercalaire. -->
  <nav class="onglets" aria-label="Pages du poste">
    {#each PAGES_POSTE as p}
      <button class={`onglet ${p}`} class:actif={jeu.page === p} aria-current={jeu.page === p ? 'page' : undefined} onclick={() => aller(p)}>
        <Icone nom={p} /><span>{NOMS[p]}</span>
        {#if p === 'cockpit' && avaries}<span class="pastille" aria-label={`${avaries} avaries`}>{avaries}</span>{/if}
        {#if p === 'social' && nouveaux}<span class="pastille telegramme" aria-label={`${nouveaux} télégrammes`}>{nouveaux}</span>{/if}
      </button>
    {/each}
  </nav>
  </div>

  <div class="page" ontouchstart={toucher} ontouchend={lacher} ontouchcancel={() => (depart = null)} onpointerdown={appuyer} onpointerup={relacher} role="presentation">
    {#key jeu.page}
      <div class="contenu" in:fly={{ x: sens * 120, duration: 180 }}>
        {#if jeu.page === 'cockpit'}<Fenetre />
        {:else if jeu.page === 'carte'}<Carte />
        {:else if jeu.page === 'social'}<Social />
        {:else if jeu.page === 'atelier'}<Atelier />
        {:else}<div class="vitrine-defile"><Trophees /></div>
        {/if}
      </div>
    {/key}
  </div>
</div>

<style>
  .poste {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  /* Partie haute, figée : un bandeau bleu nuit, qui se détache du papier du cockpit. */
  .bandeau {
    flex: none;
    background: var(--hachures-claires), var(--couleur-bandeau);
    color: var(--couleur-texte-clair);
    border-bottom: 3px solid var(--couleur-encre);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    padding: 6px 10px 4px var(--espace);
  }
  /* Pastille d'avaries sur l'onglet COCKPIT ; de télégrammes sur l'onglet SOCIAL (jaune, sans clignoter). */
  .pastille.telegramme {
    background: var(--moutarde);
    color: var(--couleur-encre);
    animation: none;
  }
  .pastille {
    position: absolute;
    top: -6px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    box-sizing: border-box;
    display: grid;
    place-items: center;
    border: 2px solid var(--couleur-encre);
    border-radius: 9px;
    background: var(--cerise);
    color: var(--couleur-papier);
    font-family: var(--police-chiffres);
    font-size: 11px;
    font-weight: 700;
    animation: clignote-pastille 0.9s steps(2, jump-none) infinite;
  }
  @keyframes clignote-pastille {
    50% {
      background: var(--couleur-encre);
    }
  }
  @keyframes clignote {
    50% {
      background: var(--couleur-encre);
    }
  }
  .caisse {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  .saison {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    opacity: 0.85;
  }
  .identite {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .c58 {
    font-size: 22px;
    line-height: 1;
  }
  .nom {
    font-family: var(--police-script);
    font-size: 16px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 96px;
  }
  .instruments {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .credits {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
  }
  .credits .compteur {
    outline: 1px solid rgba(255, 255, 255, 0.5);
  }
  .credits .compteur {
    font-size: 16px;
  }
  .unite {
    font-size: 11px;
    font-weight: 700;
  }
  .interrupteur {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    width: 40px;
    border: 0;
    background: none;
    padding: 0;
    color: inherit;
  }
  .bascule {
    position: relative;
    width: 18px;
    height: 26px;
    border-radius: 9px;
    border: 2px solid var(--couleur-encre);
    background: var(--menthe);
  }
  .bascule::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--couleur-encre);
    background: var(--couleur-papier);
    transition: top 0.12s;
  }
  .interrupteur.coupe .bascule {
    background: var(--couleur-papier-fonce);
  }
  .interrupteur.coupe .bascule::after {
    top: 11px;
  }
  .interrupteur .mot {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .manuel {
    color: var(--couleur-encre);
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 2px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--couleur-papier);
    box-shadow: 2px 2px 0 var(--couleur-encre);
  }
  .manuel:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  /* Onglets en intercalaires. */
  .onglets {
    flex: none;
    display: grid;
    grid-template-columns: 1fr 1fr 1.3fr 1fr 1fr;
    align-items: end;
    gap: 3px;
    padding: 4px 8px 0;
    margin-bottom: -3px;
  }
  .onglet {
    position: relative;
    min-width: 0;
    height: 50px;
    padding: 4px 0 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    border: 2px solid var(--couleur-encre);
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    background: var(--hachures), var(--couleur-papier-fonce);
    color: var(--couleur-encre-discrete);
    font-family: var(--police-titre);
    font-size: 8.5px;
    letter-spacing: 0.2px;
    transform: translateY(4px);
    transition: transform 0.15s;
  }
  .onglet :global(svg) {
    width: 22px;
    height: 22px;
  }
  /* L'onglet de la page affichée : plus haut, en couleur, soudé à la page. */
  .onglet.actif {
    transform: translateY(3px);
    height: 54px;
    margin-top: -4px;
    color: var(--couleur-encre);
    background: var(--couleur-fond);
    border-width: 3px;
    z-index: 1;
  }
  .onglet.actif::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -3px;
    height: 4px;
    background: var(--couleur-fond);
  }
  .onglet.carte span {
    font-size: 7.6px;
    letter-spacing: -0.2px;
  }
  .onglet.actif.carte {
    background: var(--couleur-fond);
    color: var(--cerise);
  }
  /* COCKPIT, l'écran principal : plus grand que ses voisins, liseré moutarde, même quand il n'est pas affiché. */
  .onglet.cockpit {
    height: 58px;
    font-size: 10.5px;
    letter-spacing: 0.5px;
    color: var(--couleur-encre);
    background: var(--hachures), var(--moutarde);
  }
  .onglet.cockpit :global(svg) {
    width: 28px;
    height: 28px;
  }
  .onglet.actif.cockpit {
    height: 62px;
    color: var(--cerise);
    background: var(--couleur-fond);
    box-shadow: inset 0 4px 0 var(--moutarde);
  }

  .page {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    touch-action: pan-y;
  }
  .contenu {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
  }
  .vitrine-defile {
    flex: 1;
    overflow-y: auto;
    padding: 6px var(--espace) 20px;
  }
</style>
