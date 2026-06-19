<script lang="ts" setup>
import { useToast } from '~/composables/useToast';

type YarnTypeForm = {
   name: string;
   skeinWeightGrams: number | null;
   thicknessMm: number | null;
};

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{
   initialType?: {
      id: number;
      name: string;
      skeinWeightGrams?: number | null;
      thicknessMm?: number | null;
   };
}>();
const emits = defineEmits<{ (e: 'save-type', payload: { type: YarnTypeForm; done: () => void }): void }>();

const yarnType = ref<YarnTypeForm>({
   name: props.initialType?.name ?? '',
   skeinWeightGrams: props.initialType?.skeinWeightGrams ?? null,
   thicknessMm: props.initialType?.thicknessMm ?? null,
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

const modalTitle = computed(() =>
   props.initialType ? t('actions.edit-type', { type: t('yarn.type') }) : t('actions.create-type', { type: t('yarn.type') }),
);

watch(
   () => props.initialType,
   (initialType) => {
      yarnType.value = {
         name: initialType?.name ?? '',
         skeinWeightGrams: initialType?.skeinWeightGrams ?? null,
         thicknessMm: initialType?.thicknessMm ?? null,
      };
      errors.value = {};
   },
);

const validateName = (name: string): string | null => {
   if (!name || name.trim().length === 0) return t('form.field-required');
   if (name.length > 100) return 'Name must be 100 characters or less';
   return null;
};

const validateSkeinWeight = (value: number | null): string | null => {
   if (value === null || value === undefined) return null;
   if (!Number.isFinite(value) || value <= 0) return 'Skein weight must be above 0g';
   if (!Number.isInteger(value)) return 'Skein weight must be a whole number in grams';
   return null;
};

const validateThickness = (value: number | null): string | null => {
   if (value === null || value === undefined) return null;
   if (!Number.isFinite(value) || value <= 0) return 'Thickness must be above 0 mm';
   return null;
};

const validate = (): boolean => {
   errors.value = {};

   const nameError = validateName(yarnType.value.name);
   const skeinWeightError = validateSkeinWeight(yarnType.value.skeinWeightGrams);
   const thicknessError = validateThickness(yarnType.value.thicknessMm);

   if (nameError) errors.value.name = nameError;
   if (skeinWeightError) errors.value.skeinWeightGrams = skeinWeightError;
   if (thicknessError) errors.value.thicknessMm = thicknessError;

   return Object.keys(errors.value).length === 0;
};

async function onSubmit() {
   if (!validate()) {
      showErrorToast('Please fix the errors in the form');
      return;
   }

   isSubmitting.value = true;
   try {
      emits('save-type', {
         type: {
            name: yarnType.value.name.trim(),
            skeinWeightGrams: yarnType.value.skeinWeightGrams,
            thicknessMm: yarnType.value.thicknessMm,
         },
         done: () => {
            isSubmitting.value = false;
            if (!props.initialType) yarnType.value = { name: '', skeinWeightGrams: null, thicknessMm: null };
            open.value = false;
         },
      });
   } catch {
      isSubmitting.value = false;
      showErrorToast('Failed to save yarn type');
   }
}

function handleNameBlur() {
   const error = validateName(yarnType.value.name);
   if (error) {
      errors.value.name = error;
   } else {
      delete errors.value.name;
   }
}

function handleSkeinWeightBlur() {
   const error = validateSkeinWeight(yarnType.value.skeinWeightGrams);
   if (error) {
      errors.value.skeinWeightGrams = error;
   } else {
      delete errors.value.skeinWeightGrams;
   }
}

function handleThicknessBlur() {
   const error = validateThickness(yarnType.value.thicknessMm);
   if (error) {
      errors.value.thicknessMm = error;
   } else {
      delete errors.value.thicknessMm;
   }
}
</script>

<template>
   <ResponsiveModal
      v-model:open="open"
      :title="modalTitle"
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }"
      @update:open="() => (errors.value = {})"
   >
      <template #body>
         <div class="space-y-4">
            <FormField
               :model-value="yarnType.name"
               :label="$t('generic.name')"
               :error="errors.name"
               :placeholder="$t('yarn.type-name-placeholder')"
               required
               :max-length="100"
               @update:model-value="(val) => (yarnType.name = String(val))"
               @blur="handleNameBlur"
            />

            <FormField
               :model-value="yarnType.skeinWeightGrams ?? ''"
               type="number"
               :label="$t('yarn.skein-weight-grams')"
               :error="errors.skeinWeightGrams"
               :placeholder="$t('yarn.skein-weight-grams-placeholder')"
               :min="1"
               :step="10"
               @update:model-value="(val) => (yarnType.skeinWeightGrams = val === '' ? null : Number(val))"
               @blur="handleSkeinWeightBlur"
            />

            <FormField
               :model-value="yarnType.thicknessMm ?? ''"
               type="number"
               :label="$t('yarn.thickness-mm')"
               :error="errors.thicknessMm"
               :placeholder="$t('yarn.thickness-mm-placeholder')"
               :min="0.5"
               :step="0.5"
               @update:model-value="(val) => (yarnType.thicknessMm = val === '' ? null : Number(val))"
               @blur="handleThicknessBlur"
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
