<script lang="ts">
  // V. Procédures du bloc propulsion : 1 surchauffe (TU-1), 2 défaut de pression (CH-1).
  import { PROPULSION } from '../../../donnees/modules'
  import Page from '../Page.svelte'

  let { numero }: { numero: number } = $props()
  const P = PROPULSION
  const branche = (titre: string, cran: number) => [titre, `Placer R sur ${cran}`, 'Presser P une fois', `Replacer R sur ${P.moletteDepart}`]
</script>

<Page {numero} chapitre="V." titre="PROCÉDURES DE PROPULSION">
  <h3>Procédure 1 — Surchauffe de tuyère (TU-1)</h3>
  <p>Symptôme : V-1 allumé fixe. L’aiguille de T-2 monte en zone rouge.</p>
  <ol>
    <li>Abaisser L-A. L’injection est coupée ; la vitesse chute fortement.</li>
    <li>Surveiller T-2. Attendre que l’aiguille descende <b>sous la graduation {P.temperatureReparation}</b>.</li>
    <li>Relever L-A.</li>
  </ol>
  <p class="discret">Relevé trop tôt, L-A ne règle rien : la surchauffe reprend quelques secondes plus tard.</p>

  <h3>Procédure 2 — Défaut de pression (CH-1)</h3>
  <p>Symptôme : V-2 clignote, alarme sonore. Lire M-1, puis suivre la branche correspondante.</p>
  <svg class="planche" viewBox="0 0 344 196" aria-label="Organigramme de la procédure 2">
    <rect x="112" y="2" width="120" height="22" fill="#f8f5ec" stroke="#1d1916" stroke-width="1" />
    <text x="172" y="17" text-anchor="middle" font-size="10" font-family="Courier Prime, monospace">Aiguille de M-1 ?</text>
    <path d="M 150 24 L 82 52 M 194 24 L 262 52" stroke="#1d1916" stroke-width="1" />
    <text x="14" y="40" font-size="9" font-weight="700" font-family="Courier Prime, monospace">zone rouge</text>
    <text x="330" y="40" text-anchor="end" font-size="9" font-weight="700" font-family="Courier Prime, monospace">zone bleue</text>
    {#each [{ cases: branche('Surpression', P.reglageSurpression), x: 12 }, { cases: branche('Sous-pression', P.reglageSousPression), x: 196 }] as { cases, x }}
      {#each cases as texte, i}
        <rect {x} y={54 + i * 36} width="136" height="26" fill="#f8f5ec" stroke="#1d1916" stroke-width={i === 0 ? 1.6 : 1} />
        <text x={x + 68} y={71 + i * 36} text-anchor="middle" font-size="10" font-weight={i === 0 ? 700 : 400} font-family="Courier Prime, monospace">{texte}</text>
        {#if i < 3}
          <line x1={x + 68} y1={80 + i * 36} x2={x + 68} y2={90 + i * 36} stroke="#1d1916" stroke-width="1" />
          <path d={`M ${x + 65} ${86 + i * 36} L ${x + 68} ${90 + i * 36} L ${x + 71} ${86 + i * 36}`} fill="none" stroke="#1d1916" stroke-width="1" />
        {/if}
      {/each}
    {/each}
  </svg>
  <p class="discret">
    Toute pression sur P hors procédure provoque une purge à vide et une perte de pression. Ne pas oublier de replacer
    R sur {P.moletteDepart} : laissée sur {P.reglageSurpression}, la molette fait retomber la chambre en sous-pression.
  </p>
</Page>
