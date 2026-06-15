import type { ComputedRef } from 'vue';

export function useRouteNumericParam(paramName: string): ComputedRef<number> {
   const route = useRoute();

   return computed(() => {
      const value = route.params[paramName];

      if (Array.isArray(value)) return Number(value[0] ?? 0);

      return Number(value ?? 0);
   });
}
