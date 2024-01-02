<script lang="ts" setup>
import type { FormError } from '@nuxt/ui/dist/runtime/types/form';
import type { SelectPart } from '~/db/schema';

//#region Props & Emits
const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{ initialPart?: SelectPart }>();
const emits = defineEmits<{ (e: 'save-part', payload: { part: typeof part.value; done: () => void }): void }>();
//#endregion

//#region State
const part = ref({ name: props.initialPart?.name ?? '', counter: props.initialPart?.counter ?? 0 });

const validate = (state: any): FormError[] => {
   const errors = [];
   if (!state.name) errors.push({ path: 'name', message: 'Required' });

   return errors;
};

function onSubmit() {
   if (validate(part.value).length > 0) return;
   emits('save-part', {
      part: part.value,
      done: () => {
         part.value = { name: '', counter: 0 };
         open.value = false;
      },
   });
}

//#endregion
</script>

<template>
   <UModal v-model="open">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
         <template #header>
            <p>Create a part</p>
         </template>

         <UForm class="flex flex-col gap-3" :state="part" :validate="validate">
            <UFormGroup label="Name" name="name">
               <UInput v-model="part.name" />
            </UFormGroup>

            <UFormGroup label="Row Count" name="counter">
               <UInput v-model="part.counter" :type="'number'" />
            </UFormGroup>
         </UForm>

         <template #footer>
            <div class="flex justify-end">
               <UButton variant="ghost" color="gray" @click="open = false">Cancel</UButton>
               <UButton color="primary" @click="onSubmit">Save</UButton>
            </div>
         </template>
      </UCard>
   </UModal>
</template>

<style lang="scss" scoped></style>
