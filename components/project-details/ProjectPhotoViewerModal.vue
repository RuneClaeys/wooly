<script setup lang="ts">
import type { SelectProjectPhoto } from '~/db/schema';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
   activePhoto: SelectProjectPhoto | null;
   activePhotoIndex: number;
   totalPhotos: number;
   hasMultiplePhotos: boolean;
   photoSrc: (photoId: number) => string;
}>();

const emit = defineEmits<{
   previous: [];
   next: [];
}>();
</script>

<template>
   <UModal
      v-model:open="open"
      :title="activePhoto?.name ?? $t('photos.photo')"
      :description="
         totalPhotos
            ? $t('photos.position', {
                 current: activePhotoIndex + 1,
                 total: totalPhotos,
              })
            : undefined
      "
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-4xl' }"
   >
      <template #body>
         <div v-if="activePhoto" class="space-y-3">
            <div class="relative overflow-hidden rounded-xl bg-neutral-950/95">
               <img :src="photoSrc(activePhoto.id)" :alt="activePhoto.name" class="max-h-[70vh] w-full object-contain" />

               <div
                  v-if="hasMultiplePhotos"
                  class="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2"
               >
                  <UButton
                     icon="i-heroicons-chevron-left-16-solid"
                     color="neutral"
                     variant="solid"
                     class="pointer-events-auto"
                     :aria-label="$t('photos.previous')"
                     @click="emit('previous')"
                  />

                  <UButton
                     icon="i-heroicons-chevron-right-16-solid"
                     color="neutral"
                     variant="solid"
                     class="pointer-events-auto"
                     :aria-label="$t('photos.next')"
                     @click="emit('next')"
                  />
               </div>
            </div>

            <p class="text-center text-sm wooly-muted">
               {{
                  $t('photos.position', {
                     current: activePhotoIndex + 1,
                     total: totalPhotos || 1,
                  })
               }}
            </p>
         </div>
      </template>
   </UModal>
</template>
