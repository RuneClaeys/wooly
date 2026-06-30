<script setup lang="ts">
import { useRouteNumericParam } from '~/composables/useRouteNumericParam';
import { useToast } from '~/composables/useToast';
import type { SelectProject } from '~/db/schema';

const boardId = useRouteNumericParam('id');
const { bingoRouter, projectRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { success: showSuccessToast, error: showErrorToast } = useToast();
const { t } = useI18n();

const { data: boardData, execute: refreshBoard, pending } = bingoRouter.getBoard.useQuery(boardId, { watch: [boardId] });
const { data: activeProjects } = projectRouter.list.useQuery({
   finished: false,
   query: { orderBy: 'updatedAt', order: 'asc' },
});

const boardCells = computed(
   () =>
      (boardData.value?.cells ?? []) as Array<{
         position: number;
         manualCompleted: boolean | null;
         autoCompleted: boolean | null;
      }>,
);

const completedCellsCount = computed(() => boardCells.value.filter((cell) => cell.manualCompleted || cell.autoCompleted).length);
const occupiedPositions = computed(() => boardCells.value.map((cell) => cell.position));

const projectOptions = computed(() =>
   (activeProjects.value ?? []).map((project: SelectProject) => ({
      label: project.name ?? `#${project.id}`,
      value: project.id,
   })),
);

const showCreateCell = ref(false);
const showEditCell = ref(false);
const cellToEdit = ref<any | undefined>(undefined);
const lockedPosition = ref<number | undefined>(undefined);

async function ensureProject(projectName: string | null) {
   if (!projectName) return null;
   const created = await projectRouter.create.mutate({ name: projectName, finished: false });
   return created?.id ?? null;
}

function resolveProjectName(projectId: number | null, newProjectName: string | null) {
   const trimmedNewName = newProjectName?.trim() ?? '';
   if (trimmedNewName) return trimmedNewName;
   if (!projectId) return null;

   const selectedProject = (activeProjects.value ?? []).find((project: SelectProject) => project.id === projectId);
   return selectedProject?.name ?? null;
}

function buildAutoLabel(
   kind: 'project_finish' | 'parts_count' | 'skeins_count' | 'free_text',
   projectName: string | null,
   selectedPartNames: string[],
   targetValue: number | null,
   fallbackLabel: string | null,
) {
   const target = Math.max(1, Number(targetValue) || 1);

   if (kind === 'skeins_count') {
      return t(target === 1 ? 'bingo.auto-label-skeins-singular' : 'bingo.auto-label-skeins-plural', { target });
   }

   if (!projectName) return fallbackLabel;

   if (kind === 'project_finish') {
      return t('bingo.auto-label-project', { projectName });
   }

   if (kind === 'parts_count') {
      if (selectedPartNames.length) {
         const previewNames = selectedPartNames.slice(0, 2);
         const hiddenCount = selectedPartNames.length - previewNames.length;
         if (hiddenCount > 0) {
            return t('bingo.auto-label-parts-specific-more', {
               partNames: previewNames.join(', '),
               extraCount: hiddenCount,
            });
         }

         return t('bingo.auto-label-parts-specific', {
            partNames: previewNames.join(', '),
         });
      }

      return t(target === 1 ? 'bingo.auto-label-parts-singular' : 'bingo.auto-label-parts-plural', { target, projectName });
   }

   return fallbackLabel;
}

function openCreateCell(position: number) {
   lockedPosition.value = position;
   cellToEdit.value = undefined;
   showCreateCell.value = true;
}

function openEditCell(cell: any) {
   cellToEdit.value = { ...cell };
   lockedPosition.value = undefined;
   showEditCell.value = true;
}

async function createCell(payload: {
   cell: {
      position: number;
      kind: 'project_finish' | 'parts_count' | 'skeins_count' | 'free_text';
      label: string | null;
      linkedProjectId: number | null;
      linkedPartIds: number[] | null;
      selectedPartNames: string[];
      targetValue: number | null;
      newProjectName: string | null;
   };
   done: () => void;
}) {
   try {
      const createdProjectId = payload.cell.newProjectName ? await ensureProject(payload.cell.newProjectName) : null;
      const linkedProjectId = payload.cell.linkedProjectId ?? createdProjectId;
      const projectName = resolveProjectName(linkedProjectId, payload.cell.newProjectName);
      const computedLabel = buildAutoLabel(
         payload.cell.kind,
         projectName,
         payload.cell.selectedPartNames,
         payload.cell.targetValue,
         payload.cell.label,
      );

      await bingoRouter.createCell.mutate({
         boardId: boardId.value,
         position: payload.cell.position,
         kind: payload.cell.kind,
         label: computedLabel,
         linkedProjectId,
         linkedPartIds: payload.cell.linkedPartIds,
         targetValue: payload.cell.targetValue,
      });
      await refreshBoard();
      payload.done();
      showCreateCell.value = false;
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function updateCell(payload: {
   cell: {
      position: number;
      kind: 'project_finish' | 'parts_count' | 'skeins_count' | 'free_text';
      label: string | null;
      linkedProjectId: number | null;
      linkedPartIds: number[] | null;
      selectedPartNames: string[];
      targetValue: number | null;
      newProjectName: string | null;
   };
   done: () => void;
}) {
   if (!cellToEdit.value) return;

   try {
      const createdProjectId = payload.cell.newProjectName ? await ensureProject(payload.cell.newProjectName) : null;
      const linkedProjectId = payload.cell.linkedProjectId ?? createdProjectId;
      const projectName = resolveProjectName(linkedProjectId, payload.cell.newProjectName);
      const computedLabel = buildAutoLabel(
         payload.cell.kind,
         projectName,
         payload.cell.selectedPartNames,
         payload.cell.targetValue,
         payload.cell.label,
      );

      await bingoRouter.updateCell.mutate({
         id: cellToEdit.value.id,
         position: payload.cell.position,
         kind: payload.cell.kind,
         label: computedLabel,
         linkedProjectId,
         linkedPartIds: payload.cell.linkedPartIds,
         targetValue: payload.cell.targetValue,
      });
      await refreshBoard();
      payload.done();
      showEditCell.value = false;
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function deleteCell(cellId: number) {
   promptDeleteConfirmation(t('bingo.cell'), async (done) => {
      try {
         await bingoRouter.deleteCell.mutate(cellId);
         done();
         await refreshBoard();
         showSuccessToast(t('actions.delete'));
      } catch {
         showErrorToast(t('actions.confirm-delete-type', { type: t('bingo.cell') }));
      }
   });
}

async function toggleManualCompletion(payload: { cellId: number; completed: boolean }) {
   try {
      await bingoRouter.setManualCompletion.mutate(payload);
      await refreshBoard();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function setManualProgress(payload: { cellId: number; currentValue: number }) {
   try {
      await bingoRouter.setManualProgress.mutate(payload);
      await refreshBoard();
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function recompute() {
   try {
      await bingoRouter.recomputeBoard.mutate(boardId.value);
      await refreshBoard();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}
</script>

<template>
   <NuxtLayout :root="false" :title="boardData?.board?.name ?? $t('bingo.board')" navigate-back-to="/bingo">
      <div class="space-y-4 pb-[calc(12rem+env(safe-area-inset-bottom))]">
         <!-- Board Header Card -->
         <div class="wooly-shell p-5 space-y-3">
            <div class="flex items-start justify-between gap-3">
               <div class="space-y-2 grow">
                  <p class="wooly-title text-2xl font-bold">{{ boardData?.board?.name ?? $t('bingo.board') }}</p>
                  <p class="text-sm wooly-muted font-medium flex items-center gap-1.5">
                     <UIcon name="i-heroicons-calendar-days-16-solid" class="h-4 w-4" />
                     {{
                        $t('bingo.ends-on', {
                           date: boardData?.board?.endDate ? $dayjs(boardData.board.endDate).format('D MMM YYYY') : '-',
                        })
                     }}
                  </p>
               </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap pt-2">
               <UBadge color="primary" variant="soft" size="md" class="font-semibold">
                  {{ boardData?.board?.size }}x{{ boardData?.board?.size }} {{ $t('bingo.grid') }}
               </UBadge>
               <UBadge color="neutral" variant="soft" size="md" class="font-semibold">
                  {{ completedCellsCount }}/{{ boardData?.cells?.length ?? 0 }}
                  {{ $t('generic.completed') }}
               </UBadge>
            </div>

            <UButton
               icon="i-heroicons-arrow-path-16-solid"
               color="neutral"
               variant="soft"
               class="tap-target w-full justify-center"
               :label="$t('bingo.recompute')"
               @click="recompute"
            />
         </div>

         <div v-if="pending" class="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
         </div>

         <BingoBoardGrid
            v-else-if="boardData?.board"
            :size="boardData.board.size"
            :cells="boardData.cells"
            @create-cell="openCreateCell"
            @edit-cell="openEditCell"
            @delete-cell="deleteCell"
            @toggle-manual="toggleManualCompletion"
            @set-progress="setManualProgress"
         />

         <ModalsBingoCell
            v-model="showCreateCell"
            :projects="projectOptions"
            :locked-position="lockedPosition"
            :total-positions="(boardData?.board?.size ?? 3) * (boardData?.board?.size ?? 3)"
            :occupied-positions="occupiedPositions"
            @save-cell="createCell"
         />

         <ModalsBingoCell
            v-model="showEditCell"
            :projects="projectOptions"
            :initial-cell="cellToEdit"
            :total-positions="(boardData?.board?.size ?? 3) * (boardData?.board?.size ?? 3)"
            :occupied-positions="occupiedPositions"
            @save-cell="updateCell"
         />
      </div>
   </NuxtLayout>
</template>
