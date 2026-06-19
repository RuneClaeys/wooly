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
   step?: number;
   showStepper?: boolean;
   decrementAriaLabel?: string;
   incrementAriaLabel?: string;
}

interface Emits {
   (e: 'update:modelValue', value: string | number): void;
   (e: 'blur'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const hasError = computed(() => Boolean(props.error));

const shouldShowSuccess = computed(() => {
   if (hasError.value) return false;

   const value = props.modelValue;
   if (value === null || value === undefined) return false;

   if (props.type === 'number') {
      return Number(value) > 0;
   }

   return String(value).trim().length > 0;
});

const displayValue = computed(() => {
   const value = props.modelValue;
   return value !== null && value !== undefined ? String(value) : '';
});

const stepValue = computed(() => {
   if (typeof props.step === 'number' && Number.isFinite(props.step) && props.step > 0) return props.step;
   return 1;
});

const hasStepper = computed(() => props.type === 'number' && props.showStepper);

const numericValue = computed(() => {
   const parsed = Number(props.modelValue);
   if (Number.isFinite(parsed)) return parsed;
   if (typeof props.min === 'number') return props.min;
   return 0;
});

const stepPrecision = computed(() => {
   const asString = String(stepValue.value);
   const decimalPart = asString.split('.')[1];
   return decimalPart ? decimalPart.length : 0;
});

const canDecrement = computed(() => {
   if (!hasStepper.value || props.disabled) return false;
   if (typeof props.min !== 'number') return true;
   return numericValue.value > props.min;
});

const canIncrement = computed(() => {
   if (!hasStepper.value || props.disabled) return false;
   if (typeof props.max !== 'number') return true;
   return numericValue.value < props.max;
});

function clampValue(value: number): number {
   let next = value;

   if (typeof props.min === 'number') {
      next = Math.max(next, props.min);
   }

   if (typeof props.max === 'number') {
      next = Math.min(next, props.max);
   }

   return next;
}

function applyStep(direction: -1 | 1) {
   if (!hasStepper.value || props.disabled) return;

   const delta = stepValue.value * direction;
   const nextRaw = numericValue.value + delta;
   const nextClamped = clampValue(nextRaw);
   const next = Number(nextClamped.toFixed(stepPrecision.value));

   emit('update:modelValue', next);
}
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
            <button
               v-if="hasStepper"
               type="button"
               :disabled="!canDecrement"
               :aria-label="decrementAriaLabel || 'Decrease value'"
               class="stepper-btn stepper-btn-left"
               @click="applyStep(-1)"
            >
               <UIcon name="i-heroicons-minus-small" class="size-5" />
            </button>

            <UInput
               :model-value="displayValue"
               :type="type"
               :placeholder="placeholder"
               :disabled="disabled"
               :maxlength="maxLength"
               :min="min"
               :max="max"
               :step="step"
               :color="hasError ? 'red' : 'gray'"
               :ui="{
                  base: 'disabled:cursor-not-allowed disabled:opacity-50',
                  form: 'transition-colors',
               }"
               class="wooly-input"
               :class="['w-full min-h-11 rounded-lg font-normal', hasStepper ? 'wooly-input-stepper' : '']"
               @update:model-value="$emit('update:modelValue', $event)"
               @blur="$emit('blur')"
            />

            <button
               v-if="hasStepper"
               type="button"
               :disabled="!canIncrement"
               :aria-label="incrementAriaLabel || 'Increase value'"
               class="stepper-btn stepper-btn-right"
               @click="applyStep(1)"
            >
               <UIcon name="i-heroicons-plus-small" class="size-5" />
            </button>
         </div>

         <!-- Error icon -->
         <UIcon
            v-if="hasError && !hasStepper"
            name="i-heroicons-exclamation-circle-16-solid"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-error-500 dark:text-error-400 pointer-events-none"
         />

         <!-- Success icon -->
         <UIcon
            v-else-if="shouldShowSuccess && !hasStepper"
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
   background: transparent;
   color: var(--wooly-text-main);
}

.dark .wooly-input {
   background: transparent;
   color: var(--wooly-text-main);
}

.wooly-input :deep(input) {
   background: transparent !important;
   border: 0 !important;
   box-shadow: none !important;
   padding: 0.7rem 0.95rem !important;
   color: var(--wooly-text-main);
}

.wooly-input-stepper :deep(input) {
   padding-left: 2.8rem !important;
   padding-right: 2.8rem !important;
   text-align: center;
}

.wooly-input :deep(input:focus) {
   outline: none !important;
   box-shadow: none !important;
}

.wooly-field-shell {
   border-width: 1px;
   border-style: solid;
   border-radius: 0.8rem;
   position: relative;
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

.wooly-input::placeholder {
   color: var(--wooly-text-soft);
   opacity: 0.6;
   font-style: italic;
}

.wooly-input:focus {
   outline: none;
}

.stepper-btn {
   position: absolute;
   top: 50%;
   transform: translateY(-50%);
   display: inline-flex;
   align-items: center;
   justify-content: center;
   width: 2.1rem;
   height: 2.1rem;
   border-radius: 999px;
   color: var(--wooly-text-soft);
   background: color-mix(in oklab, var(--wooly-bg-1) 75%, white);
   transition:
      background-color 0.16s ease,
      color 0.16s ease,
      opacity 0.16s ease;
   z-index: 1;
}

.dark .stepper-btn {
   background: color-mix(in oklab, var(--wooly-bg-2) 82%, black);
}

.stepper-btn:hover:not(:disabled) {
   color: var(--wooly-text-main);
   background: color-mix(in oklab, var(--wooly-primary) 14%, white);
}

.stepper-btn:disabled {
   opacity: 0.45;
   cursor: not-allowed;
}

.stepper-btn-left {
   left: 0.4rem;
}

.stepper-btn-right {
   right: 0.4rem;
}
</style>
