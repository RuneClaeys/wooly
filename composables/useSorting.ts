type OrderBy = 'name' | 'createdAt' | 'updatedAt';
type Order = 'asc' | 'desc';

export type Sorting = { orderBy: OrderBy; order: Order };

export const useSorting = (listKey: string) => {
   const route = useRoute();
   const router = useRouter();

   const query = computed(() => route.query);

   function getInitialValues() {
      if (process.server) {
         return {
            orderBy: (query.value.orderBy as OrderBy) ?? 'createdAt',
            order: (query.value.order as Order) ?? 'desc',
         };
      }

      const savedQuery = JSON.parse(window.localStorage.getItem(`${listKey}-query`) ?? '{}');

      return {
         orderBy: (query.value.orderBy as OrderBy) ?? savedQuery.orderBy ?? 'createdAt',
         order: (query.value.order as Order) ?? savedQuery.order ?? 'desc',
      };
   }

   const sorting = ref<Sorting>(getInitialValues());

   function sortingChanged(value: Sorting) {
      const newQuery = { ...query.value, orderBy: value.orderBy, order: value.order };
      router.replace({ ...route, query: newQuery });
      window.localStorage.setItem(`${listKey}-query`, JSON.stringify({ ...newQuery }));
   }

   watch(sorting, sortingChanged, { deep: true });

   return {
      query,
      sorting,
   };
};
