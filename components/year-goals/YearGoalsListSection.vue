<script setup lang="ts">
interface YearGoalListItem {
   id: number;
   year: number;
   kind: 'projects_count' | 'yarn_balls_count' | 'specific_project_finish' | 'free_challenge';
   label: string | null;
   linkedProjectId: number | null;
   linkedProjectName: string | null;
   targetValue: number | null;
   currentValue: number | null;
   autoCompleted: boolean | null;
   manualCompleted: boolean | null;
}

defineProps<{
   goals?: YearGoalListItem[];
   pending: boolean;
   selectedYear: number;
}>();

const emit = defineEmits<{
   (e: 'edit', goal: YearGoalListItem): void;
   (e: 'delete', id: number): void;
   (e: 'toggle-manual', payload: { goalId: number; completed: boolean }): void;
   (e: 'set-progress', payload: { goalId: number; currentValue: number }): void;
   (e: 'recompute'): void;
}>();

function percent(goal: YearGoalListItem) {
   if (goal.kind === 'projects_count' || goal.kind === 'yarn_balls_count') {
      const target = Math.max(1, goal.targetValue ?? 1);
      const value = Math.max(0, goal.currentValue ?? 0);
      return Math.min(100, Math.round((value / target) * 100));
   }

   return goal.manualCompleted || goal.autoCompleted ? 100 : 0;
}

function canManualProgress(goal: YearGoalListItem) {
   return goal.kind === 'projects_count' || goal.kind === 'yarn_balls_count';
}
</script>

<template>
   <div class="space-y-3">
      <div class="wooly-shell p-4 flex items-center justify-between gap-3">
         <div>
            <p class="wooly-title text-base font-semibold">{{ $t('year-goals.title') }}</p>
            <p class="wooly-muted text-sm">{{ $t('year-goals.subtitle', { year: selectedYear }) }}</p>
         </div>

         <UButton
            icon="i-heroicons-arrow-path-16-solid"
            color="neutral"
            variant="soft"
            size="sm"
            class="tap-target"
            :label="$t('year-goals.recompute')"
            @click="emit('recompute')"
         />
      </div>

      <div v-if="pending" class="space-y-2">
         <SkeletonCard />
         <SkeletonCard />
      </div>

      <div v-else-if="!goals?.length" class="wooly-shell px-6 py-12 text-center space-y-3">
         <div class="mx-auto h-14 w-14 rounded-full bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center">
            <UIcon name="i-heroicons-calendar-days-16-solid" class="h-7 w-7 text-primary-600 dark:text-primary-300" />
         </div>
         <p class="wooly-title text-lg font-bold">{{ $t('year-goals.empty-title', { year: selectedYear }) }}</p>
         <p class="wooly-muted text-sm">{{ $t('year-goals.empty-hint') }}</p>
      </div>

      <div v-else class="space-y-2">
         <UCard v-for="goal in goals" :key="goal.id" class="wooly-shell overflow-hidden">
            <div class="space-y-3">
               <div class="flex items-start justify-between gap-3">
                  <div class="space-y-1">
                     <p class="wooly-title text-base font-semibold">{{ goal.label || $t(`year-goals.kind-short-${goal.kind}`) }}</p>
                     <p v-if="goal.linkedProjectName" class="text-xs wooly-muted">
                        {{ $t('year-goals.linked-project', { projectName: goal.linkedProjectName }) }}
                     </p>
                  </div>

                  <div class="flex items-center gap-1">
                     <UButton
                        icon="i-heroicons-pencil-16-solid"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        class="tap-target tap-target-icon"
                        :aria-label="$t('actions.edit-type', { type: $t('year-goals.goal') })"
                        @click="emit('edit', goal)"
                     />
                     <UButton
                        icon="i-heroicons-trash-16-solid"
                        variant="ghost"
                        color="error"
                        size="sm"
                        class="tap-target tap-target-icon"
                        :aria-label="$t('actions.delete-type', { type: $t('year-goals.goal') })"
                        @click="emit('delete', goal.id)"
                     />
                  </div>
               </div>

               <div class="flex items-center gap-2 flex-wrap">
                  <UBadge color="primary" variant="soft" size="sm">{{ $t(`year-goals.kind-short-${goal.kind}`) }}</UBadge>
                  <UBadge :color="goal.manualCompleted || goal.autoCompleted ? 'success' : 'neutral'" variant="soft" size="sm">
                     {{ goal.manualCompleted || goal.autoCompleted ? $t('generic.completed') : $t('generic.active') }}
                  </UBadge>
                  <UBadge v-if="canManualProgress(goal)" color="neutral" variant="soft" size="sm"
                     >{{ Math.max(0, goal.currentValue ?? 0) }}/{{ Math.max(1, goal.targetValue ?? 1) }}</UBadge
                  >
               </div>

               <div class="space-y-1.5">
                  <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                     <div
                        class="h-full bg-linear-to-r from-primary-400 to-primary-500 transition-all duration-300"
                        :style="{ width: `${percent(goal)}%` }"
                     />
                  </div>
                  <p class="text-xs wooly-muted">{{ percent(goal) }}%</p>
               </div>

               <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <FormField
                     v-if="canManualProgress(goal)"
                     :model-value="goal.currentValue ?? 0"
                     :label="$t('year-goals.progress')"
                     type="number"
                     :min="0"
                     show-stepper
                     :decrement-aria-label="$t('actions.decrease-count', { type: $t('year-goals.progress') })"
                     :increment-aria-label="$t('actions.increase-count', { type: $t('year-goals.progress') })"
                     @update:model-value="(value) => emit('set-progress', { goalId: goal.id, currentValue: Number(value) })"
                  />

                  <div class="flex items-center justify-between rounded-lg bg-slate-100/70 dark:bg-slate-800/70 px-3 py-2 h-11">
                     <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('year-goals.manual-complete') }}</p>
                     <USwitch
                        :model-value="Boolean(goal.manualCompleted || goal.autoCompleted)"
                        :disabled="Boolean(goal.autoCompleted)"
                        color="primary"
                        @update:model-value="(value) => emit('toggle-manual', { goalId: goal.id, completed: Boolean(value) })"
                     />
                  </div>
               </div>
            </div>
         </UCard>
      </div>
   </div>
</template>
