<script lang="ts" setup>
import imageCompression from 'browser-image-compression';
import { useRouteNumericParam } from '~/composables/useRouteNumericParam';
import { useToast } from '~/composables/useToast';
import type { SelectPart, SelectProjectPhoto } from '~/db/schema';

//#region Globals
const { projectRouter, partRouter, yarnRouter } = useTrpcClient();
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

//#region Yarn Tracker
type YarnUsageRow = {
   id: number;
   yarnTypeId: number;
   yarnTypeName: string;
   yarnColorId: number;
   yarnColorName: string;
   usedCount: number;
};

type ArchiveType = {
   id: number;
   name: string;
   skeinWeightGrams: number | null;
   thicknessMm: number | null;
   colors: Array<{
      id: number;
      name: string;
      stashCount: number;
      usedCount: number;
      remainingCount: number;
   }>;
};

type YarnColorOption = { label: string; value: number };

const { data: yarnArchive } = yarnRouter.archiveList.useQuery();
const yarnColorOptions = computed<YarnColorOption[]>(() => {
   const types = (yarnArchive.value ?? []) as ArchiveType[];
   return types.flatMap((type) =>
      type.colors.map((color) => ({
         label: `${type.name} - ${color.name}`,
         value: color.id,
      })),
   );
});

const yarnInput = computed(() => ({
   projectId: projectId.value,
   sorting: query.value,
}));

const {
   data: yarnUsages,
   execute: refreshYarn,
   pending: pendingYarn,
} = yarnRouter.projectList.useQuery(yarnInput, { watch: [yarnInput], deep: true });
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

//#region Add Yarn
const showCreateYarnForm = ref(false);

async function ensureYarnColor(payload: {
   yarnColorId: number | null;
   newTypeName: string;
   newTypeSkeinWeightGrams: number | null;
   newTypeThicknessMm: number | null;
   newColorName: string;
   newColorStashCount: number;
}) {
   if (payload.yarnColorId) return payload.yarnColorId;

   if (!payload.newTypeName || !payload.newColorName) {
      throw new Error('Missing yarn type or color');
   }

   const createdType = await yarnRouter.typeCreate.mutate({
      name: payload.newTypeName,
      skeinWeightGrams: payload.newTypeSkeinWeightGrams,
      thicknessMm: payload.newTypeThicknessMm,
   });

   const createdColor = await yarnRouter.colorCreate.mutate({
      yarnTypeId: createdType.id,
      name: payload.newColorName,
      stashCount: payload.newColorStashCount,
   });

   return createdColor.id;
}

async function createYarn(payload: {
   yarn: {
      yarnColorId: number | null;
      usedCount: number;
      newTypeName: string;
      newTypeSkeinWeightGrams: number | null;
      newTypeThicknessMm: number | null;
      newColorName: string;
      newColorStashCount: number;
   };
   done: () => void;
}) {
   try {
      const yarnColorId = await ensureYarnColor(payload.yarn);

      const response = await yarnRouter.projectAdd.mutate({
         projectId: projectId.value,
         yarnColorId,
         usedCount: payload.yarn.usedCount,
      });

      if (response) refreshYarn();
      showCreateYarnForm.value = false;
      payload.done();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('form.field-required'));
   }
}

async function deleteYarn(id: number) {
   promptDeleteConfirmation(t('yarn.color'), async (done) => {
      try {
         await yarnRouter.projectRemove.mutate(id);
         done();
         yarnUsages.value = (yarnUsages.value ?? []).filter((yarn: YarnUsageRow) => yarn.id !== id);
         showSuccessToast(t('actions.delete'));
      } catch {
         showErrorToast(t('actions.confirm-delete-type', { type: t('yarn.color') }));
      }
   });
}

async function incrementOrDecrementYarn(yarn: YarnUsageRow, increment: boolean) {
   const previousCounter = yarn.usedCount;
   try {
      yarn.usedCount += increment ? 1 : -1;
      await yarnRouter.projectUpdate.mutate({ id: yarn.id, yarnColorId: yarn.yarnColorId, usedCount: yarn.usedCount });
      await refreshYarn();
   } catch {
      yarn.usedCount = previousCounter;
      showErrorToast(t('actions.save'));
   }
}
//#endregion

//#region Edit Yarn
const showEditYarnForm = ref(false);
const yarnToEdit = ref<YarnUsageRow | undefined>(undefined);

async function changeYarn(payload: {
   yarn: {
      yarnColorId: number | null;
      usedCount: number;
      newTypeName: string;
      newTypeSkeinWeightGrams: number | null;
      newTypeThicknessMm: number | null;
      newColorName: string;
      newColorStashCount: number;
   };
   done: () => void;
}) {
   try {
      const yarnColorId = await ensureYarnColor(payload.yarn);

      const response = await yarnRouter.projectUpdate.mutate({
         id: yarnToEdit.value!.id,
         yarnColorId,
         usedCount: payload.yarn.usedCount,
      });
      if (response) refreshYarn();
      showEditYarnForm.value = false;
      payload.done();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

function editYarn(yarn: YarnUsageRow) {
   yarnToEdit.value = { ...yarn };
   showEditYarnForm.value = true;
}

function handleYarnAdjust(payload: { yarn: YarnUsageRow; increment: boolean }) {
   return incrementOrDecrementYarn(payload.yarn, payload.increment);
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
         <ProjectBreadcrumb :project-name="data?.name ?? $t('generic.loading')" />

         <!-- Tab-Based Content -->
         <ProjectDetailTabs
            :project-id="projectId"
            :project-name="data?.name ?? ''"
            :project-status="data?.finished ?? false"
            :parts="parts ?? null"
            :photos="photos ?? null"
            :yarn-usages="yarnUsages ?? null"
            :pending-parts="pending"
            :pending-photos="pendingPhotos"
            :pending-yarn="pendingYarn"
            :uploading-photo="uploadingPhoto"
            :photo-error="photoError"
            @edit-part="editPart"
            @delete-part="deletePart"
            @adjust-part="handlePartAdjust"
            @toggle-part-completed="togglePartCompleted"
            @edit-yarn="editYarn"
            @delete-yarn="deleteYarn"
            @adjust-yarn="handleYarnAdjust"
            @create-part="showCreatePartForm = true"
            @create-yarn="showCreateYarnForm = true"
            @upload-photo="openUploadDialog"
            @open-photo="openPhotoViewerById"
            @delete-photo="deletePhoto"
         />

         <!-- Photo Viewer Modal -->
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

         <!-- Modals -->
         <ModalsPart v-model="showCreatePartForm" @save-part="createPart" />
         <ModalsPart v-model="showEditProjectForm" :initial-part="partToEdit" @save-part="changePart" />
         <ModalsProjectYarn v-model="showCreateYarnForm" :color-options="yarnColorOptions" @save-project-yarn="createYarn" />
         <ModalsProjectYarn
            v-model="showEditYarnForm"
            :color-options="yarnColorOptions"
            :initial-usage="
               yarnToEdit
                  ? {
                       yarnColorId: yarnToEdit.yarnColorId,
                       usedCount: yarnToEdit.usedCount,
                    }
                  : undefined
            "
            @save-project-yarn="changeYarn"
         />

         <!-- Hidden File Input -->
         <input ref="uploadInput" type="file" accept="image/*" multiple class="hidden" @change="uploadPhotos" />
      </div>
   </NuxtLayout>
</template>
