<script lang="ts" setup>
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

const yarnColor = ref<YarnColorForm>({
   name: props.initialColor?.name ?? '',
   stashCount: props.initialColor?.stashCount ?? 0,
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

const modalTitle = computed(() =>
   props.initialColor ? t('actions.edit-type', { type: t('yarn.color') }) : t('actions.create-type', { type: t('yarn.color') }),
);

watch(
   () => props.initialColor,
   (initialColor) => {
      yarnColor.value = {
         name: initialColor?.name ?? '',
         stashCount: initialColor?.stashCount ?? 0,
      };
      errors.value = {};
   },
);

const validateName = (name: string): string | null => {
   if (!name || name.trim().length === 0) return t('form.field-required');
   if (name.length > 100) return 'Color name must be 100 characters or less';
   return null;
};

const validateStashCount = (stashCount: number): string | null => {
   if (!Number.isFinite(stashCount) || stashCount < 0) return 'Stash count must be zero or higher';
   return null;
};

const validate = (): boolean => {
   errors.value = {};

   const nameError = validateName(yarnColor.value.name);
   const stashError = validateStashCount(yarnColor.value.stashCount);

   if (nameError) errors.value.name = nameError;
   if (stashError) errors.value.stashCount = stashError;

   return Object.keys(errors.value).length === 0;
};

async function onSubmit() {
   if (!validate()) {
      showErrorToast('Please fix the errors in the form');
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
            if (!props.initialColor) yarnColor.value = { name: '', stashCount: 0 };
            open.value = false;
         },
      });
   } catch {
      isSubmitting.value = false;
      showErrorToast('Failed to save yarn color');
   }
}

function handleNameBlur() {
   const error = validateName(yarnColor.value.name);
   if (error) {
      errors.value.name = error;
   } else {
      delete errors.value.name;
   }
}

function handleStashCountBlur() {
   const error = validateStashCount(yarnColor.value.stashCount);
   if (error) {
      errors.value.stashCount = error;
   } else {
      delete errors.value.stashCount;
   }
}
</script>

<template>
   <ResponsiveModal
      v-model:open="open"
      :title="modalTitle"
      :description="yarnTypeName"
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }"
      @update:open="() => (errors.value = {})"
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
               @blur="handleNameBlur"
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
               @blur="handleStashCountBlur"
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
