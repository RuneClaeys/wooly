import type { NuxtConfig } from 'nuxt/config';

export const auth: NuxtConfig['auth'] = {
   globalAppMiddleware: true,
   baseURL: process.env.AUTH_ORIGIN,
   provider: {
      type: 'authjs',
   },
};
