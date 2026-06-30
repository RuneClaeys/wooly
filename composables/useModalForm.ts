import { ref, watch, type Ref } from 'vue';

type Validators<T> = {
   [K in keyof T]?: (value: T[K], form: T) => string | null;
};

interface UseModalFormOptions<T extends Record<string, unknown>> {
   /** Factory that produces a fresh form state, typically derived from props. */
   createInitial: () => T;
   /** Per-field validation functions. Return an error message or `null` when valid. */
   validators?: Validators<T>;
   /** Reactive source (e.g. a prop) that resets the form whenever it changes. */
   watchSource?: () => unknown;
}

/**
 * Encapsulates the modal form pattern shared across the CRUD modals:
 * reactive form state synced from props, a validation error map, a submitting
 * flag, and helpers to validate the whole form or a single field on blur.
 */
export function useModalForm<T extends Record<string, unknown>>(options: UseModalFormOptions<T>) {
   const { createInitial, watchSource } = options;
   const validators: Validators<T> = options.validators ?? {};

   const form = ref(createInitial()) as Ref<T>;
   const errors = ref<Record<string, string>>({});
   const isSubmitting = ref(false);

   function runValidator(field: keyof T): string | null {
      const validator = validators[field] as ((value: T[keyof T], form: T) => string | null) | undefined;
      if (!validator) return null;
      return validator(form.value[field], form.value);
   }

   function reset() {
      form.value = createInitial();
      errors.value = {};
   }

   function clearErrors() {
      errors.value = {};
   }

   function validateField(field: keyof T) {
      if (!validators[field]) return;

      const message = runValidator(field);
      if (message) errors.value[field as string] = message;
      else delete errors.value[field as string];
   }

   function validate(): boolean {
      errors.value = {};

      for (const field in validators) {
         const message = runValidator(field as keyof T);
         if (message) errors.value[field] = message;
      }

      return Object.keys(errors.value).length === 0;
   }

   if (watchSource) watch(watchSource, reset);

   return { form, errors, isSubmitting, reset, clearErrors, validateField, validate };
}
