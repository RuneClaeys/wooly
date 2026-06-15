<script lang="ts" setup>
type SkeinOption = { label: string; value: number };
type SkeinForm = {
   skeinId: number | null;
   skeinName: string;
   counter: number;
};

const { t } = useI18n();

const open = defineModel('modelValue', { default: false });
const props = defineProps<{ initialUsage?: { skeinId: number; skeinName: string; counter: number }; catalogItems: SkeinOption[] }>();
const emits = defineEmits<{ (e: 'save-skein', payload: { skein: SkeinForm; done: () => void }): void }>();

const skein = ref<SkeinForm>({
   skeinId: props.initialUsage?.skeinId ?? null,
   skeinName: props.initialUsage?.skeinName ?? '',
   counter: props.initialUsage?.counter ?? 0,
});

const modalTitle = computed(() => (props.initialUsage ? t('actions.edit-type', { type: t('trackers.skein') }) : t('actions.create-type', { type: t('trackers.skein') })));

watch(
   () => props.initialUsage,
   (initialUsage) => {
      skein.value = {
         skeinId: initialUsage?.skeinId ?? null,
         skeinName: initialUsage?.skeinName ?? '',
         counter: initialUsage?.counter ?? 0,
      };
   },
);

const validate = (state: SkeinForm) => {
   const errors: Array<{ name: string; message: string }> = [];
   if (!state.skeinId && !state.skeinName.trim()) {
      errors.push({ name: 'skein', message: t('form.field-required') });
   }

   return errors;
};

function onSubmit() {
   if (validate(skein.value).length > 0) return;

   emits('save-skein', {
      skein: {
         skeinId: skein.value.skeinId,
         skeinName: skein.value.skeinName.trim(),
         counter: skein.value.counter,
      },
      done: () => {
         if (!props.initialUsage) {
            skein.value = { skeinId: null, skeinName: '', counter: 0 };
         }
         open.value = false;
      },
   });
}
</script>

<template>
   <UModal v-model:open="open" :title="modalTitle" :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }">
      <template #body>
         <UForm class="flex flex-col gap-4" :state="skein" :validate="validate">
            <UFormField :label="$t('trackers.skein-existing')" name="skeinId">
               <USelect v-model="skein.skeinId" :items="catalogItems" class="w-full" />
            </UFormField>

            <UFormField :label="$t('trackers.skein-name')" name="skeinName">
               <UInput v-model="skein.skeinName" class="w-full" :placeholder="$t('trackers.skein-name-placeholder')" />
            </UFormField>

            <UFormField :label="$t('trackers.skein-count')" name="counter">
               <UInput v-model="skein.counter" type="number" class="w-full" />
            </UFormField>
         </UForm>
      </template>

      <template #footer>
         <div class="flex justify-end gap-2">
            <UButton class="tap-target" variant="soft" color="neutral" @click="open = false">{{ $t('actions.cancel') }}</UButton>
            <UButton class="tap-target" color="primary" @click="onSubmit">{{ $t('actions.save') }}</UButton>
         </div>
      </template>
   </UModal>
</template>