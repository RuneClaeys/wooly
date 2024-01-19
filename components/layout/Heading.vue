<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Sorting } from '~/composables/useSorting';

//#region
defineProps({
   title: { type: String, default: 'Add a title' },
   sorting: { type: Object as PropType<Sorting>, default: undefined },
});

defineEmits(['update:sorting']);
//#endregion

//#region
const orderByOptions = computed(() => [
   { name: 'Name', value: 'name' },
   { name: 'Aangemaakt op', value: 'createdAt' },
   { name: 'Laatst bewerkt', value: 'updatedAt' },
]);

const orderOptions = computed(() => [
   { name: 'Nieuwste eerst', value: 'asc' },
   { name: 'Oudste eerst', value: 'desc' },
]);
//#endregion
</script>

<template>
   <div class="flex flex-col justify-between gap-1 py-3">
      <h3>{{ title }}</h3>

      <div v-if="sorting" class="flex gap-2">
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
      </div>

      <!-- <ClientOnly>
         <div v-on-click-outside="() => (showFilters = false)" class="flex gap-2 align-start relative">
            <div
               v-show="showFilters"
               v-if="sorting"
               class="flex flex-col gap-2 absolute z-10 end-full min-w-max p-3 mr-2 bg-white shadow-lg rounded-md"
            >
              
            </div>

            <UButton
               class="self-start"
               color="pink"
               :icon="showFilters ? 'i-heroicons-x-mark-16-solid' : 'i-heroicons-bars-3-bottom-right-16-solid'"
               @click.stop="showFilters = !showFilters"
            />
         </div>
      </ClientOnly> -->
   </div>
</template>
