<script setup lang="ts">
import type { SelectPart } from '~/db/schema';

defineProps<{
   parts?: SelectPart[];
   pending: boolean;
}>();

const selectedPartForActions = ref<SelectPart | null>(null);
const isPartActionsOpen = ref(false);

const emit = defineEmits<{
   (e: 'edit', part: SelectPart): void;
   (e: 'delete', id: number): void;
   (e: 'adjust', payload: { part: SelectPart; increment: boolean }): void;
   (e: 'toggle-completed', payload: { partId: number; completed: boolean }): void;
}>();

function openPartActions(part: SelectPart) {
   selectedPartForActions.value = part;
   isPartActionsOpen.value = true;
}
</script>

<template>
   <div v-auto-animate class="grid grid-cols-1 gap-2" :class="{ 'opacity-75': pending }">
      <UCard v-for="part in parts ?? []" :key="part.id" class="wooly-shell w-full px-2.5 py-1.5">
         <div class="flex items-center justify-between gap-1.5">
            <div class="min-w-0 flex-1">
               <p class="truncate wooly-title text-sm text-pink-900 dark:text-pink-100">{{ part.name }}</p>
               <div class="mt-0.5 flex items-baseline gap-1.5 text-xs wooly-muted">
                  <span class="truncate">{{ part.completed ? $t('generic.completed') : $t('generic.active') }}</span>
                  <span aria-hidden="true" class="opacity-60">•</span>
                  <span class="whitespace-nowrap">{{ $t('parts.row-count') }}:</span>
                  <span class="whitespace-nowrap font-semibold tabular-nums text-pink-900 dark:text-pink-100">{{ part.counter }}</span>
               </div>
            </div>

            <div class="flex shrink-0 flex-wrap items-center justify-end gap-1">
               <UButton
                  icon="i-heroicons-minus-16-solid"
                  variant="soft"
                  color="error"
                  size="xs"
                  class="tap-target-icon"
                  :aria-label="$t('actions.decrease-count', { type: $t('parts.part') })"
                  @click.stop="emit('adjust', { part, increment: false })"
               />
               <UButton
                  icon="i-heroicons-plus-16-solid"
                  variant="soft"
                  color="success"
                  size="xs"
                  class="tap-target-icon"
                  :aria-label="$t('actions.increase-count', { type: $t('parts.part') })"
                  @click.stop="emit('adjust', { part, increment: true })"
               />
               <UButton
                  icon="i-heroicons-ellipsis-vertical-16-solid"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  class="tap-target-icon"
                  :aria-label="$t('actions.open-type', { type: $t('parts.part') })"
                  @click.stop="openPartActions(part)"
               />
            </div>
         </div>
      </UCard>
   </div>

   <ModalsPartActions
      v-if="selectedPartForActions"
      v-model:open="isPartActionsOpen"
      :part="selectedPartForActions"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
      @toggle-completed="emit('toggle-completed', $event)"
   />

   <div v-if="!pending && !parts?.length" class="wooly-shell px-6 py-10 text-center">
      <p class="text-pink-900 dark:text-pink-100">{{ $t('generic.no-results-for-type', { type: $t('parts.part', 2) }) }}</p>
   </div>
</template>
