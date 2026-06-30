<script lang="ts" setup>
import { useModalForm } from '~/composables/useModalForm';
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

const {
   form: yarnType,
   errors,
   isSubmitting,
   validate,
   validateField,
   clearErrors,
   reset,
} = useModalForm<YarnTypeForm>({
   createInitial: () => ({
      name: props.initialType?.name ?? '',
      skeinWeightGrams: props.initialType?.skeinWeightGrams ?? null,
      thicknessMm: props.initialType?.thicknessMm ?? null,
   }),
   watchSource: () => props.initialType,
   validators: {
      name: (value) => {
         if (!value || value.trim().length === 0) return t('form.field-required');
         if (value.length > 100) return t('form.max-length', { max: 100 });
         return null;
      },
      skeinWeightGrams: (value) => {
         if (value === null || value === undefined) return null;
         if (!Number.isFinite(value) || value <= 0) return t('form.greater-than-zero');
         if (!Number.isInteger(value)) return t('form.whole-number');
         return null;
      },
      thicknessMm: (value) => {
         if (value === null || value === undefined) return null;
         if (!Number.isFinite(value) || value <= 0) return t('form.greater-than-zero');
         return null;
      },
   },
});

const modalTitle = computed(() =>
   props.initialType ? t('actions.edit-type', { type: t('yarn.type') }) : t('actions.create-type', { type: t('yarn.type') }),
);

async function onSubmit() {
   if (!validate()) {
      showErrorToast(t('form.fix-errors'));
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
            if (!props.initialType) reset();
            open.value = false;
         },
      });
   } catch {
      isSubmitting.value = false;
      showErrorToast(t('form.save-failed'));
   }
}
</script>

<template>
   <ResponsiveModal
      v-model:open="open"
      :title="modalTitle"
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }"
      @update:open="clearErrors"
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
               @blur="() => validateField('name')"
            />

            <FormField
               :model-value="yarnType.skeinWeightGrams ?? ''"
               type="number"
               :label="$t('yarn.skein-weight-grams')"
               :error="errors.skeinWeightGrams"
               :placeholder="$t('yarn.skein-weight-grams-placeholder')"
               :min="1"
               :step="10"
               show-stepper
               :decrement-aria-label="$t('actions.decrease-count', { type: $t('yarn.skein-weight-grams') })"
               :increment-aria-label="$t('actions.increase-count', { type: $t('yarn.skein-weight-grams') })"
               @update:model-value="(val) => (yarnType.skeinWeightGrams = val === '' ? null : Number(val))"
               @blur="() => validateField('skeinWeightGrams')"
            />

            <FormField
               :model-value="yarnType.thicknessMm ?? ''"
               type="number"
               :label="$t('yarn.thickness-mm')"
               :error="errors.thicknessMm"
               :placeholder="$t('yarn.thickness-mm-placeholder')"
               :min="0.5"
               :step="0.5"
               show-stepper
               :decrement-aria-label="$t('actions.decrease-count', { type: $t('yarn.thickness-mm') })"
               :increment-aria-label="$t('actions.increase-count', { type: $t('yarn.thickness-mm') })"
               @update:model-value="(val) => (yarnType.thicknessMm = val === '' ? null : Number(val))"
               @blur="() => validateField('thicknessMm')"
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
