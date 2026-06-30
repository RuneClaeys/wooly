import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from '~/composables/useToast';

describe('useToast', () => {
   beforeEach(() => {
      vi.useFakeTimers();
      // The composable keeps a module-level toast list; clear it between tests.
      const { toasts, removeToast } = useToast();
      [...toasts.value].forEach((toast) => removeToast(toast.id));
   });

   afterEach(() => {
      vi.useRealTimers();
   });

   it('adds a toast and returns its id', () => {
      const { addToast, toasts } = useToast();

      const id = addToast({ type: 'success', message: 'Saved' });

      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]).toMatchObject({ id, type: 'success', message: 'Saved', duration: 4000 });
   });

   it('removes a toast by id', () => {
      const { addToast, removeToast, toasts } = useToast();

      const id = addToast({ type: 'info', message: 'Heads up' });
      expect(toasts.value).toHaveLength(1);

      removeToast(id);
      expect(toasts.value).toHaveLength(0);
   });

   it('auto-dismisses a toast after its default duration', () => {
      const { addToast, toasts } = useToast();

      addToast({ type: 'warning', message: 'Careful' });
      expect(toasts.value).toHaveLength(1);

      vi.advanceTimersByTime(3999);
      expect(toasts.value).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(toasts.value).toHaveLength(0);
   });

   it('respects a custom duration', () => {
      const { addToast, toasts } = useToast();

      addToast({ type: 'error', message: 'Boom', duration: 1000 });

      vi.advanceTimersByTime(999);
      expect(toasts.value).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(toasts.value).toHaveLength(0);
   });

   it('does not auto-dismiss when duration is 0 (sticky)', () => {
      const { addToast, toasts } = useToast();

      addToast({ type: 'info', message: 'Stays', duration: 0 });

      vi.advanceTimersByTime(60_000);
      expect(toasts.value).toHaveLength(1);
   });

   it('exposes typed helpers that set the correct toast type', () => {
      const { success, error, info, warning, toasts } = useToast();

      success('s');
      error('e');
      info('i');
      warning('w');

      expect(toasts.value.map((t) => t.type)).toEqual(['success', 'error', 'info', 'warning']);
   });
});
