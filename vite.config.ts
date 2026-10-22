/// <reference types="vitest/config" />
// Capsule Andromeda : publié sur GitHub Pages, à l'adresse …github.io/<nom du dépôt>/.
// Adresses relatives (base './') : le site marche quel que soit le nom du dépôt.
// planche.html, maquette-reparation.html, maquette-interface.html, maquette-symboles.html, maquette-carte.html, maquette-fenetres.html, maquette-tableau.html : planches et maquettes de présentation, pour validation par Adrien.
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

/** Version affichée dans le jeu : le commit construit (pour vérifier sur le téléphone que la mise à jour est arrivée). */
const version = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'locale' }
})()

export default defineConfig({
  base: './',
  define: { __VERSION__: JSON.stringify(version) },
  // version.json : le jeu le relit pour savoir si une nouvelle version est en ligne (mise à jour automatique).
  plugins: [{
    name: 'version',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version }) })
    },
  }],
  server: { host: true },
  build: {
    rollupOptions: { input: { index: 'index.html', planche: 'planche.html', 'maquette-reparation': 'maquette-reparation.html', 'maquette-interface': 'maquette-interface.html', 'maquette-symboles': 'maquette-symboles.html', 'maquette-carte': 'maquette-carte.html', 'maquette-fenetres': 'maquette-fenetres.html', 'maquette-tableau': 'maquette-tableau.html' } },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
