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
         class="toast-container fixed top-0 left-4 right-4 z-50 flex flex-col items-center gap-2 pointer-events-none sm:left-auto sm:right-6 sm:items-end"
         :style="{ maxWidth: 'min(calc(100vw - 2rem), 24rem)', marginInline: 'auto' }"
      >
         <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2 w-full">
            <div v-for="toast in toasts" :key="toast.id" class="pointer-events-auto">
               <div class="toast-card flex gap-3 items-start px-4 py-3 rounded-2xl shadow-lg">
                  <UIcon
                     :name="getToastIcon(toast.type)"
                     :class="[
                        'shrink-0 w-5 h-5 mt-0.5',
                        toast.type === 'success' && 'text-success-500',
                        toast.type === 'error' && 'text-error-500',
                        toast.type === 'warning' && 'text-warning-500',
                        toast.type === 'info' && 'text-blue-500',
                     ]"
                  />
                  <div class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</div>
                  <button
                     class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                     :aria-label="`Dismiss ${toast.type} notification`"
                     @click="removeToast(toast.id)"
                  >
                     <UIcon name="i-heroicons-x-mark-16-solid" class="w-4 h-4" />
                  </button>
               </div>
            </div>
         </TransitionGroup>
      </div>
   </Teleport>
</template>

<style scoped>
.toast-card {
   background: var(--wooly-card);
   border: 1px solid var(--wooly-card-border);
   backdrop-filter: blur(12px) saturate(120%);
   -webkit-backdrop-filter: blur(12px) saturate(120%);
   box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.1),
      0 1px 4px rgba(0, 0, 0, 0.06);
}

:root.dark .toast-card {
   box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.35),
      0 1px 4px rgba(0, 0, 0, 0.2);
}

.toast-container {
   padding-top: calc(env(safe-area-inset-top) + 0.75rem);
}

@media (min-width: 640px) {
   .toast-container {
      padding-top: 1.5rem;
   }
}

.toast-enter-active,
.toast-leave-active {
   transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
   opacity: 0;
   transform: translateY(-1rem) scale(0.95);
}

.toast-leave-to {
   opacity: 0;
   transform: translateY(-0.5rem) scale(0.97);
}

@media (min-width: 640px) {
   .toast-enter-from {
      opacity: 0;
      transform: translateX(100%);
   }

   .toast-leave-to {
      opacity: 0;
      transform: translateX(100%);
   }
}

.toast-move {
   transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
