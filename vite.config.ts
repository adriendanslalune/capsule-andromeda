/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  // Le jeu est publié sur GitHub Pages à l'adresse …github.io/manuel-de-vol/
  base: '/manuel-de-vol/',
  plugins: [svelte()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
