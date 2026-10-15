<script lang="ts">
  // I. Le poste de pilotage : planche du cockpit, organes numérotés (nomenclature à la page suivante).
  import Page from '../Page.svelte'
  import Motifs from '../schemas/Motifs.svelte'
  import Repere from '../schemas/Repere.svelte'
  import Voyant from '../schemas/Voyant.svelte'

  let { numero }: { numero: number } = $props()
  const voyants = Array.from({ length: 12 }, (_, i) => ({ x: 88 + (i % 6) * 33.5, y: 236 + Math.floor(i / 6) * 22 }))
  const onglets = ['NAVIG.', 'SOCIAL', 'COCKPIT', 'ATEL.', 'TROPH.']
  const encre = '#1d1916'
  const police = 'Courier Prime, monospace'
</script>

<Page {numero} chapitre="I." titre="LE POSTE DE PILOTAGE">
  <p>Vue de face, depuis le siège du commissionnaire. Les numéros renvoient à la nomenclature (chapitre II).</p>
  <svg class="planche" viewBox="0 0 344 424" aria-label="Planche du poste de pilotage">
    <Motifs />
    <rect x="62" y="4" width="220" height="416" rx="10" fill="none" stroke={encre} stroke-width="1.6" />
    <!-- Barre du haut : nom, compteur et saison, son, manuel. -->
    <text x="70" y="22" font-size="11" font-weight="700" font-family={police}>C-58</text>
    <rect x="182" y="10" width="44" height="12" fill="none" stroke={encre} stroke-width="1.2" />
    {#each [1, 2, 3] as i}<line x1={182 + 11 * i} y1="10" x2={182 + 11 * i} y2="22" stroke={encre} stroke-width="0.6" />{/each}
    <text x="226" y="28" text-anchor="end" font-size="4.5" font-family={police}>SAISON</text>
    <rect x="238" y="9" width="8" height="17" rx="4" fill="none" stroke={encre} stroke-width="1.2" />
    <rect x="254" y="9" width="20" height="18" rx="3" fill="none" stroke={encre} stroke-width="1.2" />
    <path d="M 264 13 q -3 -2 -7 -1 v 10 q 4 -1 7 1 q 3 -2 7 -1 v -10 q -4 -1 -7 1 z M 264 13 v 10" fill="none" stroke={encre} stroke-width="0.8" />
    <!-- Onglets. -->
    <line x1="62" y1="48" x2="282" y2="48" stroke={encre} stroke-width="1.6" />
    {#each onglets as o, i}
      {@const x = 66 + i * 43}
      <path d={i === 2 ? `M ${x} 48 V 31 Q ${x} 29 ${x + 3} 29 H ${x + 37} Q ${x + 40} 29 ${x + 40} 31 V 48` : `M ${x} 48 V 35 Q ${x} 33 ${x + 3} 33 H ${x + 37} Q ${x + 40} 33 ${x + 40} 35 V 48`}
        fill={i === 2 ? '#f8f5ec' : 'none'} stroke={encre} stroke-width={i === 2 ? 1.6 : 1} />
      <text x={x + 20} y="44" text-anchor="middle" font-size="5.5" font-weight="700" font-family={police}>{o}</text>
    {/each}
    <line x1="152" y1="48" x2="192" y2="48" stroke="#f8f5ec" stroke-width="2" />
    <circle cx="191" cy="30" r="4.5" fill={encre} />
    <text x="191" y="32" text-anchor="middle" font-size="5.5" font-weight="700" fill="#f8f5ec" font-family={police}>2</text>
    <!-- Hublot, avec l'écran de navigation posé à son pied. -->
    <line x1="62" y1="54" x2="282" y2="54" stroke={encre} stroke-width="1.2" />
    <rect x="66" y="58" width="212" height="86" rx="5" fill="url(#zone-bleue)" stroke={encre} stroke-width="1" />
    <path d="M 66 103 H 278 V 139 Q 278 144 273 144 H 71 Q 66 144 66 139 Z" fill={encre} />
    <line x1="62" y1="147" x2="282" y2="147" stroke={encre} stroke-width="1.2" />

    <text x="78" y="113" font-size="6" fill="#f8f5ec" font-family={police}>EN ROUTE VERS</text>
    <text x="78" y="125" font-size="9" font-weight="700" fill="#f8f5ec" font-family={police}>LA LUNE</text>
    <text x="266" y="125" text-anchor="end" font-size="8" fill="#f8f5ec" font-family={police}>02:14:06</text>
    <text x="78" y="133" font-size="5.5" fill="#f8f5ec" font-family={police}>Arrivée demain 18:39</text>
    <rect x="78" y="136" width="188" height="3.5" fill="none" stroke="#f8f5ec" stroke-width="0.6" />
    <rect x="78" y="136" width="70" height="3.5" fill="#f8f5ec" />

    <!-- Pupitre central : la radio (écran d'ondes, bouton, fréquence, ÉMETTRE) et la navigation (radar). -->
    <rect x="66" y="150" width="212" height="36" rx="4" fill="none" stroke={encre} stroke-width="0.8" />
    <text x="74" y="152.5" font-size="5" font-family={police}>RADIO · NAVIGATION</text>
    <rect x="72" y="156" width="88" height="15" rx="2" fill={encre} />
    <path d="M 75 163.5 q 3 -5 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0" fill="none" stroke="#f8f5ec" stroke-width="0.8" />
    <circle cx="80" cy="179" r="5.5" fill="#f8f5ec" stroke={encre} stroke-width="1.4" />
    <line x1="80" y1="179" x2="80" y2="175" stroke={encre} stroke-width="1.2" />
    <rect x="102" y="174.5" width="24" height="9" fill={encre} />
    <text x="114" y="181.5" text-anchor="middle" font-size="5.5" fill="#f8f5ec" font-family={police}>6,00</text>
    <circle cx="151" cy="179" r="5.5" fill="url(#zone-rouge)" stroke={encre} stroke-width="1.2" />
    <line x1="168" y1="155" x2="168" y2="184" stroke={encre} stroke-width="0.5" stroke-dasharray="2 1.5" />
    <circle cx="222" cy="168" r="15" fill={encre} />
    <circle cx="222" cy="168" r="8" fill="none" stroke="#f8f5ec" stroke-width="0.4" />
    <line x1="222" y1="168" x2="233" y2="158" stroke="#f8f5ec" stroke-width="0.8" stroke-dasharray="1 1.5" />
    <line x1="222" y1="168" x2="234" y2="165" stroke="#f8f5ec" stroke-width="1.2" stroke-dasharray="3 2" />
    <path d="M 0 -3 L 2.5 3 L 0 1.8 L -2.5 3 Z" fill="#f8f5ec" transform="translate(222 168) rotate(70)" />
    <text x="250" y="166" font-size="4.5" font-family={police}>NAVIGATION</text>
    <text x="250" y="173" font-size="5.5" font-weight="700" font-family={police}>LA LUNE</text>

    <g transform="translate(0 40)">
    <!-- Panneau PILOTAGE : trois petits cadrans, interrupteur MOTEUR. -->
    <rect x="66" y="149" width="212" height="53" rx="4" fill="none" stroke={encre} stroke-width="0.8" />
    <text x="74" y="151.5" font-size="5" font-family={police}>PILOTAGE</text>
    {#each [92, 132, 172] as x, k}
      <circle cx={x} cy="167" r="11" fill="#f8f5ec" stroke={encre} stroke-width="1.4" />
      <line x1={x} y1="167" x2={x + (k === 0 ? -6 : k === 1 ? 5 : 0)} y2={167 - (k === 2 ? 8 : 6)} stroke={encre} stroke-width="1.4" />
      <text x={x} y="186" text-anchor="middle" font-size="5" font-family={police}>{['KM/S', 'CAP', 'ARRIVÉE'][k]}</text>
    {/each}
    <rect x="200" y="155" width="68" height="30" rx="3" fill="url(#zone-rouge)" stroke={encre} stroke-width="1" />
    <rect x="206" y="159" width="56" height="16" rx="8" fill="#f8f5ec" stroke={encre} stroke-width="1.2" />
    <circle cx="254" cy="167" r="5.5" fill={encre} />
    <text x="212" y="170" font-size="6.5" font-weight="700" font-family={police}>ON</text>
    <rect x="72" y="192" width="200" height="6" fill="url(#zone-rouge)" stroke={encre} stroke-width="0.6" />

    <!-- Panneau BLOCS DU BORD : phrase d'état, voyants, plaque constructeur. -->
    <rect x="66" y="208" width="212" height="92" rx="4" fill="none" stroke={encre} stroke-width="0.8" />
    <text x="74" y="210.5" font-size="5" font-family={police}>BLOCS DU BORD</text>
    <circle cx="77" cy="220" r="3" fill={encre} />
    <text x="84" y="222.5" font-size="6.5" font-weight="700" font-family={police}>2 avaries : touchez un voyant rouge.</text>
    {#each voyants as v}<Voyant x={v.x} y={v.y} r={7} />{/each}
    <path d="M 88 229 L 88 226 L 121.5 226 L 121.5 229" fill="none" stroke={encre} stroke-width="0.6" />
    <rect x="132" y="282" width="80" height="11" fill="none" stroke={encre} stroke-width="1" />
    <text x="172" y="290" text-anchor="middle" font-size="6.5" font-family={police}>N° SÉRIE ___-___</text>

    <!-- Mission, visiteur, poste radio, transmissions, journal. -->
    <rect x="66" y="306" width="104" height="26" rx="3" fill="none" stroke={encre} stroke-width="1.2" />
    <text x="72" y="314" font-size="5" font-family={police}>MISSION</text>
    <text x="72" y="325" font-size="7.5" font-weight="700" font-family={police}>MARS · 40 CR</text>
    <rect x="174" y="306" width="104" height="26" rx="3" fill={encre} />
    <circle cx="189" cy="319" r="8" fill="url(#zone-verte)" stroke="#f8f5ec" stroke-width="1" />
    <text x="203" y="322" font-size="7" font-weight="700" fill="#f8f5ec" font-family={police}>VISITEUR</text>
    </g>
    <g transform="translate(0 24)">
    <rect x="66" y="351" width="212" height="22" rx="3" fill={encre} />
    <text x="72" y="359" font-size="5" fill="#f8f5ec" font-family={police}>TRANSMISSIONS · 9 EN LIGNE</text>
    <text x="72" y="368" font-size="5.5" fill="#f8f5ec" font-family={police}>20:49 ZÉPHYR  AVARIE À BORD, JE RALENTIS.</text>
    <rect x="66" y="376" width="212" height="16" fill="none" stroke={encre} stroke-width="0.8" />
    <line x1="74" y1="384" x2="262" y2="384" stroke={encre} stroke-width="0.6" stroke-dasharray="3 2" />
    </g>

    <Repere x={204} y={16} tx={316} ty={8} n={1} />
    <Repere x={242} y={18} tx={316} ty={24} n={2} />
    <Repere x={270} y={22} tx={316} ty={40} n={3} />
    <Repere x={110} y={40} tx={30} ty={40} n={4} />
    <Repere x={70} y={72} tx={30} ty={72} n={5} />
    <Repere x={74} y={118} tx={30} ty={118} n={6} />
    <Repere x={74} y={163} tx={30} ty={160} n={7} />
    <Repere x={236} y={160} tx={316} ty={156} n={8} />
    <Repere x={82} y={207} tx={30} ty={204} n={9} />
    <Repere x={266} y={216} tx={316} ty={216} n={10} />
    <Repere x={81} y={280} tx={30} ty={280} n={11} />
    <Repere x={208} y={327} tx={316} ty={327} n={12} />
    <Repere x={70} y={361} tx={30} ty={361} n={13} />
    <Repere x={274} y={359} tx={316} ty={356} n={14} />
    <Repere x={274} y={386} tx={316} ty={386} n={15} />
    <Repere x={70} y={408} tx={30} ty={408} n={16} />
  </svg>
</Page>
