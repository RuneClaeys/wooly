import type { NuxtConfig } from 'nuxt/schema';

export const i18n: NuxtConfig['i18n'] = {
   defaultLocale: 'en',
   langDir: 'i18n',
   strategy: 'no_prefix',
   locales: [
      { code: 'en', name: 'English' },
      { code: 'nl', name: 'Nederlands' },
   ],
};
