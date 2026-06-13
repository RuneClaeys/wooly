import { createTRPCNuxtHandler } from "trpc-nuxt/server";
import { createContext } from "~/server/trpc/context";
import { appRouter } from "~/server/trpc/routers";

// export API handler
export default createTRPCNuxtHandler({
  router: appRouter,
  createContext,
});
