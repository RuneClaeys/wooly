import type { NuxtConfig } from 'nuxt/schema';

export const app: NuxtConfig['app'] = {
   head: {
      title: 'Wooly',
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
            content: '#f472b6',
         },
      ],
   },

   pageTransition: {
      name: 'page',
      mode: 'out-in',
   },
};
