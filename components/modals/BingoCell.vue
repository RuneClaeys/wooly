<script setup lang="ts">
const { t } = useI18n();

interface ProjectOption {
   label: string;
   value: number;
}

interface InitialCell {
   id: number;
   position: number;
   kind: 'project_finish' | 'parts_count' | 'skeins_count' | 'free_text';
   label: string | null;
   linkedProjectId: number | null;
   linkedPartIds: number[] | null;
   targetValue: number | null;
}

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{
   projects: ProjectOption[];
   initialCell?: InitialCell;
   lockedPosition?: number;
   totalPositions: number;
   occupiedPositions: number[];
}>();

const emit = defineEmits<{
   (
      e: 'save-cell',
      payload: {
         cell: {
            position: number;
            kind: 'project_finish' | 'parts_count' | 'skeins_count' | 'free_text';
            label: string | null;
            linkedProjectId: number | null;
            linkedPartIds: number[] | null;
            selectedPartNames: string[];
            targetValue: number | null;
            newProjectName: string | null;
         };
         done: () => void;
      },
   ): void;
}>();

const cell = ref({
   position: props.initialCell?.position ?? props.lockedPosition ?? 1,
   kind: props.initialCell?.kind ?? 'free_text',
   label: props.initialCell?.label ?? '',
   linkedProjectId: props.initialCell?.linkedProjectId ?? null,
   linkedPartIds: props.initialCell?.linkedPartIds ?? [],
   targetValue: props.initialCell?.targetValue ?? 1,
   newProjectName: '',
});

const { partRouter } = useTrpcClient();
const projectParts = ref<Array<{ id: number; name: string | null }>>([]);

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

function syncCellFromInitialCell(initialCell?: InitialCell) {
   cell.value = {
      position: initialCell?.position ?? props.lockedPosition ?? 1,
      kind: initialCell?.kind ?? 'free_text',
      label: initialCell?.label ?? '',
      linkedProjectId: initialCell?.linkedProjectId ?? null,
      linkedPartIds: initialCell?.linkedPartIds ?? [],
      targetValue: initialCell?.targetValue ?? 1,
      newProjectName: '',
   };
   projectMode.value = initialCell?.linkedProjectId ? 'existing' : 'existing';
   partGoalMode.value = initialCell?.linkedPartIds?.length ? 'specific' : 'amount';
   errors.value = {};
}

function syncPositionFromLockedPosition(lockedPosition?: number) {
   if (!props.initialCell && lockedPosition) {
      cell.value.position = lockedPosition;
   }
}

watch(() => props.initialCell, syncCellFromInitialCell);

watch(() => props.lockedPosition, syncPositionFromLockedPosition);

const kindOptions = computed(() => [
   { label: t('bingo.kind-project'), value: 'project_finish' },
   { label: t('bingo.kind-parts'), value: 'parts_count' },
   { label: t('bingo.kind-skeins'), value: 'skeins_count' },
   { label: t('bingo.kind-free'), value: 'free_text' },
]);

const positionOptions = computed(() => {
   const currentPosition = props.initialCell?.position ?? props.lockedPosition;
   return Array.from({ length: props.totalPositions }, (_, i) => i + 1)
      .filter((pos) => pos === currentPosition || !props.occupiedPositions.includes(pos))
      .map((pos) => ({ label: String(pos), value: pos }));
});

const showProjectSelector = computed(() => cell.value.kind === 'project_finish' || cell.value.kind === 'parts_count');
const showTarget = computed(() => cell.value.kind === 'skeins_count' || (cell.value.kind === 'parts_count' && partGoalMode.value === 'amount'));
const autoLabelKind = computed(
   () => cell.value.kind === 'project_finish' || cell.value.kind === 'parts_count' || cell.value.kind === 'skeins_count',
);
const showLabelField = computed(() => !autoLabelKind.value);
const isPartsGoal = computed(() => cell.value.kind === 'parts_count');
const selectedProjectId = computed(() => (projectMode.value === 'existing' ? cell.value.linkedProjectId : null));
const canCreateProjectInline = computed(() => cell.value.kind === 'project_finish');

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
   () => [selectedProjectId.value, isPartsGoal.value] as const,
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

const selectedPartNames = computed(() => {
   const selectedIds = new Set(cell.value.linkedPartIds ?? []);
   return partOptions.value.filter((option) => selectedIds.has(Number(option.value))).map((option) => option.label);
});

const selectedProjectName = computed(() => {
   if (projectMode.value === 'new') return cell.value.newProjectName.trim();
   const selected = props.projects.find((project) => project.value === cell.value.linkedProjectId);
   return selected?.label?.trim() ?? '';
});

const autoLabelPreview = computed(() => {
   const target = Math.max(1, Number(cell.value.targetValue) || 1);

   if (cell.value.kind === 'skeins_count') {
      return t(target === 1 ? 'bingo.auto-label-skeins-singular' : 'bingo.auto-label-skeins-plural', { target });
   }

   const projectName = selectedProjectName.value;
   if (!projectName) return '';

   if (cell.value.kind === 'project_finish') {
      return t('bingo.auto-label-project', { projectName });
   }

   if (cell.value.kind === 'parts_count') {
      if (partGoalMode.value === 'specific' && selectedPartNames.value.length) {
         const previewNames = selectedPartNames.value.slice(0, 2);
         const hiddenCount = selectedPartNames.value.length - previewNames.length;
         if (hiddenCount > 0) {
            return t('bingo.auto-label-parts-specific-more', {
               partNames: previewNames.join(', '),
               extraCount: hiddenCount,
            });
         }

         return t('bingo.auto-label-parts-specific', {
            partNames: previewNames.join(', '),
         });
      }

      return t(target === 1 ? 'bingo.auto-label-parts-singular' : 'bingo.auto-label-parts-plural', {
         target,
         projectName,
      });
   }

   return '';
});

const projectMode = ref<'existing' | 'new'>(props.initialCell?.linkedProjectId ? 'existing' : 'existing');
const partGoalMode = ref<'amount' | 'specific'>(props.initialCell?.linkedPartIds?.length ? 'specific' : 'amount');

function syncProjectFieldsForMode(mode: 'existing' | 'new') {
   if (mode === 'existing') {
      cell.value.newProjectName = '';
   } else {
      cell.value.linkedProjectId = null;
      cell.value.linkedPartIds = [];
   }
}

watch(projectMode, syncProjectFieldsForMode);

function syncModesForKind(kind: typeof cell.value.kind) {
   if (kind === 'parts_count') {
      projectMode.value = 'existing';
      if (partGoalMode.value === 'specific') {
         cell.value.targetValue = 1;
      } else {
         cell.value.linkedPartIds = [];
      }
      return;
   }

   partGoalMode.value = 'amount';
   cell.value.linkedPartIds = [];
}

watch(() => cell.value.kind, syncModesForKind);

function syncPartFieldsForMode(mode: 'amount' | 'specific') {
   if (mode === 'specific') {
      cell.value.targetValue = 1;
      return;
   }

   cell.value.linkedPartIds = [];
}

watch(partGoalMode, syncPartFieldsForMode);

function syncSelectedPartsWithProject(projectId: number | null) {
   if (!projectId) {
      cell.value.linkedPartIds = [];
   }
}

watch(selectedProjectId, syncSelectedPartsWithProject);

const title = computed(() =>
   props.initialCell ? t('actions.edit-type', { type: t('bingo.cell') }) : t('actions.create-type', { type: t('bingo.cell') }),
);

function validate() {
   errors.value = {};

   if (cell.value.position < 1) {
      errors.value.position = t('form.field-required');
   }

   if (showProjectSelector.value && !cell.value.linkedProjectId && !cell.value.newProjectName.trim()) {
      errors.value.linkedProjectId = t('bingo.select-or-create-project');
   }

   if (isPartsGoal.value && !cell.value.linkedProjectId) {
      errors.value.linkedProjectId = t('bingo.select-project');
   }

   if (showTarget.value && (!cell.value.targetValue || cell.value.targetValue < 1)) {
      errors.value.targetValue = t('bingo.target-min');
   }

   if (isPartsGoal.value && partGoalMode.value === 'specific' && !cell.value.linkedPartIds.length) {
      errors.value.linkedPartIds = t('bingo.select-parts');
   }

   if (showLabelField.value && !cell.value.label.trim()) {
      errors.value.label = t('form.field-required');
   }

   return Object.keys(errors.value).length === 0;
}

function onSubmit() {
   if (!validate()) return;

   isSubmitting.value = true;
   emit('save-cell', {
      cell: {
         position: cell.value.position,
         kind: cell.value.kind,
         label: showLabelField.value ? cell.value.label.trim() || null : null,
         linkedProjectId: cell.value.linkedProjectId,
         linkedPartIds: isPartsGoal.value && partGoalMode.value === 'specific' ? cell.value.linkedPartIds : null,
         selectedPartNames: isPartsGoal.value && partGoalMode.value === 'specific' ? selectedPartNames.value : [],
         targetValue: showTarget.value ? cell.value.targetValue : null,
         newProjectName: cell.value.newProjectName.trim() || null,
      },
      done: () => {
         isSubmitting.value = false;
         if (!props.initialCell) {
            cell.value = {
               position: props.lockedPosition ?? 1,
               kind: 'free_text',
               label: '',
               linkedProjectId: null,
               linkedPartIds: [],
               targetValue: 1,
               newProjectName: '',
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
                  :model-value="cell.position"
                  :label="$t('bingo.position')"
                  :items="positionOptions"
                  :error="errors.position"
                  :disabled="Boolean(lockedPosition)"
                  @update:model-value="(val) => (cell.position = Number(val))"
               />

               <FormSelect
                  :model-value="cell.kind"
                  :label="$t('bingo.kind')"
                  :items="kindOptions"
                  @update:model-value="(val) => (cell.kind = val as typeof cell.kind)"
               />
            </div>

            <FormField
               v-if="showLabelField"
               :model-value="cell.label"
               :label="$t('bingo.label')"
               :error="errors.label"
               :placeholder="$t('bingo.label-placeholder')"
               @update:model-value="(val) => (cell.label = String(val))"
            />

            <div v-if="showProjectSelector" class="space-y-3">
               <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {{ $t('bingo.project-link') }}
               </label>

               <!-- Toggle between existing / new -->
               <div v-if="canCreateProjectInline" class="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                  <button
                     type="button"
                     :class="[
                        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all tap-target',
                        projectMode === 'existing'
                           ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                           : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
                     ]"
                     @click="projectMode = 'existing'"
                  >
                     {{ $t('bingo.project-existing') }}
                  </button>
                  <button
                     type="button"
                     :class="[
                        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all tap-target',
                        projectMode === 'new'
                           ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                           : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
                     ]"
                     @click="projectMode = 'new'"
                  >
                     {{ $t('bingo.project-new') }}
                  </button>
               </div>

               <div v-if="isPartsGoal" class="space-y-1.5">
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('bingo.parts-mode') }}</label>
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
                        {{ $t('bingo.parts-mode-amount') }}
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
                        {{ $t('bingo.parts-mode-specific') }}
                     </button>
                  </div>
               </div>

               <!-- Existing project select -->
               <FormSelect
                  v-if="projectMode === 'existing'"
                  :model-value="cell.linkedProjectId"
                  :label="''"
                  :items="projects"
                  :placeholder="$t('bingo.project-link-placeholder')"
                  :error="errors.linkedProjectId"
                  @update:model-value="(val) => (cell.linkedProjectId = val as number | null)"
               />

               <!-- New project name -->
               <FormField
                  v-else-if="canCreateProjectInline"
                  :model-value="cell.newProjectName"
                  :label="''"
                  :placeholder="$t('bingo.create-project-inline-placeholder')"
                  :error="errors.linkedProjectId"
                  @update:model-value="(val) => (cell.newProjectName = String(val))"
               />

               <div v-if="isPartsGoal && partGoalMode === 'specific'" class="space-y-1.5">
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('bingo.parts-select') }}</label>
                  <USelectMenu
                     :model-value="cell.linkedPartIds"
                     :items="partOptions"
                     value-key="value"
                     :placeholder="$t('bingo.parts-select-placeholder')"
                     multiple
                     class="w-full"
                     @update:model-value="(val) => (cell.linkedPartIds = ((val ?? []) as number[]))"
                  />
                  <p v-if="errors.linkedPartIds" class="text-xs text-error-600 dark:text-error-400 leading-tight">{{ errors.linkedPartIds }}</p>
               </div>

               <div
                  v-if="autoLabelKind"
                  class="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-200"
               >
                  <p class="font-medium">{{ $t('bingo.auto-label') }}</p>
                  <p>{{ autoLabelPreview || $t('bingo.auto-label-missing-project') }}</p>
               </div>
            </div>

            <FormField
               v-if="showTarget"
               :model-value="cell.targetValue"
               :label="$t('bingo.target')"
               :error="errors.targetValue"
               type="number"
               :min="1"
               show-stepper
               :decrement-aria-label="$t('actions.decrease-count', { type: $t('bingo.target') })"
               :increment-aria-label="$t('actions.increase-count', { type: $t('bingo.target') })"
               @update:model-value="(val) => (cell.targetValue = Number(val))"
            />
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
