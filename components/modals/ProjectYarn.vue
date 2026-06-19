<script lang="ts" setup>
import { useToast } from '~/composables/useToast';

type YarnColorOption = { label: string; value: number };

type ProjectYarnForm = {
   yarnColorId: number | null;
   usedCount: number;
   newTypeName: string;
   newTypeSkeinWeightGrams: number | null;
   newTypeThicknessMm: number | null;
   newColorName: string;
   newColorStashCount: number;
};

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{
   initialUsage?: { yarnColorId: number; usedCount: number };
   colorOptions: YarnColorOption[];
}>();

const emits = defineEmits<{
   (
      e: 'save-project-yarn',
      payload: {
         yarn: ProjectYarnForm;
         done: () => void;
      },
   ): void;
}>();

const form = ref<ProjectYarnForm>({
   yarnColorId: props.initialUsage?.yarnColorId ?? null,
   usedCount: props.initialUsage?.usedCount ?? 0,
   newTypeName: '',
   newTypeSkeinWeightGrams: null,
   newTypeThicknessMm: null,
   newColorName: '',
   newColorStashCount: 0,
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

const isCreateMode = computed(() => !props.initialUsage);
const creatingNewColor = computed(() => form.value.newTypeName.trim().length > 0 || form.value.newColorName.trim().length > 0);

const modalTitle = computed(() =>
   props.initialUsage ? t('actions.edit-type', { type: t('yarn.color') }) : t('actions.create-type', { type: t('yarn.color') }),
);

watch(
   () => props.initialUsage,
   (initialUsage) => {
      form.value = {
         yarnColorId: initialUsage?.yarnColorId ?? null,
         usedCount: initialUsage?.usedCount ?? 0,
         newTypeName: '',
         newTypeSkeinWeightGrams: null,
         newTypeThicknessMm: null,
         newColorName: '',
         newColorStashCount: 0,
      };
      errors.value = {};
   },
);

function validateSelection(): string | null {
   if (!isCreateMode.value) return null;

   if (creatingNewColor.value) {
      if (!form.value.newTypeName.trim()) return t('form.field-required');
      if (!form.value.newColorName.trim()) return t('form.field-required');
      if (form.value.newColorStashCount < 0) return 'Stash count must be zero or higher';
      return null;
   }

   if (!form.value.yarnColorId) return t('form.field-required');
   return null;
}

function validateUsedCount(): string | null {
   if (!Number.isFinite(form.value.usedCount) || form.value.usedCount < 0) return 'Used count must be zero or higher';
   return null;
}

function validate(): boolean {
   errors.value = {};

   const selectionError = validateSelection();
   const usedError = validateUsedCount();

   if (selectionError) errors.value.selection = selectionError;
   if (usedError) errors.value.usedCount = usedError;

   return Object.keys(errors.value).length === 0;
}

function onSelectExistingColor(value: number | string | null | undefined) {
   form.value.yarnColorId = value ? Number(value) : null;
   if (form.value.yarnColorId) {
      form.value.newTypeName = '';
      form.value.newTypeSkeinWeightGrams = null;
      form.value.newTypeThicknessMm = null;
      form.value.newColorName = '';
      form.value.newColorStashCount = 0;
   }
   delete errors.value.selection;
}

function onNewTypeUpdate(value: string | number) {
   form.value.newTypeName = String(value);
   if (form.value.newTypeName.trim()) {
      form.value.yarnColorId = null;
   }
   delete errors.value.selection;
}

function onNewColorUpdate(value: string | number) {
   form.value.newColorName = String(value);
   if (form.value.newColorName.trim()) {
      form.value.yarnColorId = null;
   }
   delete errors.value.selection;
}

async function onSubmit() {
   if (!validate()) {
      showErrorToast('Please fix the errors in the form');
      return;
   }

   isSubmitting.value = true;
   try {
      emits('save-project-yarn', {
         yarn: {
            yarnColorId: form.value.yarnColorId,
            usedCount: form.value.usedCount,
            newTypeName: form.value.newTypeName.trim(),
            newTypeSkeinWeightGrams: form.value.newTypeSkeinWeightGrams,
            newTypeThicknessMm: form.value.newTypeThicknessMm,
            newColorName: form.value.newColorName.trim(),
            newColorStashCount: form.value.newColorStashCount,
         },
         done: () => {
            isSubmitting.value = false;
            if (!props.initialUsage) {
               form.value = {
                  yarnColorId: null,
                  usedCount: 0,
                  newTypeName: '',
                  newTypeSkeinWeightGrams: null,
                  newTypeThicknessMm: null,
                  newColorName: '',
                  newColorStashCount: 0,
               };
            }
            open.value = false;
         },
      });
   } catch {
      isSubmitting.value = false;
      showErrorToast('Failed to save yarn usage');
   }
}
</script>

<template>
   <ResponsiveModal
      v-model:open="open"
      :title="modalTitle"
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }"
      @update:open="() => (errors = {})"
   >
      <template #body>
         <div class="space-y-4">
            <div v-if="isCreateMode" class="space-y-4">
               <FormSelect
                  :model-value="form.yarnColorId"
                  :label="$t('yarn.color')"
                  :items="colorOptions"
                  clearable
                  :error="errors.selection"
                  :placeholder="$t('yarn.select-color-placeholder')"
                  @update:model-value="onSelectExistingColor"
               />

               <div v-if="!form.yarnColorId" class="rounded-lg border border-slate-200/80 p-3 dark:border-slate-700">
                  <p class="text-xs wooly-muted mb-3">{{ $t('yarn.or-create-new-color') }}</p>

                  <div class="space-y-3">
                     <FormField
                        :model-value="form.newTypeName"
                        :label="$t('yarn.type')"
                        :placeholder="$t('yarn.type-name-placeholder')"
                        @update:model-value="onNewTypeUpdate"
                     />

                     <FormField
                        :model-value="form.newTypeSkeinWeightGrams ?? ''"
                        type="number"
                        :label="$t('yarn.skein-weight-grams')"
                        :placeholder="$t('yarn.skein-weight-grams-placeholder')"
                        :min="1"
                        show-stepper
                        :decrement-aria-label="$t('actions.decrease-count', { type: $t('yarn.skein-weight-grams') })"
                        :increment-aria-label="$t('actions.increase-count', { type: $t('yarn.skein-weight-grams') })"
                        @update:model-value="(val) => (form.newTypeSkeinWeightGrams = val === '' ? null : Number(val))"
                     />

                     <FormField
                        :model-value="form.newTypeThicknessMm ?? ''"
                        type="number"
                        :label="$t('yarn.thickness-mm')"
                        :placeholder="$t('yarn.thickness-mm-placeholder')"
                        :min="0.01"
                        :step="0.01"
                        show-stepper
                        :decrement-aria-label="$t('actions.decrease-count', { type: $t('yarn.thickness-mm') })"
                        :increment-aria-label="$t('actions.increase-count', { type: $t('yarn.thickness-mm') })"
                        @update:model-value="(val) => (form.newTypeThicknessMm = val === '' ? null : Number(val))"
                     />

                     <FormField
                        :model-value="form.newColorName"
                        :label="$t('yarn.color-name')"
                        :placeholder="$t('yarn.color-name-placeholder')"
                        @update:model-value="onNewColorUpdate"
                     />

                     <FormField
                        :model-value="form.newColorStashCount"
                        type="number"
                        :label="$t('yarn.stash-count')"
                        :placeholder="'0'"
                        :min="0"
                        show-stepper
                        :decrement-aria-label="$t('actions.decrease-count', { type: $t('yarn.stash') })"
                        :increment-aria-label="$t('actions.increase-count', { type: $t('yarn.stash') })"
                        @update:model-value="(val) => (form.newColorStashCount = Number(val))"
                     />
                  </div>
               </div>
            </div>

            <FormField
               :model-value="form.usedCount"
               type="number"
               :label="$t('yarn.used')"
               :error="errors.usedCount"
               :placeholder="'0'"
               :min="0"
               show-stepper
               :decrement-aria-label="$t('actions.decrease-count', { type: $t('yarn.used') })"
               :increment-aria-label="$t('actions.increase-count', { type: $t('yarn.used') })"
               @update:model-value="(val) => (form.usedCount = Number(val))"
            />
         </div>
      </template>

      <template #footer>
         <div class="flex justify-end gap-2">
            <UButton class="tap-target" variant="soft" color="neutral" :disabled="isSubmitting" @click="open = false">
               {{ $t('actions.cancel') }}
            </UButton>
            <UButton
               class="tap-target"
               color="primary"
               :loading="isSubmitting"
               :disabled="isSubmitting || Object.keys(errors).length > 0"
               @click="onSubmit"
            >
               {{ $t('actions.save') }}
            </UButton>
         </div>
      </template>
   </ResponsiveModal>
</template>
