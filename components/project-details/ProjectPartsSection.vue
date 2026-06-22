<script setup lang="ts">
import type { SelectPart } from '~/db/schema';

const props = defineProps<{
   parts?: SelectPart[];
   pending: boolean;
   storageKey?: string;
}>();

const selectedPartForActions = ref<SelectPart | null>(null);
const isPartActionsOpen = ref(false);
const openPartId = ref<number | null>(null);
const resolvedStorageKey = computed(() => props.storageKey ?? 'wooly:parts:last-open');

const emit = defineEmits<{
   (e: 'edit', part: SelectPart): void;
   (e: 'delete', id: number): void;
   (e: 'adjust', payload: { part: SelectPart; increment: boolean }): void;
   (e: 'toggle-completed', payload: { partId: number; completed: boolean }): void;
}>();

function openPartActions(part: SelectPart) {
   selectedPartForActions.value = part;
   isPartActionsOpen.value = true;
}

function togglePartOpen(partId: number) {
   openPartId.value = openPartId.value === partId ? null : partId;
}

function shouldIgnoreCardToggle(target: EventTarget | null): boolean {
   if (!(target instanceof Element)) {
      return false;
   }

   return Boolean(target.closest('button, a, input, select, textarea, [role="button"], [data-no-card-toggle="true"]'));
}

function handlePartCardClick(event: MouseEvent, partId: number) {
   if (shouldIgnoreCardToggle(event.target)) {
      return;
   }

   togglePartOpen(partId);
}

function handlePartCardKeydown(event: KeyboardEvent, partId: number) {
   if (event.key !== 'Enter' && event.key !== ' ') {
      return;
   }

   if (shouldIgnoreCardToggle(event.target)) {
      return;
   }

   event.preventDefault();
   togglePartOpen(partId);
}

function restoreOpenPartId() {
   if (!import.meta.client) {
      return;
   }

   const storedValue = localStorage.getItem(resolvedStorageKey.value);
   if (storedValue === null) {
      openPartId.value = null;
      return;
   }

   const parsed = Number(storedValue);
   openPartId.value = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function handleStorageKeyChange() {
   restoreOpenPartId();
}

function persistOpenPartId(partId: number | null) {
   if (!import.meta.client) {
      return;
   }

   if (partId === null) {
      localStorage.removeItem(resolvedStorageKey.value);
      return;
   }

   localStorage.setItem(resolvedStorageKey.value, String(partId));
}

function resetOpenPartIfMissing(partIds: number[]) {
   if (openPartId.value === null) {
      return;
   }

   if (!partIds.includes(openPartId.value)) {
      openPartId.value = null;
   }
}

watch(resolvedStorageKey, handleStorageKeyChange, { immediate: true });

watch(openPartId, persistOpenPartId);

watch(() => (props.parts ?? []).map((part) => part.id), resetOpenPartIfMissing, { immediate: true });
</script>

<template>
   <div v-auto-animate class="grid grid-cols-1 gap-2" :class="{ 'opacity-75': pending }">
      <UCard v-for="part in parts ?? []" :key="part.id" class="wooly-shell w-full px-2.5 py-1.5">
         <div
            :class="openPartId === part.id ? 'space-y-3' : 'space-y-1.5'"
            role="button"
            tabindex="0"
            :aria-expanded="openPartId === part.id"
            @click="handlePartCardClick($event, part.id)"
            @keydown="handlePartCardKeydown($event, part.id)"
         >
            <div class="flex items-start justify-between gap-2">
               <div class="min-w-0 flex items-start gap-1.5">
                  <UButton
                     :icon="openPartId === part.id ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'"
                     variant="ghost"
                     color="neutral"
                     size="md"
                     class="mt-0.5"
                     :aria-label="$t('actions.open-type', { type: $t('parts.part') })"
                     :aria-expanded="openPartId === part.id"
                     @click="togglePartOpen(part.id)"
                  />

                  <div class="text-left min-w-0">
                     <p class="truncate wooly-title text-sm text-pink-900 dark:text-pink-100">{{ part.name }}</p>
                     <div class="mt-0.5 flex items-baseline gap-1.5 text-xs wooly-muted">
                        <span class="truncate">{{ part.completed ? $t('generic.completed') : $t('generic.active') }}</span>
                        <span aria-hidden="true" class="opacity-60">•</span>
                        <span class="whitespace-nowrap">{{ $t('parts.row-count') }}:</span>
                        <span class="whitespace-nowrap font-semibold tabular-nums text-pink-900 dark:text-pink-100">{{
                           part.counter
                        }}</span>
                     </div>
                  </div>
               </div>

               <UButton
                  icon="i-heroicons-ellipsis-vertical-16-solid"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  class="tap-target-icon"
                  :aria-label="$t('actions.open-type', { type: $t('parts.part') })"
                  @click.stop="openPartActions(part)"
               />
            </div>

            <div
               v-if="openPartId === part.id"
               class="flex items-center justify-center gap-2 border-t border-pink-200/60 dark:border-pink-900/50 pt-2"
            >
               <UButton
                  icon="i-heroicons-minus-16-solid"
                  variant="soft"
                  color="error"
                  size="xs"
                  class="tap-target-icon"
                  :aria-label="$t('actions.decrease-count', { type: $t('parts.part') })"
                  @click.stop="emit('adjust', { part, increment: false })"
               />
               <span class="min-w-9 text-center text-sm font-semibold tabular-nums text-pink-900 dark:text-pink-100">{{
                  part.counter
               }}</span>
               <UButton
                  icon="i-heroicons-plus-16-solid"
                  variant="soft"
                  color="success"
                  size="xs"
                  class="tap-target-icon"
                  :aria-label="$t('actions.increase-count', { type: $t('parts.part') })"
                  @click.stop="emit('adjust', { part, increment: true })"
               />
            </div>
         </div>
      </UCard>
   </div>

   <ModalsPartActions
      v-if="selectedPartForActions"
      v-model:open="isPartActionsOpen"
      :part="selectedPartForActions"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
      @toggle-completed="emit('toggle-completed', $event)"
   />

   <div v-if="!pending && !parts?.length" class="wooly-shell px-6 py-10 text-center">
      <p class="text-pink-900 dark:text-pink-100">{{ $t('generic.no-results-for-type', { type: $t('parts.part', 2) }) }}</p>
   </div>
</template>
