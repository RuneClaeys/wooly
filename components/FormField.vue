<script setup lang="ts">
import { computed } from 'vue';

interface Props {
   label: string;
   modelValue: string | number;
   error?: string | null;
   placeholder?: string;
   type?: 'text' | 'number';
   required?: boolean;
   disabled?: boolean;
   hint?: string;
   maxLength?: number;
   min?: number;
   max?: number;
}

interface Emits {
   (e: 'update:modelValue', value: string | number): void;
   (e: 'blur'): void;
}

defineProps<Props>();
defineEmits<Emits>();

const hasError = computed(() => Boolean(error));

const displayValue = computed(() => {
   const value = modelValue;
   return value !== null && value !== undefined ? String(value) : '';
});
</script>

<template>
   <div class="space-y-1.5">
      <label :class="['block text-sm font-medium', hasError ? 'text-error-600 dark:text-error-400' : 'text-slate-700 dark:text-slate-300']">
         {{ label }}
         <span v-if="required" class="text-error-500 dark:text-error-400 ml-1">*</span>
      </label>

      <div class="relative">
         <UInput
            :model-value="displayValue"
            :type="type"
            :placeholder="placeholder"
            :disabled="disabled"
            :maxlength="maxLength"
            :min="min"
            :max="max"
            :color="hasError ? 'red' : 'gray'"
            :ui="{
               base: 'disabled:cursor-not-allowed disabled:opacity-50',
               form: 'transition-colors',
            }"
            class="wooly-input"
            :class="[
               'min-h-[44px] px-3 py-2 rounded-lg font-normal',
               hasError ? 'ring-1 ring-error-500 dark:ring-error-400' : 'ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-primary-500',
            ]"
            @update:model-value="$emit('update:modelValue', $event)"
            @blur="$emit('blur')"
         />

         <!-- Error icon -->
         <UIcon
            v-if="hasError"
            name="i-heroicons-exclamation-circle-16-solid"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-error-500 dark:text-error-400 pointer-events-none"
         />

         <!-- Success icon -->
         <UIcon
            v-else-if="modelValue !== null && modelValue !== '' && modelValue !== undefined"
            name="i-heroicons-check-circle-16-solid"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-success-500 dark:text-success-400 pointer-events-none"
         />
      </div>

      <!-- Error message -->
      <div v-if="hasError" class="flex items-start gap-1.5">
         <p class="text-xs text-error-600 dark:text-error-400 leading-tight">{{ error }}</p>
      </div>

      <!-- Hint text -->
      <p v-else-if="hint" class="text-xs text-slate-500 dark:text-slate-400">{{ hint }}</p>

      <!-- Character counter -->
      <div v-if="maxLength && modelValue" class="text-xs text-slate-400 dark:text-slate-500 text-right">
         {{ String(modelValue).length }} / {{ maxLength }}
      </div>
   </div>
</template>

<style scoped>
.wooly-input {
   background: var(--wooly-bg-1);
   color: var(--wooly-text-main);
}

.dark .wooly-input {
   background: var(--wooly-bg-2);
   color: var(--wooly-text-main);
}

.wooly-input::placeholder {
   color: var(--wooly-text-soft);
   opacity: 0.6;
   font-style: italic;
}

.wooly-input:focus {
   outline: none;
}
</style>
