type OrderBy = 'name' | 'createdAt' | 'updatedAt';
type Order = 'asc' | 'desc';

export type Sorting = { orderBy: OrderBy; order: Order };

export const useSorting = () => {
   const route = useRoute();
   const router = useRouter();

   const query = computed(() => route.query);

   const ORDER_BY = [
      { name: 'Naam', value: 'name' },
      { name: 'Aangemaakt op', value: 'createdAt' },
      { name: 'Laast bewerkt', value: 'updatedAt' },
   ];

   const ORDER = [
      { name: 'Oplopend', value: 'asc' },
      { name: 'Aflopend', value: 'desc' },
   ];

   const sorting = ref<Sorting>({
      orderBy: (query.value.orderBy as OrderBy) ?? 'createdAt',
      order: (query.value.order as Order) ?? 'desc',
   });

   function sortingChanged(value: Sorting) {
      router.push({ ...route, query: { ...route.query, orderBy: value.orderBy, order: value.order } });
   }

   watch(sorting, sortingChanged, { deep: true });

   return {
      ORDER_BY,
      ORDER,
      query,
      sorting,
   };
};
