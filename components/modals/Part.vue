<script lang="ts" setup>
import { useToast } from '~/composables/useToast';
import type { SelectPart } from '~/db/schema';

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{ initialPart?: SelectPart }>();
const emits = defineEmits<{ (e: 'save-part', payload: { part: typeof part.value; done: () => void }): void }>();

const part = ref({
   name: props.initialPart?.name ?? '',
   counter: props.initialPart?.counter ?? 0,
   completed: props.initialPart?.completed ?? false,
});
const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

const modalTitle = computed(() => (props.initialPart ? t('actions.edit-part') : t('actions.create-part')));

function syncPartFromInitialPart(initialPart?: SelectPart) {
   part.value = {
      name: initialPart?.name ?? '',
      counter: initialPart?.counter ?? 0,
      completed: initialPart?.completed ?? false,
   };
   errors.value = {};
}

watch(
   () => props.initialPart,
   syncPartFromInitialPart,
);

const validateName = (name: string): string | null => {
   if (!name || name.trim().length === 0) return t('form.field-required');
   if (name.length > 100) return 'Name must be 100 characters or less';
   return null;
};

const validateCounter = (counter: number): string | null => {
   if (counter < 0) return 'Counter cannot be negative';
   return null;
};

const validate = (): boolean => {
   errors.value = {};
   const nameError = validateName(part.value.name);
   const counterError = validateCounter(part.value.counter);

   if (nameError) errors.value.name = nameError;
   if (counterError) errors.value.counter = counterError;

   return Object.keys(errors.value).length === 0;
};

async function onSubmit() {
   if (!validate()) {
      showErrorToast('Please fix the errors in the form');
      return;
   }

   isSubmitting.value = true;
   try {
      emits('save-part', {
         part: part.value,
         done: () => {
            isSubmitting.value = false;
            if (!props.initialPart) part.value = { name: '', counter: 0, completed: false };
            open.value = false;
         },
      });
   } catch (err) {
      isSubmitting.value = false;
      showErrorToast('Failed to save part');
   }
}

function handleNameBlur() {
   const error = validateName(part.value.name);
   if (error) {
      errors.value.name = error;
   } else {
      delete errors.value.name;
   }
}

function handleCounterBlur() {
   const error = validateCounter(part.value.counter);
   if (error) {
      errors.value.counter = error;
   } else {
      delete errors.value.counter;
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
            <FormField
               :model-value="part.name"
               :label="$t('generic.name')"
               :error="errors.name"
               :placeholder="$t('generic.name')"
               required
               :max-length="100"
               @update:model-value="(val) => (part.name = String(val))"
               @blur="handleNameBlur"
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
               @blur="handleCounterBlur"
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
