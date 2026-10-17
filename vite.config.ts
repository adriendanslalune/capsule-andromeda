/// <reference types="vitest/config" />
// Capsule Andromeda : publié sur …github.io/manuel-de-vol/
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/manuel-de-vol/',
  server: { host: true },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
