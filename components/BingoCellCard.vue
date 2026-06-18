<script setup lang="ts">
import { ref } from 'vue';

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

const props = defineProps<{
   position: number;
   cell: BingoCellItem;
}>();

const emit = defineEmits<{
   (e: 'edit', cell: BingoCellItem): void;
   (e: 'delete', id: number): void;
   (e: 'toggle-manual', payload: { cellId: number; completed: boolean }): void;
   (e: 'set-progress', payload: { cellId: number; currentValue: number }): void;
}>();

const isActionsModalOpen = ref(false);

function isCompleted(cell: BingoCellItem | undefined) {
   if (!cell) return false;
   return Boolean(cell.manualCompleted || cell.autoCompleted);
}

function progressValue(cell: BingoCellItem) {
   return cell.currentValue ?? 0;
}

function progressTarget(cell: BingoCellItem) {
   if (cell.kind === 'project_finish') return 1;
   if (cell.kind === 'free_text') return null;
   return cell.targetValue ?? 1;
}

function kindLabel(kind: BingoCellItem['kind']) {
   if (kind === 'project_finish') return 'bingo.kind-project';
   if (kind === 'parts_count') return 'bingo.kind-parts';
   if (kind === 'skeins_count') return 'bingo.kind-skeins';
   return 'bingo.kind-free';
}
</script>

<template>
   <div v-if="cell" class="relative group aspect-square">
      <UCard
         class="wooly-shell h-full transition-all duration-200 relative overflow-hidden flex flex-col"
         :class="{
            'ring-2 ring-success-500 ring-offset-2 dark:ring-offset-slate-950 shadow-lg shadow-success-500/20': isCompleted(cell),
            'hover:shadow-md hover:shadow-slate-300/20 dark:hover:shadow-slate-800/40': true,
         }"
      >
         <!-- Completed overlay -->
         <div
            v-if="isCompleted(cell)"
            class="absolute inset-0 bg-linear-to-br from-success-500/5 via-transparent to-success-400/5 dark:from-success-400/3 dark:to-success-300/2 pointer-events-none"
         />

         <div class="space-y-1.5 sm:space-y-3 flex flex-col h-full overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between gap-1">
               <UBadge size="sm" color="primary" variant="soft" class="text-[10px] sm:text-xs font-semibold truncate">
                  {{ $t(kindLabel(cell.kind)) }}
               </UBadge>

               <UButton
                  icon="i-heroicons-ellipsis-vertical-16-solid"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  class="shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  :aria-label="$t('actions.more')"
                  @click="isActionsModalOpen = true"
               />
            </div>

            <!-- Content -->
            <div class="flex-grow min-h-0 overflow-hidden space-y-1">
               <p class="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-50 line-clamp-2 leading-tight">
                  {{ cell.label || $t('bingo.no-label') }}
               </p>
               <p v-if="cell.linkedProjectName" class="text-[10px] sm:text-xs wooly-muted line-clamp-1 font-medium truncate">
                  📌 {{ cell.linkedProjectName }}
               </p>

               <!-- Progress Section -->
               <div v-if="cell.kind !== 'free_text'" class="space-y-1 sm:space-y-2 pt-0.5 sm:pt-1">
                  <div class="font-bold text-slate-700 dark:text-slate-300 text-[11px] sm:text-sm">
                     {{ progressValue(cell) }}<span v-if="progressTarget(cell) !== null"> / {{ progressTarget(cell) }}</span>
                  </div>

                  <!-- Progress bar -->
                  <div v-if="progressTarget(cell) !== null" class="h-1 sm:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                     <div
                        class="h-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 transition-all duration-300 rounded-full"
                        :style="{
                           width: `${Math.min(100, (progressValue(cell) / (progressTarget(cell) || 1)) * 100)}%`,
                        }"
                     />
                  </div>

                  <!-- Manual input (desktop only) -->
                  <UInput
                     v-if="cell.kind !== 'project_finish'"
                     type="number"
                     min="0"
                     :model-value="progressValue(cell)"
                     class="hidden sm:block text-sm h-8"
                     placeholder="Enter value"
                     @update:model-value="
                        emit('set-progress', {
                           cellId: cell.id,
                           currentValue: Number($event),
                        })
                     "
                  />
               </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-1 sm:pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
               <USwitch
                  size="sm"
                  :model-value="Boolean(cell.manualCompleted)"
                  @update:model-value="
                     emit('toggle-manual', {
                        cellId: cell.id,
                        completed: Boolean($event),
                     })
                  "
               />

               <UBadge
                  :color="isCompleted(cell) ? 'success' : 'neutral'"
                  variant="soft"
                  size="sm"
                  class="font-semibold text-[10px] sm:text-xs"
               >
                  <span class="hidden sm:inline">{{ isCompleted(cell) ? $t('generic.completed') : $t('generic.active') }}</span>
                  <span class="sm:hidden">{{ isCompleted(cell) ? '✓' : '○' }}</span>
               </UBadge>
            </div>
         </div>
      </UCard>

      <ModalsBingoCellActions v-model:open="isActionsModalOpen" @edit="emit('edit', cell)" @delete="emit('delete', cell.id)" />
   </div>
</template>
