<script lang="ts" setup>
import type { FormError } from '@nuxt/ui/dist/runtime/types/form';
import type { SelectProject } from '~/db/schema';

//#region Props & Emits
const open = defineModel('modelValue', { default: false });
const props = defineProps<{ initialProject?: SelectProject }>();
const emits = defineEmits<{ (e: 'save-project', project: { name: string }): void }>();
//#endregion

//#region State
const project = ref<{ name: string }>({ name: props.initialProject?.name ?? '' });

const validate = (state: any): FormError[] => {
   const errors = [];
   if (!state.name) errors.push({ path: 'name', message: 'Required' });

   return errors;
};

function onSubmit() {
   if (validate(project.value).length > 0) return;
   emits('save-project', project.value);
}

//#endregion
</script>

<template>
   <UModal v-model="open">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
         <template #header>
            <p>Create a project</p>
         </template>

         <UForm :state="project" :validate="validate">
            <UFormGroup label="Name" name="name">
               <UInput v-model="project.name" />
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
