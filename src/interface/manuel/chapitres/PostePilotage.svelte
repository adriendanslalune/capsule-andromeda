<script lang="ts">
  // I. Le poste de pilotage : planche du cockpit, organes numérotés (nomenclature à la page suivante).
  import Page from '../Page.svelte'
  import Bouton from '../schemas/Bouton.svelte'
  import Jauge from '../schemas/Jauge.svelte'
  import Motifs from '../schemas/Motifs.svelte'
  import Repere from '../schemas/Repere.svelte'
  import Voyant from '../schemas/Voyant.svelte'

  let { numero }: { numero: number } = $props()
  const voyants = Array.from({ length: 12 }, (_, i) => ({ x: 92 + (i % 6) * 32, y: 270 + Math.floor(i / 6) * 26 }))
</script>

<Page {numero} chapitre="I." titre="LE POSTE DE PILOTAGE">
  <p>Vue de face, depuis le siège du commissionnaire. Les numéros renvoient à la nomenclature (chapitre II).</p>
  <svg class="planche" viewBox="0 0 344 420" aria-label="Planche du poste de pilotage">
    <Motifs />
    <!-- Contour du poste. -->
    <rect x="62" y="4" width="220" height="412" rx="10" fill="none" stroke="#1d1916" stroke-width="1.6" />
    <!-- En-tête : nom, compteur, saison, son. -->
    <text x="72" y="22" font-size="11" font-weight="700" font-family="Courier Prime, monospace">C-58</text>
    <rect x="178" y="12" width="52" height="14" fill="none" stroke="#1d1916" stroke-width="1.2" />
    {#each [0, 1, 2, 3] as i}<line x1={178 + 13 * i} y1="12" x2={178 + 13 * i} y2="26" stroke="#1d1916" stroke-width="0.6" />{/each}
    <rect x="258" y="10" width="10" height="18" rx="5" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <!-- Hublot. -->
    <rect x="72" y="34" width="200" height="66" rx="18" fill="none" stroke="#1d1916" stroke-width="1.6" />
    <rect x="80" y="42" width="184" height="50" rx="12" fill="url(#zone-bleue)" stroke="#1d1916" stroke-width="1" />
    <text x="76" y="112" font-size="7.5" font-family="Courier Prime, monospace">● 1 en vol · 1 autour de la Terre</text>
    <!-- Console. -->
    <rect x="70" y="118" width="204" height="216" rx="8" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <rect x="78" y="124" width="50" height="18" rx="9" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <circle cx="119" cy="133" r="6" fill="#1d1916" />
    <text x="84" y="136" font-size="7" font-weight="700" font-family="Courier Prime, monospace">ON</text>
    <Jauge x={104} y={170} r={22} />
    <!-- Compas de cap. -->
    <circle cx="172" cy="170" r="22" fill="#f8f5ec" stroke="#1d1916" stroke-width="2" />
    {#each [0, 90, 180, 270] as a}
      {@const r = (a * Math.PI) / 180}
      <line x1={172 + Math.cos(r) * 16} y1={170 - Math.sin(r) * 16} x2={172 + Math.cos(r) * 20} y2={170 - Math.sin(r) * 20} stroke="#1d1916" stroke-width="1.4" />
      <text x={172 + Math.cos(r) * 10} y={172.5 - Math.sin(r) * 10} text-anchor="middle" font-size="5" font-family="Courier Prime, monospace">{a}</text>
    {/each}
    <path d="M 172 170 L 182 156 L 175 171 Z" fill="#1d1916" />
    <path d="M 172 147 l 3 5 h -6 Z" fill="#1d1916" />
    <circle cx="240" cy="170" r="22" fill="#f8f5ec" stroke="#1d1916" stroke-width="2" />
    <line x1="240" y1="170" x2="240" y2="154" stroke="#1d1916" stroke-width="1.8" />
    <line x1="240" y1="170" x2="252" y2="174" stroke="#1d1916" stroke-width="1.2" />
    <rect x="80" y="204" width="184" height="48" rx="4" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <text x="86" y="220" font-size="7.5" font-family="Courier Prime, monospace">EN ROUTE VERS</text>
    <text x="86" y="234" font-size="10" font-weight="700" font-family="Courier Prime, monospace">LA LUNE</text>
    <rect x="86" y="240" width="172" height="6" fill="none" stroke="#1d1916" stroke-width="0.8" />
    <rect x="86" y="240" width="60" height="6" fill="#1d1916" />
    {#each voyants as v}<Voyant x={v.x} y={v.y} r={7} />{/each}
    <path d="M 92 258 L 92 255 L 124 255 L 124 258" fill="none" stroke="#1d1916" stroke-width="0.6" />
    <rect x="132" y="318" width="80" height="12" fill="none" stroke="#1d1916" stroke-width="1" />
    <text x="172" y="327" text-anchor="middle" font-size="6.5" font-family="Courier Prime, monospace">N° SÉRIE ___-___</text>
    <!-- Chasse, téléscripteur, boutons. -->
    <rect x="70" y="340" width="204" height="24" rx="5" fill="none" stroke="#1d1916" stroke-width="1.2" />
    <circle cx="84" cy="352" r="8" fill="url(#zone-rouge)" stroke="#1d1916" stroke-width="1" />
    <line x1="70" y1="370" x2="274" y2="370" stroke="#1d1916" stroke-width="0.8" stroke-dasharray="3 2" />
    <line x1="70" y1="384" x2="274" y2="384" stroke="#1d1916" stroke-width="0.8" stroke-dasharray="3 2" />
    <Bouton x={102} y={400} r={9} largeur={58} texte="CARTE" />
    <Bouton x={172} y={400} r={9} largeur={58} texte="OFFICE" />
    <Bouton x={242} y={400} r={9} largeur={58} texte="MANUEL" />

    <Repere x={204} y={19} tx={316} ty={19} n={1} />
    <Repere x={263} y={19} tx={316} ty={40} n={2} />
    <Repere x={80} y={67} tx={30} ty={67} n={3} />
    <Repere x={76} y={110} tx={30} ty={110} n={4} />
    <Repere x={84} y={133} tx={30} ty={133} n={5} />
    <Repere x={90} y={180} tx={30} ty={175} n={6} />
    <Repere x={190} y={156} tx={316} ty={140} n={7} />
    <Repere x={258} y={176} tx={316} ty={176} n={8} />
    <Repere x={262} y={228} tx={316} ty={228} n={9} />
    <Repere x={85} y={276} tx={30} ty={276} n={10} />
    <Repere x={108} y={256} tx={30} ty={252} n={11} />
    <Repere x={208} y={324} tx={316} ty={324} n={12} />
    <Repere x={78} y={352} tx={30} ty={352} n={13} />
    <Repere x={270} y={377} tx={316} ty={377} n={14} />
    <Repere x={242} y={400} tx={316} ty={404} n={15} />
  </svg>
</Page>
