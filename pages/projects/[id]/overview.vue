<script lang="ts" setup>
import { useRouteNumericParam } from '~/composables/useRouteNumericParam';
import { useToast } from '~/composables/useToast';
import type { SelectPart } from '~/db/schema';

const { partRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { success: showSuccessToast, error: showErrorToast } = useToast();
const { t } = useI18n();
const projectId = useRouteNumericParam('id');

const { query } = useSorting('parts');

const input = computed(() => ({
   projectId: projectId.value,
   sorting: query.value,
}));

const { data: parts, execute: refresh, pending } = partRouter.list.useQuery(input, { watch: [input], deep: true });

const { adjustPartCounter } = usePartCounterQueueSync({
   projectId,
   parts,
   refreshParts: refresh,
   adjustCounter: ({ id, delta }) => partRouter.adjustCounter.mutate({ id, delta }),
   onSyncError: () => showErrorToast(t('actions.save')),
});

const showCreatePartForm = ref(false);
const showEditPartForm = ref(false);
const partToEdit = ref<SelectPart | undefined>(undefined);

async function createPart(payload: { part: { name: string; counter: number; completed: boolean }; done: () => void }) {
   try {
      const response = await partRouter.create.mutate({
         projectId: projectId.value,
         name: payload.part.name,
         counter: payload.part.counter,
         completed: payload.part.completed,
      });

      if (response) await refresh();
      showCreatePartForm.value = false;
      payload.done();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('form.field-required'));
   }
}

async function changePart(payload: { part: { name: string; counter: number; completed: boolean }; done: () => void }) {
   try {
      const response = await partRouter.update.mutate({
         ...payload.part,
         id: partToEdit.value!.id,
         completedAt: payload.part.completed ? new Date() : null,
      });

      if (response) await refresh();
      showEditPartForm.value = false;
      payload.done();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

function editPart(part: SelectPart) {
   partToEdit.value = { ...part };
   showEditPartForm.value = true;
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

function handlePartAdjust(payload: { part: SelectPart; increment: boolean }) {
   adjustPartCounter(payload.part, payload.increment);
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
</script>

<template>
   <div class="space-y-4 wooly-scale-up sm:px-0">
      <TabParts
         :project-id="projectId"
         :parts="parts ?? null"
         :pending="pending"
         @create="showCreatePartForm = true"
         @edit="editPart"
         @delete="deletePart"
         @adjust="handlePartAdjust"
         @toggle-completed="togglePartCompleted"
      />

      <ModalsPart v-model="showCreatePartForm" @save-part="createPart" />
      <ModalsPart v-model="showEditPartForm" :initial-part="partToEdit" @save-part="changePart" />
   </div>
</template>
