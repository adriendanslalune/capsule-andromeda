/// <reference types="vitest/config" />
// Capsule Andromeda : publié sur GitHub Pages, à l'adresse …github.io/<nom du dépôt>/.
// Adresses relatives (base './') : le site marche quel que soit le nom du dépôt.
// planche.html : planches de présentation des dessins, pour validation par Adrien.
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

/** Version affichée dans le jeu : le commit construit (pour vérifier sur le téléphone que la mise à jour est arrivée). */
const version = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'locale' }
})()

export default defineConfig({
  base: './',
  define: { __VERSION__: JSON.stringify(version) },
  server: { host: true },
  build: {
    rollupOptions: { input: { index: 'index.html', planche: 'planche.html' } },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
