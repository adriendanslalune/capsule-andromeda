<script lang="ts">
  // Petits dessins des boutons du cockpit, au trait d'encre : carte, contrats, atelier, trophées, manuel.
  let { nom }: { nom: 'carte' | 'contrats' | 'cockpit' | 'atelier' | 'trophees' | 'manuel' } = $props()
</script>

<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
  {#if nom === 'carte'}
    <!-- Carte pliée en trois, avec un tracé. -->
    <path d="M2 6 L8 4 L16 6 L22 4 L22 18 L16 20 L8 18 L2 20 Z" />
    <path d="M8 4 V18 M16 6 V20" />
    <path d="M4 15 Q8 10 12 13 T19 8" stroke-width="1.4" stroke-dasharray="2 2" />
  {:else if nom === 'contrats'}
    <!-- Contrat roulé avec son sceau. -->
    <path d="M5 3 H15 L19 7 V21 H5 Z" />
    <path d="M15 3 V7 H19" />
    <path d="M8 10 H15 M8 13 H15" stroke-width="1.5" />
    <circle cx="14" cy="17.5" r="2.5" />
  {:else if nom === 'cockpit'}
    <!-- Hublot boulonné et son cadran. -->
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="12" r="5.5" stroke-width="1.6" />
    <path d="M12 12 L15 9" stroke-width="1.6" />
    <circle cx="12" cy="3.5" r="0.6" fill="currentColor" /><circle cx="12" cy="20.5" r="0.6" fill="currentColor" />
    <circle cx="3.5" cy="12" r="0.6" fill="currentColor" /><circle cx="20.5" cy="12" r="0.6" fill="currentColor" />
  {:else if nom === 'atelier'}
    <!-- Clé plate et tournevis croisés. -->
    <path d="M4 20 L13 11" stroke-width="3" />
    <path d="M13 11 A4 4 0 1 0 17 7 L15 9 L13 9 L13 7 L15 5" />
    <path d="M20 20 L11 11" stroke-width="2.4" />
    <path d="M11 11 L7 7 L5 5" stroke-width="1.6" />
  {:else if nom === 'trophees'}
    <!-- Coupe. -->
    <path d="M7 3 H17 V9 A5 5 0 0 1 7 9 Z" />
    <path d="M7 5 H3 Q3 10 8 11 M17 5 H21 Q21 10 16 11" stroke-width="1.6" />
    <path d="M12 14 V18 M8 21 H16 L15 18 H9 Z" />
  {:else}
    <!-- Livre ouvert. -->
    <path d="M12 6 Q8 3 2 4 V19 Q8 18 12 21 Q16 18 22 19 V4 Q16 3 12 6 Z" />
    <path d="M12 6 V21" />
    <path d="M5 8 H9 M5 11 H9 M15 8 H19 M15 11 H19" stroke-width="1.3" />
  {/if}
</svg>
