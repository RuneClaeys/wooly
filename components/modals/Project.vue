<script lang="ts" setup>
import type { FormError } from '@nuxt/ui/dist/runtime/types/form';
import type { SelectProject } from '~/db/schema';

//#region Globals
const { t } = useI18n();
//#endregion

//#region Props & Emits
const open = defineModel('modelValue', { default: false });
const props = defineProps<{ initialProject?: SelectProject }>();
const emits = defineEmits<{ (e: 'save-project', payload: { id?: number; project: typeof project.value; done: () => void }): void }>();
//#endregion

//#region State
const project = ref({ name: props.initialProject?.name ?? '', finished: props.initialProject?.finished ?? false });

watch(
   () => props.initialProject,
   (initialProject) => {
      project.value = { name: initialProject?.name ?? '', finished: initialProject?.finished ?? false };
   }
);

const validate = (state: any): FormError[] => {
   const errors = [];
   if (!state.name) errors.push({ path: 'name', message: t('form.field-required') });

   return errors;
};

function onSubmit() {
   if (validate(project.value).length > 0) return;
   emits('save-project', {
      project: project.value,
      done: () => {
         if (!props.initialProject) project.value = { name: '', finished: false };
         open.value = false;
      },
   });
}

//#endregion
</script>

<template>
   <UModal v-model="open">
      <UCard>
         <template #header>
            <p>{{ $t('actions.create-type', { type: $t('projects.project') }) }}</p>
         </template>

         <UForm class="flex flex-col gap-3" :state="project" :validate="validate">
            <UFormGroup :label="$t('generic.name')" name="name">
               <UInput v-model="project.name" />
            </UFormGroup>
            <UFormGroup class="flex gap-3" :label="$t('generic.completed')" name="finished">
               <UToggle v-model="project.finished" />
            </UFormGroup>
         </UForm>

         <template #footer>
            <div class="flex justify-end">
               <UButton variant="ghost" color="gray" @click="open = false">{{ $t('actions.cancel') }}</UButton>
               <UButton color="primary" @click="onSubmit">{{ $t('actions.save') }}</UButton>
            </div>
         </template>
      </UCard>
   </UModal>
</template>
