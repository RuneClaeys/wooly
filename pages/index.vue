<script setup lang="ts">
import type { SelectProject } from '~/db/schema';

const { projectRouter, skeinRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { t } = useI18n();
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');
const fabColor = computed(() => (isDark.value ? 'neutral' : 'primary'));
const fabVariant = computed(() => (isDark.value ? 'soft' : 'solid'));

//#region List Projects
const status = ref<'active' | 'finished'>('active');
const { sorting, query } = useSorting('projects');

const input = computed(() => ({
   finished: status.value === 'finished',
   query: query.value,
}));

const { data, execute: refresh, pending, error } = projectRouter.list.useQuery(input, { watch: [input], deep: true });
//#endregion

const { data: skeinSummary } = skeinRouter.summary.useQuery();
type SkeinSummaryRow = { skeinId: number; skeinName: string; projectCount: number; totalCounter: number };

const totalSkeinsUsed = computed<number>(() =>
   (skeinSummary.value ?? []).reduce((total: number, skein: SkeinSummaryRow) => total + (skein.totalCounter ?? 0), 0),
);
const showSkeinInsights = ref(false);

function openProject(id: number) {
   navigateTo({ name: 'projects-id', params: { id } });
}

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
      data.value = data.value?.filter((project: SelectProject) => project.id !== id);
   });
}
//#endregion
</script>

<template>
   <NuxtLayout>
      <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
         <ProjectListSection
            v-model:sorting="sorting"
            v-model:status="status"
            :projects="data"
            :pending="pending"
            :error-message="error?.message ?? null"
            @create-project="showCreateProjectForm = true"
            @open-project="openProject"
            @edit-project="editProject"
            @delete-project="deleteProject"
         />

         <div class="wooly-shell p-3 md:p-4 space-y-3">
            <div class="flex items-center justify-between rounded-lg px-2 py-2 bg-primary-50/70 dark:bg-primary-950/25">
               <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-squares-plus-16-solid" class="h-4 w-4 text-primary-500" />
                  <span class="text-sm wooly-title">{{ $t('bingo.board', 2) }}</span>
               </div>

               <UButton
                  size="xs"
                  icon="i-heroicons-arrow-right-16-solid"
                  variant="soft"
                  color="primary"
                  :label="$t('actions.open-type', { type: $t('bingo.board', 2) })"
                  @click="navigateTo('/bingo')"
               />
            </div>

            <button
               class="w-full flex items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-pink-50/70 dark:hover:bg-pink-950/30 transition-colors"
               type="button"
               @click="showSkeinInsights = !showSkeinInsights"
            >
               <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-chart-bar-square-16-solid" class="h-4 w-4 text-primary-500" />
                  <span class="text-sm wooly-title">{{ $t('home.skein-insights') }}</span>
                  <UBadge color="primary" variant="soft" size="xs">{{ totalSkeinsUsed }}</UBadge>
               </div>

               <UIcon
                  :name="showSkeinInsights ? 'i-heroicons-chevron-up-16-solid' : 'i-heroicons-chevron-down-16-solid'"
                  class="h-4 w-4 wooly-muted"
               />
            </button>

            <ProjectSkeinSummarySection
               v-if="showSkeinInsights"
               :skein-summary="skeinSummary as SkeinSummaryRow[] | undefined"
               :total="totalSkeinsUsed"
               :show-heading="false"
               :compact="true"
            />
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
