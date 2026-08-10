// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // 3000 is taken by Supabase Studio, 3001 by PostgREST, 3333 by the API.
  devServer: { host: '0.0.0.0', port: 3100 },

  vite: {
    server: {
      allowedHosts: true,
    },
  },

  future: { compatibilityVersion: 4 },

  modules: ['@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  typescript: { strict: true, typeCheck: false },

  routeRules: {
    '/api/**': { proxy: 'http://localhost:3333/api/**' },
  },

  runtimeConfig: {
    /**
     * Base URL the *Nitro server* uses during SSR. Override with
     * NUXT_API_BASE_SERVER.
     *
     * In production the browser talks to https://chunithm-api.novaseele.com,
     * but the server must not: that address resolves to Cloudflare, so every
     * server-rendered page would leave the VPS, cross the internet, and come
     * back in through nginx to reach a process listening on the same machine.
     * Slower, and it makes SSR depend on the CDN being reachable from inside
     * the box. Loopback keeps it a local call.
     */
    apiBaseServer: 'http://127.0.0.1:3333/api/v1',

    public: {
      // What the browser calls. Override with NUXT_PUBLIC_API_BASE — in
      // production that is the absolute chunithm-api URL.
      apiBase: '/api/v1',
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
      script: [
        {
          // Runs before first paint so an explicitly chosen theme does not
          // flash the system one first. The server cannot know the choice —
          // it lives in localStorage — so this is the only place it can
          // happen without a visible swap.
          innerHTML:
            "try{var t=localStorage.getItem('chunithmqueue:theme');"
            + "if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}",
          tagPriority: 'critical',
        },
      ],
    },
  },
})
