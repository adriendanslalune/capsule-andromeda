<script lang="ts">
  // Volet du manuel : lecteur page par page des PDF du manuel (pdf.js, chargé seulement à l'ouverture).
  import { jeu } from '../jeu.svelte'
  import { PAGES_MANUEL } from './pages-manuel'

  let toile: HTMLCanvasElement
  let cadre: HTMLDivElement
  let erreur = $state<string | null>(null)
  let chargement = $state(true)

  // Documents déjà chargés (un par fichier PDF).
  type Document = { getPage(n: number): Promise<any> }
  const documents = new Map<string, Promise<Document>>()
  let pdfjs: Promise<any> | null = null

  async function bibliotheque() {
    pdfjs ??= (async () => {
      const lib = await import('pdfjs-dist')
      const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
      lib.GlobalWorkerOptions.workerSrc = worker
      return lib
    })()
    return pdfjs
  }

  async function document(fichier: string): Promise<Document> {
    if (!documents.has(fichier)) documents.set(fichier, bibliotheque().then((lib) => lib.getDocument({ url: fichier }).promise))
    return documents.get(fichier)!
  }

  let rendu: { cancel(): void } | null = null
  async function afficher(index: number) {
    chargement = true
    erreur = null
    try {
      const p = PAGES_MANUEL[index]
      const page = await (await document(p.fichier)).getPage(p.page)
      const largeur = cadre.clientWidth
      const base = page.getViewport({ scale: 1 })
      const echelle = (largeur / base.width) * (window.devicePixelRatio || 1)
      const vue = page.getViewport({ scale: echelle })
      toile.width = vue.width
      toile.height = vue.height
      toile.style.width = `${largeur}px`
      rendu?.cancel()
      const tache = page.render({ canvas: toile, viewport: vue })
      rendu = tache
      await tache.promise
      cadre.scrollTop = 0
    } catch (e) {
      if ((e as { name?: string }).name !== 'RenderingCancelledException') {
        console.error('Manuel :', e)
        erreur = 'Impossible d’ouvrir cette page du manuel.'
      }
    } finally {
      chargement = false
    }
  }

  $effect(() => { afficher(jeu.pageManuel) })

  const aller = (d: number) => (jeu.pageManuel = Math.max(0, Math.min(PAGES_MANUEL.length - 1, jeu.pageManuel + d)))
</script>

<div class="manuel">
  <div class="page" bind:this={cadre}>
    <canvas bind:this={toile} aria-label={`Page ${jeu.pageManuel + 1} du manuel`}></canvas>
    {#if chargement}<p class="info">Chargement…</p>{/if}
    {#if erreur}<p class="info">{erreur}</p>{/if}
  </div>
  <nav>
    <button onclick={() => aller(-1)} disabled={jeu.pageManuel === 0}>‹ PRÉCÉDENTE</button>
    <span>{jeu.pageManuel + 1} / {PAGES_MANUEL.length}</span>
    <button onclick={() => aller(1)} disabled={jeu.pageManuel === PAGES_MANUEL.length - 1}>SUIVANTE ›</button>
  </nav>
</div>

<style>
  .manuel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 8px 0 0;
  }
  .page {
    position: relative;
    flex: 1;
    overflow-y: auto;
    margin: 0 10px;
    background: #fff;
  }
  canvas {
    display: block;
  }
  .info {
    position: absolute;
    top: 40%;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 16px;
  }
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 14px 18px;
  }
  nav button {
    min-height: 44px;
    padding: 0 14px;
    border-radius: 12px;
    border: 2px solid var(--couleur-encre);
    background: none;
    font-weight: 700;
    letter-spacing: 1px;
  }
  nav button:disabled {
    opacity: 0.3;
  }
  nav span {
    font-family: var(--police-chiffres);
  }
</style>
