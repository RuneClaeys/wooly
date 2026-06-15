import { createTRPCNuxtClient, httpBatchLink } from 'trpc-nuxt/client';
import type { AppRouter } from '~/server/trpc/routers';

export default defineNuxtPlugin(() => {
   if (import.meta.dev && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
         registrations.forEach((registration) => {
            registration.unregister();
         });
      });
   }

   /**
    * createTRPCNuxtClient adds a `useQuery` composable
    * built on top of `useAsyncData`.
    */
   const client = createTRPCNuxtClient<AppRouter>({
      links: [
         httpBatchLink({
            url: '/api/trpc',
         }),
      ],
   });

   return {
      provide: {
         client,
      },
   };
});
