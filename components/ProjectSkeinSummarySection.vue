<script setup lang="ts">
type SkeinSummaryRow = {
   skeinId: number;
   skeinName: string;
   projectCount: number;
   totalCounter: number;
};

defineProps<{
   skeinSummary?: SkeinSummaryRow[];
   total: number;
}>();
</script>

<template>
   <LayoutHeading :title="$t('trackers.skeins-used')" />

   <div class="wooly-shell space-y-4 p-4 md:p-5">
      <div class="flex items-center justify-between gap-3">
         <div>
            <p class="wooly-title text-base text-pink-900 dark:text-pink-100">{{ $t('trackers.skeins-used') }}</p>
            <p class="text-sm wooly-muted">{{ $t('trackers.skeins-used-description') }}</p>
         </div>

         <UBadge color="primary" variant="soft" size="sm">{{ total }}</UBadge>
      </div>

      <div v-if="skeinSummary?.length" class="space-y-2">
         <div v-for="skein in skeinSummary" :key="skein.skeinId" class="flex items-center justify-between rounded-xl bg-pink-50/70 px-4 py-3 dark:bg-pink-950/35">
            <div class="min-w-0">
               <p class="truncate font-medium text-pink-900 dark:text-pink-100">{{ skein.skeinName }}</p>
               <p class="text-xs text-pink-800 dark:text-pink-200">{{ skein.projectCount }} {{ $t('projects.project', skein.projectCount) }}</p>
            </div>

            <p class="ml-4 text-lg font-semibold text-pink-900 dark:text-pink-100">{{ skein.totalCounter }}</p>
         </div>
      </div>
   </div>
</template>