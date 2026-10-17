/// <reference types="vitest/config" />
// Capsule Andromeda : publié sur GitHub Pages, à l'adresse …github.io/<nom du dépôt>/.
// Adresses relatives (base './') : le site marche quel que soit le nom du dépôt.
// planche.html : planches de présentation des dessins, pour validation par Adrien.
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: { host: true },
  build: {
    rollupOptions: { input: { index: 'index.html', planche: 'planche.html' } },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
