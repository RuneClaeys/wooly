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

defineEmits(['update:sorting']);
//#endregion

//#region
const orderByOptions = computed(() => [
   { name: t('generic.name'), value: 'name' },
   { name: t('filters.created-on'), value: 'createdAt' },
   { name: t('filters.last-changed-at'), value: 'updatedAt' },
]);

const orderOptions = computed(() => [
   { name: t('filters.newest-first'), value: 'asc' },
   { name: t('filters.oldest-first'), value: 'desc' },
]);
//#endregion
</script>

<template>
   <div class="flex flex-col justify-between gap-1 py-3">
      <h3>{{ title }}</h3>

      <div v-if="sorting" class="flex gap-2">
         <ClientOnly>
            <USelect
               :model-value="sorting.orderBy"
               :options="orderByOptions"
               :size="'2xs'"
               option-attribute="name"
               @update:model-value="$emit('update:sorting', { ...sorting, orderBy: $event })"
            />
            <USelect
               :model-value="sorting.order"
               :options="orderOptions"
               :size="'2xs'"
               option-attribute="name"
               @update:model-value="$emit('update:sorting', { ...sorting, order: $event })"
            />

            <slot name="otherFilters"></slot>
         </ClientOnly>
      </div>
   </div>
</template>
