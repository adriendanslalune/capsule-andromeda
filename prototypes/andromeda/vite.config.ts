/// <reference types="vitest/config" />
// Prototype « Capsule Andromeda » : construit à part, publié à côté du jeu, dans …github.io/manuel-de-vol/andromeda/
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const ici = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: ici,
  base: '/manuel-de-vol/andromeda/',
  build: {
    outDir: fileURLToPath(new URL('../../dist/andromeda', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        carte2d: fileURLToPath(new URL('./carte2d.html', import.meta.url)),
      },
    },
  },
  server: { host: true },
  test: {
    root: ici,
    include: ['tests/**/*.test.ts'],
  },
})
