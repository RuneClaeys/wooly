<script lang="ts" setup>
import type { SelectPart } from '~/db/schema';

const { t } = useI18n();

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{ initialPart?: SelectPart }>();
const emits = defineEmits<{ (e: 'save-part', payload: { part: typeof part.value; done: () => void }): void }>();

const part = ref({ name: props.initialPart?.name ?? '', counter: props.initialPart?.counter ?? 0 });

const modalTitle = computed(() => (props.initialPart ? t('actions.edit-part') : t('actions.create-part')));

watch(
   () => props.initialPart,
   (initialPart) => {
      part.value = { name: initialPart?.name ?? '', counter: initialPart?.counter ?? 0 };
   },
);

const validate = (state: typeof part.value) => {
   const errors: Array<{ name: string; message: string }> = [];
   if (!state.name) errors.push({ name: 'name', message: t('form.field-required') });

   return errors;
};

function onSubmit() {
   if (validate(part.value).length > 0) return;
   emits('save-part', {
      part: part.value,
      done: () => {
         if (!props.initialPart) part.value = { name: '', counter: 0 };
         open.value = false;
      },
   });
}
</script>

<template>
   <UModal v-model:open="open" :title="modalTitle" :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }">
      <template #body>
         <UForm class="flex flex-col gap-4" :state="part" :validate="validate">
            <UFormField :label="$t('generic.name')" name="name" required>
               <UInput v-model="part.name" class="w-full" />
            </UFormField>

            <UFormField :label="$t('parts.row-count')" name="counter">
               <UInput v-model="part.counter" type="number" class="w-full" />
            </UFormField>
         </UForm>
      </template>

      <template #footer>
         <div class="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <UButton class="tap-target w-full sm:w-auto" variant="soft" color="neutral" @click="open = false">{{
               $t('actions.cancel')
            }}</UButton>
            <UButton class="tap-target w-full sm:w-auto" color="primary" @click="onSubmit">{{ $t('actions.save') }}</UButton>
         </div>
      </template>
   </UModal>
</template>
