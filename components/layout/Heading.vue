<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Sorting } from '~/composables/useSorting';

defineProps({
   title: { type: String, default: 'Add a title' },
   sorting: { type: Object as PropType<Sorting>, default: undefined },
});

defineEmits(['update:sorting']);
</script>

<template>
   <div class="flex justify-between items-center py-3">
      <h3>{{ title }}</h3>

      <div v-if="sorting" class="flex gap-2">
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
      </div>
   </div>
</template>
