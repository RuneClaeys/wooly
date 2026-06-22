<script setup lang="ts">
import YearGoalsListSection from '~/components/year-goals/YearGoalsListSection.vue';
import { useToast } from '~/composables/useToast';
import type { SelectProject } from '~/db/schema';

const { yearGoalRouter, projectRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { success: showSuccessToast, error: showErrorToast } = useToast();
const { t } = useI18n();
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');
const fabColor = computed(() => (isDark.value ? 'neutral' : 'primary'));
const fabVariant = computed(() => (isDark.value ? 'soft' : 'solid'));

const selectedYear = ref(new Date().getFullYear());

const { data: yearOptionsData } = yearGoalRouter.yearOptions.useQuery();
const { data: yearSummaryData, execute: refreshYearSummary } = yearGoalRouter.yearSummary.useQuery();

const yearInput = computed(() => ({ year: selectedYear.value }));
const {
   data: goals,
   pending,
   execute: refreshGoals,
} = yearGoalRouter.listGoals.useQuery(yearInput, {
   watch: [yearInput],
   deep: true,
});

const { data: activeProjects } = projectRouter.list.useQuery({
   finished: false,
   query: { orderBy: 'updatedAt', order: 'asc' },
});
const { data: finishedProjects } = projectRouter.list.useQuery({
   finished: true,
   query: { orderBy: 'updatedAt', order: 'asc' },
});

const yearOptions = computed(() => {
   const base = yearOptionsData.value ?? [];
   const currentYear = new Date().getFullYear();

   if (!base.length) {
      return [currentYear + 1, currentYear, currentYear - 1];
   }

   return base;
});

function syncSelectedYearWithOptions(years: number[]) {
   if (!years.length) return;

   // Default to the most recent available year so existing goals are visible on first load.
   if (!years.includes(selectedYear.value)) {
      selectedYear.value = years[0];
   }
}

watch(yearOptions, syncSelectedYearWithOptions, { immediate: true });

const yearSelectItems = computed(() =>
   yearOptions.value.map((year) => {
      const summary = (yearSummaryData.value ?? []).find(
         (entry: { year: number; total: number; completed: number }) => entry.year === year,
      );
      const suffix = summary ? ` (${summary.completed}/${summary.total})` : '';
      return {
         label: `${year}${suffix}`,
         value: year,
      };
   }),
);

const allProjects = computed<SelectProject[]>(() => {
   const merged = [...(activeProjects.value ?? []), ...(finishedProjects.value ?? [])] as SelectProject[];
   const byId = new Map<number, SelectProject>();

   for (const project of merged) {
      if (!project.id || byId.has(project.id)) continue;
      byId.set(project.id, project);
   }

   return Array.from(byId.values());
});

const projectOptions = computed(() =>
   allProjects.value.map((project) => ({
      label: project.name ?? `#${project.id}`,
      value: project.id,
   })),
);

const showCreateGoal = ref(false);
const showEditGoal = ref(false);
const goalToEdit = ref<any | undefined>(undefined);

function buildAutoLabel(
   goal: {
      kind: 'projects_count' | 'yarn_balls_count' | 'specific_project_finish' | 'free_challenge';
      targetValue: number | null;
      linkedProjectId: number | null;
      label: string | null;
   },
   linkedProjectName: string | null,
) {
   const target = Math.max(1, Number(goal.targetValue) || 1);

   if (goal.kind === 'projects_count') {
      return t(target === 1 ? 'year-goals.auto-label-projects-singular' : 'year-goals.auto-label-projects-plural', { target });
   }

   if (goal.kind === 'yarn_balls_count') {
      return t(target === 1 ? 'year-goals.auto-label-yarn-singular' : 'year-goals.auto-label-yarn-plural', { target });
   }

   if (goal.kind === 'specific_project_finish') {
      if (!linkedProjectName) return goal.label;
      return t('year-goals.auto-label-specific-project', { projectName: linkedProjectName });
   }

   return goal.label;
}

function resolveProjectName(projectId: number | null) {
   if (!projectId) return null;
   const selected = allProjects.value.find((project) => project.id === projectId);
   return selected?.name ?? null;
}

async function createGoal(payload: {
   goal: {
      year: number;
      kind: 'projects_count' | 'yarn_balls_count' | 'specific_project_finish' | 'free_challenge';
      label: string | null;
      linkedProjectId: number | null;
      targetValue: number | null;
   };
   done: () => void;
}) {
   try {
      const linkedProjectName = resolveProjectName(payload.goal.linkedProjectId);
      const label = buildAutoLabel(payload.goal, linkedProjectName);

      await yearGoalRouter.createGoal.mutate({
         year: payload.goal.year,
         kind: payload.goal.kind,
         label,
         linkedProjectId: payload.goal.linkedProjectId,
         targetValue: payload.goal.targetValue,
      });

      payload.done();
      showCreateGoal.value = false;
      if (payload.goal.year !== selectedYear.value) {
         selectedYear.value = payload.goal.year;
      }

      await Promise.all([refreshGoals(), refreshYearSummary()]);
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

function editGoal(goal: any) {
   goalToEdit.value = { ...goal };
   showEditGoal.value = true;
}

async function updateGoal(payload: {
   goal: {
      year: number;
      kind: 'projects_count' | 'yarn_balls_count' | 'specific_project_finish' | 'free_challenge';
      label: string | null;
      linkedProjectId: number | null;
      targetValue: number | null;
   };
   done: () => void;
}) {
   if (!goalToEdit.value) return;

   try {
      const linkedProjectName = resolveProjectName(payload.goal.linkedProjectId);
      const label = buildAutoLabel(payload.goal, linkedProjectName);

      await yearGoalRouter.updateGoal.mutate({
         id: goalToEdit.value.id,
         year: payload.goal.year,
         kind: payload.goal.kind,
         label,
         linkedProjectId: payload.goal.linkedProjectId,
         targetValue: payload.goal.targetValue,
      });

      payload.done();
      showEditGoal.value = false;
      if (payload.goal.year !== selectedYear.value) {
         selectedYear.value = payload.goal.year;
      }

      await Promise.all([refreshGoals(), refreshYearSummary()]);
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function deleteGoal(goalId: number) {
   promptDeleteConfirmation(t('year-goals.goal'), async (done) => {
      try {
         await yearGoalRouter.deleteGoal.mutate(goalId);
         done();
         await Promise.all([refreshGoals(), refreshYearSummary()]);
         showSuccessToast(t('actions.delete'));
      } catch {
         showErrorToast(t('actions.confirm-delete-type', { type: t('year-goals.goal') }));
      }
   });
}

async function toggleManualCompletion(payload: { goalId: number; completed: boolean }) {
   try {
      await yearGoalRouter.setManualCompletion.mutate(payload);
      await Promise.all([refreshGoals(), refreshYearSummary()]);
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function setManualProgress(payload: { goalId: number; currentValue: number }) {
   try {
      await yearGoalRouter.setManualProgress.mutate(payload);
      await Promise.all([refreshGoals(), refreshYearSummary()]);
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function recomputeYearGoals() {
   try {
      await yearGoalRouter.recomputeYear.mutate(selectedYear.value);
      await Promise.all([refreshGoals(), refreshYearSummary()]);
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

function onYearChange(value: string | number | null) {
   if (value === null || value === undefined || value === '') return;
   selectedYear.value = Number(value);
}
</script>

<template>
   <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <div class="wooly-shell p-4">
         <FormSelect
            :model-value="selectedYear"
            :label="$t('year-goals.year')"
            :items="yearSelectItems"
            @update:model-value="onYearChange"
         />
      </div>

      <YearGoalsListSection
         :goals="goals"
         :pending="pending"
         :selected-year="selectedYear"
         @edit="editGoal"
         @delete="deleteGoal"
         @toggle-manual="toggleManualCompletion"
         @set-progress="setManualProgress"
         @recompute="recomputeYearGoals"
      />

      <UButton
         class="wooly-fab tap-target tap-target-icon"
         size="xl"
         icon="i-heroicons-plus-16-solid"
         :color="fabColor"
         :variant="fabVariant"
         :aria-label="$t('actions.create-type', { type: $t('year-goals.goal') })"
         @click="showCreateGoal = true"
      />

      <ModalsYearGoal
         v-model="showCreateGoal"
         :projects="projectOptions"
         :year-options="yearOptions"
         :selected-year="selectedYear"
         @save-goal="createGoal"
      />
      <ModalsYearGoal
         v-model="showEditGoal"
         :projects="projectOptions"
         :year-options="yearOptions"
         :selected-year="selectedYear"
         :initial-goal="goalToEdit"
         @save-goal="updateGoal"
      />
   </div>
</template>
