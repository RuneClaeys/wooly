<script lang="ts" setup>
import { useModalForm } from '~/composables/useModalForm';
import { useToast } from '~/composables/useToast';

type YarnColorForm = {
   name: string;
   stashCount: number;
};

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{
   initialColor?: { id: number; name: string; stashCount: number };
   yarnTypeName?: string;
}>();
const emits = defineEmits<{ (e: 'save-color', payload: { color: YarnColorForm; done: () => void }): void }>();

const {
   form: yarnColor,
   errors,
   isSubmitting,
   validate,
   validateField,
   clearErrors,
   reset,
} = useModalForm<YarnColorForm>({
   createInitial: () => ({
      name: props.initialColor?.name ?? '',
      stashCount: props.initialColor?.stashCount ?? 0,
   }),
   watchSource: () => props.initialColor,
   validators: {
      name: (value) => {
         if (!value || value.trim().length === 0) return t('form.field-required');
         if (value.length > 100) return t('form.max-length', { max: 100 });
         return null;
      },
      stashCount: (value) => (!Number.isFinite(value) || value < 0 ? t('form.min-zero') : null),
   },
});

const modalTitle = computed(() =>
   props.initialColor ? t('actions.edit-type', { type: t('yarn.color') }) : t('actions.create-type', { type: t('yarn.color') }),
);

async function onSubmit() {
   if (!validate()) {
      showErrorToast(t('form.fix-errors'));
      return;
   }

   isSubmitting.value = true;
   try {
      emits('save-color', {
         color: {
            name: yarnColor.value.name.trim(),
            stashCount: yarnColor.value.stashCount,
         },
         done: () => {
            isSubmitting.value = false;
            if (!props.initialColor) reset();
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
      :description="yarnTypeName"
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }"
      @update:open="clearErrors"
   >
      <template #body>
         <div class="space-y-4">
            <FormField
               :model-value="yarnColor.name"
               :label="$t('yarn.color-name')"
               :error="errors.name"
               :placeholder="$t('yarn.color-name-placeholder')"
               required
               :max-length="100"
               @update:model-value="(val) => (yarnColor.name = String(val))"
               @blur="() => validateField('name')"
            />

            <FormField
               :model-value="yarnColor.stashCount"
               type="number"
               :label="$t('yarn.stash-count')"
               :error="errors.stashCount"
               :placeholder="'0'"
               :min="0"
               show-stepper
               :decrement-aria-label="$t('actions.decrease-count', { type: $t('yarn.stash') })"
               :increment-aria-label="$t('actions.increase-count', { type: $t('yarn.stash') })"
               @update:model-value="(val) => (yarnColor.stashCount = Number(val))"
               @blur="() => validateField('stashCount')"
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
