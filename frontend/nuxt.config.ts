// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  
  alias: {
    '@shared': '../shared' 
  },

  // Zdejmujemy blokadę Vite na pliki spoza folderu frontend
  vite: {
    server: {
      fs: {
        allow: ['..']
      }
    }
  }
})