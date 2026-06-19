<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
   colorName?: string;
   allowAdjustUsage?: boolean;
   allowSetCurrentStash?: boolean;
}>();

const emit = defineEmits<{
   (e: 'adjust-usage'): void;
   (e: 'set-current-stash'): void;
   (e: 'edit'): void;
   (e: 'delete'): void;
}>();

function handleAdjustUsage() {
   emit('adjust-usage');
   open.value = false;
}

function handleSetCurrentStash() {
   emit('set-current-stash');
   open.value = false;
}

function handleEdit() {
   emit('edit');
   open.value = false;
}

function handleDelete() {
   emit('delete');
   open.value = false;
}
</script>

<template>
   <UDrawer v-model:open="open" :title="colorName || $t('yarn.color')">
      <template #body>
         <div class="px-4 pb-4">
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
               <button
                  v-if="allowSetCurrentStash"
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('yarn.set-current-stash')"
                  @click="handleSetCurrentStash"
               >
                  <UIcon name="i-heroicons-circle-stack-16-solid" class="size-5" />
                  {{ $t('yarn.set-current-stash') }}
               </button>

               <button
                  v-if="allowAdjustUsage"
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('yarn.add-manual-usage')"
                  @click="handleAdjustUsage"
               >
                  <UIcon name="i-heroicons-plus-circle-16-solid" class="size-5" />
                  {{ $t('yarn.add-manual-usage') }}
               </button>

               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('actions.edit-type', { type: $t('yarn.color') })"
                  @click="handleEdit"
               >
                  <UIcon name="i-heroicons-pencil-16-solid" class="size-5 text-gray-500 dark:text-gray-400" />
                  {{ $t('actions.edit') }}
               </button>

               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('actions.delete-type', { type: $t('yarn.color') })"
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
