<script lang="ts" setup>
import { vOnClickOutside } from '@vueuse/components';
import type { PropType } from 'vue';
import type { Sorting } from '~/composables/useSorting';

defineProps({
   title: { type: String, default: 'Add a title' },
   sorting: { type: Object as PropType<Sorting>, default: undefined },
});

defineEmits(['update:sorting']);

const showFilters = ref(false);
</script>

<template>
   <div class="flex justify-between items-center py-3">
      <h3>{{ title }}</h3>

      <ClientOnly>
         <div v-on-click-outside="() => (showFilters = false)" class="flex gap-2 align-start relative">
            <div
               v-show="showFilters"
               v-if="sorting"
               class="flex flex-col gap-2 absolute z-10 end-full min-w-max p-3 mr-2 bg-white shadow-lg rounded-md"
            >
               <USelect
                  :model-value="sorting.orderBy"
                  :options="[
                     { name: 'Name', value: 'name' },
                     { name: 'Aangemaakt op', value: 'createdAt' },
                     { name: 'Laatst bewerkt', value: 'updatedAt' },
                  ]"
                  option-attribute="name"
                  @update:model-value="$emit('update:sorting', { ...sorting, orderBy: $event })"
               />
               <USelect
                  :model-value="sorting.order"
                  :options="[
                     { name: 'Oplopend', value: 'asc' },
                     { name: 'Aflopend', value: 'desc' },
                  ]"
                  option-attribute="name"
                  @update:model-value="$emit('update:sorting', { ...sorting, order: $event })"
               />

               <slot name="otherFilters"></slot>
            </div>

            <UButton
               class="self-start"
               color="pink"
               :icon="showFilters ? 'i-heroicons-x-mark-16-solid' : 'i-heroicons-bars-3-bottom-right-16-solid'"
               @click.stop="showFilters = !showFilters"
            />
         </div>
      </ClientOnly>
   </div>
</template>
