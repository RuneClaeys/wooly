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

const expandedTypeIds = ref<number[]>([]);
const hasInitializedExpandedTypes = ref(false);

const showCreateTypeModal = ref(false);
const showEditTypeModal = ref(false);
const showCreateColorModal = ref(false);
const showEditColorModal = ref(false);

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

watch(
   archiveList,
   (types) => {
      if (hasInitializedExpandedTypes.value || !types.length) return;

      expandedTypeIds.value = types.filter((type) => type.colors.length > 0).map((type) => type.id);
      hasInitializedExpandedTypes.value = true;
   },
   { immediate: true },
);

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
</script>

<template>
   <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <UCard class="wooly-shell">
         <div class="flex items-center justify-between gap-2">
            <div>
               <p class="text-xs wooly-muted">{{ $t('yarn.archive') }}</p>
               <p class="wooly-title text-lg">{{ $t('navigation.yarn') }}</p>
            </div>
         </div>

         <div class="mt-4 grid grid-cols-3 gap-2">
            <div class="rounded-xl bg-primary-50/60 p-3 dark:bg-primary-950/30">
               <p class="text-xs wooly-muted">{{ $t('yarn.stash') }}</p>
               <p class="wooly-title text-lg">{{ totals.stash }}</p>
            </div>
            <div class="rounded-xl bg-amber-50/70 p-3 dark:bg-amber-950/30">
               <p class="text-xs wooly-muted">{{ $t('yarn.used') }}</p>
               <p class="wooly-title text-lg">{{ totals.used }}</p>
            </div>
            <div class="rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-950/30">
               <p class="text-xs wooly-muted">{{ $t('yarn.remaining') }}</p>
               <p class="wooly-title text-lg">{{ totals.remaining }}</p>
            </div>
         </div>
      </UCard>

      <div v-if="pending" class="space-y-2">
         <SkeletonCard />
         <SkeletonCard />
         <SkeletonCard />
      </div>

      <div v-else-if="!hasArchive" class="wooly-shell rounded-xl p-6 text-center space-y-3">
         <UIcon name="i-heroicons-archive-box-16-solid" class="w-10 h-10 mx-auto wooly-muted" />
         <div>
            <p class="wooly-title text-sm">{{ $t('yarn.no-types') }}</p>
            <p class="wooly-muted text-xs mt-1">{{ $t('yarn.no-types-hint') }}</p>
         </div>
      </div>

      <div v-else class="space-y-3">
         <UCard v-for="type in archiveList" :key="type.id" class="wooly-shell">
            <div class="space-y-3">
               <div class="flex items-start justify-between gap-3">
                  <button type="button" class="text-left min-w-0" @click="toggleExpanded(type.id)">
                     <p class="wooly-title text-base truncate">{{ type.name }}</p>
                     <p class="text-xs wooly-muted">
                        {{
                           [
                              type.skeinWeightGrams ? `${$t('yarn.skein-weight-grams-short')}: ${type.skeinWeightGrams}g` : null,
                              type.thicknessMm ? `${$t('yarn.thickness-mm-short')}: ${type.thicknessMm}mm` : null,
                           ]
                              .filter(Boolean)
                              .join(' • ') || $t('yarn.specs-not-set')
                        }}
                     </p>
                  </button>

                  <div class="flex items-center gap-1">
                     <UButton
                        icon="i-heroicons-plus-16-solid"
                        variant="ghost"
                        color="primary"
                        size="sm"
                        :aria-label="$t('actions.create-type', { type: $t('yarn.color') })"
                        @click="openCreateColor(type)"
                     />
                     <UButton
                        icon="i-heroicons-pencil-16-solid"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        :aria-label="$t('actions.edit-type', { type: $t('yarn.type') })"
                        @click="editType(type)"
                     />
                     <UButton
                        icon="i-heroicons-trash-16-solid"
                        variant="ghost"
                        color="error"
                        size="sm"
                        :aria-label="$t('actions.delete-type', { type: $t('yarn.type') })"
                        @click="deleteType(type)"
                     />
                  </div>
               </div>

               <div class="grid grid-cols-3 gap-2">
                  <div class="rounded-lg bg-primary-50/60 p-2 dark:bg-primary-950/25">
                     <p class="text-[11px] wooly-muted">{{ $t('yarn.stash') }}</p>
                     <p class="text-sm font-semibold">{{ type.stashCount }}</p>
                  </div>
                  <div class="rounded-lg bg-amber-50/70 p-2 dark:bg-amber-950/25">
                     <p class="text-[11px] wooly-muted">{{ $t('yarn.used') }}</p>
                     <p class="text-sm font-semibold">{{ type.usedCount }}</p>
                  </div>
                  <div
                     class="rounded-lg p-2"
                     :class="type.remainingCount < 0 ? 'bg-red-50/80 dark:bg-red-950/25' : 'bg-emerald-50/70 dark:bg-emerald-950/25'"
                  >
                     <p class="text-[11px] wooly-muted">{{ $t('yarn.remaining') }}</p>
                     <p class="text-sm font-semibold">{{ type.remainingCount }}</p>
                  </div>
               </div>

               <div v-if="isExpanded(type.id)" class="pt-1">
                  <div v-if="!type.colors.length" class="text-xs wooly-muted">
                     {{ $t('yarn.no-colors') }}
                  </div>

                  <div v-else class="divide-y divide-slate-200/80 dark:divide-slate-700/80">
                     <div v-for="color in type.colors" :key="color.id" class="py-2 first:pt-0 last:pb-0">
                        <div class="flex items-start justify-between gap-2">
                           <div class="min-w-0 flex-1">
                              <p class="font-medium truncate">{{ color.name }}</p>
                              <div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                 <span class="rounded-md bg-primary-50/60 px-2 py-1 dark:bg-primary-950/30">
                                    {{ $t('yarn.stash') }}: {{ color.stashCount }}
                                 </span>
                                 <span class="rounded-md bg-amber-50/70 px-2 py-1 dark:bg-amber-950/30">
                                    {{ $t('yarn.used') }}: {{ color.usedCount }}
                                 </span>
                                 <span
                                    class="rounded-md px-2 py-1"
                                    :class="
                                       color.remainingCount < 0
                                          ? 'bg-red-50/80 dark:bg-red-950/30'
                                          : 'bg-emerald-50/70 dark:bg-emerald-950/30'
                                    "
                                 >
                                    {{ $t('yarn.remaining') }}: {{ color.remainingCount }}
                                 </span>
                              </div>
                           </div>

                           <div class="flex items-center gap-1">
                              <UButton
                                 icon="i-heroicons-pencil-16-solid"
                                 variant="ghost"
                                 color="neutral"
                                 size="xs"
                                 :aria-label="$t('actions.edit-type', { type: $t('yarn.color') })"
                                 @click="editColor(type, color)"
                              />
                              <UButton
                                 icon="i-heroicons-trash-16-solid"
                                 variant="ghost"
                                 color="error"
                                 size="xs"
                                 :aria-label="$t('actions.delete-type', { type: $t('yarn.color') })"
                                 @click="deleteColor(color)"
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </UCard>
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
   </div>
</template>
