<script setup lang="ts">
import type { SelectProject } from '~/db/schema';

const { projectRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { t } = useI18n();

//#region List Projects
const status = ref<'active' | 'finished'>('active');
const { sorting, query } = useSorting('projects');

const input = computed(() => ({
   finished: status.value === 'finished',
   query: query.value,
}));

const { data, execute: refresh, pending } = projectRouter.list.useQuery(input, { watch: [input], deep: true });
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

//#region Edit Project
const showEditProjectForm = ref(false);
const projectToEdit = ref<SelectProject | undefined>(undefined);

async function changeProject(payload: { project: { name: string; finished: boolean }; done: () => void }) {
   const response = await projectRouter.update.mutate({ ...payload.project, id: projectToEdit.value!.id });
   if (response) refresh();
   showEditProjectForm.value = false;
   payload.done();
}

function editProject(project: SelectProject) {
   projectToEdit.value = { ...project };
   showEditProjectForm.value = true;
}

//#endregion

//#region Delete Project
async function deleteProject(id: number) {
   promptDeleteConfirmation(t('projects.project'), async (done) => {
      await projectRouter.delete.mutate(id);
      done();
      if (data.value) {
         data.value = data.value?.filter((p) => p.id !== id);
      }
   });
}
//#endregion
</script>

<template>
   <div>
      <NuxtLayout :name="'default'">
         <LayoutHeading v-model:sorting="sorting" :title="$t('projects.project', 2)">
            <template #otherFilters>
               <USelect
                  v-model="status"
                  :options="[
                     { name: t('generic.active'), value: 'active' },
                     { name: t('generic.completed'), value: 'finished' },
                  ]"
                  :size="'2xs'"
                  option-attribute="name"
               />
            </template>
         </LayoutHeading>

         <div v-auto-animate class="flex flex-row flex-wrap gap-3 justify-center">
            <UCard
               v-if="data?.length"
               v-for="project in data ?? []"
               :key="project.id"
               class="min-w-full md:min-w-96 cursor-pointer max-h-[90px]"
               :ui="{ background: 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800' }"
               @click="$router.push({ name: 'projects-id', params: { id: project.id } })"
            >
               <div class="flex flex-col">
                  <div class="flex justify-between items-center">
                     <p>{{ project.name }}</p>
                     <div class="flex gap-1">
                        <UButton icon="i-heroicons-pencil-16-solid" variant="ghost" color="grey" @click.stop="editProject(project)" />
                        <UButton icon="i-heroicons-trash-16-solid" variant="ghost" color="red" @click.stop="deleteProject(project.id)" />
                     </div>
                  </div>
                  <small>{{ $t('generic.status') }}: {{ project.finished ? 'Afgewerkt' : 'Actief' }}</small>
               </div>
            </UCard>

            <p v-else-if="!pending" class="text-gray-400">{{ $t('generic.no-results-for-type', { type: $t('projects.project', 2) }) }}</p>
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
         <ModalsProject v-model="showEditProjectForm" :initial-project="projectToEdit" @save-project="changeProject" />
      </NuxtLayout>
   </div>
</template>
