<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts, removeToast } = useToast();

const getToastIcon = (type: string) => {
   const icons: Record<string, string> = {
      success: 'i-heroicons-check-circle-16-solid',
      error: 'i-heroicons-exclamation-circle-16-solid',
      info: 'i-heroicons-information-circle-16-solid',
      warning: 'i-heroicons-exclamation-triangle-16-solid',
   };
   return icons[type] || 'i-heroicons-check-circle-16-solid';
};

const getToastColor = (type: string) => {
   const colors: Record<string, string> = {
      success: 'success',
      error: 'error',
      info: 'blue',
      warning: 'warning',
   };
   return colors[type] || 'primary';
};
</script>

<template>
   <Teleport to="body">
      <div
         class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:bottom-6 sm:right-6"
         :style="{ maxWidth: 'min(calc(100vw - 2rem), 24rem)' }"
      >
         <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
            <div v-for="toast in toasts" :key="toast.id" class="wooly-slide-in-up pointer-events-auto">
               <UCard class="wooly-shell flex gap-3 items-start p-4" :ui="{ base: 'relative' }">
                  <UIcon
                     :name="getToastIcon(toast.type)"
                     :class="[
                        'flex-shrink-0 w-5 h-5 mt-0.5',
                        toast.type === 'success' && 'text-success-500',
                        toast.type === 'error' && 'text-error-500',
                        toast.type === 'warning' && 'text-warning-500',
                        toast.type === 'info' && 'text-blue-500',
                     ]"
                  />
                  <div class="flex-1 text-sm leading-snug">{{ toast.message }}</div>
                  <button
                     class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                     :aria-label="`Dismiss ${toast.type} notification`"
                     @click="removeToast(toast.id)"
                  >
                     <UIcon name="i-heroicons-x-mark-16-solid" class="w-4 h-4" />
                  </button>
               </UCard>
            </div>
         </TransitionGroup>
      </div>
   </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
   transition: all 120ms ease-out;
}

.toast-enter-from {
   opacity: 0;
   transform: translateX(100%);
}

.toast-leave-to {
   opacity: 0;
   transform: translateX(100%);
}

.toast-move {
   transition: transform 120ms ease-out;
}
</style>
