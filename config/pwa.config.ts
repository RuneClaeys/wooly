import type { NuxtConfig } from 'nuxt/config';

export const pwa: NuxtConfig['pwa'] = {
   registerType: 'autoUpdate',

   workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
      navigateFallback: '/',
   },

   client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
   },

   manifest: {
      name: 'Wooly',
      short_name: 'Wooly',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      lang: 'en',
      scope: '/',
      description: 'Wooly is an app to keep track of your knitting and crocheting projects.',
      theme_color: '#f472b6',
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
      screenshots: [
         {
            src: '/screenshots/screen-1.png',
            sizes: '1284x2778',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Wooly',
         },
         {
            src: '/screenshots/screen-2.png',
            sizes: '1284x2778',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Wooly',
         },
         {
            src: '/screenshots/screen-3.png',
            sizes: '1284x2778',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Wooly',
         },
         {
            src: '/screenshots/screen-4.png',
            sizes: '1284x2778',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Wooly',
         },
         {
            src: '/screenshots/screen-5.png',
            sizes: '1284x2778',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Wooly',
         },
      ],
      id: 'wooly',
      dir: 'ltr',
      orientation: 'portrait',
      display_override: ['standalone', 'fullscreen', 'minimal-ui', 'browser', 'window-controls-overlay'],
      iarc_rating_id: '7+',
      prefer_related_applications: false,
      categories: ['productivity', 'utilities'],
   },

   devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
   },
};
