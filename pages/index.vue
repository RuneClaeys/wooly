<script setup lang="ts">
const { projectRouter } = useTrpcClient();
const { promptConfirmation } = useConfirmation();

//#region List Projects
const { sorting, query } = useSorting();
const { data } = projectRouter.list.useQuery(query, { watch: [query], deep: true });
//#endregion

//#region Create Project
const showCeateProjectForm = ref(false);

async function createProject(newProject: Parameters<typeof projectRouter.create.mutate>[0]) {
   const response = await projectRouter.create.mutate(newProject);
   if (response) {
      data.value?.push(response);
   }
   showCeateProjectForm.value = false;
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
            v-for="project in data ?? []"
            :key="project.id"
            class="min-w-full md:min-w-96 cursor-pointer"
            @click="$router.push({ name: 'projects-id', params: { id: project.id } })"
         >
            <div class="flex justify-between items-center">
               <p>{{ project.name }}</p>
               <div class="flex gap-1">
                  <!-- <UButton icon="i-heroicons-pencil-16-solid" variant="ghost" color="gray" @click.stop="deleteProject(project.id)" /> -->
                  <UButton icon="i-heroicons-trash-16-solid" variant="ghost" color="red" @click.stop="deleteProject(project.id)" />
               </div>
            </div>

            <template #footer>
               <small> Status: Active </small>
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

      <ModalsProject v-model="showCeateProjectForm" @save-project="createProject" />
   </NuxtLayout>
</template>
