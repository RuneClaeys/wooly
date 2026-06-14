<script lang="ts" setup>
import imageCompression from 'browser-image-compression';
import type { SelectPart, SelectProjectPhoto } from '~/db/schema';

//#region Globals
const route = useRoute('projects-id');
const { projectRouter, partRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { t } = useI18n();
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');
const fabColor = computed(() => (isDark.value ? 'neutral' : 'primary'));
const fabVariant = computed(() => (isDark.value ? 'soft' : 'solid'));
//#endregion

//#region Get Project
const { data } = projectRouter.get.useQuery(+route.params.id);

const { sorting, query } = useSorting('parts');

const input = computed(() => ({
   projectId: +route.params.id,
   sorting: query.value,
}));

const { data: parts, execute: refresh, pending } = partRouter.list.useQuery(input, { watch: [input], deep: true });
//#endregion

//#region Project Photos
const projectId = computed(() => +route.params.id);
const {
   data: photos,
   execute: refreshPhotos,
   pending: pendingPhotos,
} = projectRouter.listPhotos.useQuery(projectId, {
   watch: [projectId],
});
const uploadInput = ref<HTMLInputElement | null>(null);
const uploadingPhoto = ref(false);
const photoError = ref<string | null>(null);
const showPhotoViewer = ref(false);
const activePhotoIndex = ref(0);

const photoSrc = (photoId: number) => `/api/projects/${route.params.id}/photos/${photoId}`;

const activePhoto = computed(() => photos.value?.[activePhotoIndex.value] ?? null);

const hasMultiplePhotos = computed(() => (photos.value?.length ?? 0) > 1);

async function compressPhoto(file: File) {
   return imageCompression(file, {
      maxSizeMB: 10,
      maxWidthOrHeight: 2200,
      initialQuality: 0.88,
      useWebWorker: true,
      alwaysKeepResolution: false,
   });
}

function openUploadDialog() {
   uploadInput.value?.click();
}

async function uploadPhotos(event: Event) {
   const target = event.target as HTMLInputElement;
   const files = target.files;

   if (!files?.length) return;

   photoError.value = null;
   uploadingPhoto.value = true;

   try {
      for (const file of Array.from(files)) {
         const compressedFile = await compressPhoto(file);

         if (compressedFile.size > 10 * 1024 * 1024) {
            throw new Error(t('photos.max-size-error'));
         }

         const formData = new FormData();
         formData.append('file', compressedFile, compressedFile.name || file.name);

         await $fetch(`/api/projects/${route.params.id}/photos`, {
            method: 'POST',
            body: formData,
         });
      }

      await refreshPhotos();
   } catch {
      photoError.value = t('photos.upload-error');
   } finally {
      target.value = '';
      uploadingPhoto.value = false;
   }
}

async function deletePhoto(photo: SelectProjectPhoto) {
   promptDeleteConfirmation(t('photos.photo'), async (done) => {
      await projectRouter.deletePhoto.mutate(photo.id);
      done();

      if (showPhotoViewer.value && activePhoto.value?.id === photo.id) {
         showPhotoViewer.value = false;
      }

      await refreshPhotos();

      if (photos.value?.length) {
         activePhotoIndex.value = Math.min(activePhotoIndex.value, photos.value.length - 1);
      } else {
         activePhotoIndex.value = 0;
      }
   });
}

function openPhotoViewerById(photoId: number) {
   const foundIndex = photos.value?.findIndex((photo) => photo.id === photoId) ?? -1;

   if (foundIndex < 0) return;

   activePhotoIndex.value = foundIndex;
   showPhotoViewer.value = true;
}

function showPreviousPhoto() {
   if (!photos.value?.length) return;

   activePhotoIndex.value = activePhotoIndex.value === 0 ? (photos.value.length ?? 1) - 1 : activePhotoIndex.value - 1;
}

function showNextPhoto() {
   if (!photos.value?.length) return;

   activePhotoIndex.value = activePhotoIndex.value === (photos.value.length ?? 1) - 1 ? 0 : activePhotoIndex.value + 1;
}

function handlePhotoViewerKeydown(event: KeyboardEvent) {
   if (!showPhotoViewer.value) return;

   if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPreviousPhoto();
   }

   if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNextPhoto();
   }

   if (event.key === 'Escape') {
      showPhotoViewer.value = false;
   }
}

onMounted(() => {
   window.addEventListener('keydown', handlePhotoViewerKeydown);
});

onBeforeUnmount(() => {
   window.removeEventListener('keydown', handlePhotoViewerKeydown);
});
//#endregion

//#region Add Part
const showCreatePartForm = ref(false);
const sortDelay = ref<ReturnType<typeof setTimeout> | undefined>(undefined);

async function createPart(payload: { part: { name: string; counter: number }; done: () => void }) {
   const response = await partRouter.create.mutate({
      projectId: +route.params.id,
      name: payload.part.name,
      counter: payload.part.counter,
   });

   if (response) refresh();
   showCreatePartForm.value = false;
   payload.done();
}

async function deletePart(id: number) {
   promptDeleteConfirmation(t('parts.part'), async (done) => {
      await partRouter.delete.mutate(id);
      done();
      parts.value = (parts.value ?? []).filter((part) => part.id !== id);
   });
}

async function incrementOrDecrement(part: Required<SelectPart>, increment: boolean) {
   try {
      part.counter += increment ? 1 : -1;
      await partRouter.update.mutate({ ...part });
      if (sortDelay.value) clearTimeout(sortDelay.value);

      sortDelay.value = setTimeout(() => {
         refresh();
      }, 1000);
   } catch {
      part.counter -= increment ? 1 : -1;
   }
}
//#endregion

//#region Edit Part
const showEditProjectForm = ref(false);
const partToEdit = ref<SelectPart | undefined>(undefined);

async function changePart(payload: { part: { name: string; counter: number }; done: () => void }) {
   const response = await partRouter.update.mutate({ ...payload.part, id: partToEdit.value!.id });
   if (response) refresh();
   showEditProjectForm.value = false;
   payload.done();
}

function editPart(part: SelectPart) {
   partToEdit.value = { ...part };
   showEditProjectForm.value = true;
}

//#endregion
</script>

<template>
   <NuxtLayout :root="false" :title="data?.name ?? $t('generic.loading')" navigate-back-to="/">
      <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
         <LayoutHeading :title="$t('photos.photo', 2)" />

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
                  @click="openUploadDialog"
               />
            </div>

            <input ref="uploadInput" type="file" accept="image/*" multiple class="hidden" @change="uploadPhotos" />

            <p v-if="photoError" class="text-sm text-red-600 dark:text-red-300">{{ photoError }}</p>

            <div v-if="pendingPhotos" class="text-sm wooly-muted">{{ $t('generic.loading') }}</div>

            <div v-else-if="photos?.length" class="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
               <div
                  v-for="photo in photos"
                  :key="photo.id"
                  class="group wooly-shell relative w-40 shrink-0 overflow-hidden rounded-xl sm:w-48"
               >
                  <button
                     type="button"
                     class="block w-full text-left"
                     :aria-label="$t('photos.open-viewer')"
                     @click="openPhotoViewerById(photo.id)"
                  >
                     <img :src="photoSrc(photo.id)" :alt="photo.name" class="h-36 w-full object-cover" />
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
                     @click.stop="deletePhoto(photo)"
                  />
               </div>
            </div>

            <div v-else class="text-sm wooly-muted">{{ $t('generic.no-results-for-type', { type: $t('photos.photo', 2) }) }}</div>

            <UModal
               v-model:open="showPhotoViewer"
               :title="activePhoto?.name ?? $t('photos.photo')"
               :description="
                  photos?.length
                     ? $t('photos.position', {
                          current: activePhotoIndex + 1,
                          total: photos.length,
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
                              @click="showPreviousPhoto"
                           />

                           <UButton
                              icon="i-heroicons-chevron-right-16-solid"
                              color="neutral"
                              variant="solid"
                              class="pointer-events-auto"
                              :aria-label="$t('photos.next')"
                              @click="showNextPhoto"
                           />
                        </div>
                     </div>

                     <p class="text-center text-sm wooly-muted">
                        {{
                           $t('photos.position', {
                              current: activePhotoIndex + 1,
                              total: photos?.length ?? 1,
                           })
                        }}
                     </p>
                  </div>
               </template>
            </UModal>
         </div>

         <LayoutHeading v-model:sorting="sorting" :title="$t('parts.part', 2)" />

         <div v-auto-animate class="grid grid-cols-1 gap-3" :class="{ 'opacity-75': pending }">
            <UCard v-for="part in parts ?? []" :key="part.id" class="wooly-shell w-full">
               <div class="space-y-4">
                  <div class="flex items-start justify-between gap-2">
                     <p class="wooly-title text-base text-pink-900 dark:text-pink-100">{{ part.name }}</p>

                     <div class="flex items-center gap-1">
                        <UButton
                           icon="i-heroicons-pencil-16-solid"
                           variant="ghost"
                           color="neutral"
                           size="md"
                           class="tap-target tap-target-icon"
                           :aria-label="$t('actions.edit-type', { type: $t('parts.part') })"
                           @click.stop="editPart(part)"
                        />
                        <UButton
                           icon="i-heroicons-trash-16-solid"
                           variant="ghost"
                           color="error"
                           size="md"
                           class="tap-target tap-target-icon"
                           :aria-label="$t('actions.delete-type', { type: $t('parts.part') })"
                           @click.stop="deletePart(part.id)"
                        />
                     </div>
                  </div>

                  <div class="rounded-xl bg-pink-50/70 p-2 dark:bg-pink-950/35">
                     <div class="flex items-center justify-between gap-2">
                        <small class="text-pink-800 dark:text-pink-200">{{ $t('parts.row-count') }}</small>

                        <div class="flex items-center gap-2">
                           <UButton
                              icon="i-heroicons-minus-16-solid"
                              variant="soft"
                              color="error"
                              size="md"
                              class="tap-target tap-target-icon"
                              :aria-label="$t('actions.decrease-count', { type: $t('parts.part') })"
                              @click.stop="incrementOrDecrement(part, false)"
                           />

                           <p class="min-w-10 text-center text-lg font-semibold text-pink-900 dark:text-pink-100">{{ part.counter }}</p>

                           <UButton
                              icon="i-heroicons-plus-16-solid"
                              variant="soft"
                              color="success"
                              size="md"
                              class="tap-target tap-target-icon"
                              :aria-label="$t('actions.increase-count', { type: $t('parts.part') })"
                              @click.stop="incrementOrDecrement(part, true)"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </UCard>
         </div>

         <div v-if="!pending && !parts?.length" class="wooly-shell px-6 py-10 text-center">
            <p class="text-pink-900 dark:text-pink-100">{{ $t('generic.no-results-for-type', { type: $t('parts.part', 2) }) }}</p>
         </div>

         <UButton
            class="wooly-fab tap-target tap-target-icon"
            size="xl"
            icon="i-heroicons-plus-16-solid"
            :color="fabColor"
            :variant="fabVariant"
            :aria-label="$t('actions.create-type', { type: $t('parts.part') })"
            @click="showCreatePartForm = true"
         />

         <ModalsPart v-model="showCreatePartForm" @save-part="createPart" />
         <ModalsPart v-model="showEditProjectForm" :initial-part="partToEdit" @save-part="changePart" />
      </div>
   </NuxtLayout>
</template>
