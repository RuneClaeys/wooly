<script lang="ts" setup>
const { showConfirmation, confirmationPrompt, closeConfirmation } = useConfirmation();
</script>

<template>
   <UModal :model-value="showConfirmation" @close="confirmationPrompt?.onCancel">
      <UCard>
         <template #header>
            <p>{{ confirmationPrompt?.title }}</p>
         </template>

         <p>{{ confirmationPrompt?.description }}</p>

         <template #footer>
            <div class="flex justify-end">
               <UButton
                  v-if="confirmationPrompt?.onCancel"
                  variant="ghost"
                  color="gray"
                  @click="confirmationPrompt.onCancel(closeConfirmation)"
               >
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

<style lang="scss" scoped></style>
