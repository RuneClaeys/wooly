<script setup lang="ts">
const { t } = useI18n();

interface ProjectOption {
   label: string;
   value: number;
}

interface InitialGoal {
   id: number;
   year: number;
   kind: 'projects_count' | 'yarn_balls_count' | 'specific_project_finish' | 'parts_count' | 'free_challenge';
   label: string | null;
   linkedProjectId: number | null;
   linkedPartIds: number[] | null;
   targetValue: number | null;
}

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{
   projects: ProjectOption[];
   yearOptions: number[];
   selectedYear: number;
   initialGoal?: InitialGoal;
}>();

const emit = defineEmits<{
   (
      e: 'save-goal',
      payload: {
         goal: {
            year: number;
            kind: 'projects_count' | 'yarn_balls_count' | 'specific_project_finish' | 'parts_count' | 'free_challenge';
            label: string | null;
            linkedProjectId: number | null;
            linkedPartIds: number[] | null;
            selectedPartNames: string[];
            targetValue: number | null;
         };
         done: () => void;
      },
   ): void;
}>();

const goal = ref({
   year: props.initialGoal?.year ?? props.selectedYear,
   kind: props.initialGoal?.kind ?? ('free_challenge' as const),
   label: props.initialGoal?.label ?? '',
   linkedProjectId: props.initialGoal?.linkedProjectId ?? null,
   linkedPartIds: props.initialGoal?.linkedPartIds ?? [],
   targetValue: props.initialGoal?.targetValue ?? 1,
});

const partGoalMode = ref<'amount' | 'specific'>(props.initialGoal?.linkedPartIds?.length ? 'specific' : 'amount');
const { partRouter } = useTrpcClient();
const projectParts = ref<Array<{ id: number; name: string | null }>>([]);

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

function syncGoalFromInitialGoal(initialGoal?: InitialGoal) {
   goal.value = {
      year: initialGoal?.year ?? props.selectedYear,
      kind: initialGoal?.kind ?? 'free_challenge',
      label: initialGoal?.label ?? '',
      linkedProjectId: initialGoal?.linkedProjectId ?? null,
      linkedPartIds: initialGoal?.linkedPartIds ?? [],
      targetValue: initialGoal?.targetValue ?? 1,
   };
   partGoalMode.value = initialGoal?.linkedPartIds?.length ? 'specific' : 'amount';
   errors.value = {};
}

function syncGoalYearWithSelectedYear(selectedYear: number) {
   if (!props.initialGoal) {
      goal.value.year = selectedYear;
   }
}

watch(() => props.initialGoal, syncGoalFromInitialGoal);

watch(() => props.selectedYear, syncGoalYearWithSelectedYear);

const kindOptions = computed(() => [
   { label: t('year-goals.kind-projects-count'), value: 'projects_count' },
   { label: t('year-goals.kind-yarn-balls-count'), value: 'yarn_balls_count' },
   { label: t('year-goals.kind-specific-project-finish'), value: 'specific_project_finish' },
   { label: t('year-goals.kind-parts-count'), value: 'parts_count' },
   { label: t('year-goals.kind-free-challenge'), value: 'free_challenge' },
]);

const yearSelectOptions = computed(() => props.yearOptions.map((year) => ({ label: String(year), value: year })));
const isPartsGoal = computed(() => goal.value.kind === 'parts_count');
const showTarget = computed(
   () =>
      goal.value.kind === 'projects_count' ||
      goal.value.kind === 'yarn_balls_count' ||
      (isPartsGoal.value && partGoalMode.value === 'amount'),
);
const showProject = computed(() => goal.value.kind === 'specific_project_finish' || isPartsGoal.value);
const showLabel = computed(() => goal.value.kind === 'free_challenge');

async function fetchProjectParts(projectId: number | null) {
   if (!projectId || !isPartsGoal.value) {
      projectParts.value = [];
      return;
   }

   try {
      projectParts.value = await partRouter.list.query({
         projectId,
         sorting: { orderBy: 'createdAt', order: 'asc' },
      });
   } catch {
      projectParts.value = [];
   }
}

watch(
   () => [goal.value.linkedProjectId, isPartsGoal.value] as const,
   ([projectId, partsGoal]) => {
      if (!partsGoal) {
         projectParts.value = [];
         return;
      }

      void fetchProjectParts(projectId);
   },
   { immediate: true },
);

const partOptions = computed(() =>
   (projectParts.value ?? []).map((part: { id: number; name: string | null }) => ({
      label: part.name?.trim() || `#${part.id}`,
      value: part.id,
   })),
);

type PartOption = {
   label: string;
   value: number;
};

const selectedPartNames = computed(() => {
   const selectedIds = new Set(goal.value.linkedPartIds ?? []);
   return partOptions.value.filter((option: PartOption) => selectedIds.has(Number(option.value))).map((option: PartOption) => option.label);
});

const selectedProjectName = computed(() => {
   const selected = props.projects.find((project) => project.value === goal.value.linkedProjectId);
   return selected?.label ?? '';
});

const autoLabelPreview = computed(() => {
   const target = Math.max(1, Number(goal.value.targetValue) || 1);

   if (goal.value.kind === 'projects_count') {
      return t(target === 1 ? 'year-goals.auto-label-projects-singular' : 'year-goals.auto-label-projects-plural', { target });
   }

   if (goal.value.kind === 'yarn_balls_count') {
      return t(target === 1 ? 'year-goals.auto-label-yarn-singular' : 'year-goals.auto-label-yarn-plural', { target });
   }

   if (goal.value.kind === 'specific_project_finish') {
      if (!selectedProjectName.value) return '';
      return t('year-goals.auto-label-specific-project', { projectName: selectedProjectName.value });
   }

   if (goal.value.kind === 'parts_count') {
      if (partGoalMode.value === 'specific' && selectedPartNames.value.length) {
         const previewNames = selectedPartNames.value.slice(0, 2);
         const hiddenCount = selectedPartNames.value.length - previewNames.length;
         if (hiddenCount > 0) {
            return t('year-goals.auto-label-parts-specific-more', {
               partNames: previewNames.join(', '),
               extraCount: hiddenCount,
            });
         }

         return t('year-goals.auto-label-parts-specific', {
            partNames: previewNames.join(', '),
         });
      }

      if (!selectedProjectName.value) return '';
      return t(target === 1 ? 'year-goals.auto-label-parts-singular' : 'year-goals.auto-label-parts-plural', {
         target,
         projectName: selectedProjectName.value,
      });
   }

   return '';
});

const title = computed(() =>
   props.initialGoal ? t('actions.edit-type', { type: t('year-goals.goal') }) : t('actions.create-type', { type: t('year-goals.goal') }),
);

function syncPartGoalState(kind: typeof goal.value.kind) {
   if (kind !== 'parts_count') {
      goal.value.linkedPartIds = [];
      partGoalMode.value = 'amount';
      return;
   }

   if (partGoalMode.value === 'specific') {
      goal.value.targetValue = 1;
      return;
   }

   goal.value.linkedPartIds = [];
}

watch(() => goal.value.kind, syncPartGoalState);

function syncPartsMode(mode: 'amount' | 'specific') {
   if (mode === 'specific') {
      goal.value.targetValue = 1;
      return;
   }

   goal.value.linkedPartIds = [];
}

watch(partGoalMode, syncPartsMode);

function syncSelectedPartsWithProject(projectId: number | null) {
   if (!projectId || !isPartsGoal.value) {
      goal.value.linkedPartIds = [];
   }
}

watch(() => goal.value.linkedProjectId, syncSelectedPartsWithProject);

function validate() {
   errors.value = {};

   if (!goal.value.year) {
      errors.value.year = t('form.field-required');
   }

   if (showTarget.value && (!goal.value.targetValue || goal.value.targetValue < 1)) {
      errors.value.targetValue = t('year-goals.target-min');
   }

   if (showProject.value && !goal.value.linkedProjectId) {
      errors.value.linkedProjectId = t('year-goals.select-project');
   }

   if (isPartsGoal.value && partGoalMode.value === 'specific' && !goal.value.linkedPartIds.length) {
      errors.value.linkedPartIds = t('year-goals.select-parts');
   }

   if (showLabel.value && !goal.value.label.trim()) {
      errors.value.label = t('form.field-required');
   }

   return Object.keys(errors.value).length === 0;
}

function onSubmit() {
   if (!validate()) return;

   isSubmitting.value = true;
   emit('save-goal', {
      goal: {
         year: goal.value.year,
         kind: goal.value.kind,
         label: showLabel.value ? goal.value.label.trim() || null : null,
         linkedProjectId: showProject.value ? goal.value.linkedProjectId : null,
         linkedPartIds: isPartsGoal.value && partGoalMode.value === 'specific' ? goal.value.linkedPartIds : null,
         selectedPartNames: isPartsGoal.value && partGoalMode.value === 'specific' ? selectedPartNames.value : [],
         targetValue: showTarget.value ? goal.value.targetValue : null,
      },
      done: () => {
         isSubmitting.value = false;
         if (!props.initialGoal) {
            goal.value = {
               year: props.selectedYear,
               kind: 'free_challenge',
               label: '',
               linkedProjectId: null,
               linkedPartIds: [],
               targetValue: 1,
            };
         }
         open.value = false;
      },
   });
}
</script>

<template>
   <ResponsiveModal v-model:open="open" :title="title" :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-xl' }">
      <template #body>
         <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
               <FormSelect
                  :model-value="goal.year"
                  :label="$t('year-goals.year')"
                  :items="yearSelectOptions"
                  :error="errors.year"
                  @update:model-value="(val) => (goal.year = Number(val))"
               />

               <FormSelect
                  :model-value="goal.kind"
                  :label="$t('year-goals.preset')"
                  :items="kindOptions"
                  @update:model-value="(val) => (goal.kind = val as typeof goal.kind)"
               />
            </div>

            <FormField
               v-if="showTarget && !isPartsGoal"
               :model-value="goal.targetValue"
               :label="$t('year-goals.target')"
               :error="errors.targetValue"
               type="number"
               :min="1"
               show-stepper
               :decrement-aria-label="$t('actions.decrease-count', { type: $t('year-goals.target') })"
               :increment-aria-label="$t('actions.increase-count', { type: $t('year-goals.target') })"
               @update:model-value="(val) => (goal.targetValue = Number(val))"
            />

            <FormSelect
               v-if="showProject"
               :model-value="goal.linkedProjectId"
               :label="$t('year-goals.project-link')"
               :items="projects"
               :error="errors.linkedProjectId"
               :placeholder="$t('year-goals.project-link-placeholder')"
               @update:model-value="(val) => (goal.linkedProjectId = val as number | null)"
            />

            <div v-if="isPartsGoal" class="space-y-3">
               <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('year-goals.parts-mode') }}</label>
                  <div class="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                     <button
                        type="button"
                        :class="[
                           'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all tap-target',
                           partGoalMode === 'amount'
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
                        ]"
                        @click="partGoalMode = 'amount'"
                     >
                        {{ $t('year-goals.parts-mode-amount') }}
                     </button>
                     <button
                        type="button"
                        :class="[
                           'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all tap-target',
                           partGoalMode === 'specific'
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
                        ]"
                        @click="partGoalMode = 'specific'"
                     >
                        {{ $t('year-goals.parts-mode-specific') }}
                     </button>
                  </div>
               </div>

               <FormField
                  v-if="partGoalMode === 'amount'"
                  :model-value="goal.targetValue"
                  :label="$t('year-goals.target')"
                  :error="errors.targetValue"
                  type="number"
                  :min="1"
                  show-stepper
                  :decrement-aria-label="$t('actions.decrease-count', { type: $t('year-goals.target') })"
                  :increment-aria-label="$t('actions.increase-count', { type: $t('year-goals.target') })"
                  @update:model-value="(val) => (goal.targetValue = Number(val))"
               />

               <div v-if="partGoalMode === 'specific'" class="space-y-1.5">
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('year-goals.parts-select') }}</label>
                  <USelectMenu
                     :model-value="goal.linkedPartIds"
                     :items="partOptions"
                     value-key="value"
                     :placeholder="$t('year-goals.parts-select-placeholder')"
                     multiple
                     class="w-full"
                     @update:model-value="(val) => (goal.linkedPartIds = (val ?? []) as number[])"
                  />
                  <p v-if="errors.linkedPartIds" class="text-xs text-error-600 dark:text-error-400 leading-tight">
                     {{ errors.linkedPartIds }}
                  </p>
               </div>
            </div>

            <FormField
               v-if="showLabel"
               :model-value="goal.label"
               :label="$t('year-goals.label')"
               :error="errors.label"
               :placeholder="$t('year-goals.label-placeholder')"
               @update:model-value="(val) => (goal.label = String(val))"
            />

            <div
               v-if="!showLabel"
               class="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-200"
            >
               <p class="font-medium">{{ $t('year-goals.auto-label') }}</p>
               <p>{{ autoLabelPreview || $t('year-goals.auto-label-missing-project') }}</p>
            </div>
         </div>
      </template>

      <template #footer>
         <div class="flex justify-end gap-2">
            <UButton class="tap-target" variant="soft" color="neutral" :disabled="isSubmitting" @click="open = false">
               {{ $t('actions.cancel') }}
            </UButton>
            <UButton class="tap-target" color="primary" :loading="isSubmitting" :disabled="isSubmitting" @click="onSubmit">
               {{ $t('actions.save') }}
            </UButton>
         </div>
      </template>
   </ResponsiveModal>
</template>
