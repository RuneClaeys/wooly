<script lang="ts" setup>
import { useModalForm } from '~/composables/useModalForm';
import { useToast } from '~/composables/useToast';
import type { SelectPart } from '~/db/schema';

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{ initialPart?: SelectPart }>();
const emits = defineEmits<{ (e: 'save-part', payload: { part: typeof part.value; done: () => void }): void }>();

const {
   form: part,
   errors,
   isSubmitting,
   validate,
   validateField,
   clearErrors,
   reset,
} = useModalForm<{
   name: string;
   counter: number;
   completed: boolean;
}>({
   createInitial: () => ({
      name: props.initialPart?.name ?? '',
      counter: props.initialPart?.counter ?? 0,
      completed: props.initialPart?.completed ?? false,
   }),
   watchSource: () => props.initialPart,
   validators: {
      name: (value) => {
         if (!value || value.trim().length === 0) return t('form.field-required');
         if (value.length > 100) return t('form.max-length', { max: 100 });
         return null;
      },
      counter: (value) => (value < 0 ? t('form.min-zero') : null),
   },
});

const modalTitle = computed(() => (props.initialPart ? t('actions.edit-part') : t('actions.create-part')));

async function onSubmit() {
   if (!validate()) {
      showErrorToast(t('form.fix-errors'));
      return;
   }

   isSubmitting.value = true;
   try {
      emits('save-part', {
         part: part.value,
         done: () => {
            isSubmitting.value = false;
            if (!props.initialPart) reset();
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
               :model-value="part.name"
               :label="$t('generic.name')"
               :error="errors.name"
               :placeholder="$t('generic.name')"
               required
               :max-length="100"
               @update:model-value="(val) => (part.name = String(val))"
               @blur="() => validateField('name')"
            />

            <FormField
               :model-value="part.counter"
               type="number"
               :label="$t('parts.row-count')"
               :error="errors.counter"
               :placeholder="'0'"
               :min="0"
               show-stepper
               :decrement-aria-label="$t('actions.decrease-count', { type: $t('parts.row-count') })"
               :increment-aria-label="$t('actions.increase-count', { type: $t('parts.row-count') })"
               @update:model-value="(val) => (part.counter = Number(val))"
               @blur="() => validateField('counter')"
            />

            <UFormField :label="$t('parts.marked-complete')" size="lg">
               <USwitch v-model="part.completed" />
            </UFormField>
         </div>
      </template>

      <template #footer>
         <div class="flex justify-end gap-2">
            <UButton class="tap-target" variant="soft" color="neutral" :disabled="isSubmitting" @click="open = false">{{
               $t('actions.cancel')
            }}</UButton>
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
