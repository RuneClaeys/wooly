export default defineNuxtConfig({
   devtools: { enabled: true },
   modules: ['@sidebase/nuxt-auth', '@formkit/auto-animate/nuxt', '@nuxt/ui', '@nuxt/image', '@nuxtjs/google-fonts'],

   build: {
      transpile: ['trpc-nuxt'],
   },

   experimental: {
      typedPages: true,
   },

   sourcemap: true,

   debug: process.env.NODE_ENV !== 'production',

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

   googleFonts: {
      display: 'swap',
      download: true,
      families: {
         Poppins: true,
      },
   },
});
