<script setup lang="ts">
const { projectRouter } = useTrpcClient();

//#region List Projects
const { data, execute: refresh } = projectRouter.list.useQuery(undefined);
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
   await projectRouter.delete.mutate(id);
   refresh();
}
//#endregion
</script>

<template>
   <NuxtLayout :name="'default'">
      <UContainer>
         <h3 class="py-3">Projects</h3>

         <div v-auto-animate class="flex flex-col gap-3">
            <UCard v-for="project in data ?? []" :key="project.id">
               <div class="flex justify-between items-center">
                  <p>Project Title</p>
                  <div class="flex gap-1">
                     <UButton icon="i-heroicons-pencil-16-solid" variant="ghost" color="gray" @click="deleteProject(project.id)" />
                     <UButton icon="i-heroicons-trash-16-solid" variant="ghost" color="red" @click="deleteProject(project.id)" />
                  </div>
               </div>

               <template #footer>
                  <small> Status: Active </small>
               </template>
            </UCard>
         </div>
      </UContainer>

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
