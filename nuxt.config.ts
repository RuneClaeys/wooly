import { app } from './config/app.config';
import { auth } from './config/auth.config';
import { dayjs } from './config/dayjs.config';
import { googleFonts } from './config/google-fonts.config';
import { i18n } from './config/i18n.config';
import { pwa } from './config/pwa.config';

export default defineNuxtConfig({
   devtools: { enabled: true },

   ssr: false,

   future: {
      compatibilityVersion: 4,
   },

   modules: [
      '@vueuse/nuxt',
      '@sidebase/nuxt-auth',
      '@formkit/auto-animate/nuxt',
      '@nuxt/ui',
      '@nuxt/image',
      '@nuxtjs/google-fonts',
      '@vite-pwa/nuxt',
      '@nuxtjs/i18n',
      'dayjs-nuxt',
   ],

   css: ['~/assets/css/tailwind.css'],

   build: {
      transpile: ['trpc-nuxt'],
   },

   routeRules: {
      '/api/**': { cors: true },
   },

   auth,
   googleFonts,
   app,
   pwa,
   i18n,
   dayjs,
});
