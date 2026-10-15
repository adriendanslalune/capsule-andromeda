<script lang="ts">
  // MISSIONS, DÉCOUVERTES : le visiteur de la saison (la chasse, déjà jouable), puis les monolithes, les artefacts et
  // les épaves, annoncés (docs/conception-destin.md, §4).
  import { STATIONS_RADIO } from '../../donnees/radio'
  import { distanceEcho, finSaison, numeroSaison, visiteurDetecte } from '../../moteur/chasse'
  import { heureLocale, nombre, ua } from '../format'
  import { jeu } from '../jeu.svelte'
  import BientotDisponible from './BientotDisponible.svelte'

  const etat = $derived(jeu.etat!)
  const t = $derived(jeu.maintenant)
  const saison = $derived(numeroSaison(t))
  const trouve = $derived(etat.chasse.trouvailles.some((x) => x.saison === saison))
  const detecte = $derived(visiteurDetecte(etat, t))
  const jours = $derived(Math.ceil((finSaison(saison) - t) / 86_400_000))
  const echo = $derived(etat.chasse.dernierEcho ?? null)
</script>

<div class="rubrique">
  <!-- Le visiteur : la chasse en cours. -->
  <div class="fiche visiteur">
    <span class="radar" aria-hidden="true"><span class="balayage"></span>{#if detecte !== null || trouve}<span class="echo"></span>{/if}</span>
    <span class="texte">
      <small>LE VISITEUR · SAISON {saison}</small>
      <b>{trouve ? 'Photographié !' : detecte !== null ? `Détecté à ${ua(detecte)}` : 'Introuvable'}</b>
      <span>{jours} jour{jours > 1 ? 's' : ''} avant la fin de la saison</span>
      {#if echo}<span class="discret">Dernier écho à {heureLocale(echo.t)} : {nombre(distanceEcho(echo.duree), 3)} UA</span>{/if}
    </span>
  </div>
  <button class="aller" onclick={() => (jeu.page = 'carte')}>CHASSER : CARTE ET TRACÉS ›</button>

  <BientotDisponible titre="Les monolithes · 0 / 10" texte={`Leur signal s’entend sur ${nombre(STATIONS_RADIO.monolithe, 2)} : plus on approche, plus il est net. Les dix réunis donnent accès à une technologie extraterrestre : se téléporter n’importe où dans le système solaire, une fois par jour.`} />
  <BientotDisponible titre="Artefacts" texte="Objets perdus et curiosités, semés près des astres. Le manuel aide à les identifier et à connaître leur valeur." />
  <BientotDisponible titre="Épaves" texte="Cargos et sondes en perdition : une cargaison à récupérer, des pièces, parfois un indice." />
</div>

<style>
  .rubrique {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 2px;
  }
  .fiche {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 2px solid var(--couleur-encre);
    border-radius: 8px;
    background: var(--nuit);
    color: var(--menthe);
    box-shadow: 3px 3px 0 var(--couleur-encre);
  }
  .texte {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    line-height: 1.25;
  }
  .texte small {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #9cc7a4;
  }
  .texte b {
    font-family: var(--police-titre);
    font-weight: 400;
    font-size: 18px;
  }
  .texte span {
    font-size: 13px;
  }
  .discret {
    color: #9cc7a4;
  }
  .radar {
    position: relative;
    flex: none;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 3px solid var(--moutarde);
    background: #10331f;
    overflow: hidden;
  }
  .radar::before {
    content: '';
    position: absolute;
    inset: 10px;
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
    width: 8px;
    height: 8px;
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
  @keyframes clignote {
    50% {
      opacity: 0;
    }
  }
  .aller {
    align-self: flex-start;
    min-height: 44px;
    padding: 0 14px;
    border: 2px solid var(--couleur-encre);
    border-radius: 10px;
    background: var(--couleur-papier);
    box-shadow: 0 3px 0 var(--couleur-encre);
    font-family: var(--police-chiffres);
    font-weight: 700;
    letter-spacing: 0.5px;
  }
</style>
