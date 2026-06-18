<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
   (e: 'edit'): void;
   (e: 'delete'): void;
}>();

function handleEdit() {
   emit('edit');
   open.value = false;
}

function handleDelete() {
   emit('delete');
   open.value = false;
}
</script>

<template>
   <UModal v-model:open="open" :title="$t('bingo.cell-actions')" :ui="{ content: 'mx-2 w-[calc(100%-1rem)] sm:mx-0 sm:max-w-sm' }">
      <template #body>
         <div class="space-y-3 p-4">
            <UButton
               color="primary"
               variant="soft"
               icon="i-heroicons-pencil-16-solid"
               class="w-full justify-start"
               :aria-label="$t('actions.edit-type', { type: $t('bingo.cell') })"
               @click="handleEdit"
            >
               {{ $t('actions.edit') }}
            </UButton>
            <UButton
               color="error"
               variant="soft"
               icon="i-heroicons-trash-16-solid"
               class="w-full justify-start"
               :aria-label="$t('actions.delete-type', { type: $t('bingo.cell') })"
               @click="handleDelete"
            >
               {{ $t('actions.delete') }}
            </UButton>
         </div>
      </template>
   </UModal>
</template>
