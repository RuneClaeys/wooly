<script setup lang="ts">
import type { SelectProject } from '~/db/schema';

const { projectRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { t } = useI18n();
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');
const fabColor = computed(() => (isDark.value ? 'neutral' : 'primary'));
const fabVariant = computed(() => (isDark.value ? 'soft' : 'solid'));

//#region List Projects
const status = ref<'active' | 'finished'>('active');
const { sorting, query } = useSorting('projects');

const statusOptions = computed(() => [
   { label: t('generic.active'), value: 'active' },
   { label: t('generic.completed'), value: 'finished' },
]);

const input = computed(() => ({
   finished: status.value === 'finished',
   query: query.value,
}));

const { data, execute: refresh, pending, error } = projectRouter.list.useQuery(input, { watch: [input], deep: true });
//#endregion

//#region Create Project
const showCreateProjectForm = ref(false);

async function createProject(payload: { project: Parameters<typeof projectRouter.create.mutate>[0]; done: () => void }) {
   const response = await projectRouter.create.mutate(payload.project);
   if (response) refresh();
   showCreateProjectForm.value = false;
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
   <NuxtLayout>
      <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
         <LayoutHeading v-model:sorting="sorting" :title="$t('projects.project', 2)">
            <template #otherFilters>
               <USelect v-model="status" :items="statusOptions" size="md" class="w-full md:w-44" />
            </template>
         </LayoutHeading>

         <div v-if="error" class="wooly-shell px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {{ error.message }}
         </div>

         <div v-auto-animate class="grid grid-cols-1 gap-3" :class="{ 'opacity-80': pending }">
            <UCard
               v-for="project in data ?? []"
               :key="project.id"
               class="wooly-shell wooly-pop w-full cursor-pointer transition duration-200 hover:-translate-y-0.5"
               @click="$router.push({ name: 'projects-id', params: { id: project.id } })"
            >
               <div class="flex items-start justify-between gap-2">
                  <div class="space-y-2">
                     <p class="wooly-title text-base">{{ project.name }}</p>
                     <UBadge :color="project.finished ? 'neutral' : 'success'" variant="soft" size="sm">
                        {{ project.finished ? $t('generic.completed') : $t('generic.active') }}
                     </UBadge>
                  </div>

                  <div class="flex items-center gap-1">
                     <UButton
                        icon="i-heroicons-pencil-16-solid"
                        variant="ghost"
                        color="neutral"
                        size="md"
                        class="tap-target tap-target-icon"
                        :aria-label="$t('actions.edit-type', { type: $t('projects.project') })"
                        @click.stop="editProject(project)"
                     />
                     <UButton
                        icon="i-heroicons-trash-16-solid"
                        variant="ghost"
                        color="error"
                        size="md"
                        class="tap-target tap-target-icon"
                        :aria-label="$t('actions.delete-type', { type: $t('projects.project') })"
                        @click.stop="deleteProject(project.id)"
                     />
                  </div>
               </div>
            </UCard>
         </div>

         <div v-if="!pending && !data?.length" class="wooly-shell px-6 py-10 text-center">
            <p class="wooly-muted">{{ $t('generic.no-results-for-type', { type: $t('projects.project', 2) }) }}</p>
         </div>

         <UButton
            class="wooly-fab tap-target tap-target-icon"
            size="xl"
            icon="i-heroicons-plus-16-solid"
            :color="fabColor"
            :variant="fabVariant"
            :aria-label="$t('actions.create-type', { type: $t('projects.project') })"
            @click="showCreateProjectForm = true"
         />

         <ModalsProject v-model="showCreateProjectForm" @save-project="createProject" />
         <ModalsProject v-model="showEditProjectForm" :initial-project="projectToEdit" @save-project="changeProject" />
      </div>
   </NuxtLayout>
</template>
