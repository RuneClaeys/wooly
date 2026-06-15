<script setup lang="ts">
import type { SelectPart } from '~/db/schema';

interface Props {
   projectId: number;
   parts: SelectPart[] | null;
   pending: boolean;
}

interface Emits {
   (e: 'create'): void;
   (e: 'edit', part: SelectPart): void;
   (e: 'delete', id: number): void;
   (e: 'adjust', payload: { part: SelectPart; increment: boolean }): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const { sorting } = useSorting('parts');

const hasAnyData = computed(() => (props.parts?.length ?? 0) > 0);
</script>

<template>
   <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between px-2">
         <h3 class="wooly-title text-sm">{{ $t('parts.parts') }} ({{ parts?.length ?? 0 }})</h3>
         <UButton
            size="xs"
            variant="ghost"
            icon="i-heroicons-plus-16-solid"
            :aria-label="$t('actions.create-type', { type: $t('parts.part') })"
            @click="$emit('create')"
         />
      </div>

      <!-- Sorting Controls -->
      <ProjectPartsSection
         v-model:sorting="sorting"
         :parts="parts ?? []"
         :pending="pending"
         @edit="$emit('edit', $event)"
         @delete="$emit('delete', $event)"
         @adjust="$emit('adjust', $event)"
      />

      <!-- Empty State -->
      <div
         v-if="!pending && !hasAnyData"
         class="wooly-shell rounded-xl p-6 text-center space-y-3"
      >
         <UIcon
            name="i-heroicons-list-bullet-16-solid"
            class="w-12 h-12 mx-auto wooly-muted"
         />
         <div>
            <p class="wooly-title text-sm">{{ $t('parts.no-parts') }}</p>
            <p class="wooly-muted text-xs mt-1">{{ $t('parts.no-parts-hint') }}</p>
         </div>
         <UButton
            size="sm"
            icon="i-heroicons-plus-16-solid"
            :label="$t('actions.add')"
            @click="$emit('create')"
         />
      </div>
   </div>
</template>
