<script lang="ts">
  // Journal de bord en entier : la bande du téléscripteur déroulée (100 lignes au plus), la plus récente en haut,
  // avec la date à chaque changement de jour.
  import { dateLocale, heureLocale } from '../format'
  import { jeu } from '../jeu.svelte'

  const jours = $derived.by(() => {
    const groupes: { jour: string; lignes: typeof jeu.telex }[] = []
    for (const l of [...jeu.telex].reverse()) {
      const jour = dateLocale(l.t)
      const dernier = groupes.at(-1)
      if (dernier?.jour === jour) dernier.lignes.push(l)
      else groupes.push({ jour, lignes: [l] })
    }
    return groupes
  })
</script>

<div class="journal">
  <section class="bande">
    <div class="bord">— DERNIÈRE LIGNE —</div>
    {#each jours as g}
      <div class="jour">{g.jour.toUpperCase()}</div>
      {#each g.lignes as l}
        <div><span class="heure" class:alerte={l.alerte}>{heureLocale(l.t)}</span> {l.texte}</div>
      {/each}
    {:else}
      <div class="discret">Bande vierge.</div>
    {/each}
    <div class="bord">— DÉBUT DE BANDE —</div>
  </section>
</div>

<style>
  .journal {
    flex: 1;
    overflow-y: auto;
    padding: 10px 16px 24px;
  }
  .bande {
    padding: 6px 22px;
    border: 1px solid var(--couleur-encre);
    --trou: radial-gradient(circle, var(--couleur-fond) 0 2.4px, var(--couleur-encre) 2.9px 3.4px, transparent 3.8px);
    background: var(--trou) left 4px top 4px / 10px 14px repeat-y, var(--trou) right 4px top 4px / 10px 14px repeat-y,
      linear-gradient(90deg, transparent 17px, rgba(42, 30, 23, 0.35) 17px 18px, transparent 18px calc(100% - 18px), rgba(42, 30, 23, 0.35) calc(100% - 18px) calc(100% - 17px), transparent calc(100% - 17px)),
      var(--couleur-papier);
    font-family: var(--police-machine);
    font-size: 13px;
    line-height: 1.45;
  }
  .bord {
    text-align: center;
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--couleur-texte-eteint);
  }
  .jour {
    margin: 6px 0 2px;
    border-bottom: 1px dashed var(--couleur-encre-discrete);
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--couleur-encre-discrete);
  }
  .heure {
    color: var(--couleur-texte-discret);
  }
  .heure.alerte {
    color: var(--cerise);
  }
</style>
