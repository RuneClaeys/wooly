<script setup lang="ts">
import type { SelectPart } from '~/db/schema';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
   part: SelectPart;
}>();

const emit = defineEmits<{
   (e: 'edit', part: SelectPart): void;
   (e: 'delete', id: number): void;
   (e: 'toggle-completed', payload: { partId: number; completed: boolean }): void;
}>();

function handleEdit() {
   emit('edit', props.part);
   open.value = false;
}

function handleDelete() {
   emit('delete', props.part.id);
   open.value = false;
}

function handleToggleCompleted() {
   emit('toggle-completed', {
      partId: props.part.id,
      completed: !props.part.completed,
   });
   open.value = false;
}
</script>

<template>
   <UDrawer v-model:open="open" :title="part.name || $t('parts.part')">
      <template #body>
         <div class="px-4 pb-4">
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium transition-colors rounded-md px-2"
                  :class="
                     part.completed
                        ? 'text-warning-600 dark:text-warning-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        : 'text-success-600 dark:text-success-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  "
                  :aria-label="part.completed ? $t('parts.mark-incomplete') : $t('parts.mark-complete')"
                  @click="handleToggleCompleted"
               >
                  <UIcon
                     :name="part.completed ? 'i-heroicons-arrow-path-16-solid' : 'i-heroicons-check-16-solid'"
                     class="size-5"
                  />
                  {{ part.completed ? $t('parts.mark-incomplete') : $t('parts.mark-complete') }}
               </button>

               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('actions.edit-type', { type: $t('parts.part') })"
                  @click="handleEdit"
               >
                  <UIcon name="i-heroicons-pencil-16-solid" class="size-5 text-gray-500 dark:text-gray-400" />
                  {{ $t('actions.edit') }}
               </button>

               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('actions.delete-type', { type: $t('parts.part') })"
                  @click="handleDelete"
               >
                  <UIcon name="i-heroicons-trash-16-solid" class="size-5" />
                  {{ $t('actions.delete') }}
               </button>
            </div>
         </div>
      </template>
   </UDrawer>
</template>
