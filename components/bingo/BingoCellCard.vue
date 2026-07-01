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
   if (cell.manualCompleted) return progressTarget(cell);
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

function kindLabelShort(kind: BingoCellItem['kind']) {
   if (kind === 'project_finish') return 'bingo.kind-project-short';
   if (kind === 'parts_count') return 'bingo.kind-parts-short';
   if (kind === 'skeins_count') return 'bingo.kind-skeins-short';
   return 'bingo.kind-free-short';
}
</script>

<template>
   <div v-if="cell" class="relative group aspect-square">
      <div
         class="h-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 sm:p-3 flex flex-col transition-all duration-200 overflow-hidden"
         :class="{
            'ring-2 ring-success-500 bg-success-50/50 dark:bg-success-950/20': isCompleted(cell),
            'hover:shadow-md': !isCompleted(cell),
         }"
         @click="emit('edit', cell)"
      >
         <!-- Top row: badge (if fits) + actions -->
         <div class="flex items-start justify-between gap-1 shrink-0">
            <UBadge size="xs" color="primary" variant="subtle" class="text-[9px] sm:text-[10px] font-medium truncate max-w-[70%]">
               <span class="sm:hidden">{{ $t(kindLabelShort(cell.kind)) }}</span>
               <span class="hidden sm:inline">{{ $t(kindLabel(cell.kind)) }}</span>
            </UBadge>

            <UButton
               icon="i-heroicons-ellipsis-vertical-16-solid"
               variant="ghost"
               color="neutral"
               size="xs"
               class="shrink-0 -mr-1 -mt-0.5"
               :aria-label="$t('actions.more')"
               @click.stop="isActionsModalOpen = true"
            />
         </div>

         <!-- Title -->
         <p class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-50 line-clamp-2 leading-snug mt-1.5 grow min-h-0">
            {{ cell.label || $t('bingo.no-label') }}
         </p>

         <!-- Progress (compact, bottom-anchored) -->
         <div class="mt-auto pt-1.5 shrink-0">
            <!-- Free text: simple done/not-done indicator -->
            <div v-if="cell.kind === 'free_text'" class="flex items-center gap-1">
               <UIcon
                  :name="isCompleted(cell) ? 'i-heroicons-check-circle-solid' : 'i-heroicons-circle-stack'"
                  class="size-4"
                  :class="isCompleted(cell) ? 'text-success-500' : 'text-slate-400 dark:text-slate-500'"
               />
               <span
                  class="text-[10px] sm:text-xs font-medium"
                  :class="isCompleted(cell) ? 'text-success-600 dark:text-success-400' : 'text-slate-500 dark:text-slate-400'"
               >
                  {{ isCompleted(cell) ? $t('generic.completed') : $t('generic.active') }}
               </span>
            </div>

            <!-- Tracked progress: number + bar -->
            <div v-else class="space-y-1">
               <div class="flex items-baseline justify-between">
                  <span class="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
                     {{ progressValue(cell) }} / {{ progressTarget(cell) }}
                  </span>
                  <UIcon v-if="isCompleted(cell)" name="i-heroicons-check-circle-solid" class="size-3.5 text-success-500" />
               </div>
               <div class="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                     class="h-full rounded-full transition-all duration-300"
                     :class="isCompleted(cell) ? 'bg-success-500' : 'bg-primary-500'"
                     :style="{
                        width: `${Math.min(100, (progressValue(cell) / (progressTarget(cell) || 1)) * 100)}%`,
                     }"
                  />
               </div>
            </div>
         </div>
      </div>

      <ModalsBingoCellActions
         v-model:open="isActionsModalOpen"
         :cell="cell"
         @edit="emit('edit', cell)"
         @delete="emit('delete', cell.id)"
         @toggle-manual="emit('toggle-manual', $event)"
         @set-progress="emit('set-progress', $event)"
      />
   </div>
</template>
