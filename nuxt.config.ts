import { app } from './config/app.config';
import { auth } from './config/auth.config';
import { colorMode } from './config/color-mode.config';
import { googleFonts } from './config/google-fonts.config';
import { pwa } from './config/pwa.config';

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

   auth,
   colorMode,
   googleFonts,
   app,
   pwa,
});
