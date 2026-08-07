// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // 3000 is taken by Supabase Studio, 3001 by PostgREST, 3333 by the API.
  devServer: { port: 3100 },

  future: { compatibilityVersion: 4 },

  modules: ['@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  typescript: { strict: true, typeCheck: false },

  runtimeConfig: {
    // Server-only secrets go here (override with NUXT_* env vars).

    public: {
      // Override with NUXT_PUBLIC_API_BASE
      apiBase: 'http://localhost:3333/api/v1',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'ChunithmQueue',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Chunithm queue web app' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
})
