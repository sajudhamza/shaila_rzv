import { defineConfig } from 'vite'
import { resolve } from 'path'
import { shailaAdminPlugin } from './server/adminPlugin.js'

export default defineConfig({
  appType: 'mpa',
  plugins: [shailaAdminPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ammi: resolve(__dirname, 'desing-cms/ammi/index.html'),
        bungalow: resolve(__dirname, 'desing-cms/bungalow/index.html'),
        chotemiya: resolve(__dirname, 'desing-cms/chote-miya/index.html'),
        gupshup: resolve(__dirname, 'desing-cms/gupshup/index.html'),
        movie: resolve(__dirname, 'desing-cms/movie/index.html'),
      },
    },
  },
})
