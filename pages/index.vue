<script setup lang="ts">
const { projectRouter } = useTrpcClient();
const { promptConfirmation } = useConfirmation();

//#region List Projects
const { sorting, query } = useSorting();
const { data, execute: refresh } = projectRouter.list.useQuery(query, { watch: [query], deep: true });
//#endregion

//#region Create Project
const showCeateProjectForm = ref(false);

async function createProject(payload: { project: Parameters<typeof projectRouter.create.mutate>[0]; done: () => void }) {
   const response = await projectRouter.create.mutate(payload.project);
   if (response) refresh();
   showCeateProjectForm.value = false;
   payload.done();
}
//#endregion

//#region Delete Project
async function deleteProject(id: number) {
   promptConfirmation({
      title: 'Delete Project',
      description: 'Are you sure you want to delete this project?',
      onConfirm: async (done) => {
         await projectRouter.delete.mutate(id);
         done();
         if (data.value) {
            data.value = data.value?.filter((p) => p.id !== id);
         }
      },
   });
}
//#endregion
</script>

<template>
   <NuxtLayout :name="'default'">
      <LayoutHeading v-model:sorting="sorting" :title="'Projects'" />

      <div v-auto-animate class="flex flex-row flex-wrap gap-3 justify-center">
         <UCard
            v-if="data?.length"
            v-for="project in data ?? []"
            :key="project.id"
            class="min-w-full md:min-w-96 cursor-pointer max-h-[90px]"
            :ui="{ background: 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800' }"
            @click="$router.push({ name: 'projects-id', params: { id: project.id } })"
         >
            <div class="flex justify-between items-center">
               <p>{{ project.name }}</p>
               <div class="flex gap-1">
                  <UButton icon="i-heroicons-trash-16-solid" variant="ghost" color="red" @click.stop="deleteProject(project.id)" />
               </div>
            </div>

            <template #footer>
               <small> Status: Active </small>
            </template>
         </UCard>

         <p v-else class="text-gray-400">No projects added yet</p>
      </div>

      <UButton
         class="fixed bottom-5 right-5 dark:bg-pink-900 dark:text-white"
         size="xl"
         square
         icon="i-heroicons-plus-16-solid"
         :ui="{ rounded: 'rounded-full' }"
         @click="showCeateProjectForm = true"
      />

      <ModalsProject v-model="showCeateProjectForm" @save-project="createProject" />
   </NuxtLayout>
</template>
