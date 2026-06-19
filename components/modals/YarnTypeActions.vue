<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
   typeName?: string;
}>();

const emit = defineEmits<{
   (e: 'create-color'): void;
   (e: 'edit'): void;
   (e: 'delete'): void;
}>();

function handleCreateColor() {
   emit('create-color');
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
   <UDrawer v-model:open="open" :title="typeName || $t('yarn.type')">
      <template #body>
         <div class="px-4 pb-4">
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('actions.create-type', { type: $t('yarn.color') })"
                  @click="handleCreateColor"
               >
                  <UIcon name="i-heroicons-plus-16-solid" class="size-5" />
                  {{ $t('actions.create-type', { type: $t('yarn.color') }) }}
               </button>

               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('actions.edit-type', { type: $t('yarn.type') })"
                  @click="handleEdit"
               >
                  <UIcon name="i-heroicons-pencil-16-solid" class="size-5 text-gray-500 dark:text-gray-400" />
                  {{ $t('actions.edit') }}
               </button>

               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('actions.delete-type', { type: $t('yarn.type') })"
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
