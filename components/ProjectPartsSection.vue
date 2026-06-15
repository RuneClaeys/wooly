<script setup lang="ts">
import type { SelectPart } from '~/db/schema';
import type { Sorting } from '~/composables/useSorting';

defineProps<{
   parts?: SelectPart[];
   pending: boolean;
}>();

const sorting = defineModel<Sorting>('sorting');

const emit = defineEmits<{
   (e: 'edit', part: SelectPart): void;
   (e: 'delete', id: number): void;
   (e: 'adjust', payload: { part: SelectPart; increment: boolean }): void;
}>();
</script>

<template>
   <LayoutHeading v-model:sorting="sorting" :title="$t('parts.part', 2)" />

   <div v-auto-animate class="grid grid-cols-1 gap-3" :class="{ 'opacity-75': pending }">
      <UCard v-for="part in parts ?? []" :key="part.id" class="wooly-shell w-full">
         <div class="space-y-4">
            <div class="flex items-start justify-between gap-2">
               <p class="wooly-title text-base text-pink-900 dark:text-pink-100">{{ part.name }}</p>

               <div class="flex items-center gap-1">
                  <UButton
                     icon="i-heroicons-pencil-16-solid"
                     variant="ghost"
                     color="neutral"
                     size="md"
                     class="tap-target tap-target-icon"
                     :aria-label="$t('actions.edit-type', { type: $t('parts.part') })"
                     @click.stop="emit('edit', part)"
                  />
                  <UButton
                     icon="i-heroicons-trash-16-solid"
                     variant="ghost"
                     color="error"
                     size="md"
                     class="tap-target tap-target-icon"
                     :aria-label="$t('actions.delete-type', { type: $t('parts.part') })"
                     @click.stop="emit('delete', part.id)"
                  />
               </div>
            </div>

            <div class="rounded-xl bg-pink-50/70 p-2 dark:bg-pink-950/35">
               <div class="flex items-center justify-between gap-2">
                  <small class="text-pink-800 dark:text-pink-200">{{ $t('parts.row-count') }}</small>

                  <div class="flex items-center gap-2">
                     <UButton
                        icon="i-heroicons-minus-16-solid"
                        variant="soft"
                        color="error"
                        size="md"
                        class="tap-target tap-target-icon"
                        :aria-label="$t('actions.decrease-count', { type: $t('parts.part') })"
                        @click.stop="emit('adjust', { part, increment: false })"
                     />

                     <p class="min-w-10 text-center text-lg font-semibold text-pink-900 dark:text-pink-100">{{ part.counter }}</p>

                     <UButton
                        icon="i-heroicons-plus-16-solid"
                        variant="soft"
                        color="success"
                        size="md"
                        class="tap-target tap-target-icon"
                        :aria-label="$t('actions.increase-count', { type: $t('parts.part') })"
                        @click.stop="emit('adjust', { part, increment: true })"
                     />
                  </div>
               </div>
            </div>
         </div>
      </UCard>
   </div>

   <div v-if="!pending && !parts?.length" class="wooly-shell px-6 py-10 text-center">
      <p class="text-pink-900 dark:text-pink-100">{{ $t('generic.no-results-for-type', { type: $t('parts.part', 2) }) }}</p>
   </div>
</template>