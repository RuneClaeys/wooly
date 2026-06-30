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
   (e: 'toggle-completed', payload: { partId: number; completed: boolean }): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const { sorting } = useSorting('parts');
const { t } = useI18n();
const showFilters = ref(false);

const orderByOptions = computed(() => [
   { label: t('generic.name'), value: 'name' },
   { label: t('filters.created-on'), value: 'createdAt' },
   { label: t('filters.last-changed-at'), value: 'updatedAt' },
]);

const orderOptions = computed(() => [
   { label: t('filters.newest-first'), value: 'asc' },
   { label: t('filters.oldest-first'), value: 'desc' },
]);

const hasAnyData = computed(() => (props.parts?.length ?? 0) > 0);

function updateOrderBy(value: string | number | null) {
   if (value === 'name' || value === 'createdAt' || value === 'updatedAt') {
      sorting.value = { ...sorting.value, orderBy: value };
   }
}

function updateOrder(value: string | number | null) {
   if (value === 'asc' || value === 'desc') {
      sorting.value = { ...sorting.value, order: value };
   }
}
</script>

<template>
   <div class="space-y-3">
      <div class="flex items-center justify-between px-2">
         <h3 class="wooly-title text-sm">{{ $t('parts.parts') }} ({{ parts?.length ?? 0 }})</h3>
         <div class="flex items-center gap-1">
            <UButton
               size="xs"
               variant="ghost"
               icon="i-heroicons-funnel-16-solid"
               :aria-label="$t('filters.open')"
               @click="showFilters = true"
            />
            <UButton
               size="xs"
               variant="ghost"
               icon="i-heroicons-plus-16-solid"
               :aria-label="$t('actions.create-type', { type: $t('parts.part') })"
               @click="$emit('create')"
            />
         </div>
      </div>

      <ProjectPartsSection
         :parts="parts ?? []"
         :pending="pending"
         :storage-key="`wooly:project:${projectId}:parts:last-open`"
         @edit="$emit('edit', $event)"
         @delete="$emit('delete', $event)"
         @adjust="$emit('adjust', $event)"
         @toggle-completed="$emit('toggle-completed', $event)"
      />

      <UDrawer v-model:open="showFilters" :title="$t('filters.title')">
         <template #body>
            <div class="space-y-4 px-4 py-3">
               <div class="space-y-2">
                  <p class="text-sm wooly-muted">{{ $t('filters.sort-by') }}</p>
                  <ResponsiveSelect
                     :value="sorting.orderBy"
                     :items="orderByOptions"
                     :title="$t('filters.sort-by')"
                     class="w-full wooly-select-clean"
                     @update:value="updateOrderBy"
                  />
               </div>

               <div class="space-y-2">
                  <p class="text-sm wooly-muted">{{ $t('filters.direction') }}</p>
                  <ResponsiveSelect
                     :value="sorting.order"
                     :items="orderOptions"
                     :title="$t('filters.direction')"
                     class="w-full wooly-select-clean"
                     @update:value="updateOrder"
                  />
               </div>
            </div>
         </template>
      </UDrawer>

      <div v-if="!pending && !hasAnyData" class="wooly-shell rounded-xl p-6 text-center space-y-3">
         <UIcon name="i-heroicons-list-bullet-16-solid" class="w-12 h-12 mx-auto wooly-muted" />
         <div>
            <p class="wooly-title text-sm">{{ $t('parts.no-parts') }}</p>
            <p class="wooly-muted text-xs mt-1">{{ $t('parts.no-parts-hint') }}</p>
         </div>
         <UButton size="sm" icon="i-heroicons-plus-16-solid" :label="$t('actions.add')" @click="$emit('create')" />
      </div>
   </div>
</template>
