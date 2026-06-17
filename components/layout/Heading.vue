<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Sorting } from '~/composables/useSorting';

const { t } = useI18n();

defineProps({
   title: { type: String, default: 'Add a title' },
   sorting: { type: Object as PropType<Sorting>, default: undefined },
});

defineEmits(['update:sorting']);

const orderByOptions = computed(() => [
   { label: t('generic.name'), value: 'name' },
   { label: t('filters.created-on'), value: 'createdAt' },
   { label: t('filters.last-changed-at'), value: 'updatedAt' },
]);

const orderOptions = computed(() => [
   { label: t('filters.newest-first'), value: 'asc' },
   { label: t('filters.oldest-first'), value: 'desc' },
]);
</script>

<template>
   <div class="wooly-shell flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <h2 class="wooly-title text-xl text-pink-900 dark:text-pink-100">{{ title }}</h2>

      <div v-if="sorting" class="flex flex-col gap-2 md:flex-row md:items-center">
         <ClientOnly>
            <USelect
               :model-value="sorting.orderBy"
               :items="orderByOptions"
               size="md"
               class="w-full md:w-44 wooly-select-clean"
               @update:model-value="$emit('update:sorting', { ...sorting, orderBy: $event })"
            />

            <USelect
               :model-value="sorting.order"
               :items="orderOptions"
               size="md"
               class="w-full md:w-44 wooly-select-clean"
               @update:model-value="$emit('update:sorting', { ...sorting, order: $event })"
            />

            <slot name="otherFilters" />
         </ClientOnly>
      </div>
   </div>
</template>
