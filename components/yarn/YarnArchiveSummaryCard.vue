<script setup lang="ts">
defineProps<{
   stash: number;
   used: number;
   remaining: number;
   hasActiveFilters: boolean;
}>();

const emit = defineEmits<{
   'toggle-filters': [];
}>();
</script>

<template>
   <UCard class="wooly-shell">
      <div class="flex items-center justify-between gap-2">
         <div>
            <p class="text-[11px] wooly-muted">{{ $t('yarn.archive') }}</p>
            <p class="wooly-title text-base leading-tight">{{ $t('navigation.yarn') }}</p>
         </div>

         <UButton
            icon="i-heroicons-funnel-16-solid"
            color="neutral"
            size="sm"
            :variant="hasActiveFilters ? 'soft' : 'ghost'"
            class="tap-target tap-target-icon"
            :aria-label="$t('filters.open')"
            :title="$t('filters.open')"
            @click="emit('toggle-filters')"
         />
      </div>

      <div class="mt-3 grid grid-cols-3 gap-2">
         <div class="rounded-lg bg-primary-50/60 px-2 py-2 dark:bg-primary-950/30">
            <p class="text-[11px] wooly-muted">{{ $t('yarn.stash') }}</p>
            <p class="wooly-title text-base leading-tight">{{ stash }}</p>
         </div>
         <div class="rounded-lg bg-amber-50/70 px-2 py-2 dark:bg-amber-950/30">
            <p class="text-[11px] wooly-muted">{{ $t('yarn.used') }}</p>
            <p class="wooly-title text-base leading-tight">{{ used }}</p>
         </div>
         <div class="rounded-lg bg-emerald-50/70 px-2 py-2 dark:bg-emerald-950/30">
            <p class="text-[11px] wooly-muted">{{ $t('yarn.remaining') }}</p>
            <p class="wooly-title text-base leading-tight">{{ remaining }}</p>
         </div>
      </div>
   </UCard>
</template>
