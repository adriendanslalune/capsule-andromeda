<script lang="ts">
  // Le poste de pilotage : une barre fixe en haut (nom de la fusée, crédits, saison, son, manuel), les cinq onglets
  // (CARTE, CONTRATS, COCKPIT au milieu, ATELIER, TROPHÉES), et la page choisie. On passe d'une page à sa voisine
  // en glissant le doigt vers la gauche ou la droite.
  import { fly } from 'svelte/transition'
  import { numeroSaison } from '../../moteur/chasse'
  import { modulesEnPanne } from '../../moteur/modules'
  import Icone from '../cockpit/Icone.svelte'
  import { jeu, ONGLETS, type PagePoste } from '../jeu.svelte'
  import { nonLus, telegrammesRecus } from '../reseau'
  import Carte from '../volets/Carte.svelte'
  import Atelier from '../volets/Atelier.svelte'
  import Trophees from '../volets/Trophees.svelte'
  import BarreBord from '../cockpit/BarreBord.svelte'
  import Social from '../social/Social.svelte'
  import Fenetre from './Fenetre.svelte'

  const NOMS: Record<PagePoste, string> = { carte: 'NAVIGATION', social: 'SOCIAL', cockpit: 'COCKPIT', atelier: 'ATELIER', trophees: 'TROPHÉES' }

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
    // La carte (sans onglet) se range du côté du cockpit.
    const rang = (p: PagePoste) => (p === 'carte' ? ONGLETS.indexOf('cockpit') : ONGLETS.indexOf(p))
    sens = rang(page) >= rang(jeu.page) ? 1 : -1
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
    if (jeu.page === 'carte') return
    const i = ONGLETS.indexOf(jeu.page) + (dx < 0 ? 1 : -1)
    if (i >= 0 && i < ONGLETS.length) aller(ONGLETS[i])
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
    <!-- Pilotage en miniature : vitesse, cap, arrivée, moteur. -->
    <BarreBord />
    <div class="instruments">
      <div class="caisse">
        <button class="credits" aria-label={`${etat.credits} crédits : ouvrir le portefeuille`} onclick={() => (jeu.volet = 'portefeuille')}>
          <span class="compteur">{#each tambours as c}<span>{c}</span>{/each}</span>
          <span class="unite">CR</span>
        </button>
        <span class="saison">SAISON {saison}</span>
      </div>
      <button class="manuel" aria-label="Ouvrir le manuel" onclick={() => (jeu.volet = 'manuel')}><Icone nom="manuel" /></button>
    </div>
  </header>

  <!-- Onglets : les intercalaires d'un vieux classeur, en carton de couleur, chacun son étiquette ; celui de la page
       affichée passe devant les autres. -->
  <nav class="onglets" aria-label="Pages du poste">
    {#each ONGLETS as p}
      {@const actif = jeu.page === p || (p === 'cockpit' && jeu.page === 'carte')}
      <button class={`onglet ${p}`} class:actif aria-current={actif ? 'page' : undefined} onclick={() => aller(p)}>
        <span class="carton" aria-hidden="true"></span>
        <span class="etiquette"><Icone nom={p} /><span>{NOMS[p]}</span></span>
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
    max-width: 72px;
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

  /* Onglets : intercalaires de vieux classeur. Chaque onglet est un carton en trapèze (bords biseautés), de sa
     couleur, cerné d'encre ; une petite étiquette de papier, rivée, porte l'icône et le nom. Ils dépassent à des
     hauteurs un peu différentes, comme des intercalaires décalés ; celui de la page affichée passe devant. */
  .onglets {
    flex: none;
    display: grid;
    grid-template-columns: 1fr 1.25fr 1fr 1fr;
    align-items: end;
    gap: 0;
    padding: 4px 6px 0;
    margin-bottom: -3px;
  }
  .onglet {
    position: relative;
    min-width: 0;
    height: 46px;
    margin: 0 -3px;
    padding: 6px 7px 3px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    border: 0;
    background: none;
    color: var(--couleur-encre);
    /* Le trait d'encre suit la forme du carton. */
    filter: drop-shadow(0 -2px 0 var(--couleur-encre)) drop-shadow(2px 0 0 var(--couleur-encre)) drop-shadow(-2px 0 0 var(--couleur-encre));
    transition: transform 0.15s;
  }
  .onglet:nth-child(2n) {
    height: 50px;
  }
  .carton {
    position: absolute;
    inset: 0;
    clip-path: polygon(9% 0, 91% 0, 100% 100%, 0 100%);
    border-radius: 4px 4px 0 0;
    background: repeating-linear-gradient(0deg, rgba(42, 30, 23, 0.06) 0 1px, transparent 1px 4px), var(--carton);
  }
  .onglet.social {
    --carton: #efc0b0;
  }
  .onglet.cockpit {
    --carton: var(--moutarde);
  }
  .onglet.atelier {
    --carton: #b7dbe3;
  }
  .onglet.trophees {
    --carton: #c3e0bf;
  }
  /* L'étiquette de papier, glissée dans le carton. */
  .etiquette {
    position: relative;
    display: flex;
    align-items: center;
    gap: 2px;
    max-width: 100%;
    padding: 2px 4px;
    border: 1.5px solid var(--couleur-encre);
    border-radius: 2px;
    background: var(--couleur-papier);
    font-family: var(--police-machine);
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0;
    box-shadow: 1px 1px 0 rgba(42, 30, 23, 0.35);
  }
  .etiquette > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .etiquette :global(svg) {
    flex: none;
    width: 14px;
    height: 14px;
  }
  /* L'intercalaire de la page affichée : devant les autres, plus haut, soudé à la page (même couleur qu'elle, avec
     le liseré de sa couleur en haut). */
  .onglet.actif {
    z-index: 2;
    height: 56px;
  }
  .onglet.actif .carton {
    background: linear-gradient(var(--carton) 0 5px, var(--couleur-fond) 5px);
  }
  .onglet.actif::after {
    content: '';
    position: absolute;
    left: 2px;
    right: 2px;
    bottom: -3px;
    height: 5px;
    background: var(--couleur-fond);
  }
  .onglet.actif .etiquette {
    font-size: 10px;
    transform: translateY(-2px);
  }
  /* COCKPIT, l'écran principal : un peu plus grand. */
  .onglet.cockpit .etiquette :global(svg) {
    width: 20px;
    height: 20px;
  }
  .onglet:not(.actif):active {
    transform: translateY(2px);
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
