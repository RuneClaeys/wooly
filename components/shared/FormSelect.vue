<script setup lang="ts">
import { computed } from 'vue';

interface SelectItem {
   label: string;
   value: string | number | null;
}

interface Props {
   label: string;
   modelValue: string | number | null;
   items: SelectItem[];
   error?: string | null;
   placeholder?: string;
   required?: boolean;
   disabled?: boolean;
   clearable?: boolean;
}

const props = defineProps<Props>();
defineEmits<{ (e: 'update:modelValue', value: string | number | null): void }>();

const hasError = computed(() => Boolean(props.error));
</script>

<template>
   <div class="space-y-1.5">
      <label :class="['block text-sm font-medium', hasError ? 'text-error-600 dark:text-error-400' : 'text-slate-700 dark:text-slate-300']">
         {{ label }}
         <span v-if="required" class="text-error-500 dark:text-error-400 ml-1">*</span>
      </label>

      <div class="relative">
         <div
            :class="[
               'wooly-field-shell',
               hasError
                  ? 'wooly-field-shell-error'
                  : 'border-slate-200/90 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
            ]"
         >
            <USelectMenu
               :model-value="modelValue"
               :items="items"
               value-key="value"
               :placeholder="placeholder"
               :search-input="false"
               :disabled="disabled"
               :clear="clearable"
               class="wooly-select w-full"
               @update:model-value="$emit('update:modelValue', $event)"
            />
         </div>
      </div>

      <div v-if="hasError" class="flex items-start gap-1.5">
         <p class="text-xs text-error-600 dark:text-error-400 leading-tight">{{ error }}</p>
      </div>
   </div>
</template>

<style scoped>
.wooly-select {
   width: 100%;
}

.wooly-select :deep(select),
.wooly-select :deep(button),
.wooly-select :deep([role='combobox']) {
   width: 100%;
   min-height: 44px;
   border: 0 !important;
   background: transparent !important;
   box-shadow: none !important;
   border-radius: 0.8rem;
   padding: 0.7rem 0.95rem !important;
   color: var(--wooly-text-main);
   font-size: 0.875rem;
   appearance: none;
   -webkit-appearance: none;
}

.wooly-select :deep(select:focus),
.wooly-select :deep(button:focus),
.wooly-select :deep([role='combobox']:focus) {
   outline: none !important;
   box-shadow: none !important;
}

/* Hide default Nuxt UI wrapper border/ring */
.wooly-select :deep(.relative),
.wooly-select :deep([data-part]) {
   border: 0 !important;
   box-shadow: none !important;
   background: transparent !important;
}

.wooly-field-shell {
   border-width: 1px;
   border-style: solid;
   border-radius: 0.8rem;
   background: color-mix(in oklab, var(--wooly-bg-1) 82%, white);
   transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background-color 0.18s ease;
}

.dark .wooly-field-shell {
   background: color-mix(in oklab, var(--wooly-bg-2) 88%, black);
}

.wooly-field-shell:focus-within {
   border-color: color-mix(in oklab, var(--wooly-primary) 60%, white);
   box-shadow: 0 0 0 3px color-mix(in oklab, var(--wooly-primary) 18%, transparent);
}

.wooly-field-shell-error {
   border-color: color-mix(in oklab, var(--wooly-error) 75%, white);
   box-shadow: 0 0 0 2px color-mix(in oklab, var(--wooly-error) 14%, transparent);
}
</style>
