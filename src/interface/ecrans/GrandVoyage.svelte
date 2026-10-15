<script lang="ts">
  // Le premier grand voyage : à la fin du tutoriel (ISS, Hubble, Tiangong), l'Office annonce solennellement le départ
  // vers la Lune. Plein écran, nuit étoilée, la Lune qui se lève, une lettre signée, un tampon, une fanfare lente.
  // Un seul bouton engage le voyage (contrat accepté, cap sur la Lune) ; « plus tard » remet l'annonce à plus tard.
  import { onMount } from 'svelte'
  import { UA_KM } from '../../astro/temps'
  import { CONTRATS_TUTORIEL } from '../../donnees/economie'
  import { accepterContrat, destinationDuContrat } from '../../moteur/economie'
  import { choisirDestination, distance, positionAstre } from '../../moteur/fusee'
  import { jeu } from '../jeu.svelte'
  import { SONS } from '../sons'

  const lune = CONTRATS_TUTORIEL.find((c) => c.grandVoyage)!
  const etat = $derived(jeu.etat!)
  // La vraie distance de la Terre à la Lune, aujourd'hui.
  const km = $derived(Math.round((distance(positionAstre('Terre', jeu.maintenant), positionAstre('Lune', jeu.maintenant)) * UA_KM) / 100) * 100)
  const enLettres = (n: number) => n.toLocaleString('fr-FR')

  // Les étoiles du fond : tirées une fois.
  const etoiles = Array.from({ length: 70 }, (_, i) => {
    const h = (k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1
    return { x: h(1) * 100, y: h(2) * 70, r: 0.6 + h(3) * 1.4, d: h(4) * 4 }
  })

  onMount(() => SONS.solennel())

  function partir() {
    const r = accepterContrat(etat, lune.id, jeu.maintenant)
    if (r.refus) return
    const e = { ...r.etat, fusee: choisirDestination(r.etat.fusee, destinationDuContrat(r.etat.contrats.find((c) => c.id === lune.id)!)) }
    jeu.remplacer(e, ['L’OFFICE ANNONCE LE PREMIER GRAND VOYAGE.', 'NOUVEAU CAP : LA LUNE.'])
    jeu.page = 'cockpit'
    SONS.bon()
  }
</script>

<div class="grand-voyage" role="dialog" aria-label="Le premier grand voyage">
  <div class="ciel" aria-hidden="true">
    {#each etoiles as s}<i style={`left: ${s.x}%; top: ${s.y}%; width: ${s.r * 2}px; height: ${s.r * 2}px; animation-delay: ${s.d}s`}></i>{/each}
  </div>
  <!-- La Lune, en aplats et traits d'encre, qui se lève. -->
  <svg class="lune" viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="92" fill="#efe6cf" stroke="#22160f" stroke-width="5" />
    <path d="M 100 8 A 92 92 0 0 1 100 192 A 70 92 0 0 0 100 8 Z" fill="#cdbf9e" />
    <circle cx="70" cy="72" r="16" fill="#d9ccab" stroke="#22160f" stroke-width="3" />
    <circle cx="122" cy="58" r="9" fill="#d9ccab" stroke="#22160f" stroke-width="3" />
    <circle cx="112" cy="118" r="22" fill="#d9ccab" stroke="#22160f" stroke-width="3" />
    <circle cx="62" cy="134" r="8" fill="#d9ccab" stroke="#22160f" stroke-width="3" />
    <circle cx="150" cy="100" r="6" fill="#d9ccab" stroke="#22160f" stroke-width="3" />
  </svg>

  <div class="contenu">
    <p class="surtitre">OFFICE NATIONAL DES VOLS INTERPLANÉTAIRES</p>
    <h1 class="titre-pulp">En route<br />vers la Lune</h1>
    <p class="sous-titre">— LE PREMIER GRAND VOYAGE —</p>

    <article class="lettre">
      <p>Commissionnaire,</p>
      <p>
        Vos trois premières missions sont remplies. L’Office vous juge digne du grand départ : quitter les abords de
        la Terre, et traverser le vide jusqu’à la Lune, à <b>{enLettres(km)} km</b>.
      </p>
      <p>
        Personne ne vous y attend, sauf le relais de l’Office et son courrier. La C-58 n’a jamais été aussi loin
        avec vous. Que le moteur tienne, et que le manuel ne vous quitte pas.
      </p>
      <p class="signature">Le Directeur des commissions</p>
      <span class="tampon" aria-hidden="true">BON POUR<br />LE DÉPART</span>
    </article>

    <div class="prime"><span>PRIME DU VOYAGE</span><b>{lune.prime} CR</b></div>
    <button class="partir" onclick={partir}>CAP SUR LA LUNE</button>
    <button class="plus-tard" onclick={() => (jeu.grandVoyageRemis = true)}>plus tard</button>
  </div>
</div>

<style>
  .grand-voyage {
    position: absolute;
    inset: 0;
    z-index: 30;
    overflow-y: auto;
    background: radial-gradient(ellipse at 50% 18%, #1d3355 0%, #0b1424 55%, #05080f 100%);
    color: var(--couleur-texte-clair);
    animation: nuit 1.6s ease-out both;
  }
  @keyframes nuit {
    from {
      opacity: 0;
    }
  }
  .ciel {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .ciel i {
    position: absolute;
    border-radius: 50%;
    background: #fdf6e3;
    animation: scintille 4s ease-in-out infinite;
  }
  @keyframes scintille {
    50% {
      opacity: 0.35;
    }
  }
  .lune {
    position: absolute;
    left: 50%;
    top: 26px;
    width: 124px;
    margin-left: -62px;
    filter: drop-shadow(0 0 28px rgba(239, 230, 207, 0.35));
    animation: leve 3.2s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  @keyframes leve {
    from {
      transform: translateY(90px) scale(0.85);
      opacity: 0;
    }
  }
  .contenu {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 160px 18px 18px;
    text-align: center;
  }
  .contenu > * {
    animation: monte 1s ease-out both;
  }
  .surtitre {
    margin: 0;
    font-size: 10px;
    letter-spacing: 2.5px;
    color: var(--moutarde);
    animation-delay: 1.4s !important;
  }
  h1 {
    margin: 0;
    font-size: 40px;
    line-height: 0.95;
    color: var(--couleur-papier);
    text-shadow: 3px 3px 0 var(--couleur-encre);
    animation-delay: 1.8s !important;
  }
  .sous-titre {
    margin: 0;
    font-family: var(--police-chiffres);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--moutarde);
    animation-delay: 2.3s !important;
  }
  @keyframes monte {
    from {
      transform: translateY(14px);
      opacity: 0;
    }
  }
  .lettre {
    position: relative;
    margin-top: 6px;
    padding: 14px 16px 18px;
    border: 2px solid var(--couleur-encre);
    border-radius: 4px;
    background: var(--couleur-papier);
    box-shadow: 5px 5px 0 var(--couleur-encre);
    color: var(--couleur-encre);
    font-family: var(--police-machine);
    font-size: 14px;
    line-height: 1.38;
    text-align: left;
    transform: rotate(-0.6deg);
    animation-delay: 2.9s !important;
  }
  .lettre p {
    margin: 0 0 8px;
  }
  .signature {
    margin: 12px 0 0 !important;
    font-family: var(--police-script);
    font-size: 19px;
    text-align: right;
  }
  .tampon {
    position: absolute;
    left: 14px;
    bottom: 10px;
    padding: 3px 8px;
    border: 3px solid var(--cerise);
    border-radius: 6px;
    color: var(--cerise);
    font-family: var(--police-titre);
    font-size: 13px;
    line-height: 1.05;
    transform: rotate(-11deg);
    opacity: 0.85;
  }
  .prime {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 8px 12px;
    border: var(--trait) solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--moutarde);
    color: var(--couleur-encre);
    font-weight: 700;
    letter-spacing: 1px;
    animation-delay: 3.4s !important;
  }
  .prime b {
    font-family: var(--police-titre);
    font-size: 22px;
    font-weight: 400;
  }
  .partir {
    width: 100%;
    min-height: 60px;
    border: 3px solid var(--couleur-encre);
    border-radius: 12px;
    background: var(--cerise);
    color: var(--couleur-texte-clair);
    box-shadow: 0 5px 0 var(--couleur-encre);
    font-family: var(--police-titre);
    font-size: 21px;
    letter-spacing: 1px;
    animation-delay: 3.8s !important;
  }
  .partir:active {
    transform: translateY(4px);
    box-shadow: 0 1px 0 var(--couleur-encre);
  }
  .plus-tard {
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    background: none;
    color: #9fb3cc;
    font-size: 13px;
    text-decoration: underline;
    animation-delay: 4.2s !important;
  }
</style>
