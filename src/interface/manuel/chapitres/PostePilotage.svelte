<script lang="ts">
  // I. Le poste de pilotage : planche du cockpit, organes numérotés (nomenclature à la page suivante).
  import Page from '../Page.svelte'
  import Motifs from '../schemas/Motifs.svelte'
  import Repere from '../schemas/Repere.svelte'
  import Voyant from '../schemas/Voyant.svelte'

  let { numero }: { numero: number } = $props()
  const voyants = Array.from({ length: 12 }, (_, i) => ({ x: 88 + (i % 6) * 33.5, y: 246 + Math.floor(i / 6) * 21 }))
  const onglets = ['NAVIG.', 'SOCIAL', 'COCKPIT', 'ATEL.', 'TROPH.']
  const encre = '#1d1916'
  const papier = '#f8f5ec'
  const police = 'Courier Prime, monospace'
</script>

<Page {numero} chapitre="I." titre="LE POSTE DE PILOTAGE">
  <p>Vue de face, depuis le siège du commissionnaire. Les numéros renvoient à la nomenclature (chapitre II).</p>
  <svg class="planche" viewBox="0 0 344 410" aria-label="Planche du poste de pilotage">
    <Motifs />
    <rect x="62" y="4" width="220" height="402" rx="10" fill="none" stroke={encre} stroke-width="1.6" />
    <!-- Barre du haut : nom, compteur et saison, son, manuel. -->
    <text x="70" y="20" font-size="11" font-weight="700" font-family={police}>C-58</text>
    <rect x="182" y="9" width="44" height="12" fill="none" stroke={encre} stroke-width="1.2" />
    {#each [1, 2, 3] as i}<line x1={182 + 11 * i} y1="9" x2={182 + 11 * i} y2="21" stroke={encre} stroke-width="0.6" />{/each}
    <rect x="238" y="8" width="8" height="15" rx="4" fill="none" stroke={encre} stroke-width="1.2" />
    <rect x="254" y="7" width="20" height="17" rx="3" fill="none" stroke={encre} stroke-width="1.2" />
    <path d="M 264 11 q -3 -2 -7 -1 v 10 q 4 -1 7 1 q 3 -2 7 -1 v -10 q -4 -1 -7 1 z M 264 11 v 10" fill="none" stroke={encre} stroke-width="0.8" />
    <!-- Barre de bord : trois petits cadrans, interrupteur MOTEUR. -->
    <rect x="66" y="27" width="212" height="15" rx="3" fill={encre} />
    {#each [76, 116, 156] as x, k}
      <circle cx={x} cy="34.5" r="5" fill={k === 1 ? encre : papier} stroke={papier} stroke-width="0.8" />
      <line x1={x} y1="34.5" x2={x + (k === 0 ? -3 : k === 1 ? 2.5 : 0)} y2={34.5 - (k === 2 ? 4 : 3)} stroke={k === 1 ? papier : encre} stroke-width="1" />
      <text x={x + 8} y="37" font-size="5.5" fill={papier} font-family={police}>{['13,5', '265°', '05:00'][k]}</text>
    {/each}
    <rect x="216" y="29" width="58" height="11" rx="2" fill="url(#zone-rouge)" stroke={papier} stroke-width="0.6" />
    <rect x="219" y="31" width="16" height="7" rx="3.5" fill={papier} stroke={encre} stroke-width="0.8" />
    <circle cx="231.5" cy="34.5" r="2.5" fill={encre} />
    <rect x="238" y="31" width="33" height="7" fill={encre} />
    <text x="254.5" y="36.5" text-anchor="middle" font-size="4.5" fill={papier} font-family={police}>MOTEUR ON</text>
    <!-- Onglets. -->
    <line x1="62" y1="64" x2="282" y2="64" stroke={encre} stroke-width="1.6" />
    {#each onglets as o, i}
      {@const x = 66 + i * 43}
      <path d={i === 2 ? `M ${x} 64 V 47 Q ${x} 45 ${x + 3} 45 H ${x + 37} Q ${x + 40} 45 ${x + 40} 47 V 64` : `M ${x} 64 V 51 Q ${x} 49 ${x + 3} 49 H ${x + 37} Q ${x + 40} 49 ${x + 40} 51 V 64`}
        fill={i === 2 ? papier : 'none'} stroke={encre} stroke-width={i === 2 ? 1.6 : 1} />
      <text x={x + 20} y="60" text-anchor="middle" font-size="5.5" font-weight="700" font-family={police}>{o}</text>
    {/each}
    <line x1="152" y1="64" x2="192" y2="64" stroke={papier} stroke-width="2" />
    <circle cx="191" cy="46" r="4.5" fill={encre} />
    <text x="191" y="48" text-anchor="middle" font-size="5.5" font-weight="700" fill={papier} font-family={police}>2</text>
    <!-- Hublot, avec l'écran de navigation posé à son pied. -->
    <rect x="66" y="70" width="212" height="82" rx="5" fill="url(#zone-bleue)" stroke={encre} stroke-width="1" />
    <path d="M 66 113 H 278 V 147 Q 278 152 273 152 H 71 Q 66 152 66 147 Z" fill={encre} opacity="0.8" />
    <text x="78" y="122" font-size="6" fill={papier} font-family={police}>EN ROUTE VERS</text>
    <text x="78" y="134" font-size="9" font-weight="700" fill={papier} font-family={police}>LA LUNE</text>
    <text x="266" y="134" text-anchor="end" font-size="8" fill={papier} font-family={police}>02:14:06</text>
    <text x="78" y="142" font-size="5.5" fill={papier} font-family={police}>Arrivée demain 18:39</text>
    <rect x="78" y="145" width="188" height="3" fill="none" stroke={papier} stroke-width="0.6" />
    <rect x="78" y="145" width="70" height="3" fill={papier} />
    <!-- Pupitre : la radio (écran, boutons GROS et FIN, ÉMETTRE, − fréquence +, haut-parleur) et le radar. -->
    <rect x="66" y="158" width="212" height="58" rx="4" fill="none" stroke={encre} stroke-width="0.8" />
    <text x="74" y="160.5" font-size="5" font-family={police}>RADIO · NAVIGATION</text>
    <rect x="72" y="165" width="96" height="17" rx="2" fill={encre} />
    <path d="M 75 173.5 q 3 -5 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0" fill="none" stroke={papier} stroke-width="0.8" />
    <circle cx="80" cy="192" r="6" fill={papier} stroke={encre} stroke-width="1.4" />
    <circle cx="103" cy="192" r="4.5" fill={papier} stroke={encre} stroke-width="1.2" />
    <circle cx="158" cy="192" r="6" fill="url(#zone-rouge)" stroke={encre} stroke-width="1.2" />
    <rect x="72" y="202" width="12" height="9" rx="1.5" fill="none" stroke={encre} stroke-width="1" />
    <rect x="88" y="202" width="28" height="9" fill={encre} />
    <text x="102" y="208.5" text-anchor="middle" font-size="5.5" fill={papier} font-family={police}>6,00</text>
    <rect x="120" y="202" width="12" height="9" rx="1.5" fill="none" stroke={encre} stroke-width="1" />
    <rect x="136" y="202" width="12" height="9" rx="1.5" fill="url(#zone-verte)" stroke={encre} stroke-width="1" />
    <line x1="176" y1="164" x2="176" y2="212" stroke={encre} stroke-width="0.5" stroke-dasharray="2 1.5" />
    <circle cx="226" cy="183" r="21" fill={encre} />
    <circle cx="226" cy="183" r="11" fill="none" stroke={papier} stroke-width="0.4" />
    <path d="M 226 183 L 247 183 A 21 21 0 0 0 242 169.5 Z" fill={papier} opacity="0.35" />
    <line x1="226" y1="183" x2="240" y2="172" stroke={papier} stroke-width="0.8" stroke-dasharray="1 1.5" />
    <line x1="226" y1="183" x2="242" y2="179" stroke={papier} stroke-width="1.2" stroke-dasharray="3 2" />
    <path d="M 0 -3 L 2.5 3 L 0 1.8 L -2.5 3 Z" fill={papier} transform="translate(226 183) rotate(70)" />
    <text x="226" y="212" text-anchor="middle" font-size="5.5" font-weight="700" font-family={police}>LA LUNE</text>

    <!-- Panneau BLOCS DU BORD : phrase d'état, voyants, plaque constructeur. -->
    <rect x="66" y="222" width="212" height="82" rx="4" fill="none" stroke={encre} stroke-width="0.8" />
    <text x="74" y="224.5" font-size="5" font-family={police}>BLOCS DU BORD</text>
    <circle cx="77" cy="231" r="3" fill={encre} />
    <text x="84" y="233.5" font-size="6.5" font-weight="700" font-family={police}>2 avaries : touchez un voyant rouge.</text>
    {#each voyants as v}<Voyant x={v.x} y={v.y} r={7} />{/each}
    <rect x="132" y="287" width="80" height="11" fill="none" stroke={encre} stroke-width="1" />
    <text x="172" y="295" text-anchor="middle" font-size="6.5" font-family={police}>N° SÉRIE ___-___</text>

    <!-- Mission, transmissions, journal. -->
    <rect x="66" y="310" width="212" height="22" rx="3" fill="none" stroke={encre} stroke-width="1.2" />
    <text x="72" y="318" font-size="5" font-family={police}>MISSION</text>
    <text x="72" y="328" font-size="7.5" font-weight="700" font-family={police}>MARS · 40 CR</text>
    <rect x="66" y="336" width="212" height="22" rx="3" fill={encre} />
    <text x="72" y="344" font-size="5" fill={papier} font-family={police}>TRANSMISSIONS · 9 EN LIGNE</text>
    <text x="72" y="353" font-size="5.5" fill={papier} font-family={police}>20:49 ZÉPHYR  AVARIE À BORD, JE RALENTIS.</text>
    <rect x="66" y="362" width="212" height="16" fill="none" stroke={encre} stroke-width="0.8" />
    <line x1="74" y1="370" x2="262" y2="370" stroke={encre} stroke-width="0.6" stroke-dasharray="3 2" />

    <Repere x={204} y={15} tx={316} ty={8} n={1} />
    <Repere x={242} y={16} tx={316} ty={20} n={2} />
    <Repere x={270} y={16} tx={316} ty={32} n={3} />
    <Repere x={82} y={34.5} tx={30} ty={30} n={4} />
    <Repere x={268} y={40} tx={316} ty={46} n={5} />
    <Repere x={110} y={56} tx={30} ty={56} n={6} />
    <Repere x={70} y={88} tx={30} ty={88} n={7} />
    <Repere x={74} y={128} tx={30} ty={128} n={8} />
    <Repere x={74} y={173} tx={30} ty={172} n={9} />
    <Repere x={246} y={190} tx={316} ty={190} n={10} />
    <Repere x={81} y={262} tx={30} ty={262} n={11} />
    <Repere x={208} y={292} tx={316} ty={292} n={12} />
    <Repere x={70} y={321} tx={30} ty={321} n={13} />
    <Repere x={274} y={347} tx={316} ty={347} n={14} />
    <Repere x={70} y={370} tx={30} ty={370} n={15} />
  </svg>
</Page>
