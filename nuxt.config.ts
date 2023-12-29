// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@sidebase/nuxt-auth", "@formkit/auto-animate/nuxt"],

  build: {
    transpile: ["trpc-nuxt"],
  },

  experimental: {
    typedPages: true,
  },

  auth: {
    globalAppMiddleware: true,
    baseURL: process.env.AUHT_ORIGIN,
    provider: {
      type: "authjs",
    },
  },
});
