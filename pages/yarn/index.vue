<script setup lang="ts">
const { skeinRouter } = useTrpcClient();

const { data: skeinSummary, pending } = skeinRouter.summary.useQuery();

type SkeinSummaryRow = { skeinId: number; skeinName: string; projectCount: number; totalCounter: number };

const totalSkeinsUsed = computed<number>(() =>
   (skeinSummary.value ?? []).reduce((total: number, skein: SkeinSummaryRow) => total + (skein.totalCounter ?? 0), 0),
);
</script>

<template>
   <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <div v-if="pending" class="space-y-2">
         <SkeletonCard />
         <SkeletonCard />
         <SkeletonCard />
      </div>

      <ProjectSkeinSummarySection
         v-else
         :skein-summary="skeinSummary as SkeinSummaryRow[] | undefined"
         :total="totalSkeinsUsed"
         :show-heading="false"
      />
   </div>
</template>
