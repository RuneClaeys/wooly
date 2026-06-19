<script lang="ts" setup>
import { useToast } from '~/composables/useToast';

type SkeinOption = { label: string; value: number };
type SkeinForm = {
   skeinId: number | null;
   skeinName: string;
   counter: number;
};

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel('modelValue', { default: false });
const props = defineProps<{ initialUsage?: { skeinId: number; skeinName: string; counter: number }; catalogItems: SkeinOption[] }>();
const emits = defineEmits<{ (e: 'save-skein', payload: { skein: SkeinForm; done: () => void }): void }>();

const skein = ref<SkeinForm>({
   skeinId: props.initialUsage?.skeinId ?? null,
   skeinName: props.initialUsage?.skeinName ?? '',
   counter: props.initialUsage?.counter ?? 0,
});
const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

const modalTitle = computed(() =>
   props.initialUsage ? t('actions.edit-type', { type: t('trackers.skein') }) : t('actions.create-type', { type: t('trackers.skein') }),
);

const hasCatalogItems = computed(() => props.catalogItems.length > 0);

watch(
   () => props.initialUsage,
   (initialUsage) => {
      skein.value = {
         skeinId: initialUsage?.skeinId ?? null,
         skeinName: initialUsage?.skeinName ?? '',
         counter: initialUsage?.counter ?? 0,
      };
      errors.value = {};
   },
);

const validateSkeinSelection = (): string | null => {
   if (!skein.value.skeinId && !skein.value.skeinName.trim()) {
      return t('form.field-required');
   }
   if (skein.value.skeinName.length > 100) {
      return 'Skein name must be 100 characters or less';
   }
   return null;
};

const validateCounter = (counter: number): string | null => {
   if (counter < 0) return 'Counter cannot be negative';
   return null;
};

const validate = (): boolean => {
   errors.value = {};
   const skeinError = validateSkeinSelection();
   const counterError = validateCounter(skein.value.counter);

   if (skeinError) errors.value.skein = skeinError;
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
      emits('save-skein', {
         skein: {
            skeinId: skein.value.skeinId,
            skeinName: skein.value.skeinName.trim(),
            counter: skein.value.counter,
         },
         done: () => {
            isSubmitting.value = false;
            if (!props.initialUsage) {
               skein.value = { skeinId: null, skeinName: '', counter: 0 };
            }
            open.value = false;
         },
      });
   } catch {
      isSubmitting.value = false;
      showErrorToast('Failed to save skein');
   }
}

function handleSkeinBlur() {
   const error = validateSkeinSelection();
   if (error) {
      errors.value.skein = error;
   } else {
      delete errors.value.skein;
   }
}

function handleSkeinSelect(value: number | string | null | undefined) {
   skein.value.skeinId = value ? Number(value) : null;

   // Selecting an existing skein means we should not also submit a new skein name.
   if (skein.value.skeinId) {
      skein.value.skeinName = '';
   }

   delete errors.value.skein;
}

function handleSkeinNameUpdate(value: string | number) {
   skein.value.skeinName = String(value);

   // Any non-empty name should switch intent to creating a new catalog skein.
   if (skein.value.skeinName.trim().length > 0) {
      skein.value.skeinId = null;
   }

   delete errors.value.skein;
}

function handleCounterBlur() {
   const error = validateCounter(skein.value.counter);
   if (error) {
      errors.value.counter = error;
   } else {
      delete errors.value.counter;
   }
}

function handleModalOpenChange() {
   errors.value = {};
}
</script>

<template>
   <ResponsiveModal
      v-model:open="open"
      :title="modalTitle"
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-xl rounded-2xl overflow-hidden wooly-pop' }"
      @update:open="handleModalOpenChange"
   >
      <template #body>
         <div class="skein-form space-y-5">
            <div class="skein-form-intro">
               <p class="skein-form-title">{{ $t('trackers.skein') }}</p>
               <p class="skein-form-subtitle">{{ $t('generic.name') }} + {{ $t('trackers.skein-count') }}</p>
            </div>

            <div v-if="hasCatalogItems" class="space-y-2">
               <label class="skein-field-label">{{ $t('trackers.skein-existing') }}</label>
               <USelect
                  :model-value="skein.skeinId"
                  :items="catalogItems"
                  class="w-full wooly-select-clean"
                  @blur="handleSkeinBlur"
                  @update:model-value="handleSkeinSelect"
               />
            </div>

            <FormField
               :model-value="skein.skeinName"
               :label="$t('trackers.skein-name')"
               :error="errors.skein"
               :placeholder="$t('trackers.skein-name-placeholder')"
               :max-length="100"
               @update:model-value="handleSkeinNameUpdate"
               @blur="handleSkeinBlur"
            />

            <FormField
               :model-value="skein.counter"
               type="number"
               :label="$t('trackers.skein-count')"
               :error="errors.counter"
               :placeholder="'0'"
               :min="0"
               @update:model-value="(val) => (skein.counter = Number(val))"
               @blur="handleCounterBlur"
            />
         </div>
      </template>

      <template #footer>
         <div class="flex items-center justify-end gap-3">
            <UButton class="tap-target rounded-xl px-5" variant="soft" color="neutral" :disabled="isSubmitting" @click="open = false">{{
               $t('actions.cancel')
            }}</UButton>
            <UButton
               class="tap-target rounded-xl px-5"
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

<style scoped>
.skein-form {
   padding-top: 0.25rem;
}

.skein-form-intro {
   display: flex;
   flex-direction: column;
   gap: 0.15rem;
   padding: 0.8rem 0.9rem;
   border: 1px solid color-mix(in oklab, var(--wooly-primary) 18%, transparent);
   border-radius: 0.9rem;
   background: linear-gradient(
      115deg,
      color-mix(in oklab, var(--wooly-primary) 9%, white) 0%,
      color-mix(in oklab, var(--wooly-bg-1) 85%, white) 100%
   );
}

.dark .skein-form-intro {
   background: linear-gradient(
      115deg,
      color-mix(in oklab, var(--wooly-primary) 18%, transparent) 0%,
      color-mix(in oklab, var(--wooly-bg-2) 94%, black) 100%
   );
}

.skein-form-title {
   font-size: 0.95rem;
   font-weight: 700;
   letter-spacing: 0.01em;
   color: var(--wooly-text-main);
}

.skein-form-subtitle {
   font-size: 0.78rem;
   color: var(--wooly-text-soft);
}

.skein-field-label {
   display: block;
   font-size: 0.82rem;
   font-weight: 700;
   letter-spacing: 0.02em;
   text-transform: uppercase;
   color: color-mix(in oklab, var(--wooly-text-main) 82%, black);
}

.dark .skein-field-label {
   color: color-mix(in oklab, var(--wooly-text-main) 90%, white);
}
</style>
