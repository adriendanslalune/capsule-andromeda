<svelte:options namespace="svg" />

<!-- Motifs des planches : le manuel est en noir et blanc, les zones de couleur des cadrans sont hachurées.
     « zone-rouge » : hachures serrées ; « zone-bleue » : pointillés. -->
<defs>
  <pattern id="zone-rouge" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="4" height="4" fill="#f8f5ec" />
    <line x1="0" y1="0" x2="0" y2="4" stroke="#1d1916" stroke-width="2" />
  </pattern>
  <pattern id="zone-bleue" width="4" height="4" patternUnits="userSpaceOnUse">
    <rect width="4" height="4" fill="#f8f5ec" />
    <circle cx="2" cy="2" r="0.9" fill="#1d1916" />
  </pattern>
  <pattern id="zone-verte" width="5" height="5" patternUnits="userSpaceOnUse">
    <rect width="5" height="5" fill="#f8f5ec" />
    <line x1="0" y1="2.5" x2="5" y2="2.5" stroke="#1d1916" stroke-width="1" />
  </pattern>
</defs>
