<script setup lang="ts">
defineProps<{
   stash: number;
   used: number;
   remaining: number;
}>();
</script>

<template>
   <UCard class="wooly-shell">
      <div class="flex items-center justify-between gap-2">
         <div>
            <p class="text-xs wooly-muted">{{ $t('yarn.archive') }}</p>
            <p class="wooly-title text-lg">{{ $t('navigation.yarn') }}</p>
         </div>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2">
         <div class="rounded-xl bg-primary-50/60 p-3 dark:bg-primary-950/30">
            <p class="text-xs wooly-muted">{{ $t('yarn.stash') }}</p>
            <p class="wooly-title text-lg">{{ stash }}</p>
         </div>
         <div class="rounded-xl bg-amber-50/70 p-3 dark:bg-amber-950/30">
            <p class="text-xs wooly-muted">{{ $t('yarn.used') }}</p>
            <p class="wooly-title text-lg">{{ used }}</p>
         </div>
         <div class="rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-950/30">
            <p class="text-xs wooly-muted">{{ $t('yarn.remaining') }}</p>
            <p class="wooly-title text-lg">{{ remaining }}</p>
         </div>
      </div>
   </UCard>
</template>
