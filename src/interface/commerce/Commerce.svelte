<script lang="ts">
  // Intercalaire COMMERCE : la cale (ce que transporte la fusée) et le marché du lieu où elle se trouve. Pas encore
  // construit : la page annonce ce qui viendra (docs/conception-destin.md, §6).
  import { nomAstre } from '../format'
  import { jeu } from '../jeu.svelte'
  import BientotDisponible from '../missions/BientotDisponible.svelte'

  const fusee = $derived(jeu.etat!.fusee)
</script>

<div class="commerce">
  <div class="cale">
    <small>CALE</small>
    <b>Vide</b>
    <span>{fusee.orbite ? `En orbite : ${nomAstre(fusee.orbite)}` : 'En route'}</span>
  </div>
  <BientotDisponible titre="Le marché" texte="Eau, glace, minerais, hélium-3, vivres, pièces, médicaments… Chaque lieu produit certaines marchandises (pas chères) et en consomme d’autres (chères) ; les prix changent chaque jour." detail="Le manuel dira ce que produit et consomme chaque lieu, pour préparer ses routes." />
  <BientotDisponible titre="Agrandir la cale" texte="10 unités au départ ; plus à l’atelier." />
</div>

<style>
  .commerce {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px var(--espace) 20px;
  }
  .cale {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 10px 12px;
    border: 2px solid var(--couleur-encre);
    border-left: 6px solid #6fa86a;
    border-radius: 8px;
    background: var(--couleur-papier);
    box-shadow: 3px 3px 0 var(--couleur-encre);
    line-height: 1.25;
  }
  small {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--couleur-encre-discrete);
  }
  b {
    font-family: var(--police-titre);
    font-weight: 400;
    font-size: 18px;
  }
  span {
    font-size: 13px;
  }
</style>
