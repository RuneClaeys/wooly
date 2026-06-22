<script lang="ts" setup>
import { useToast } from '~/composables/useToast';

type ManualUsageForm = {
   amount: number;
};

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{
   colorName?: string;
}>();

const emits = defineEmits<{
   (e: 'save-manual-usage', payload: { amount: number; done: () => void }): void;
}>();

const form = ref<ManualUsageForm>({
   amount: 1,
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

function resetManualUsageOnOpen(isOpen: boolean) {
   if (isOpen) {
      form.value.amount = 1;
      errors.value = {};
   }
}

watch(() => open.value, resetManualUsageOnOpen);

function validate(): boolean {
   errors.value = {};

   if (!Number.isFinite(form.value.amount) || !Number.isInteger(form.value.amount) || form.value.amount < 1) {
      errors.value.amount = t('yarn.manual-usage-min');
   }

   return Object.keys(errors.value).length === 0;
}

async function onSubmit() {
   if (!validate()) {
      showErrorToast(t('form.field-required'));
      return;
   }

   isSubmitting.value = true;
   try {
      emits('save-manual-usage', {
         amount: form.value.amount,
         done: () => {
            isSubmitting.value = false;
            open.value = false;
         },
      });
   } catch {
      isSubmitting.value = false;
      showErrorToast(t('actions.save'));
   }
}
</script>

<template>
   <ResponsiveModal
      v-model:open="open"
      :title="$t('yarn.add-manual-usage')"
      :description="colorName"
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }"
      @update:open="() => (errors.value = {})"
   >
      <template #body>
         <div class="space-y-4">
            <FormField
               :model-value="form.amount"
               type="number"
               :label="$t('yarn.manual-usage-amount')"
               :error="errors.amount"
               :placeholder="'1'"
               :min="1"
               show-stepper
               :decrement-aria-label="$t('actions.decrease-count', { type: $t('yarn.manual-usage-amount') })"
               :increment-aria-label="$t('actions.increase-count', { type: $t('yarn.manual-usage-amount') })"
               @update:model-value="(val) => (form.amount = Number(val))"
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
