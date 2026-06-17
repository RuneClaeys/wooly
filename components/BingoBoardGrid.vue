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

const props = defineProps<{
   size: number;
   cells: BingoCellItem[];
}>();

const emit = defineEmits<{
   (e: 'edit-cell', cell: BingoCellItem): void;
   (e: 'delete-cell', id: number): void;
   (e: 'create-cell', position: number): void;
   (e: 'toggle-manual', payload: { cellId: number; completed: boolean }): void;
   (e: 'set-progress', payload: { cellId: number; currentValue: number }): void;
}>();

const totalSlots = computed(() => props.size * props.size);

const cellByPosition = computed(() => {
   const map = new Map<number, BingoCellItem>();
   for (const cell of props.cells) {
      map.set(cell.position, cell);
   }
   return map;
});

const positions = computed(() => Array.from({ length: totalSlots.value }, (_, index) => index + 1));

function isCompleted(cell: BingoCellItem) {
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
   <div
      class="grid gap-2"
      :style="{
         gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
      }"
   >
      <UCard
         v-for="position in positions"
         :key="position"
         class="wooly-shell min-h-44"
         :class="{ 'ring-2 ring-success-400/70': cellByPosition.get(position) && isCompleted(cellByPosition.get(position)!) }"
      >
         <div v-if="cellByPosition.get(position)" class="space-y-3">
            <div class="flex items-start justify-between gap-2">
               <div class="space-y-1">
                  <p class="text-xs wooly-muted">#{{ position }}</p>
                  <UBadge size="xs" color="primary" variant="soft">{{ $t(kindLabel(cellByPosition.get(position)!.kind)) }}</UBadge>
               </div>

               <div class="flex items-center gap-1">
                  <UButton
                     icon="i-heroicons-pencil-16-solid"
                     variant="ghost"
                     color="neutral"
                     size="xs"
                     class="tap-target tap-target-icon"
                     :aria-label="$t('actions.edit-type', { type: $t('bingo.cell') })"
                     @click="emit('edit-cell', cellByPosition.get(position)!)"
                  />
                  <UButton
                     icon="i-heroicons-trash-16-solid"
                     variant="ghost"
                     color="error"
                     size="xs"
                     class="tap-target tap-target-icon"
                     :aria-label="$t('actions.delete-type', { type: $t('bingo.cell') })"
                     @click="emit('delete-cell', cellByPosition.get(position)!.id)"
                  />
               </div>
            </div>

            <div class="space-y-1">
               <p class="text-sm font-medium">
                  {{ cellByPosition.get(position)!.label || $t('bingo.no-label') }}
               </p>
               <p v-if="cellByPosition.get(position)!.linkedProjectName" class="text-xs wooly-muted">
                  {{ cellByPosition.get(position)!.linkedProjectName }}
               </p>
            </div>

            <div v-if="cellByPosition.get(position)!.kind !== 'free_text'" class="space-y-2">
               <div class="text-xs wooly-muted">
                  <span>{{ $t('bingo.progress') }}: </span>
                  <span>{{ progressValue(cellByPosition.get(position)!) }}</span>
                  <span v-if="progressTarget(cellByPosition.get(position)!) !== null">
                     / {{ progressTarget(cellByPosition.get(position)!) }}
                  </span>
               </div>

               <UInput
                  v-if="cellByPosition.get(position)!.kind !== 'project_finish'"
                  type="number"
                  min="0"
                  :model-value="progressValue(cellByPosition.get(position)!)"
                  @update:model-value="
                     emit('set-progress', {
                        cellId: cellByPosition.get(position)!.id,
                        currentValue: Number($event),
                     })
                  "
               />
            </div>

            <div class="flex items-center justify-between">
               <div class="flex items-center gap-2">
                  <USwitch
                     :model-value="Boolean(cellByPosition.get(position)!.manualCompleted)"
                     @update:model-value="
                        emit('toggle-manual', {
                           cellId: cellByPosition.get(position)!.id,
                           completed: Boolean($event),
                        })
                     "
                  />
                  <small class="text-xs">{{ $t('bingo.manual-complete') }}</small>
               </div>

               <UBadge
                  :color="isCompleted(cellByPosition.get(position)!) ? 'success' : 'neutral'"
                  variant="soft"
                  size="xs"
               >
                  {{ isCompleted(cellByPosition.get(position)!) ? $t('generic.completed') : $t('generic.active') }}
               </UBadge>
            </div>
         </div>

         <button
            v-else
            class="h-full w-full rounded-lg border border-dashed border-primary-200/80 p-3 text-left text-sm wooly-muted hover:bg-primary-50/40 dark:hover:bg-primary-950/20"
            type="button"
            @click="emit('create-cell', position)"
         >
            <span class="font-medium text-primary-700 dark:text-primary-300">+ {{ $t('actions.add') }}</span>
            <br />
            {{ $t('bingo.empty-slot') }}
         </button>
      </UCard>
   </div>
</template>
