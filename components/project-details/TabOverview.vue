<script setup lang="ts">
interface Props {
   projectId: number;
   yarnUsages: any[] | null;
   pending: boolean;
}

interface Emits {
   (e: 'create'): void;
   (e: 'edit', yarn: any): void;
   (e: 'delete', id: number): void;
   (e: 'adjust', payload: { yarn: any; increment: boolean }): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const yarnTotal = computed(() => (props.yarnUsages ?? []).reduce((total, yarn) => total + (yarn.usedCount ?? 0), 0));

const hasAnyData = computed(() => (props.yarnUsages?.length ?? 0) > 0);
</script>

<template>
   <div class="space-y-4">
      <!-- Yarn Tracker Section -->
      <div class="space-y-3">
         <div class="flex items-center justify-between px-2">
            <h3 class="wooly-title text-sm">{{ $t('navigation.yarn') }}</h3>
            <UButton
               size="xs"
               variant="ghost"
               icon="i-heroicons-plus-16-solid"
               :aria-label="$t('actions.create-type', { type: $t('yarn.color') })"
               @click="$emit('create')"
            />
         </div>

         <!-- Loading State -->
         <div v-if="pending" class="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
         </div>

         <!-- Empty State -->
         <div v-else-if="!hasAnyData" class="wooly-shell rounded-xl p-6 text-center space-y-3">
            <UIcon name="i-heroicons-cube-16-solid" class="w-12 h-12 mx-auto wooly-muted" />
            <div>
               <p class="wooly-title text-sm">{{ $t('yarn.no-project-yarn') }}</p>
               <p class="wooly-muted text-xs mt-1">{{ $t('yarn.no-project-yarn-hint') }}</p>
            </div>
            <UButton size="sm" icon="i-heroicons-plus-16-solid" :label="$t('actions.add')" @click="$emit('create')" />
         </div>

         <!-- Skeins List -->
         <div v-else class="space-y-2">
            <ProjectTrackersSection
               :yarn-usages="yarnUsages ?? []"
               :yarn-total="yarnTotal"
               :pending="false"
               @create="$emit('create')"
               @edit="$emit('edit', $event)"
               @delete="$emit('delete', $event)"
               @adjust="$emit('adjust', $event)"
            />
         </div>
      </div>
   </div>
</template>
