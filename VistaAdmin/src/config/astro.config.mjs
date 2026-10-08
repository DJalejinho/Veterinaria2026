import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'static',
  srcDir: './src/html',
  publicDir: './src/html/public',
  cacheDir: './dist/.astro',
  outDir: './dist/html'
})
