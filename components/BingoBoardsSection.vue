<script setup lang="ts">
interface BingoBoardListItem {
   id: number;
   name: string;
   size: number;
   endDate: string | null;
   completedCells: number;
   totalCells: number;
}

defineProps<{
   boards?: BingoBoardListItem[];
   pending: boolean;
}>();

const emit = defineEmits<{
   (e: 'create'): void;
   (e: 'open', id: number): void;
   (e: 'edit', board: BingoBoardListItem): void;
   (e: 'delete', id: number): void;
}>();

const now = useNow({ interval: 60000 });

function isOverdue(endDate: string | null) {
   if (!endDate) return false;
   return new Date(endDate).getTime() < now.value.getTime();
}
</script>

<template>
   <div class="space-y-3">
      <LayoutHeading :title="$t('bingo.board', 2)">
         <template #otherFilters>
            <UButton
               size="md"
               icon="i-heroicons-plus-16-solid"
               color="primary"
               class="tap-target"
               :label="$t('actions.create-type', { type: $t('bingo.board') })"
               @click="emit('create')"
            />
         </template>
      </LayoutHeading>

      <div v-if="pending" class="space-y-2">
         <SkeletonCard />
         <SkeletonCard />
      </div>

      <div v-else-if="!(boards?.length)" class="wooly-shell px-6 py-10 text-center space-y-4">
         <UIcon name="i-heroicons-squares-2x2-16-solid" class="mx-auto h-12 w-12 wooly-muted" />
         <div class="space-y-1">
            <p class="wooly-title text-base">{{ $t('bingo.no-boards') }}</p>
            <p class="wooly-muted text-sm">{{ $t('bingo.no-boards-hint') }}</p>
         </div>
         <UButton
            color="primary"
            icon="i-heroicons-plus-16-solid"
            class="tap-target"
            :label="$t('actions.create-type', { type: $t('bingo.board') })"
            @click="emit('create')"
         />
      </div>

      <div v-else class="grid grid-cols-1 gap-3">
         <UCard
            v-for="board in boards"
            :key="board.id"
            class="wooly-shell cursor-pointer"
            @click="emit('open', board.id)"
         >
            <div class="flex items-start justify-between gap-3">
               <div class="space-y-2">
                  <p class="wooly-title text-base">{{ board.name }}</p>
                  <div class="flex flex-wrap items-center gap-2">
                     <UBadge color="primary" variant="soft" size="sm">{{ board.size }}x{{ board.size }}</UBadge>
                     <UBadge color="neutral" variant="soft" size="sm">
                        {{ board.completedCells }}/{{ board.totalCells }}
                     </UBadge>
                     <UBadge v-if="isOverdue(board.endDate)" color="warning" variant="soft" size="sm">
                        {{ $t('bingo.overdue') }}
                     </UBadge>
                  </div>
                  <p class="text-xs wooly-muted">
                     {{ $t('bingo.ends-on', { date: board.endDate ? $dayjs(board.endDate).format('ll') : '-' }) }}
                  </p>
               </div>

               <div class="flex items-center gap-1">
                  <UButton
                     icon="i-heroicons-pencil-16-solid"
                     variant="ghost"
                     color="neutral"
                     size="md"
                     class="tap-target tap-target-icon"
                     :aria-label="$t('actions.edit-type', { type: $t('bingo.board') })"
                     @click.stop="emit('edit', board)"
                  />
                  <UButton
                     icon="i-heroicons-trash-16-solid"
                     variant="ghost"
                     color="error"
                     size="md"
                     class="tap-target tap-target-icon"
                     :aria-label="$t('actions.delete-type', { type: $t('bingo.board') })"
                     @click.stop="emit('delete', board.id)"
                  />
               </div>
            </div>
         </UCard>
      </div>
   </div>
</template>
