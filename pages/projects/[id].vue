<script lang="ts" setup>
import type { SelectPart } from '~/db/schema';

//#region Globals
const toast = useToast();
const route = useRoute('projects-id');
const { projectRouter } = useTrpcClient();
//#endregion

//#region Get Project
const { data } = projectRouter.get.useQuery(+route.params.id);
//#endregion

//#region Add Part
const showCeateProjectForm = ref(false);

async function createPart(newPart: { name: string }) {
   const response = await projectRouter.partRouter.create.mutate({
      projectId: +route.params.id,
      name: newPart.name,
      count: 0,
   });

   if (response) data.value?.parts.push(response);
   showCeateProjectForm.value = false;
   toast.add({ title: 'Part created', description: 'Part has been created' });
}

async function deletePart(id: number) {
   await projectRouter.partRouter.delete.mutate(id);
   data.value!.parts = data.value!.parts.filter((part) => part.id !== id);
}

async function incrementOrDecrement(part: Required<SelectPart>, increment: boolean) {
   try {
      part.counter += increment ? 1 : -1;
      await projectRouter.partRouter.update.mutate({ ...part });
   } catch {
      part.counter -= increment ? 1 : -1;
   }
}

//#endregion
</script>

<template>
   <NuxtLayout :root="false" :title="data?.name ?? 'loading...'">
      <h3 class="py-3">Parts</h3>

      <div v-auto-animate class="flex flex-row flex-wrap gap-3 justify-center">
         <UCard v-for="part in data?.parts ?? []" :key="part.id" class="min-w-full md:min-w-96 cursor-pointer">
            <div class="flex justify-between items-center">
               <p>{{ part.name }}</p>
               <div class="flex gap-1">
                  <UButton icon="i-heroicons-trash-16-solid" variant="ghost" color="red" @click.stop="deletePart(part.id)" />
               </div>
            </div>

            <template #footer>
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
            </template>
         </UCard>
      </div>

      <UButton
         class="fixed bottom-5 right-5"
         size="xl"
         square
         icon="i-heroicons-plus-16-solid"
         :ui="{ rounded: 'rounded-full' }"
         @click="showCeateProjectForm = true"
      />

      <ModalsProject v-model="showCeateProjectForm" @save-project="createPart" />
   </NuxtLayout>
</template>

<style lang="scss" scoped></style>
