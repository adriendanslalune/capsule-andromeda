<script lang="ts">
  // ⚠ PROVISOIRE — demandé par Adrien le 14/10/2026 pour visiter toutes les destinations sans attendre.
  // À RETIRER DÈS QU'IL LE DEMANDE : supprimer ce dossier (src/interface/provisoire/) et la ligne qui l'affiche dans
  // src/interface/volets/Carte.svelte (chercher « PROVISOIRE »).
  // Le saut place la fusée en orbite autour de la destination choisie, instantanément. Aucun contrat n'est rempli,
  // mais la visite compte pour les trophées (et les points).
  import { NOMS_ENGINS } from '../../astro/engins'
  import { positionCorps, rayonCorps } from '../../astro/corps'
  import { satellitesDe } from '../../astro/satellites'
  import { UA_KM } from '../../astro/temps'
  import { APPROCHE_ENGIN_KM } from '../../donnees/engins'
  import { NOMS_PLANETES } from '../../donnees/planetes'
  import { AMARRAGE_ISS_KM } from '../../donnees/reglages'
  import { lieuDArrivee, seuilArrivee } from '../../moteur/fusee'
  import { nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'

  const LISTE = [
    { titre: 'Soleil, planètes et Lune', noms: ['Soleil', ...NOMS_PLANETES, 'Lune'] },
    { titre: 'Engins', noms: ['ISS', ...NOMS_ENGINS] },
    ...NOMS_PLANETES.filter((p) => satellitesDe(p).length).map((p) => ({ titre: `Satellites de ${p}`, noms: satellitesDe(p).map((s) => s.nom) })),
  ]
  let choix = $state('')

  function sauter() {
    if (!choix || !jeu.etat) return
    const t = jeu.maintenant
    const astre = lieuDArrivee(choix)
    const c = positionCorps(astre, t)
    // On se range du côté éclairé (entre l'astre et le Soleil), à la distance d'arrivée.
    const km = astre === 'ISS' ? AMARRAGE_ISS_KM : NOMS_ENGINS.includes(astre) ? APPROCHE_ENGIN_KM
      : Math.max(seuilArrivee({ type: 'astre', astre }) * UA_KM, (rayonCorps(astre) ?? 0) * 1.5)
    const d = Math.hypot(c.x, c.y) || 1
    const u = astre === 'Soleil' ? { x: 1, y: 0 } : { x: -c.x / d, y: -c.y / d }
    const e = km / UA_KM
    const etat = jeu.etat
    jeu.remplacer({
      ...etat,
      fusee: {
        ...etat.fusee, position: { x: c.x, y: c.y }, z: c.z, orbite: astre, destination: null, fenetre: null,
        presDuVisiteur: false, trajet: undefined, ecartOrbite: { x: u.x * e, y: u.y * e, z: 0 }, vitesseCourante: 0,
      },
    }, [`SAUT D’ESSAI : ${nomAstre(astre).toUpperCase()}.`])
    choix = ''
  }
</script>

<div class="saut">
  <span class="titre">SAUT D’ESSAI <small>provisoire</small></span>
  <select bind:value={choix} aria-label="Destination du saut">
    <option value="">Aller n’importe où…</option>
    {#each LISTE as g}
      <optgroup label={g.titre}>{#each g.noms as n}<option value={n}>{nomAstre(n).replace(/^./, (x) => x.toUpperCase())}</option>{/each}</optgroup>
    {/each}
  </select>
  <button disabled={!choix} onclick={sauter}>SAUTER</button>
</div>

<style>
  .saut {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 2px dashed var(--cerise);
    border-radius: 8px;
  }
  .titre {
    width: 100%;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--cerise);
  }
  .titre small {
    font-weight: 400;
    letter-spacing: 0;
  }
  select {
    flex: 1;
    min-width: 0;
    min-height: 40px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--couleur-papier);
    font: inherit;
    font-size: 16px;
  }
  button {
    min-height: 40px;
    padding: 0 12px;
    border: 2px solid var(--couleur-encre);
    border-radius: 6px;
    background: var(--cerise);
    color: var(--couleur-papier);
    font-weight: 700;
    letter-spacing: 1px;
  }
  button:disabled {
    opacity: 0.4;
  }
</style>
