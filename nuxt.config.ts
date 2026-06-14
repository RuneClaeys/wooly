import { app } from './config/app.config';
import { auth } from './config/auth.config';
import { colorMode } from './config/color-mode.config';
import { googleFonts } from './config/google-fonts.config';
import { i18n } from './config/i18n.config';
import { pwa } from './config/pwa.config';

export default defineNuxtConfig({
   ssr: false,

   vite: {
      optimizeDeps: {
         include: [
            '@vue/devtools-core',
            '@vue/devtools-kit',
            'dayjs',
            'dayjs/locale/en',
            'dayjs/locale/nl',
            'dayjs/plugin/relativeTime',
            'dayjs/plugin/updateLocale',
            'dayjs/plugin/utc',
         ],
      },
   },

   css: ['~/assets/css/main.css'],

   devtools: { enabled: true },

   modules: [
      '@sidebase/nuxt-auth',
      '@formkit/auto-animate/nuxt',
      '@nuxt/ui',
      '@nuxt/image',
      '@nuxtjs/google-fonts',
      '@vueuse/nuxt',
      '@vite-pwa/nuxt',
      '@nuxtjs/i18n',
      'dayjs-nuxt',
   ],

   build: {
      transpile: ['trpc-nuxt'],
   },

   experimental: {
      typedPages: true,
   },

   routeRules: {
      '/api/**': { cors: true },
   },

   auth,
   colorMode,
   googleFonts,
   app,
   pwa,
   i18n,

   dayjs: {
      locales: ['en', 'nl'],
      defaultLocale: 'en',
   },
});
