<script lang="ts" setup>
const { showConfirmation, confirmationPrompt, closeConfirmation } = useConfirmation();
</script>

<template>
   <UModal
      :open="showConfirmation"
      :title="confirmationPrompt?.title"
      :description="confirmationPrompt?.description"
      :ui="{ content: 'max-w-md' }"
      @update:open="(nextOpen) => !nextOpen && closeConfirmation()"
   >
      <template #footer>
         <div class="flex justify-end gap-2">
            <UButton
               v-if="confirmationPrompt?.onCancel"
               variant="soft"
               color="neutral"
               @click="confirmationPrompt.onCancel(closeConfirmation)"
            >
               {{ confirmationPrompt?.cancelText }}
            </UButton>
            <UButton v-if="confirmationPrompt?.onConfirm" color="error" @click="confirmationPrompt.onConfirm(closeConfirmation)">
               {{ confirmationPrompt?.confirmText }}
            </UButton>
         </div>
      </template>
   </UModal>
</template>
