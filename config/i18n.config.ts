import type { NuxtConfig } from 'nuxt/schema';

export const i18n: NuxtConfig['i18n'] = {
   // Keep legacy file layout (project-root i18n/*.json) after upgrading @nuxtjs/i18n.
   restructureDir: false,
   defaultLocale: 'en',
   langDir: 'i18n',
   strategy: 'no_prefix',
   locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'nl', name: 'Nederlands', file: 'nl.json' },
   ],
};
