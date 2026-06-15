<script setup lang="ts">
type SkeinUsageRow = {
   id: number;
   skeinId: number;
   skeinName: string;
   counter: number;
};

defineProps<{
   skeinUsages?: SkeinUsageRow[];
   skeinTotal: number;
   pending: boolean;
}>();

const emit = defineEmits<{
   (e: 'create'): void;
   (e: 'edit', skein: SkeinUsageRow): void;
   (e: 'delete', id: number): void;
   (e: 'adjust', payload: { skein: SkeinUsageRow; increment: boolean }): void;
}>();
</script>

<template>
   <LayoutHeading :title="$t('trackers.tracker', 2)">
      <template #otherFilters>
         <UButton
            icon="i-heroicons-plus-16-solid"
            color="primary"
            variant="soft"
            size="md"
            class="tap-target"
            :aria-label="$t('actions.create-type', { type: $t('trackers.skein') })"
            @click="emit('create')"
         >
            {{ $t('actions.create-type', { type: $t('trackers.skein') }) }}
         </UButton>
      </template>
   </LayoutHeading>

   <div class="wooly-shell space-y-3 p-3 sm:p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
         <div>
            <p class="wooly-title text-base text-pink-900 dark:text-pink-100">{{ $t('trackers.tracker') }}</p>
            <p class="text-sm wooly-muted">{{ $t('trackers.tracker-description') }}</p>
         </div>

         <UBadge color="primary" variant="soft" size="sm">{{ skeinTotal }}</UBadge>
      </div>

      <div v-if="pending" class="text-sm wooly-muted">{{ $t('generic.loading') }}</div>

      <div v-else-if="skeinUsages?.length" v-auto-animate class="grid grid-cols-1 gap-3">
         <UCard v-for="skein in skeinUsages ?? []" :key="skein.id" class="wooly-shell w-full">
            <div class="space-y-4">
               <div class="flex items-start justify-between gap-2">
                  <p class="wooly-title text-base text-pink-900 dark:text-pink-100">{{ skein.skeinName }}</p>

                  <div class="flex items-center gap-1">
                     <UButton
                        icon="i-heroicons-pencil-16-solid"
                        variant="ghost"
                        color="neutral"
                        size="md"
                        class="tap-target tap-target-icon"
                        :aria-label="$t('actions.edit-type', { type: $t('trackers.skein') })"
                        @click.stop="emit('edit', skein)"
                     />
                     <UButton
                        icon="i-heroicons-trash-16-solid"
                        variant="ghost"
                        color="error"
                        size="md"
                        class="tap-target tap-target-icon"
                        :aria-label="$t('actions.delete-type', { type: $t('trackers.skein') })"
                        @click.stop="emit('delete', skein.id)"
                     />
                  </div>
               </div>

               <div class="rounded-xl bg-pink-50/70 p-2 dark:bg-pink-950/35">
                  <div class="flex items-center justify-between gap-2">
                     <small class="text-pink-800 dark:text-pink-200">{{ $t('trackers.skein-count') }}</small>

                     <div class="flex items-center gap-2">
                        <UButton
                           icon="i-heroicons-minus-16-solid"
                           variant="soft"
                           color="error"
                           size="md"
                           class="tap-target tap-target-icon"
                           :aria-label="$t('actions.decrease-count', { type: $t('trackers.skein') })"
                           @click.stop="emit('adjust', { skein, increment: false })"
                        />

                        <p class="min-w-10 text-center text-lg font-semibold text-pink-900 dark:text-pink-100">{{ skein.counter }}</p>

                        <UButton
                           icon="i-heroicons-plus-16-solid"
                           variant="soft"
                           color="success"
                           size="md"
                           class="tap-target tap-target-icon"
                           :aria-label="$t('actions.increase-count', { type: $t('trackers.skein') })"
                           @click.stop="emit('adjust', { skein, increment: true })"
                        />
                     </div>
                  </div>
               </div>
            </div>
         </UCard>
      </div>

      <div v-else class="text-sm wooly-muted">{{ $t('generic.no-results-for-type', { type: $t('trackers.tracker', 2) }) }}</div>
   </div>
</template>