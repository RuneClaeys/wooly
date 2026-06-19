<script lang="ts" setup>
import { useToast } from '~/composables/useToast';

type CurrentStashForm = {
   amount: number;
};

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{
   colorName?: string;
   initialStashCount?: number;
}>();

const emits = defineEmits<{
   (e: 'save-current-stash', payload: { amount: number; done: () => void }): void;
}>();

const form = ref<CurrentStashForm>({
   amount: props.initialStashCount ?? 0,
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

watch(
   () => open.value,
   (isOpen) => {
      if (isOpen) {
         form.value.amount = props.initialStashCount ?? 0;
         errors.value = {};
      }
   },
);

watch(
   () => props.initialStashCount,
   (nextCount) => {
      if (!open.value) {
         form.value.amount = nextCount ?? 0;
      }
   },
);

function validate(): boolean {
   errors.value = {};

   if (!Number.isFinite(form.value.amount) || !Number.isInteger(form.value.amount) || form.value.amount < 0) {
      errors.value.amount = t('yarn.current-stash-min');
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
      emits('save-current-stash', {
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
      :title="$t('yarn.set-current-stash')"
      :description="colorName"
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }"
      @update:open="() => (errors.value = {})"
   >
      <template #body>
         <div class="space-y-4">
            <FormField
               :model-value="form.amount"
               type="number"
               :label="$t('yarn.current-stash')"
               :error="errors.amount"
               :placeholder="'0'"
               :min="0"
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
