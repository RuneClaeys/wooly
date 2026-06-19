<script setup lang="ts">
import type { SelectProjectPhoto } from '~/db/schema';

defineProps<{
   photos?: SelectProjectPhoto[];
   pending: boolean;
   uploadingPhoto: boolean;
   photoError: string | null;
}>();

const emit = defineEmits<{
   (e: 'upload'): void;
   (e: 'open', id: number): void;
   (e: 'delete', photo: SelectProjectPhoto): void;
}>();
</script>

<template>
   <div class="wooly-shell space-y-3 p-3 sm:p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
         <UButton
            icon="i-heroicons-photo-16-solid"
            color="neutral"
            variant="soft"
            size="md"
            :loading="uploadingPhoto"
            :disabled="uploadingPhoto"
            :label="$t('photos.add')"
            @click="emit('upload')"
         />
      </div>

      <p v-if="photoError" class="text-sm text-red-600 dark:text-red-300">{{ photoError }}</p>

      <div v-if="pending" class="text-sm wooly-muted">{{ $t('generic.loading') }}</div>

      <div v-else-if="photos?.length" class="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
         <div v-for="photo in photos" :key="photo.id" class="group wooly-shell relative w-40 shrink-0 overflow-hidden rounded-xl sm:w-48">
            <button type="button" class="block w-full text-left" :aria-label="$t('photos.open-viewer')" @click="emit('open', photo.id)">
               <img :src="`/api/projects/${photo.projectId}/photos/${photo.id}`" :alt="photo.name" class="h-36 w-full object-cover" />
            </button>

            <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/45 to-transparent p-2">
               <p class="truncate text-xs text-white">{{ photo.name }}</p>
            </div>

            <UButton
               icon="i-heroicons-trash-16-solid"
               color="error"
               variant="solid"
               size="xs"
               class="absolute right-2 top-2 opacity-90 transition-opacity duration-150 group-hover:opacity-100"
               :aria-label="$t('actions.delete-type', { type: $t('photos.photo') })"
               @click.stop="emit('delete', photo)"
            />
         </div>
      </div>

      <div v-else class="text-sm wooly-muted">{{ $t('generic.no-results-for-type', { type: $t('photos.photo', 2) }) }}</div>
   </div>
</template>