<script lang="ts">
  // VI. AL-1 Fusibles.
  import { COULEURS_FUSIBLES, NOMBRE_FUSIBLES } from '../../../donnees/modules'
  import Page from '../Page.svelte'
  import Levier from '../schemas/Levier.svelte'
  import Plaque from '../schemas/Plaque.svelte'

  let { numero }: { numero: number } = $props()
  const couleurs = COULEURS_FUSIBLES.map((c) => c.toUpperCase())
  const fusibles = Array.from({ length: NOMBRE_FUSIBLES }, (_, i) => ({ x: 52 + (i % 4) * 62, y: 6 + Math.floor(i / 4) * 52, grille: i === 5 }))
</script>

<Page {numero} chapitre="VI." titre="AL-1 — FUSIBLES">
  <svg class="planche reduite" viewBox="0 0 344 200" aria-label="Planche du bloc AL-1">
    <rect x="44" y="0" width="256" height="110" rx="6" fill="none" stroke="#1d1916" stroke-width="1.5" />
    {#each fusibles as f, i}
      <rect x={f.x} y={f.y} width="54" height="46" rx="4" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.2" />
      <text x={f.x + 27} y={f.y + 11} text-anchor="middle" font-size="7.5" font-weight="700" font-family="Courier Prime, monospace">F-{i + 1}</text>
      <rect x={f.x + 21} y={f.y + 14} width="12" height="18" rx="3" fill={f.grille ? '#1d1916' : '#f8f5ec'} stroke="#1d1916" stroke-width="1.1" />
      <rect x={f.x + 17} y={f.y + 35} width="20" height="6" fill="none" stroke="#1d1916" stroke-width="1.1" />
    {/each}
    <!-- Boîte de rechange. -->
    <rect x="72" y="118" width="200" height="34" rx="5" fill="none" stroke="#1d1916" stroke-width="1" stroke-dasharray="4 2" />
    {#each couleurs as c, i}
      <rect x={84 + i * 46} y="124" width="36" height="22" rx="4" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.2" />
      <text x={102 + i * 46} y="139" text-anchor="middle" font-size="7.5" font-weight="700" font-family="Courier Prime, monospace">{c}</text>
    {/each}
    {#each [true, true, false, true] as haut, i}
      <Levier x={112 + i * 40} y={170} h={34} {haut} />
      <Plaque x={112 + i * 40} y={194} texte={`S-${i + 1}`} />
    {/each}
  </svg>
  <p>
    Symptôme : un fusible grillé (fenêtre noire, ici F-6), bloc AL-1 en avarie. Chaque fusible porte une bague de
    couleur : {couleurs.join(', ')}.
  </p>
  <ol>
    <li>Couper l’alimentation : S-4 en position basse.</li>
    <li>Retirer le fusible grillé (le toucher).</li>
    <li>Choisir un fusible neuf dans la boîte de rechange, selon la règle ci-dessous, puis toucher l’emplacement vide.</li>
    <li>Rétablir l’alimentation : S-4 en position haute.</li>
  </ol>
  <h3>Couleur du fusible neuf</h3>
  <p>
    Dernier chiffre du n° de série PAIR : même couleur que le fusible <b>qui a grillé en premier</b>.<br />
    IMPAIR : couleur suivante, dans l’ordre {couleurs.join(' → ')} → {couleurs[0]}.
  </p>
  <p class="exception">si S-1 est en position basse, le fusible neuf est TOUJOURS {couleurs[3]}.</p>
  <p class="discret">
    Toute manipulation de fusible sous tension (S-4 haut) provoque une décharge. Un fusible de mauvaise couleur grille
    aussitôt ; la règle se calcule toujours à partir du fusible qui a grillé en premier.
  </p>
</Page>

<style>
  .reduite {
    width: 80% !important;
    align-self: center;
  }
</style>
