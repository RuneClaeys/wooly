<script lang="ts" setup>
const { showConfirmation, confirmationPrompt, closeConfirmation } = useConfirmation();

function cancel() {
   if (confirmationPrompt.value?.onCancel) {
      return confirmationPrompt.value.onCancel(closeConfirmation);
   }
   return closeConfirmation();
}
</script>

<template>
   <UModal :model-value="showConfirmation" @close="confirmationPrompt?.onCancel">
      <UCard>
         <template #header>
            <p>{{ confirmationPrompt?.title }}</p>
         </template>

         <p>{{ confirmationPrompt?.description }}</p>

         <template #footer>
            <div class="flex justify-between">
               <UButton variant="ghost" color="gray" @click="cancel">
                  {{ confirmationPrompt?.cancelText }}
               </UButton>
               <UButton v-if="confirmationPrompt?.onConfirm" color="primary" @click="confirmationPrompt.onConfirm(closeConfirmation)">
                  {{ confirmationPrompt?.confirmText }}
               </UButton>
            </div>
         </template>
      </UCard>
   </UModal>
</template>
