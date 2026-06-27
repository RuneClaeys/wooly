<script lang="ts" setup>
import { useRouteNumericParam } from '~/composables/useRouteNumericParam';
import { useToast } from '~/composables/useToast';

const { yarnRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { success: showSuccessToast, error: showErrorToast } = useToast();
const { t } = useI18n();
const projectId = useRouteNumericParam('id');

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

const { query } = useSorting('yarn');

const yarnInput = computed(() => ({
   projectId: projectId.value,
   sorting: query.value,
}));

const { data: yarnUsages, execute: refreshYarn, pending } = yarnRouter.projectList.useQuery(yarnInput, { watch: [yarnInput], deep: true });

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

const showCreateYarnForm = ref(false);
const showEditYarnForm = ref(false);
const yarnToEdit = ref<YarnUsageRow | undefined>(undefined);

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

   if (!createdType) {
      throw new Error('Failed to create yarn type');
   }

   const createdColor = await yarnRouter.colorCreate.mutate({
      yarnTypeId: createdType.id,
      name: payload.newColorName,
      stashCount: payload.newColorStashCount,
   });

   if (!createdColor) {
      throw new Error('Failed to create yarn color');
   }

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

      if (response) await refreshYarn();
      showCreateYarnForm.value = false;
      payload.done();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('form.field-required'));
   }
}

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

      if (response) await refreshYarn();
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

function handleYarnAdjust(payload: { yarn: YarnUsageRow; increment: boolean }) {
   void incrementOrDecrementYarn(payload.yarn, payload.increment);
}
</script>

<template>
   <div class="space-y-4 wooly-scale-up sm:px-0">
      <TabOverview
         :project-id="projectId"
         :yarn-usages="yarnUsages ?? null"
         :pending="pending"
         @create="showCreateYarnForm = true"
         @edit="editYarn"
         @delete="deleteYarn"
         @adjust="handleYarnAdjust"
      />

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
   </div>
</template>
