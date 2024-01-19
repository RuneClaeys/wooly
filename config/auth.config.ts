import type { NuxtConfig } from 'nuxt/config';

export const auth: NuxtConfig['auth'] = {
   globalAppMiddleware: true,
   provider: {
      type: 'authjs',
   },
};
