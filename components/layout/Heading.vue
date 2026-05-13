<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Sorting } from '~/composables/useSorting';

//#region Globals
const { t } = useI18n();
//#endregion

//#region
defineProps({
   title: { type: String, default: 'Add a title' },
   sorting: { type: Object as PropType<Sorting>, default: undefined },
});

const emits = defineEmits(['update:sorting']);
//#endregion

//#region
const orderByOptions = computed(() => [
   { label: t('generic.name'), value: 'name', order: 'asc' },
   { label: t('filters.created-on'), value: 'createdAt', order: 'desc' },
   { label: t('filters.last-changed-at'), value: 'updatedAt', order: 'desc' },
]);

function setSorting(value: string) {
   const orderBy = orderByOptions.value.find((option) => option.value === value);

   if (orderBy) {
      emits('update:sorting', { orderBy: orderBy.value, order: orderBy.order });
   }
}
//#endregion
</script>

<template>
   <div class="flex flex-col justify-between gap-1 py-3">
      <h3>{{ title }}</h3>

      <div v-if="sorting" class="flex gap-2">
         <ClientOnly>
            <USelect
               :model-value="sorting.orderBy"
               :items="orderByOptions"
               :size="'2xs'"
               @update:model-value="setSorting($event)"
            />
            <slot name="otherFilters"></slot>
         </ClientOnly>
      </div>
   </div>
</template>
