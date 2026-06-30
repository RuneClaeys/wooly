<script lang="ts" setup>
import { useModalForm } from '~/composables/useModalForm';
import { useToast } from '~/composables/useToast';
import type { SelectProject } from '~/db/schema';

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel('modelValue', { default: false });
const props = defineProps<{ initialProject?: SelectProject }>();
const emits = defineEmits<{ (e: 'save-project', payload: { id?: number; project: typeof project.value; done: () => void }): void }>();

const {
   form: project,
   errors,
   isSubmitting,
   validate,
   validateField,
   clearErrors,
   reset,
} = useModalForm({
   createInitial: () => ({ name: props.initialProject?.name ?? '', finished: props.initialProject?.finished ?? false }),
   watchSource: () => props.initialProject,
   validators: {
      name: (value) => {
         if (!value || value.trim().length === 0) return t('form.field-required');
         if (value.length > 100) return t('form.max-length', { max: 100 });
         return null;
      },
   },
});

const modalTitle = computed(() => (props.initialProject ? t('actions.edit-project') : t('actions.create-project')));

async function onSubmit() {
   if (!validate()) {
      showErrorToast(t('form.fix-errors'));
      return;
   }

   isSubmitting.value = true;
   try {
      emits('save-project', {
         project: project.value,
         done: () => {
            isSubmitting.value = false;
            if (!props.initialProject) reset();
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
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }"
      @update:open="clearErrors"
   >
      <template #body>
         <div class="space-y-4">
            <!-- Form Fields -->
            <FormField
               :model-value="project.name"
               :label="$t('generic.name')"
               :error="errors.name"
               :placeholder="$t('generic.name')"
               required
               :max-length="100"
               @update:model-value="(val) => (project.name = String(val))"
               @blur="() => validateField('name')"
            />

            <!-- Status Toggle -->
            <div class="rounded-lg bg-primary-50/50 dark:bg-primary-950/30 p-4 space-y-3">
               <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('generic.status') }}</label>
                  <USwitch v-model="project.finished" color="primary" class="tap-target" />
               </div>
               <p class="text-xs text-slate-600 dark:text-slate-400">
                  {{ project.finished ? $t('generic.completed') : $t('generic.active') }}
               </p>
            </div>
         </div>
      </template>

      <template #footer>
         <div class="flex justify-end gap-2">
            <UButton class="tap-target" variant="soft" color="neutral" :disabled="isSubmitting" @click="open = false">{{
               $t('actions.cancel')
            }}</UButton>
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
