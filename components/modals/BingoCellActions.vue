<script setup lang="ts">
interface BingoCellItem {
   id: number;
   boardId: number;
   position: number;
   kind: 'project_finish' | 'parts_count' | 'skeins_count' | 'free_text';
   label: string | null;
   linkedProjectId: number | null;
   linkedProjectName: string | null;
   targetValue: number | null;
   baselineValue: number | null;
   currentValue: number | null;
   autoCompleted: boolean | null;
   manualCompleted: boolean | null;
   completedAt: string | null;
}

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
   cell: BingoCellItem;
}>();

const emit = defineEmits<{
   (e: 'edit'): void;
   (e: 'delete'): void;
   (e: 'toggle-manual', payload: { cellId: number; completed: boolean }): void;
   (e: 'set-progress', payload: { cellId: number; currentValue: number }): void;
}>();

function isCompleted(cell: BingoCellItem) {
   return Boolean(cell.manualCompleted || cell.autoCompleted);
}

function handleEdit() {
   emit('edit');
   open.value = false;
}

function handleDelete() {
   emit('delete');
   open.value = false;
}

function handleToggleManual(value: boolean) {
   emit('toggle-manual', { cellId: props.cell.id, completed: value });
}

function handleSetProgress(value: string | number) {
   emit('set-progress', { cellId: props.cell.id, currentValue: Number(value) });
}
</script>

<template>
   <UDrawer v-model:open="open" :title="cell.label || $t('bingo.cell-actions')">
      <template #body>
         <div class="px-4 pb-4">
            <!-- Progress input (for tracked kinds) -->
            <div
               v-if="cell.kind !== 'free_text' && cell.kind !== 'project_finish'"
               class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 px-2"
            >
               <div class="flex items-center gap-3">
                  <UIcon name="i-heroicons-chart-bar" class="size-5 text-gray-500 dark:text-gray-400" />
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('bingo.progress') }}</span>
               </div>
               <UInput
                  type="number"
                  min="0"
                  :model-value="cell.currentValue ?? 0"
                  class="w-20 text-sm"
                  @update:model-value="handleSetProgress($event)"
               />
            </div>

            <!-- Actions -->
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium transition-colors rounded-md px-2"
                  :class="
                     isCompleted(cell)
                        ? 'text-success-600 dark:text-success-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  "
                  @click="handleToggleManual(!cell.manualCompleted)"
               >
                  <UIcon
                     :name="isCompleted(cell) ? 'i-heroicons-check-circle-solid' : 'i-heroicons-check-circle'"
                     class="size-5"
                     :class="isCompleted(cell) ? 'text-success-500' : 'text-gray-500 dark:text-gray-400'"
                  />
                  {{ isCompleted(cell) ? $t('generic.completed') : $t('bingo.manual-complete') }}
               </button>
               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('actions.edit-type', { type: $t('bingo.cell') })"
                  @click="handleEdit"
               >
                  <UIcon name="i-heroicons-pencil-16-solid" class="size-5 text-gray-500 dark:text-gray-400" />
                  {{ $t('actions.edit') }}
               </button>
               <button
                  class="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-md px-2"
                  :aria-label="$t('actions.delete-type', { type: $t('bingo.cell') })"
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
