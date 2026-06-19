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
      <div v-if="pending" class="space-y-2">
         <SkeletonCard />
         <SkeletonCard />
      </div>

      <div v-else-if="!boards?.length" class="wooly-shell px-6 py-12 text-center space-y-4">
         <div class="mx-auto h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center">
            <UIcon name="i-heroicons-squares-2x2-16-solid" class="h-8 w-8 text-primary-600 dark:text-primary-400" />
         </div>
         <div class="space-y-2">
            <p class="wooly-title text-lg font-bold">{{ $t('bingo.no-boards') }}</p>
            <p class="wooly-muted text-sm max-w-sm mx-auto">{{ $t('bingo.no-boards-hint') }}</p>
         </div>
      </div>

      <div v-else class="grid grid-cols-1 gap-3">
         <UCard
            v-for="board in boards"
            :key="board.id"
            class="wooly-shell cursor-pointer group transition-all duration-200 hover:shadow-md hover:shadow-slate-300/20 dark:hover:shadow-slate-800/40 overflow-hidden"
            @click="emit('open', board.id)"
         >
            <div class="flex items-start justify-between gap-4">
               <div class="space-y-3 flex-grow">
                  <!-- Title -->
                  <div class="flex items-start justify-between gap-2">
                     <p class="wooly-title text-lg font-bold leading-snug">{{ board.name }}</p>
                  </div>

                  <!-- Badges -->
                  <div class="flex flex-wrap items-center gap-2">
                     <UBadge color="primary" variant="soft" size="sm" class="font-semibold"> 🎯 {{ board.size }}×{{ board.size }} </UBadge>
                     <UBadge
                        :color="board.completedCells === board.totalCells ? 'success' : 'neutral'"
                        variant="soft"
                        size="sm"
                        class="font-semibold"
                     >
                        {{ board.completedCells }}/{{ board.totalCells }}
                     </UBadge>
                     <UBadge v-if="isOverdue(board.endDate)" color="warning" variant="soft" size="sm" class="font-semibold">
                        ⚠️ {{ $t('bingo.overdue') }}
                     </UBadge>
                  </div>

                  <!-- Progress Bar -->
                  <div class="space-y-1.5">
                     <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 flex justify-between">
                        <span>{{ $t('generic.progress') }}</span>
                        <span>{{ Math.round((board.completedCells / board.totalCells) * 100) }}%</span>
                     </div>
                     <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                           class="h-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-300"
                           :style="{ width: `${(board.completedCells / board.totalCells) * 100}%` }"
                        />
                     </div>
                  </div>

                  <!-- End Date -->
                  <p class="text-xs wooly-muted font-medium flex items-center gap-1.5">
                     <UIcon name="i-heroicons-calendar-days-16-solid" class="h-4 w-4" />
                     {{ $t('bingo.ends-on', { date: board.endDate ? $dayjs(board.endDate).format('D MMM YYYY') : '-' }) }}
                  </p>
               </div>

               <!-- Action Buttons -->
               <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                  <UButton
                     icon="i-heroicons-pencil-16-solid"
                     variant="ghost"
                     color="neutral"
                     size="sm"
                     class="tap-target tap-target-icon hover:bg-slate-100 dark:hover:bg-slate-800"
                     :aria-label="$t('actions.edit-type', { type: $t('bingo.board') })"
                     @click.stop="emit('edit', board)"
                  />
                  <UButton
                     icon="i-heroicons-trash-16-solid"
                     variant="ghost"
                     color="error"
                     size="sm"
                     class="tap-target tap-target-icon hover:bg-red-100 dark:hover:bg-red-950/30"
                     :aria-label="$t('actions.delete-type', { type: $t('bingo.board') })"
                     @click.stop="emit('delete', board.id)"
                  />
               </div>
            </div>
         </UCard>
      </div>
   </div>
</template>
