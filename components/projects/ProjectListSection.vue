<script setup lang="ts">
import type { Sorting } from '~/composables/useSorting';
import type { SelectProject } from '~/db/schema';

const { t } = useI18n();

const status = defineModel<'active' | 'finished'>('status', { default: 'active' });
const sorting = defineModel<Sorting>('sorting');

defineProps<{
   projects?: SelectProject[];
   pending: boolean;
   errorMessage?: string | null;
}>();

const emit = defineEmits<{
   (e: 'create-project'): void;
   (e: 'open-project', id: number): void;
   (e: 'edit-project', project: SelectProject): void;
   (e: 'delete-project', id: number): void;
}>();

const statusOptions = computed(() => [
   { label: t('generic.active'), value: 'active' },
   { label: t('generic.completed'), value: 'finished' },
]);

const showFilters = ref(false);
const hasActiveFilters = computed(
   () => status.value === 'finished' || sorting.value?.orderBy !== 'createdAt' || sorting.value?.order !== 'desc',
);
</script>

<template>
   <div class="flex flex-wrap items-center justify-between gap-2 px-1">
      <div class="flex items-center gap-2">
         <p class="text-sm wooly-muted">
            {{ $t('projects.visible-count', { count: projects?.length ?? 0 }) }}
         </p>
         <UBadge color="neutral" variant="soft" size="sm">
            {{ status === 'finished' ? $t('generic.completed') : $t('generic.active') }}
         </UBadge>
      </div>

      <UButton
         icon="i-heroicons-funnel-16-solid"
         color="neutral"
         size="sm"
         :variant="hasActiveFilters ? 'soft' : 'ghost'"
         class="tap-target tap-target-icon"
         :aria-label="$t('filters.open')"
         :title="$t('filters.open')"
         @click="showFilters = !showFilters"
      />
   </div>

   <UCard v-if="showFilters" class="wooly-shell">
      <div class="grid gap-2 md:grid-cols-3">
         <USelect
            v-model="sorting.orderBy"
            :items="[
               { label: $t('generic.name'), value: 'name' },
               { label: $t('filters.created-on'), value: 'createdAt' },
               { label: $t('filters.last-changed-at'), value: 'updatedAt' },
            ]"
            size="md"
            class="w-full wooly-select-clean"
         />

         <USelect
            v-model="sorting.order"
            :items="[
               { label: $t('filters.newest-first'), value: 'asc' },
               { label: $t('filters.oldest-first'), value: 'desc' },
            ]"
            size="md"
            class="w-full wooly-select-clean"
         />

         <USelect v-model="status" :items="statusOptions" size="md" class="w-full wooly-select-clean" />
      </div>
   </UCard>

   <div v-if="errorMessage" class="wooly-shell px-4 py-3 text-sm text-red-700 dark:text-red-300">
      {{ errorMessage }}
   </div>

   <div v-auto-animate class="grid grid-cols-1 gap-3" :class="{ 'opacity-80': pending }">
      <UCard
         v-for="project in projects ?? []"
         :key="project.id"
         class="wooly-shell w-full cursor-pointer transition duration-150 will-change-transform hover:-translate-y-0.5"
         @click="emit('open-project', project.id)"
      >
         <div class="flex items-start justify-between gap-2">
            <div class="space-y-2">
               <p class="wooly-title text-base">{{ project.name }}</p>
               <UBadge :color="project.finished ? 'neutral' : 'success'" variant="soft" size="sm">
                  {{ project.finished ? $t('generic.completed') : $t('generic.active') }}
               </UBadge>
            </div>

            <div class="flex items-center gap-1">
               <UButton
                  icon="i-heroicons-pencil-16-solid"
                  variant="ghost"
                  color="neutral"
                  size="md"
                  class="tap-target tap-target-icon"
                  :aria-label="$t('actions.edit-type', { type: $t('projects.project') })"
                  @click.stop="emit('edit-project', project)"
               />
               <UButton
                  icon="i-heroicons-trash-16-solid"
                  variant="ghost"
                  color="error"
                  size="md"
                  class="tap-target tap-target-icon"
                  :aria-label="$t('actions.delete-type', { type: $t('projects.project') })"
                  @click.stop="emit('delete-project', project.id)"
               />
            </div>
         </div>
      </UCard>
   </div>

   <div v-if="!pending && !projects?.length" class="wooly-shell px-6 py-10 text-center space-y-4">
      <div
         class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100/70 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300"
      >
         <UIcon name="i-heroicons-folder-plus-16-solid" class="h-7 w-7" />
      </div>
      <div class="space-y-1">
         <p class="wooly-title text-base">{{ $t('projects.empty-title') }}</p>
         <p class="wooly-muted text-sm">{{ $t('projects.empty-hint') }}</p>
      </div>
      <UButton
         color="primary"
         icon="i-heroicons-plus-16-solid"
         class="tap-target"
         :label="$t('actions.create-project')"
         @click="emit('create-project')"
      />
   </div>
</template>
