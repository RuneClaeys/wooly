<script setup lang="ts">
import type { SelectProjectPhoto } from '~/db/schema';

interface Props {
   projectId: number;
   photos: SelectProjectPhoto[] | null;
   pending: boolean;
   uploadingPhoto: boolean;
   photoError: string | null;
}

interface Emits {
   (e: 'upload'): void;
   (e: 'open', id: number): void;
   (e: 'delete', photo: SelectProjectPhoto): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const hasAnyData = computed(() => (props.photos?.length ?? 0) > 0);
</script>

<template>
   <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between px-2">
         <h3 class="wooly-title text-sm">{{ $t('photos.photos') }} ({{ photos?.length ?? 0 }})</h3>
         <UButton
            size="xs"
            variant="ghost"
            icon="i-heroicons-plus-16-solid"
            :aria-label="$t('actions.upload')"
            :loading="uploadingPhoto"
            @click="$emit('upload')"
         />
      </div>

      <!-- Upload Error -->
      <div v-if="photoError" class="bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-900/50 rounded-lg p-3">
         <p class="text-sm text-error-700 dark:text-error-300">{{ photoError }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="space-y-2">
         <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <SkeletonField v-for="i in 3" :key="i" class="aspect-square" />
         </div>
      </div>

      <!-- Empty State -->
      <div
         v-else-if="!hasAnyData"
         class="wooly-shell rounded-xl p-6 text-center space-y-3"
      >
         <UIcon
            name="i-heroicons-photo-16-solid"
            class="w-12 h-12 mx-auto wooly-muted"
         />
         <div>
            <p class="wooly-title text-sm">{{ $t('photos.no-photos') }}</p>
            <p class="wooly-muted text-xs mt-1">{{ $t('photos.no-photos-hint') }}</p>
         </div>
         <UButton
            size="sm"
            icon="i-heroicons-plus-16-solid"
            :label="$t('actions.upload')"
            @click="$emit('upload')"
         />
      </div>

      <!-- Photos Grid -->
      <ProjectPhotosSection
         :photos="photos ?? []"
         :pending="false"
         :uploading-photo="uploadingPhoto"
         :photo-error="null"
         @upload="$emit('upload')"
         @open="$emit('open', $event)"
         @delete="$emit('delete', $event)"
      />
   </div>
</template>
