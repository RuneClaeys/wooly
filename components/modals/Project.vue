<script lang="ts" setup>
import { useToast } from '~/composables/useToast';
import type { SelectProject } from '~/db/schema';

const { t } = useI18n();
const { error: showErrorToast } = useToast();

const open = defineModel('modelValue', { default: false });
const props = defineProps<{ initialProject?: SelectProject }>();
const emits = defineEmits<{ (e: 'save-project', payload: { id?: number; project: typeof project.value; done: () => void }): void }>();

const project = ref({ name: props.initialProject?.name ?? '', finished: props.initialProject?.finished ?? false });
const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

const modalTitle = computed(() => (props.initialProject ? t('actions.edit-project') : t('actions.create-project')));

function syncProjectFromInitialProject(initialProject?: SelectProject) {
   project.value = { name: initialProject?.name ?? '', finished: initialProject?.finished ?? false };
   errors.value = {};
}

watch(() => props.initialProject, syncProjectFromInitialProject);

const validateName = (name: string): string | null => {
   if (!name || name.trim().length === 0) return t('form.field-required');
   if (name.length > 100) return 'Name must be 100 characters or less';
   return null;
};

const validate = (): boolean => {
   errors.value = {};
   const nameError = validateName(project.value.name);
   if (nameError) {
      errors.value.name = nameError;
   }
   return Object.keys(errors.value).length === 0;
};

async function onSubmit() {
   if (!validate()) {
      showErrorToast('Please fix the errors in the form');
      return;
   }

   isSubmitting.value = true;
   try {
      emits('save-project', {
         project: project.value,
         done: () => {
            isSubmitting.value = false;
            if (!props.initialProject) project.value = { name: '', finished: false };
            open.value = false;
         },
      });
   } catch (err) {
      isSubmitting.value = false;
      showErrorToast('Failed to save project');
   }
}

function handleNameBlur() {
   const error = validateName(project.value.name);
   if (error) {
      errors.value.name = error;
   } else {
      delete errors.value.name;
   }
}
</script>

<template>
   <ResponsiveModal
      v-model:open="open"
      :title="modalTitle"
      :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }"
      @update:open="() => (errors.value = {})"
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
               @update:model-value="(val) => (project.name = val)"
               @blur="handleNameBlur"
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
