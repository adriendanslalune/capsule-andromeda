<script lang="ts">
  // Une médaille de trophée : ruban, disque, et son dessin (astre, engin, compteur, collection, ou dessin propre).
  // Obtenue : en couleurs ; pas encore : en silhouette pointillée.
  import type { Trophee } from '../../moteur/trophees'

  let { t, ok }: { t: Trophee; ok: boolean } = $props()
  const plein = (c: string) => (ok ? c : 'none')
</script>

<svg viewBox="0 0 80 96" aria-hidden="true">
  <!-- Ruban. -->
  <path d="M 28 4 L 36 40 L 44 40 L 52 4 Z" fill={plein(t.categorie === 'astres' || t.categorie === 'satellites' ? 'var(--ciel)' : t.categorie === 'engins' ? 'var(--menthe)' : 'var(--cerise)')} stroke="var(--couleur-encre)" stroke-width="2" />
  <path d="M 36 4 L 40 40 L 44 4" fill="none" stroke={ok ? 'var(--couleur-papier)' : 'var(--couleur-encre)'} stroke-width="1.5" />
  <!-- Disque. -->
  <circle cx="40" cy="62" r="28" fill={plein('var(--moutarde)')} stroke="var(--couleur-encre)" stroke-width="2.5" />
  <circle cx="40" cy="62" r="22" fill={plein('var(--couleur-papier)')} stroke="var(--couleur-encre)" stroke-width="1.5" stroke-dasharray={ok ? '' : '3 2'} />
  <g fill="none" stroke="var(--couleur-encre)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
    {#if t.icone === 'soleil'}
      <circle cx="40" cy="62" r="9" fill={plein(t.couleur ?? 'var(--moutarde)')} />
      {#each [0, 45, 90, 135, 180, 225, 270, 315] as a}
        {@const r = (a * Math.PI) / 180}
        <line x1={40 + Math.cos(r) * 12} y1={62 + Math.sin(r) * 12} x2={40 + Math.cos(r) * 17} y2={62 + Math.sin(r) * 17} stroke-width="1.8" />
      {/each}
    {:else if t.icone === 'planete'}
      <circle cx="40" cy="62" r="13" fill={plein(t.couleur ?? '#cfc8b8')} />
      {#if t.nom === 'Saturne'}<ellipse cx="40" cy="62" rx="19" ry="5" stroke-width="1.6" />
      {:else if t.nom === 'Jupiter'}<path d="M 28 58 H 52 M 27 64 H 53 M 29 69 H 51" stroke-width="1.3" />
      {:else if t.nom === 'Terre'}<path d="M 33 56 Q 38 54 40 58 Q 44 62 39 66 M 44 55 Q 50 58 48 63" stroke-width="1.3" />
      {:else if t.nom === 'La Lune'}<circle cx="35" cy="58" r="2.5" stroke-width="1.2" /><circle cx="45" cy="66" r="3" stroke-width="1.2" />
      {:else}<path d="M 30 60 Q 40 56 50 60" stroke-width="1.3" />{/if}
    {:else if t.icone === 'satellite'}
      <!-- Le satellite, et l'arc de sa planète. -->
      <path d="M 24 76 Q 30 62 26 50" stroke-width="1.6" stroke={ok ? t.couleur : 'var(--couleur-encre)'} />
      <circle cx="44" cy="60" r="8" fill={plein('#d6d0c4')} />
      <circle cx="41" cy="58" r="1.8" stroke-width="1" /><circle cx="46" cy="63" r="1.4" stroke-width="1" />
    {:else if t.icone === 'engin'}
      <!-- Sonde : antenne, corps, ailes. -->
      <path d="M 34 52 Q 40 44 46 52 Z" fill={plein('var(--couleur-papier)')} stroke-width="1.6" />
      <rect x="36" y="56" width="8" height="8" fill={plein('#c79a3a')} stroke-width="1.6" />
      <rect x="22" y="58" width="11" height="5" fill={plein('#2f4475')} stroke-width="1.4" />
      <rect x="47" y="58" width="11" height="5" fill={plein('#2f4475')} stroke-width="1.4" />
      <path d="M 33 60.5 H 36 M 44 60.5 H 47 M 40 64 V 72" stroke-width="1.4" />
    {:else if t.icone === 'collection'}
      <!-- Étoile et lauriers. -->
      <path d="M 40 50 L 43 58 L 51 58 L 45 63 L 47 71 L 40 66 L 33 71 L 35 63 L 29 58 L 37 58 Z" fill={plein('var(--cerise)')} stroke-width="1.5" />
      <path d="M 24 64 Q 26 74 36 77 M 56 64 Q 54 74 44 77" stroke-width="1.4" />
    {:else if t.icone === 'premier'}
      <path d="M 31 50 H 45 L 50 55 V 74 H 31 Z" />
      <path d="M 35 58 H 45 M 35 63 H 45" stroke-width="1.4" />
      <circle cx="46" cy="72" r="5" fill={plein('var(--cerise)')} />
    {:else if t.icone === 'kuiper'}
      <ellipse cx="40" cy="62" rx="17" ry="7" stroke-width="1.4" stroke-dasharray="2 3" />
      <circle cx="40" cy="62" r="3" fill={plein('var(--moutarde)')} />
      <circle cx="26" cy="60" r="2" /><circle cx="54" cy="65" r="2.5" /><circle cx="46" cy="55" r="1.6" />
    {:else if t.icone === 'helio'}
      <circle cx="40" cy="62" r="5" fill={plein('var(--moutarde)')} />
      <circle cx="40" cy="62" r="16" stroke-width="1.4" stroke-dasharray="4 2" />
      <path d="M 40 52 V 49 M 40 72 V 75 M 30 62 H 27 M 50 62 H 53" stroke-width="1.4" />
    {:else if t.icone === 'voyager'}
      <path d="M 33 56 Q 40 46 47 56 Z" fill={plein('var(--couleur-papier)')} />
      <rect x="37" y="57" width="6" height="7" />
      <path d="M 40 64 L 40 72 M 30 66 L 50 66 M 27 64 L 27 68 M 53 64 L 53 68" stroke-width="1.4" />
    {:else if t.icone === 'contact'}
      <ellipse cx="40" cy="66" rx="16" ry="5" fill={plein('var(--menthe)')} />
      <path d="M 31 64 Q 40 52 49 64" fill={plein('var(--ciel)')} />
      <path d="M 32 50 L 34 43 L 37 48 L 40 41 L 43 48 L 46 43 L 48 50 Z" fill={plein('var(--moutarde)')} stroke-width="1.6" />
    {:else}
      <!-- Compteur : le palier, en gros chiffres. -->
      <text x="40" y={t.texte && t.texte.length > 5 ? 66 : 68} text-anchor="middle" stroke="none" fill="var(--couleur-encre)"
        font-family="var(--police-titre)" font-size={t.texte && t.texte.length > 5 ? 10 : t.texte && t.texte.length > 3 ? 13 : 17}>{t.texte}</text>
    {/if}
  </g>
</svg>
