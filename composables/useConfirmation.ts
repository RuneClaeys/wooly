const confirmationPrompt = ref<{
   title: string;
   description?: string;
   confirmText?: string;
   cancelText?: string;
   onConfirm?: (done: () => void) => void;
   onCancel?: (done: () => void) => void;
}>();

export const useConfirmation = () => {
   const { t } = useI18n();
   const showConfirmation = computed(() => !!confirmationPrompt.value);

   function closeConfirmation() {
      confirmationPrompt.value = undefined;
   }

   function promptDeleteConfirmation(type: string, onConfirm: (done: () => void) => void) {
      confirmationPrompt.value = {
         title: t('actions.delete-type', { type }),
         description: t('actions.confirm-delete-type', { type }),
         confirmText: t('actions.delete'),
         cancelText: t('actions.cancel'),
         onConfirm,
      };
   }

   return {
      confirmationPrompt,
      showConfirmation,
      closeConfirmation,
      promptDeleteConfirmation,
   };
};
