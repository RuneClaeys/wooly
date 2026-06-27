<script lang="ts" setup>
import imageCompression from 'browser-image-compression';
import { useRouteNumericParam } from '~/composables/useRouteNumericParam';
import { useToast } from '~/composables/useToast';
import type { SelectProjectPhoto } from '~/db/schema';

const { projectRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { success: showSuccessToast, error: showErrorToast } = useToast();
const { t } = useI18n();
const projectId = useRouteNumericParam('id');

const { data: photos, execute: refreshPhotos, pending } = projectRouter.listPhotos.useQuery(projectId, { watch: [projectId] });

const uploadInput = ref<HTMLInputElement | null>(null);
const uploadingPhoto = ref(false);
const photoError = ref<string | null>(null);

const showPhotoViewer = ref(false);
const activePhotoIndex = ref(0);

const photoSrc = (photoId: number) => `/api/projects/${projectId.value}/photos/${photoId}`;
const activePhoto = computed<SelectProjectPhoto | null>(() => photos.value?.[activePhotoIndex.value] ?? null);
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

         await $fetch(`/api/projects/${projectId.value}/photos`, {
            method: 'POST',
            body: formData,
         });
      }

      await refreshPhotos();
      showSuccessToast(t('photos.add'));
   } catch {
      photoError.value = t('photos.upload-error');
      showErrorToast(t('photos.upload-error'));
   } finally {
      target.value = '';
      uploadingPhoto.value = false;
   }
}

async function deletePhoto(photo: SelectProjectPhoto) {
   promptDeleteConfirmation(t('photos.photo'), async (done) => {
      try {
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

         showSuccessToast(t('actions.delete'));
      } catch {
         showErrorToast(t('actions.confirm-delete-type', { type: t('photos.photo') }));
      }
   });
}

function openPhotoViewerById(photoId: number) {
   const foundIndex = photos.value?.findIndex((photo: SelectProjectPhoto) => photo.id === photoId) ?? -1;
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
</script>

<template>
   <div class="space-y-4 wooly-scale-up sm:px-0">
      <TabPhotos
         :project-id="projectId"
         :photos="photos ?? null"
         :pending="pending"
         :uploading-photo="uploadingPhoto"
         :photo-error="photoError"
         @upload="openUploadDialog"
         @open="openPhotoViewerById"
         @delete="deletePhoto"
      />

      <ProjectPhotoViewerModal
         v-model:open="showPhotoViewer"
         :active-photo="activePhoto"
         :active-photo-index="activePhotoIndex"
         :total-photos="photos?.length ?? 0"
         :has-multiple-photos="hasMultiplePhotos"
         :photo-src="photoSrc"
         @previous="showPreviousPhoto"
         @next="showNextPhoto"
      />

      <input ref="uploadInput" type="file" accept="image/*" multiple class="hidden" @change="uploadPhotos" />
   </div>
</template>
