<script setup lang="ts">
import type { SelectYarnSkein } from '~/db/schema';

interface Props {
   projectId: number;
   projectName: string;
   projectStatus: boolean;
   skeinUsages: any[] | null;
   skeinCatalog: SelectYarnSkein[] | null;
   pending: boolean;
}

interface Emits {
   (e: 'create'): void;
   (e: 'edit', skein: any): void;
   (e: 'delete', id: number): void;
   (e: 'adjust', payload: { skein: any; increment: boolean }): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const skeinTotal = computed(() => (props.skeinUsages ?? []).reduce((total, skein) => total + (skein.counter ?? 0), 0));

const hasAnyData = computed(() => (props.skeinUsages?.length ?? 0) > 0);
</script>

<template>
   <div class="space-y-4">
      <!-- Project Metadata Card -->
      <UCard class="wooly-shell">
         <template #header>
            <h2 class="wooly-title text-lg">{{ $t('projects.project') }}</h2>
         </template>

         <div class="space-y-3">
            <div class="flex items-center justify-between">
               <span class="wooly-muted text-sm">{{ $t('projects.status') }}</span>
               <UBadge
                  :label="projectStatus ? $t('projects.completed') : $t('projects.active')"
                  :color="projectStatus ? 'success' : 'primary'"
                  size="md"
               />
            </div>
            <div class="flex items-center justify-between">
               <span class="wooly-muted text-sm">{{ $t('projects.name') }}</span>
               <span class="font-medium">{{ projectName }}</span>
            </div>
         </div>
      </UCard>

      <!-- Skein Tracker Section -->
      <div class="space-y-3">
         <div class="flex items-center justify-between px-2">
            <h3 class="wooly-title text-sm">{{ $t('trackers.yarn-skeins') }}</h3>
            <UButton
               size="xs"
               variant="ghost"
               icon="i-heroicons-plus-16-solid"
               :aria-label="$t('actions.create-type', { type: $t('trackers.skein') })"
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
               <p class="wooly-title text-sm">{{ $t('trackers.no-skeins') }}</p>
               <p class="wooly-muted text-xs mt-1">{{ $t('trackers.no-skeins-hint') }}</p>
            </div>
            <UButton size="sm" icon="i-heroicons-plus-16-solid" :label="$t('actions.add')" @click="$emit('create')" />
         </div>

         <!-- Skeins List -->
         <div v-else class="space-y-2">
            <!-- Summary Card -->
            <UCard
               class="wooly-shell bg-gradient-to-r from-primary-50/50 to-primary-100/30 dark:from-primary-950/30 dark:to-primary-900/20"
            >
               <div class="flex items-center justify-between">
                  <div>
                     <p class="wooly-muted text-xs">{{ $t('trackers.total-skeins') }}</p>
                     <p class="wooly-title text-2xl">{{ skeinTotal }}</p>
                  </div>
                  <UIcon name="i-heroicons-sparkles-16-solid" class="w-8 h-8 text-primary-500" />
               </div>
            </UCard>

            <!-- Individual Skeins -->
            <ProjectTrackersSection
               :skein-usages="skeinUsages ?? []"
               :skein-total="skeinTotal"
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
