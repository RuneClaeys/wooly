<script setup lang="ts">
import { useToast } from '~/composables/useToast';

type ArchiveColor = {
   id: number;
   name: string;
   stashCount: number;
   usedCount: number;
   remainingCount: number;
};

type ArchiveType = {
   id: number;
   name: string;
   skeinWeightGrams: number | null;
   thicknessMm: number | null;
   stashCount: number;
   usedCount: number;
   remainingCount: number;
   lastUsedAt?: string | null;
   colors: ArchiveColor[];
};

const { yarnRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { success: showSuccessToast, error: showErrorToast } = useToast();
const { t } = useI18n();
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');
const fabColor = computed(() => (isDark.value ? 'neutral' : 'primary'));
const fabVariant = computed(() => (isDark.value ? 'soft' : 'solid'));

const { data: archiveData, pending, execute: refreshArchive } = yarnRouter.archiveList.useQuery();
const archiveList = computed<ArchiveType[]>(() => (archiveData.value ?? []) as ArchiveType[]);

type TypeSortOption = 'name-asc' | 'name-desc' | 'last-used-desc' | 'last-used-asc';
type LastUsedFilterOption = 'all' | 'used' | 'unused';

const typeSearchQuery = ref('');
const typeSort = ref<TypeSortOption>('name-asc');
const lastUsedFilter = ref<LastUsedFilterOption>('all');
const showFilters = ref(false);

const hasActiveFilters = computed(
   () => Boolean(typeSearchQuery.value.trim()) || typeSort.value !== 'name-asc' || lastUsedFilter.value !== 'all',
);

const expandedTypeIds = ref<number[]>([]);
const hasInitializedExpandedTypes = ref(false);

const showCreateTypeModal = ref(false);
const showEditTypeModal = ref(false);
const showCreateColorModal = ref(false);
const showEditColorModal = ref(false);
const showManualUsageModal = ref(false);
const showCurrentStashModal = ref(false);

const typeToEdit = ref<
   | {
        id: number;
        name: string;
        skeinWeightGrams?: number | null;
        thicknessMm?: number | null;
     }
   | undefined
>(undefined);
const colorToEdit = ref<{ id: number; name: string; stashCount: number } | undefined>(undefined);
const activeTypeForColor = ref<{ id: number; name: string } | undefined>(undefined);
const colorToAdjustUsage = ref<{ id: number; name: string } | undefined>(undefined);
const colorToSetCurrentStash = ref<{ id: number; name: string; stashCount: number } | undefined>(undefined);

const totals = computed(() => {
   const list = archiveList.value;
   return list.reduce(
      (acc, type: ArchiveType) => {
         acc.stash += type.stashCount;
         acc.used += type.usedCount;
         acc.remaining += type.remainingCount;
         return acc;
      },
      { stash: 0, used: 0, remaining: 0 },
   );
});

const hasArchive = computed(() => archiveList.value.length > 0);
const normalizedSearchQuery = computed(() => typeSearchQuery.value.trim().toLocaleLowerCase());

function getLastUsedMs(type: ArchiveType) {
   if (!type.lastUsedAt) return null;

   const parsed = new Date(type.lastUsedAt).getTime();
   return Number.isNaN(parsed) ? null : parsed;
}

const visibleArchiveList = computed<ArchiveType[]>(() => {
   const query = normalizedSearchQuery.value;

   const filtered = archiveList.value.filter((type) => {
      const matchesSearch = !query || type.name.toLocaleLowerCase().includes(query);
      const isUsed = Boolean(type.lastUsedAt);
      const matchesLastUsedFilter =
         lastUsedFilter.value === 'all' || (lastUsedFilter.value === 'used' && isUsed) || (lastUsedFilter.value === 'unused' && !isUsed);

      return matchesSearch && matchesLastUsedFilter;
   });

   return [...filtered].sort((a, b) => {
      if (typeSort.value === 'name-asc') return a.name.localeCompare(b.name);
      if (typeSort.value === 'name-desc') return b.name.localeCompare(a.name);

      const aLastUsed = getLastUsedMs(a);
      const bLastUsed = getLastUsedMs(b);
      const aValue = aLastUsed ?? Number.NEGATIVE_INFINITY;
      const bValue = bLastUsed ?? Number.NEGATIVE_INFINITY;

      if (typeSort.value === 'last-used-desc') return bValue - aValue;
      return aValue - bValue;
   });
});

const hasVisibleArchive = computed(() => visibleArchiveList.value.length > 0);

function initializeExpandedTypes(types: ArchiveType[]) {
   if (hasInitializedExpandedTypes.value || !types.length) return;

   expandedTypeIds.value = types.filter((type) => type.colors.length > 0).map((type) => type.id);
   hasInitializedExpandedTypes.value = true;
}

watch(archiveList, initializeExpandedTypes, { immediate: true });

function isExpanded(typeId: number) {
   return expandedTypeIds.value.includes(typeId);
}

function toggleExpanded(typeId: number) {
   if (isExpanded(typeId)) {
      expandedTypeIds.value = expandedTypeIds.value.filter((id) => id !== typeId);
      return;
   }
   expandedTypeIds.value = [...expandedTypeIds.value, typeId];
}

async function createType(payload: {
   type: { name: string; skeinWeightGrams: number | null; thicknessMm: number | null };
   done: () => void;
}) {
   try {
      await yarnRouter.typeCreate.mutate({
         name: payload.type.name,
         skeinWeightGrams: payload.type.skeinWeightGrams,
         thicknessMm: payload.type.thicknessMm,
      });
      payload.done();
      showCreateTypeModal.value = false;
      await refreshArchive();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function updateType(payload: {
   type: { name: string; skeinWeightGrams: number | null; thicknessMm: number | null };
   done: () => void;
}) {
   if (!typeToEdit.value) return;

   try {
      await yarnRouter.typeUpdate.mutate({
         id: typeToEdit.value.id,
         name: payload.type.name,
         skeinWeightGrams: payload.type.skeinWeightGrams,
         thicknessMm: payload.type.thicknessMm,
      });
      payload.done();
      showEditTypeModal.value = false;
      typeToEdit.value = undefined;
      await refreshArchive();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

function editType(type: ArchiveType) {
   typeToEdit.value = {
      id: type.id,
      name: type.name,
      skeinWeightGrams: type.skeinWeightGrams,
      thicknessMm: type.thicknessMm,
   };
   showEditTypeModal.value = true;
}

async function deleteType(type: ArchiveType) {
   promptDeleteConfirmation(t('yarn.type'), async (done) => {
      try {
         await yarnRouter.typeDelete.mutate(type.id);
         done();
         await refreshArchive();
         showSuccessToast(t('actions.delete'));
      } catch {
         showErrorToast(t('actions.confirm-delete-type', { type: t('yarn.type') }));
      }
   });
}

function openCreateColor(type: ArchiveType) {
   activeTypeForColor.value = { id: type.id, name: type.name };
   showCreateColorModal.value = true;
}

function editColor(type: ArchiveType, color: ArchiveColor) {
   activeTypeForColor.value = { id: type.id, name: type.name };
   colorToEdit.value = {
      id: color.id,
      name: color.name,
      stashCount: color.stashCount,
   };
   showEditColorModal.value = true;
}

async function createColor(payload: { color: { name: string; stashCount: number }; done: () => void }) {
   if (!activeTypeForColor.value) return;

   try {
      await yarnRouter.colorCreate.mutate({
         yarnTypeId: activeTypeForColor.value.id,
         name: payload.color.name,
         stashCount: payload.color.stashCount,
      });
      payload.done();
      showCreateColorModal.value = false;
      await refreshArchive();
      if (!expandedTypeIds.value.includes(activeTypeForColor.value.id)) {
         expandedTypeIds.value = [...expandedTypeIds.value, activeTypeForColor.value.id];
      }
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function updateColor(payload: { color: { name: string; stashCount: number }; done: () => void }) {
   if (!colorToEdit.value) return;

   try {
      await yarnRouter.colorUpdate.mutate({
         id: colorToEdit.value.id,
         name: payload.color.name,
         stashCount: payload.color.stashCount,
      });
      payload.done();
      showEditColorModal.value = false;
      colorToEdit.value = undefined;
      await refreshArchive();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function deleteColor(color: ArchiveColor) {
   promptDeleteConfirmation(t('yarn.color'), async (done) => {
      try {
         await yarnRouter.colorDelete.mutate(color.id);
         done();
         await refreshArchive();
         showSuccessToast(t('actions.delete'));
      } catch {
         showErrorToast(t('actions.confirm-delete-type', { type: t('yarn.color') }));
      }
   });
}

function openManualUsage(color: ArchiveColor) {
   colorToAdjustUsage.value = { id: color.id, name: color.name };
   showManualUsageModal.value = true;
}

function openCurrentStash(color: ArchiveColor) {
   colorToSetCurrentStash.value = { id: color.id, name: color.name, stashCount: color.stashCount };
   showCurrentStashModal.value = true;
}

async function addManualUsage(payload: { amount: number; done: () => void }) {
   if (!colorToAdjustUsage.value) return;

   try {
      await yarnRouter.colorAddUsed.mutate({
         id: colorToAdjustUsage.value.id,
         amount: payload.amount,
      });
      payload.done();
      showManualUsageModal.value = false;
      await refreshArchive();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function setCurrentStash(payload: { amount: number; done: () => void }) {
   if (!colorToSetCurrentStash.value) return;

   try {
      await yarnRouter.colorUpdate.mutate({
         id: colorToSetCurrentStash.value.id,
         stashCount: payload.amount,
      });
      payload.done();
      showCurrentStashModal.value = false;
      await refreshArchive();
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}
</script>

<template>
   <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <YarnArchiveSummaryCard
         :stash="totals.stash"
         :used="totals.used"
         :remaining="totals.remaining"
         :has-active-filters="hasActiveFilters"
         @toggle-filters="showFilters = !showFilters"
      />

      <div v-if="pending" class="space-y-2">
         <SkeletonCard />
         <SkeletonCard />
         <SkeletonCard />
      </div>

      <YarnArchiveEmptyState v-else-if="!hasArchive" />

      <div v-else class="space-y-3">
         <div v-if="showFilters" class="wooly-shell rounded-xl p-3">
            <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
               <UInput
                  v-model="typeSearchQuery"
                  size="sm"
                  icon="i-heroicons-magnifying-glass-16-solid"
                  :placeholder="$t('yarn.search-types-placeholder')"
               />

               <ResponsiveSelect
                  :value="typeSort"
                  :title="$t('filters.sort-by')"
                  :items="[
                     { label: $t('yarn.sort-name-asc'), value: 'name-asc' },
                     { label: $t('yarn.sort-name-desc'), value: 'name-desc' },
                     { label: $t('yarn.sort-last-used-desc'), value: 'last-used-desc' },
                     { label: $t('yarn.sort-last-used-asc'), value: 'last-used-asc' },
                  ]"
                  class="wooly-select-clean"
                  @update:value="(value) => (typeSort = String(value) as typeof typeSort)"
               />

               <ResponsiveSelect
                  :value="lastUsedFilter"
                  :title="$t('generic.status')"
                  :items="[
                     { label: $t('yarn.filter-all-types'), value: 'all' },
                     { label: $t('yarn.filter-used-types'), value: 'used' },
                     { label: $t('yarn.filter-unused-types'), value: 'unused' },
                  ]"
                  class="wooly-select-clean"
                  @update:value="(value) => (lastUsedFilter = String(value) as typeof lastUsedFilter)"
               />
            </div>
         </div>

         <div
            v-if="!hasVisibleArchive"
            class="rounded-xl border border-dashed border-slate-300/80 p-4 text-sm wooly-muted dark:border-slate-700"
         >
            {{ $t('generic.no-results-for-type', { type: $t('yarn.type') }) }}
         </div>

         <YarnArchiveTypeCard
            v-for="type in visibleArchiveList"
            :key="type.id"
            :type="type"
            :expanded="isExpanded(type.id)"
            @toggle="toggleExpanded"
            @create-color="openCreateColor"
            @edit-type="editType"
            @delete-type="deleteType"
            @add-manual-used="openManualUsage"
            @set-current-stash="openCurrentStash"
            @edit-color="editColor($event.type, $event.color)"
            @delete-color="deleteColor"
         />
      </div>

      <UButton
         class="wooly-fab tap-target tap-target-icon"
         size="xl"
         icon="i-heroicons-plus-16-solid"
         :color="fabColor"
         :variant="fabVariant"
         :aria-label="$t('actions.create-type', { type: $t('yarn.type') })"
         @click="showCreateTypeModal = true"
      />

      <ModalsYarnType v-model="showCreateTypeModal" @save-type="createType" />
      <ModalsYarnType v-model="showEditTypeModal" :initial-type="typeToEdit" @save-type="updateType" />
      <ModalsYarnColor v-model="showCreateColorModal" :yarn-type-name="activeTypeForColor?.name" @save-color="createColor" />
      <ModalsYarnColor
         v-model="showEditColorModal"
         :initial-color="colorToEdit"
         :yarn-type-name="activeTypeForColor?.name"
         @save-color="updateColor"
      />
      <ModalsYarnManualUsage v-model="showManualUsageModal" :color-name="colorToAdjustUsage?.name" @save-manual-usage="addManualUsage" />
      <ModalsYarnCurrentStash
         v-model="showCurrentStashModal"
         :color-name="colorToSetCurrentStash?.name"
         :initial-stash-count="colorToSetCurrentStash?.stashCount"
         @save-current-stash="setCurrentStash"
      />
   </div>
</template>
