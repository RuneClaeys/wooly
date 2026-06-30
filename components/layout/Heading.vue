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
            <ResponsiveSelect
               :value="sorting.orderBy"
               :items="orderByOptions"
               :title="$t('filters.sort-by')"
               class="w-full md:w-44 wooly-select-clean"
               @update:value="$emit('update:sorting', { ...sorting, orderBy: $event })"
            />

            <ResponsiveSelect
               :value="sorting.order"
               :items="orderOptions"
               :title="$t('filters.direction')"
               class="w-full md:w-44 wooly-select-clean"
               @update:value="$emit('update:sorting', { ...sorting, order: $event })"
            />

            <slot name="otherFilters" />
         </ClientOnly>
      </div>
   </div>
</template>
