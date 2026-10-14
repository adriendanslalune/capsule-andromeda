<script lang="ts">
  // I. Le poste de pilotage : planche du cockpit, organes numérotés (nomenclature à la page suivante).
  import Page from '../Page.svelte'
  import Jauge from '../schemas/Jauge.svelte'
  import Motifs from '../schemas/Motifs.svelte'
  import Repere from '../schemas/Repere.svelte'
  import Voyant from '../schemas/Voyant.svelte'

  let { numero }: { numero: number } = $props()
  const voyants = Array.from({ length: 12 }, (_, i) => ({ x: 92 + (i % 6) * 32, y: 314 + Math.floor(i / 6) * 22 }))
  const onglets = ['CARTE', 'CONTR.', 'COCKPIT', 'ATEL.', 'TROPH.']
</script>

<Page {numero} chapitre="I." titre="LE POSTE DE PILOTAGE">
  <p>Vue de face, depuis le siège du commissionnaire. Les numéros renvoient à la nomenclature (chapitre II).</p>
  <svg class="planche" viewBox="0 0 344 420" aria-label="Planche du poste de pilotage">
    <Motifs />
    <!-- Contour du poste. -->
    <rect x="62" y="4" width="220" height="412" rx="10" fill="none" stroke="#1d1916" stroke-width="1.6" />
    <!-- Barre du haut : nom, voyant des télégrammes, compteur et saison, son, manuel. -->
    <text x="70" y="22" font-size="11" font-weight="700" font-family="Courier Prime, monospace">C-58</text>
    <rect x="106" y="10" width="46" height="17" rx="2" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <circle cx="113" cy="16" r="2.6" fill="#1d1916" />
    <text x="118" y="18" font-size="5.5" font-weight="700" font-family="Courier Prime, monospace">TÉLÉGR.</text>
    <text x="110" y="24.5" font-size="4.5" font-family="Courier Prime, monospace">1 NOUVEAU</text>
    <rect x="182" y="10" width="44" height="12" fill="none" stroke="#1d1916" stroke-width="1.2" />
    {#each [1, 2, 3] as i}<line x1={182 + 11 * i} y1="10" x2={182 + 11 * i} y2="22" stroke="#1d1916" stroke-width="0.6" />{/each}
    <text x="226" y="28" text-anchor="end" font-size="4.5" font-family="Courier Prime, monospace">SAISON</text>
    <rect x="238" y="9" width="8" height="17" rx="4" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <rect x="254" y="9" width="20" height="18" rx="3" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <path d="M 264 13 q -3 -2 -7 -1 v 10 q 4 -1 7 1 q 3 -2 7 -1 v -10 q -4 -1 -7 1 z M 264 13 v 10" fill="none" stroke="#1d1916" stroke-width="0.8" />
    <!-- Onglets : celui de la page affichée ressort. -->
    <line x1="62" y1="48" x2="282" y2="48" stroke="#1d1916" stroke-width="1.6" />
    {#each onglets as o, i}
      {@const x = 66 + i * 43}
      <path d={i === 2 ? `M ${x} 48 V 31 Q ${x} 29 ${x + 3} 29 H ${x + 37} Q ${x + 40} 29 ${x + 40} 31 V 48` : `M ${x} 48 V 35 Q ${x} 33 ${x + 3} 33 H ${x + 37} Q ${x + 40} 33 ${x + 40} 35 V 48`}
        fill={i === 2 ? '#f8f5ec' : 'none'} stroke="#1d1916" stroke-width={i === 2 ? 1.6 : 1} />
      <text x={x + 20} y="44" text-anchor="middle" font-size="5.5" font-weight="700" font-family="Courier Prime, monospace">{o}</text>
    {/each}
    <line x1="152" y1="48" x2="192" y2="48" stroke="#f8f5ec" stroke-width="2" />
    <circle cx="191" cy="30" r="4.5" fill="#1d1916" />
    <text x="191" y="32" text-anchor="middle" font-size="5.5" font-weight="700" fill="#f8f5ec" font-family="Courier Prime, monospace">2</text>
    <!-- Hublot, d'un bord à l'autre. -->
    <line x1="62" y1="54" x2="282" y2="54" stroke="#1d1916" stroke-width="1.2" />
    <rect x="66" y="58" width="212" height="56" rx="6" fill="url(#zone-bleue)" stroke="#1d1916" stroke-width="1" />
    <line x1="62" y1="118" x2="282" y2="118" stroke="#1d1916" stroke-width="1.2" />
    <!-- Interrupteur MOTEUR. -->
    <rect x="72" y="124" width="50" height="16" rx="8" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <circle cx="114" cy="132" r="5.5" fill="#1d1916" />
    <text x="78" y="135" font-size="7" font-weight="700" font-family="Courier Prime, monospace">ON</text>
    <!-- Cadrans : grand tachymètre, compas et horloge. -->
    <Jauge x={118} y={182} r={32} />
    <rect x="106" y="194" width="24" height="9" fill="#1d1916" />
    <text x="118" y="201" text-anchor="middle" font-size="6" fill="#f8f5ec" font-family="Courier Prime, monospace">13,5</text>
    <circle cx="236" cy="160" r="16" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.6" />
    {#each [0, 90, 180, 270] as a}
      {@const r = (a * Math.PI) / 180}
      <line x1={236 + Math.cos(r) * 11} y1={160 - Math.sin(r) * 11} x2={236 + Math.cos(r) * 14} y2={160 - Math.sin(r) * 14} stroke="#1d1916" stroke-width="1.2" />
    {/each}
    <path d="M 236 160 L 243 150 L 238 161 Z" fill="#1d1916" />
    <circle cx="236" cy="200" r="16" fill="#f8f5ec" stroke="#1d1916" stroke-width="1.6" />
    <line x1="236" y1="200" x2="236" y2="189" stroke="#1d1916" stroke-width="1.6" />
    <line x1="236" y1="200" x2="244" y2="203" stroke="#1d1916" stroke-width="1.1" />
    <!-- Écran de navigation. -->
    <rect x="70" y="222" width="204" height="40" rx="4" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <text x="76" y="235" font-size="7" font-family="Courier Prime, monospace">EN ROUTE VERS</text>
    <text x="76" y="248" font-size="9.5" font-weight="700" font-family="Courier Prime, monospace">LA LUNE</text>
    <text x="268" y="248" text-anchor="end" font-size="8" font-family="Courier Prime, monospace">2 h 14 min 06 s</text>
    <rect x="76" y="253" width="192" height="5" fill="none" stroke="#1d1916" stroke-width="0.8" />
    <rect x="76" y="253" width="70" height="5" fill="#1d1916" />
    <!-- Instruments de bord. -->
    {#each [0, 1, 2] as i}<rect x={70 + i * 69} y="268" width="64" height="14" rx="2" fill="none" stroke="#1d1916" stroke-width="1" />{/each}
    <rect x="70" y="285" width="202" height="14" rx="2" fill="none" stroke="#1d1916" stroke-width="1" />
    <text x="74" y="294.5" font-size="6" font-family="Courier Prime, monospace">EN LIGNE · 3 en vol · 1 autour de la Terre</text>
    <!-- Voyants des blocs. -->
    {#each voyants as v}<Voyant x={v.x} y={v.y} r={7} />{/each}
    <path d="M 92 304 L 92 301 L 124 301 L 124 304" fill="none" stroke="#1d1916" stroke-width="0.6" />
    <rect x="132" y="352" width="80" height="11" fill="none" stroke="#1d1916" stroke-width="1" />
    <text x="172" y="360" text-anchor="middle" font-size="6.5" font-family="Courier Prime, monospace">N° SÉRIE ___-___</text>
    <!-- Chasse, téléscripteur. -->
    <rect x="70" y="369" width="204" height="20" rx="5" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <circle cx="82" cy="379" r="6.5" fill="url(#zone-rouge)" stroke="#1d1916" stroke-width="1" />
    <line x1="70" y1="398" x2="274" y2="398" stroke="#1d1916" stroke-width="0.8" stroke-dasharray="3 2" />
    <line x1="70" y1="408" x2="274" y2="408" stroke="#1d1916" stroke-width="0.8" stroke-dasharray="3 2" />

    <Repere x={129} y={12} tx={30} ty={12} n={1} />
    <Repere x={204} y={16} tx={316} ty={8} n={2} />
    <Repere x={242} y={18} tx={316} ty={24} n={3} />
    <Repere x={270} y={22} tx={316} ty={40} n={4} />
    <Repere x={110} y={40} tx={30} ty={40} n={5} />
    <Repere x={70} y={86} tx={30} ty={86} n={6} />
    <Repere x={76} y={132} tx={30} ty={132} n={7} />
    <Repere x={92} y={194} tx={30} ty={190} n={8} />
    <Repere x={252} y={156} tx={316} ty={156} n={9} />
    <Repere x={252} y={204} tx={316} ty={204} n={10} />
    <Repere x={268} y={232} tx={316} ty={232} n={11} />
    <Repere x={268} y={275} tx={316} ty={275} n={12} />
    <Repere x={85} y={320} tx={30} ty={320} n={13} />
    <Repere x={208} y={357} tx={316} ty={357} n={14} />
    <Repere x={76} y={379} tx={30} ty={379} n={15} />
    <Repere x={270} y={403} tx={316} ty={403} n={16} />
  </svg>
</Page>
