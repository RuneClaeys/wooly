export default defineNuxtConfig({
   devtools: { enabled: true },
   modules: [
      '@sidebase/nuxt-auth',
      '@formkit/auto-animate/nuxt',
      '@nuxt/ui',
      '@nuxt/image',
      '@nuxtjs/google-fonts',
      '@vueuse/nuxt',
      '@vite-pwa/nuxt',
   ],

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

   app: {
      head: {
         link: [
            {
               rel: 'apple-touch-icon',
               sizes: '180x180',
               href: '/apple-touch-icon.png',
            },
            {
               rel: 'icon',
               type: 'image/png',
               sizes: '32x32',
               href: '/favicon-32x32.png',
            },
            {
               rel: 'icon',
               type: 'image/png',
               sizes: '16x16',
               href: '/favicon-16x16.png',
            },
            {
               rel: 'mask-icon',
               href: '/safari-pinned-tab.svg',
               color: '#f472b6',
            },
         ],
         meta: [
            {
               name: 'msapplication-TileColor',
               content: '#ffffff',
            },
            {
               name: 'theme-color',
               content: '#ffffff',
            },
         ],
      },
   },

   pwa: {
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      workbox: {
         globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
         name: 'Wooly',
         short_name: 'Wooly',
         description: 'Wooly is an app to keep track of your knitting and crocheting projects.',
         lang: 'en',
         theme_color: '#f472b6',
         background_color: '#ffffff',
         display: 'standalone',
         icons: [
            {
               src: '/android-chrome-192x192.png',
               sizes: '192x192',
               type: 'image/png',
            },
            {
               src: '/android-chrome-512x512.png',
               sizes: '512x512',
               type: 'image/png',
            },
         ],
      },
   },
});
