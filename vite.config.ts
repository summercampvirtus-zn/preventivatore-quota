import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

/**
 * GitHub Pages: il sito è servito sotto /nome-repo/.
 * In CI impostare VITE_BASE="/nome-repo/" (slash iniziale e finale consigliati).
 */
function viteBase(): string {
  const raw = process.env.VITE_BASE
  if (raw == null || raw === '') return '/'
  let b = raw.trim()
  if (!b.startsWith('/')) b = `/${b}`
  if (!b.endsWith('/')) b = `${b}/`
  return b
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: viteBase(),
})
