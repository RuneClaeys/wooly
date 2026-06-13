<script lang="ts" setup>
import type { SelectProject } from '~/db/schema';

const { t } = useI18n();

const open = defineModel('modelValue', { default: false });
const props = defineProps<{ initialProject?: SelectProject }>();
const emits = defineEmits<{ (e: 'save-project', payload: { id?: number; project: typeof project.value; done: () => void }): void }>();

const project = ref({ name: props.initialProject?.name ?? '', finished: props.initialProject?.finished ?? false });

const modalTitle = computed(() => (props.initialProject ? t('actions.edit-project') : t('actions.create-project')));

watch(
   () => props.initialProject,
   (initialProject) => {
      project.value = { name: initialProject?.name ?? '', finished: initialProject?.finished ?? false };
   },
);

const validate = (state: typeof project.value) => {
   const errors: Array<{ name: string; message: string }> = [];
   if (!state.name) errors.push({ name: 'name', message: t('form.field-required') });

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
</script>

<template>
   <UModal v-model:open="open" :title="modalTitle" :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }">
      <template #body>
         <UForm class="flex flex-col gap-4" :state="project" :validate="validate">
            <UFormField :label="$t('generic.name')" name="name" required>
               <UInput v-model="project.name" class="w-full" />
            </UFormField>

            <UFormField class="rounded-xl bg-pink-50/70 p-3 dark:bg-pink-950/30" :label="$t('generic.completed')" name="finished">
               <div class="flex items-center justify-between gap-3">
                  <p class="text-sm text-pink-900 dark:text-pink-100">{{ $t('generic.status') }}</p>
                  <USwitch v-model="project.finished" color="primary" class="tap-target" />
               </div>
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
