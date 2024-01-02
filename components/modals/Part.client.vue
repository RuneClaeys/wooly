<script lang="ts" setup>
import type { FormError } from '@nuxt/ui/dist/runtime/types/form';
import type { SelectPart } from '~/db/schema';

//#region Props & Emits
const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{ initialPart?: SelectPart }>();
const emits = defineEmits<{ (e: 'save-part', part: { name: string }): void }>();
//#endregion

//#region State
const part = ref<{ name: string }>({ name: props.initialPart?.name ?? '' });

const validate = (state: any): FormError[] => {
   const errors = [];
   if (!state.name) errors.push({ path: 'name', message: 'Required' });

   return errors;
};

function onSubmit() {
   if (validate(part.value).length > 0) return;
   emits('save-part', part.value);
}

//#endregion
</script>

<template>
   <UModal v-model="open">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
         <template #header>
            <p>Create a part</p>
         </template>

         <UForm :state="part" :validate="validate">
            <UFormGroup label="Name" name="name">
               <UInput v-model="part.name" />
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
