<script setup lang="ts">
const { t } = useI18n();

interface InitialBoard {
   id: number;
   name: string;
   size: number;
   endDate: string | null;
}

const open = defineModel<boolean>('modelValue', { default: false });
const props = defineProps<{ initialBoard?: InitialBoard }>();
const emit = defineEmits<{
   (
      e: 'save-board',
      payload: {
         board: { name: string; size: 3 | 4; endDate: string };
         done: () => void;
      },
   ): void;
}>();

const board = ref({
   name: props.initialBoard?.name ?? '',
   size: (props.initialBoard?.size ?? 3) as 3 | 4,
   endDate: props.initialBoard?.endDate ? new Date(props.initialBoard.endDate).toISOString().slice(0, 10) : '',
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

function syncBoardFromInitialBoard(initialBoard?: InitialBoard) {
   board.value = {
      name: initialBoard?.name ?? '',
      size: (initialBoard?.size ?? 3) as 3 | 4,
      endDate: initialBoard?.endDate ? new Date(initialBoard.endDate).toISOString().slice(0, 10) : '',
   };
   errors.value = {};
}

watch(() => props.initialBoard, syncBoardFromInitialBoard);

const title = computed(() =>
   props.initialBoard ? t('actions.edit-type', { type: t('bingo.board') }) : t('actions.create-type', { type: t('bingo.board') }),
);

function validate() {
   errors.value = {};

   if (!board.value.name.trim()) {
      errors.value.name = t('form.field-required');
   }

   if (!board.value.endDate) {
      errors.value.endDate = t('form.field-required');
   }

   return Object.keys(errors.value).length === 0;
}

function onSubmit() {
   if (!validate()) return;

   isSubmitting.value = true;
   emit('save-board', {
      board: {
         name: board.value.name.trim(),
         size: board.value.size,
         endDate: board.value.endDate,
      },
      done: () => {
         isSubmitting.value = false;
         if (!props.initialBoard) {
            board.value = { name: '', size: 3, endDate: '' };
         }
         open.value = false;
      },
   });
}
</script>

<template>
   <ResponsiveModal v-model:open="open" :title="title" :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-lg' }">
      <template #body>
         <div class="space-y-4">
            <FormField
               :model-value="board.name"
               :label="$t('generic.name')"
               :error="errors.name"
               :placeholder="$t('bingo.board-name-placeholder')"
               required
               :max-length="120"
               @update:model-value="(value) => (board.name = value)"
            />

            <UFormField :label="$t('bingo.size')" size="lg">
               <USelect
                  v-model="board.size"
                  :items="[
                     { label: '3x3', value: 3 },
                     { label: '4x4', value: 4 },
                  ]"
               />
            </UFormField>

            <UFormField :label="$t('bingo.end-date')" :error="errors.endDate" size="lg">
               <UInput v-model="board.endDate" type="date" />
            </UFormField>
         </div>
      </template>

      <template #footer>
         <div class="flex justify-end gap-2">
            <UButton class="tap-target" variant="soft" color="neutral" :disabled="isSubmitting" @click="open = false">
               {{ $t('actions.cancel') }}
            </UButton>
            <UButton class="tap-target" color="primary" :loading="isSubmitting" :disabled="isSubmitting" @click="onSubmit">
               {{ $t('actions.save') }}
            </UButton>
         </div>
      </template>
   </ResponsiveModal>
</template>
