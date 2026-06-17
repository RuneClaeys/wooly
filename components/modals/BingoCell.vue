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
   targetValue: number | null;
}

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{
   projects: ProjectOption[];
   initialCell?: InitialCell;
   lockedPosition?: number;
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
   targetValue: props.initialCell?.targetValue ?? 1,
   newProjectName: '',
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

watch(
   () => props.initialCell,
   (initialCell) => {
      cell.value = {
         position: initialCell?.position ?? props.lockedPosition ?? 1,
         kind: initialCell?.kind ?? 'free_text',
         label: initialCell?.label ?? '',
         linkedProjectId: initialCell?.linkedProjectId ?? null,
         targetValue: initialCell?.targetValue ?? 1,
         newProjectName: '',
      };
      errors.value = {};
   },
);

watch(
   () => props.lockedPosition,
   (lockedPosition) => {
      if (!props.initialCell && lockedPosition) {
         cell.value.position = lockedPosition;
      }
   },
);

const kindOptions = computed(() => [
   { label: t('bingo.kind-project'), value: 'project_finish' },
   { label: t('bingo.kind-parts'), value: 'parts_count' },
   { label: t('bingo.kind-skeins'), value: 'skeins_count' },
   { label: t('bingo.kind-free'), value: 'free_text' },
]);

const showProjectSelector = computed(() => cell.value.kind !== 'free_text');
const showTarget = computed(() => cell.value.kind === 'parts_count' || cell.value.kind === 'skeins_count');

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

   if (showTarget.value && (!cell.value.targetValue || cell.value.targetValue < 1)) {
      errors.value.targetValue = t('bingo.target-min');
   }

   if (cell.value.kind === 'free_text' && !cell.value.label.trim()) {
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
         label: cell.value.label.trim() || null,
         linkedProjectId: cell.value.linkedProjectId,
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
   <UModal v-model:open="open" :title="title" :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-xl' }">
      <template #body>
         <div class="space-y-4">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
               <UFormField :label="$t('bingo.position')" :error="errors.position" size="lg">
                  <UInput v-model="cell.position" type="number" min="1" :disabled="Boolean(lockedPosition)" />
               </UFormField>

               <UFormField :label="$t('bingo.kind')" size="lg">
                  <USelect v-model="cell.kind" :items="kindOptions" />
               </UFormField>
            </div>

            <FormField
               :model-value="cell.label"
               :label="$t('bingo.label')"
               :error="errors.label"
               :placeholder="$t('bingo.label-placeholder')"
               @update:model-value="(value) => (cell.label = value)"
            />

            <div v-if="showProjectSelector" class="space-y-3">
               <UFormField :label="$t('bingo.project-link')" :error="errors.linkedProjectId" size="lg">
                  <USelect v-model="cell.linkedProjectId" :items="projects" :placeholder="$t('bingo.project-link-placeholder')" />
               </UFormField>

               <UFormField :label="$t('bingo.create-project-inline')" size="lg">
                  <UInput v-model="cell.newProjectName" :placeholder="$t('bingo.create-project-inline-placeholder')" />
               </UFormField>
            </div>

            <UFormField v-if="showTarget" :label="$t('bingo.target')" :error="errors.targetValue" size="lg">
               <UInput v-model="cell.targetValue" type="number" min="1" />
            </UFormField>
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
   </UModal>
</template>
