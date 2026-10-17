/// <reference types="vitest/config" />
// Capsule Andromeda : publié sur GitHub Pages, à l'adresse …github.io/<nom du dépôt>/.
// Adresses relatives (base './') : le site marche quel que soit le nom du dépôt.
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: { host: true },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
