const confirmationPrompt = ref<{
   title: string;
   description?: string;
   confirmText?: string;
   cancelText?: string;
   onConfirm?: (done: () => void) => void;
   onCancel?: (done: () => void) => void;
}>();

export const useConfirmation = () => {
   const showConfirmation = computed(() => !!confirmationPrompt.value);

   function closeConfirmation() {
      confirmationPrompt.value = undefined;
   }

   function promptConfirmation(input: typeof confirmationPrompt.value) {
      const baseConfirmationPrompt = {
         title: 'Are you sure?',
         description: 'This action cannot be undone.',
         confirmText: 'Yes',
         cancelText: 'Cancel',
         onConfirm: closeConfirmation,
         onCancel: closeConfirmation,
      };

      confirmationPrompt.value = { ...baseConfirmationPrompt, ...input };
   }

   return {
      confirmationPrompt,
      showConfirmation,
      closeConfirmation,
      promptConfirmation,
   };
};
