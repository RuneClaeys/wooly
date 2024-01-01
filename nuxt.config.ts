export default defineNuxtConfig({
   devtools: { enabled: true },
   modules: ['@sidebase/nuxt-auth', '@formkit/auto-animate/nuxt', '@nuxt/ui', '@nuxt/image'],

   build: {
      transpile: ['trpc-nuxt'],
   },

   experimental: {
      typedPages: true,
   },

   auth: {
      globalAppMiddleware: true,
      baseURL: process.env.AUHT_ORIGIN,
      provider: {
         type: 'authjs',
      },
   },

   colorMode: {
      preference: 'system',
   },
});
