<script lang="ts" setup>
import type { SelectPart } from '~/db/schema';

//#region Globals
const route = useRoute('projects-id');
const { projectRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { t } = useI18n();

//#endregion

//#region Get Project
const { data } = projectRouter.get.useQuery(+route.params.id);

const { sorting } = useSorting('parts');

const input = computed(() => ({
   projectId: +route.params.id,
   sorting: sorting.value,
}));

const { data: parts, execute: refresh, pending } = projectRouter.partRouter.list.useQuery(input, { watch: [input], deep: true });
//#endregion

//#region Add Part
const showCeateProjectForm = ref(false);
const sortDelay = ref<NodeJS.Timeout>();

async function createPart(payload: { part: { name: string; counter: number }; done: () => void }) {
   const response = await projectRouter.partRouter.create.mutate({
      projectId: +route.params.id,
      name: payload.part.name,
      counter: payload.part.counter,
   });

   if (response) refresh();
   showCeateProjectForm.value = false;
}

async function deletePart(id: number) {
   promptDeleteConfirmation(t('parts.part'), async (done) => {
      await projectRouter.partRouter.delete.mutate(id);
      done();
      parts.value = (parts.value ?? []).filter((part) => part.id !== id);
   });
}

async function incrementOrDecrement(part: Required<SelectPart>, increment: boolean) {
   try {
      part.counter += increment ? 1 : -1;
      await projectRouter.partRouter.update.mutate({ ...part });
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
   const response = await projectRouter.partRouter.update.mutate({ ...payload.part, id: partToEdit.value!.id });
   if (response) refresh();
   showEditProjectForm.value = false;
   payload.done();
}

function editPart(part: SelectPart) {
   partToEdit.value = { ...part };
   showEditProjectForm.value = true;
}

//#endregion

useDefaultLayout(() => ({
   title: data?.value?.name ?? t('generic.loading'),
   root: false,
   navigateBackTo: '/',
}));
</script>

<template>
   <div>
      <LayoutHeading v-model:sorting="sorting" :title="$t('parts.part', 2)" />

      <div v-auto-animate class="flex flex-row flex-wrap gap-3 justify-center pb-20">
         <UCard v-if="parts?.length" v-for="part in parts ?? []" :key="part.id" class="min-w-full md:min-w-96 cursor-pointer max-h-[90px]">
            <div class="flex flex-col gap-2">
               <div class="flex justify-between items-center">
                  <p>{{ part.name }}</p>
                  <div class="flex gap-1">
                     <UButton icon="i-heroicons-pencil-16-solid" variant="ghost" color="grey" @click.stop="editPart(part)" />
                     <UButton icon="i-heroicons-trash-16-solid" variant="ghost" color="red" @click.stop="deletePart(part.id)" />
                  </div>
               </div>
               <div class="flex justify-between items-center">
                  <small>{{ $t('parts.row-count') }}</small>

                  <div class="flex gap-2 items-center">
                     <UButton
                        icon="i-heroicons-minus-16-solid"
                        variant="ghost"
                        color="red"
                        :aria-label="$t('actions.change')"
                        @click.stop="incrementOrDecrement(part, false)"
                     />
                     <p>{{ part.counter }}</p>
                     <UButton
                        icon="i-heroicons-plus-16-solid"
                        variant="ghost"
                        color="green"
                        :aria-label="$t('actions.delete')"
                        @click.stop="incrementOrDecrement(part, true)"
                     />
                  </div>
               </div>
            </div>
         </UCard>

         <p v-else class="text-gray-400">{{ $t('generic.no-results-for-type', { type: $t('parts.part', 2) }) }}</p>
      </div>

      <UButton
         class="fixed bottom-5 right-5"
         size="xl"
         square
         icon="i-heroicons-plus-16-solid"
         :ui="{ rounded: 'rounded-full' }"
         :aria-label="$t('actions.create-type', { type: $t('parts.part') })"
         @click="showCeateProjectForm = true"
      />

      <ModalsPart v-model="showCeateProjectForm" @save-part="createPart" />
      <ModalsPart v-model="showEditProjectForm" :initial-part="partToEdit" @save-part="changePart" />
   </div>
</template>
