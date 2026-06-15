interface Toast {
   id: string;
   type: 'success' | 'error' | 'info' | 'warning';
   message: string;
   duration?: number;
}

const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

export const useToast = () => {
   const addToast = (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${toastIdCounter++}`;
      const toastItem: Toast = {
         ...toast,
         id,
         duration: toast.duration ?? 4000,
      };

      toasts.value.push(toastItem);

      if (toastItem.duration! > 0) {
         setTimeout(() => {
            removeToast(id);
         }, toastItem.duration);
      }

      return id;
   };

   const removeToast = (id: string) => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
   };

   const success = (message: string, duration?: number) =>
      addToast({ type: 'success', message, duration });

   const error = (message: string, duration?: number) =>
      addToast({ type: 'error', message, duration });

   const info = (message: string, duration?: number) =>
      addToast({ type: 'info', message, duration });

   const warning = (message: string, duration?: number) =>
      addToast({ type: 'warning', message, duration });

   return {
      toasts,
      addToast,
      removeToast,
      success,
      error,
      info,
      warning,
   };
};
