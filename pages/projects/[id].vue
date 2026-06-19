<script lang="ts" setup>
import imageCompression from 'browser-image-compression';
import { useRouteNumericParam } from '~/composables/useRouteNumericParam';
import { useToast } from '~/composables/useToast';
import type { SelectPart, SelectProjectPhoto, SelectYarnSkein } from '~/db/schema';

//#region Globals
const { projectRouter, partRouter, skeinRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { success: showSuccessToast, error: showErrorToast } = useToast();
const { t } = useI18n();
const projectId = useRouteNumericParam('id');
//#endregion

//#region Get Project
const { data } = projectRouter.get.useQuery(projectId);

const { sorting, query } = useSorting('parts');

const input = computed(() => ({
   projectId: projectId.value,
   sorting: query.value,
}));

const { data: parts, execute: refresh, pending } = partRouter.list.useQuery(input, { watch: [input], deep: true });
//#endregion

//#region Skein Tracker
type SkeinCatalogItem = { label: string; value: number };
type SkeinUsageRow = { id: number; skeinId: number; skeinName: string; counter: number };

const { data: skeinCatalog } = skeinRouter.catalogList.useQuery();
const catalogItems = computed<SkeinCatalogItem[]>(() =>
   (skeinCatalog.value ?? []).map((skein: SelectYarnSkein) => ({ label: skein.name, value: skein.id })),
);

const skeinInput = computed(() => ({
   projectId: projectId.value,
   sorting: query.value,
}));

const {
   data: skeinUsages,
   execute: refreshSkeins,
   pending: pendingSkeins,
} = skeinRouter.list.useQuery(skeinInput, { watch: [skeinInput], deep: true });
const skeinTotal = computed<number>(() =>
   (skeinUsages.value ?? []).reduce((total: number, skein: SkeinUsageRow) => total + (skein.counter ?? 0), 0),
);
//#endregion

//#region Project Photos
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
//#endregion

//#region Add Part
const showCreatePartForm = ref(false);

async function createPart(payload: { part: { name: string; counter: number; completed: boolean }; done: () => void }) {
   try {
      const response = await partRouter.create.mutate({
         projectId: projectId.value,
         name: payload.part.name,
         counter: payload.part.counter,
         completed: payload.part.completed,
      });

      if (response) refresh();
      showCreatePartForm.value = false;
      payload.done();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('form.field-required'));
   }
}

async function deletePart(id: number) {
   promptDeleteConfirmation(t('parts.part'), async (done) => {
      try {
         await partRouter.delete.mutate(id);
         done();
         parts.value = (parts.value ?? []).filter((part: SelectPart) => part.id !== id);
         showSuccessToast(t('actions.delete'));
      } catch {
         showErrorToast(t('actions.confirm-delete-type', { type: t('parts.part') }));
      }
   });
}

async function incrementOrDecrement(part: SelectPart, increment: boolean) {
   const previousCounter = part.counter;
   try {
      part.counter += increment ? 1 : -1;
      await partRouter.update.mutate({ ...part });
      await refresh();
   } catch {
      part.counter = previousCounter;
      showErrorToast(t('actions.save'));
   }
}
//#endregion

//#region Add Skein
const showCreateSkeinForm = ref(false);

async function ensureCatalogSkein(skein: { skeinId: number | null; skeinName: string; counter: number }) {
   if (skein.skeinId) return skein.skeinId;

   const created = await skeinRouter.catalogCreate.mutate({ name: skein.skeinName });
   if (!created) throw new Error('Unable to create skein');
   return created.id;
}

async function createSkein(payload: { skein: { skeinId: number | null; skeinName: string; counter: number }; done: () => void }) {
   try {
      const skeinId = await ensureCatalogSkein(payload.skein);

      const response = await skeinRouter.create.mutate({
         projectId: projectId.value,
         skeinId,
         counter: payload.skein.counter,
      });

      if (response) refreshSkeins();
      showCreateSkeinForm.value = false;
      payload.done();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('form.field-required'));
   }
}

async function deleteSkein(id: number) {
   promptDeleteConfirmation(t('trackers.skein'), async (done) => {
      try {
         await skeinRouter.delete.mutate(id);
         done();
         skeinUsages.value = (skeinUsages.value ?? []).filter((skein: SkeinUsageRow) => skein.id !== id);
         showSuccessToast(t('actions.delete'));
      } catch {
         showErrorToast(t('actions.confirm-delete-type', { type: t('trackers.skein') }));
      }
   });
}

async function incrementOrDecrementSkein(skein: SkeinUsageRow, increment: boolean) {
   const previousCounter = skein.counter;
   try {
      skein.counter += increment ? 1 : -1;
      await skeinRouter.update.mutate({ id: skein.id, skeinId: skein.skeinId, counter: skein.counter });
      await refreshSkeins();
   } catch {
      skein.counter = previousCounter;
      showErrorToast(t('actions.save'));
   }
}
//#endregion

//#region Edit Skein
const showEditSkeinForm = ref(false);
const skeinToEdit = ref<SkeinUsageRow | undefined>(undefined);

async function changeSkein(payload: { skein: { skeinId: number | null; skeinName: string; counter: number }; done: () => void }) {
   try {
      const skeinId = await ensureCatalogSkein(payload.skein);

      const response = await skeinRouter.update.mutate({ id: skeinToEdit.value!.id, skeinId, counter: payload.skein.counter });
      if (response) refreshSkeins();
      showEditSkeinForm.value = false;
      payload.done();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

function editSkein(skein: SkeinUsageRow) {
   skeinToEdit.value = { ...skein };
   showEditSkeinForm.value = true;
}

function handleSkeinAdjust(payload: { skein: SkeinUsageRow; increment: boolean }) {
   return incrementOrDecrementSkein(payload.skein, payload.increment);
}

//#endregion

//#region Edit Part
const showEditProjectForm = ref(false);
const partToEdit = ref<SelectPart | undefined>(undefined);

async function changePart(payload: { part: { name: string; counter: number; completed: boolean }; done: () => void }) {
   try {
      const response = await partRouter.update.mutate({
         ...payload.part,
         id: partToEdit.value!.id,
         completedAt: payload.part.completed ? new Date() : null,
      });
      if (response) refresh();
      showEditProjectForm.value = false;
      payload.done();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

function editPart(part: SelectPart) {
   partToEdit.value = { ...part };
   showEditProjectForm.value = true;
}

function handlePartAdjust(payload: { part: SelectPart; increment: boolean }) {
   return incrementOrDecrement(payload.part, payload.increment);
}

async function togglePartCompleted(payload: { partId: number; completed: boolean }) {
   try {
      await partRouter.setCompleted.mutate({ id: payload.partId, completed: payload.completed });
      await refresh();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

//#endregion
</script>

<template>
   <NuxtLayout :root="false" :title="data?.name ?? $t('generic.loading')" navigate-back-to="/">
      <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
         <!-- Breadcrumb Navigation -->
         <nav class="flex items-center gap-2 px-4 sm:px-0" aria-label="breadcrumb">
            <NuxtLink to="/" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
               {{ $t('projects.projects') }}
            </NuxtLink>
            <UIcon name="i-heroicons-chevron-right-16-solid" class="w-4 h-4 text-slate-400 dark:text-slate-600" />
            <span class="text-sm wooly-text-main font-medium">
               {{ data?.name ?? $t('generic.loading') }}
            </span>
         </nav>

         <!-- Tab-Based Content -->
         <ProjectDetailTabs
            :project-id="projectId"
            :project-name="data?.name ?? ''"
            :project-status="data?.finished ?? false"
            :parts="parts ?? null"
            :photos="photos ?? null"
            :skein-usages="skeinUsages ?? null"
            :skein-catalog="skeinCatalog ?? null"
            :pending-parts="pending"
            :pending-photos="pendingPhotos"
            :pending-skeins="pendingSkeins"
            :uploading-photo="uploadingPhoto"
            :photo-error="photoError"
            @edit-part="editPart"
            @delete-part="deletePart"
            @adjust-part="handlePartAdjust"
            @toggle-part-completed="togglePartCompleted"
            @edit-skein="editSkein"
            @delete-skein="deleteSkein"
            @adjust-skein="handleSkeinAdjust"
            @create-part="showCreatePartForm = true"
            @create-skein="showCreateSkeinForm = true"
            @upload-photo="openUploadDialog"
            @open-photo="openPhotoViewerById"
            @delete-photo="deletePhoto"
         />

         <!-- Photo Viewer Modal -->
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

         <!-- Modals -->
         <ModalsPart v-model="showCreatePartForm" @save-part="createPart" />
         <ModalsPart v-model="showEditProjectForm" :initial-part="partToEdit" @save-part="changePart" />
         <ModalsSkein v-model="showCreateSkeinForm" :catalog-items="catalogItems" @save-skein="createSkein" />
         <ModalsSkein v-model="showEditSkeinForm" :catalog-items="catalogItems" :initial-usage="skeinToEdit" @save-skein="changeSkein" />

         <!-- Hidden File Input -->
         <input ref="uploadInput" type="file" accept="image/*" multiple class="hidden" @change="uploadPhotos" />
      </div>
   </NuxtLayout>
</template>
