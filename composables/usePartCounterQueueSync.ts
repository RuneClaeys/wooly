import type { Ref } from 'vue';
import type { SelectPart } from '~/db/schema';

type AdjustCounterInput = { id: number; delta: number };

type UsePartCounterQueueSyncOptions = {
   projectId: Ref<number>;
   parts: Ref<SelectPart[] | null | undefined>;
   refreshParts: () => Promise<unknown>;
   adjustCounter: (input: AdjustCounterInput) => Promise<unknown>;
   onSyncError: () => void;
};

export const usePartCounterQueueSync = ({ projectId, parts, refreshParts, adjustCounter, onSyncError }: UsePartCounterQueueSyncOptions) => {
   const partCounterQueueStorageKey = computed(() => `wooly:project:${projectId.value}:part-counter-deltas`);
   const pendingPartCounterDeltas = ref<Record<number, number>>({});
   const appliedPendingCounterOffsets = ref<Record<number, number>>({});
   const isFlushingPartCounterQueue = ref(false);
   let partCounterFlushTimeout: ReturnType<typeof setTimeout> | undefined;

   function isClientOnline() {
      if (!import.meta.client) return true;
      return navigator.onLine;
   }

   function readPendingPartCounterDeltas() {
      if (!import.meta.client) return {} as Record<number, number>;

      const rawValue = localStorage.getItem(partCounterQueueStorageKey.value);
      if (!rawValue) return {} as Record<number, number>;

      try {
         const parsed = JSON.parse(rawValue) as Record<string, number>;
         const normalized: Record<number, number> = {};

         Object.entries(parsed).forEach(([key, value]) => {
            const id = Number(key);
            if (!Number.isInteger(id) || !Number.isInteger(value) || value === 0) return;
            normalized[id] = value;
         });

         return normalized;
      } catch {
         return {} as Record<number, number>;
      }
   }

   function persistPendingPartCounterDeltas() {
      if (!import.meta.client) return;
      if (!Object.keys(pendingPartCounterDeltas.value).length) {
         localStorage.removeItem(partCounterQueueStorageKey.value);
         return;
      }

      localStorage.setItem(partCounterQueueStorageKey.value, JSON.stringify(pendingPartCounterDeltas.value));
   }

   function queuePartCounterDelta(partId: number, delta: number) {
      const nextDelta = (pendingPartCounterDeltas.value[partId] ?? 0) + delta;

      if (nextDelta === 0) {
         const { [partId]: _, ...rest } = pendingPartCounterDeltas.value;
         pendingPartCounterDeltas.value = rest;
      } else {
         pendingPartCounterDeltas.value = { ...pendingPartCounterDeltas.value, [partId]: nextDelta };
      }

      persistPendingPartCounterDeltas();
   }

   function applyPendingPartCounterDeltasToVisibleParts() {
      const partRows = parts.value ?? [];
      const pendingDeltas = pendingPartCounterDeltas.value;

      partRows.forEach((part: SelectPart) => {
         const targetOffset = pendingDeltas[part.id] ?? 0;
         const appliedOffset = appliedPendingCounterOffsets.value[part.id] ?? 0;
         const deltaToApply = targetOffset - appliedOffset;

         if (deltaToApply === 0) return;

         part.counter += deltaToApply;
         appliedPendingCounterOffsets.value[part.id] = targetOffset;
      });
   }

   async function flushPartCounterQueue() {
      if (isFlushingPartCounterQueue.value || !isClientOnline()) return;

      const queuedEntries = Object.entries(pendingPartCounterDeltas.value).map(([key, value]) => ({ id: Number(key), delta: value }));
      if (!queuedEntries.length) return;

      isFlushingPartCounterQueue.value = true;
      pendingPartCounterDeltas.value = {};
      persistPendingPartCounterDeltas();

      let hasFailedUpdate = false;

      try {
         for (const entry of queuedEntries) {
            try {
               await adjustCounter({ id: entry.id, delta: entry.delta });
            } catch {
               hasFailedUpdate = true;
               queuePartCounterDelta(entry.id, entry.delta);
            }
         }

         if (hasFailedUpdate) onSyncError();

         await refreshParts();

         if (isClientOnline() && Object.keys(pendingPartCounterDeltas.value).length) schedulePartCounterQueueFlush();
      } finally {
         isFlushingPartCounterQueue.value = false;
      }
   }

   function schedulePartCounterQueueFlush() {
      if (partCounterFlushTimeout) clearTimeout(partCounterFlushTimeout);
      partCounterFlushTimeout = setTimeout(() => {
         void flushPartCounterQueue();
      }, 250);
   }

   function handleReconnect() {
      schedulePartCounterQueueFlush();
   }

   function adjustPartCounter(part: SelectPart, increment: boolean) {
      const delta = increment ? 1 : -1;
      part.counter += delta;
      appliedPendingCounterOffsets.value[part.id] = (appliedPendingCounterOffsets.value[part.id] ?? 0) + delta;
      queuePartCounterDelta(part.id, delta);
      if (isClientOnline()) schedulePartCounterQueueFlush();
   }

   function handlePartsRefresh() {
      appliedPendingCounterOffsets.value = {};
      applyPendingPartCounterDeltasToVisibleParts();
   }

   onMounted(() => {
      pendingPartCounterDeltas.value = readPendingPartCounterDeltas();
      if (isClientOnline()) schedulePartCounterQueueFlush();
      window.addEventListener('online', handleReconnect);
   });

   onBeforeUnmount(() => {
      window.removeEventListener('online', handleReconnect);
      if (partCounterFlushTimeout) clearTimeout(partCounterFlushTimeout);
   });

   watch(parts, handlePartsRefresh, { deep: false });

   return {
      adjustPartCounter,
   };
};
