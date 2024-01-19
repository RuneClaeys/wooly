<script lang="ts" setup>
import type { SelectPart } from '~/db/schema';

//#region Globals
const toast = useToast();
const route = useRoute('projects-id');
const { projectRouter } = useTrpcClient();
const { promptConfirmation } = useConfirmation();
//#endregion

//#region Get Project
const { data } = projectRouter.get.useQuery(+route.params.id);

const { sorting, query } = useSorting('parts');

const input = computed(() => ({
   projectId: +route.params.id,
   sorting: query.value,
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
   promptConfirmation({
      title: 'Onderdeel verwijderen',
      description: 'Ben je zeker dat je dit onderdeel wil verwijderen',
      onConfirm: async (done) => {
         await projectRouter.partRouter.delete.mutate(id);
         done();
         parts.value = (parts.value ?? []).filter((part) => part.id !== id);
      },
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
</script>

<template>
   <NuxtLayout :root="false" :title="data?.name ?? 'Laden...'" :navigate-back-to="'/'">
      <LayoutHeading v-model:sorting="sorting" :title="'Onderdelen'" />

      <div v-auto-animate class="flex flex-row flex-wrap gap-3 justify-center">
         <UCard v-if="pending && !parts?.length" v-for="i in 4" :key="i" class="min-w-full md:min-w-96 cursor-pointer max-h-[90px]">
            <div class="flex justify-between items-center">
               <USkeleton class="w-40 h-4" />
               <div class="flex gap-1">
                  <USkeleton class="h-4 w-4" />
               </div>
            </div>

            <template #footer>
               <div class="flex justify-between items-center">
                  <USkeleton class="w-40 h-3" />

                  <div class="flex gap-2 items-center">
                     <USkeleton class="h-4 w-4" />

                     <USkeleton class="h-4 w-4" />

                     <USkeleton class="h-4 w-4" />
                  </div>
               </div>
            </template>
         </UCard>

         <UCard
            v-else-if="parts?.length"
            v-for="part in parts ?? []"
            :key="part.id"
            class="min-w-full md:min-w-96 cursor-pointer max-h-[90px]"
         >
            <div class="flex flex-col gap-2">
               <div class="flex justify-between items-center">
                  <p>{{ part.name }}</p>
                  <div class="flex gap-1">
                     <UButton icon="i-heroicons-trash-16-solid" variant="ghost" color="red" @click.stop="deletePart(part.id)" />
                  </div>
               </div>
               <div class="flex justify-between items-center">
                  <small>Aantal rijen</small>

                  <div class="flex gap-2 items-center">
                     <UButton
                        icon="i-heroicons-minus-16-solid"
                        variant="ghost"
                        color="red"
                        @click.stop="incrementOrDecrement(part, false)"
                     />
                     <p>{{ part.counter }}</p>
                     <UButton
                        icon="i-heroicons-plus-16-solid"
                        variant="ghost"
                        color="green"
                        @click.stop="incrementOrDecrement(part, true)"
                     />
                  </div>
               </div>
            </div>
         </UCard>

         <p v-else class="text-gray-400">Nog geen onderedelen</p>
      </div>

      <UButton
         class="fixed bottom-5 right-5"
         size="xl"
         square
         icon="i-heroicons-plus-16-solid"
         :ui="{ rounded: 'rounded-full' }"
         @click="showCeateProjectForm = true"
      />

      <ModalsPart v-model="showCeateProjectForm" @save-part="createPart" />
   </NuxtLayout>
</template>

<style lang="scss" scoped></style>
