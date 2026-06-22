<script setup lang="ts">
type ProjectYarnUsageRow = {
   id: number;
   yarnTypeId: number;
   yarnTypeName: string;
   yarnColorId: number;
   yarnColorName: string;
   usedCount: number;
};

const props = defineProps<{
   yarnUsages?: ProjectYarnUsageRow[];
   yarnTotal: number;
   pending: boolean;
}>();

const emit = defineEmits<{
   (e: 'create'): void;
   (e: 'edit', yarn: ProjectYarnUsageRow): void;
   (e: 'delete', id: number): void;
   (e: 'adjust', payload: { yarn: ProjectYarnUsageRow; increment: boolean }): void;
}>();

type ProjectYarnTypeGroup = {
   yarnTypeId: number;
   yarnTypeName: string;
   totalUsed: number;
   colors: ProjectYarnUsageRow[];
};

const groupedYarnUsages = computed<ProjectYarnTypeGroup[]>(() => {
   const groups = new Map<number, ProjectYarnTypeGroup>();

   for (const usage of props.yarnUsages ?? []) {
      const existing = groups.get(usage.yarnTypeId);

      if (existing) {
         existing.colors.push(usage);
         existing.totalUsed += usage.usedCount;
         continue;
      }

      groups.set(usage.yarnTypeId, {
         yarnTypeId: usage.yarnTypeId,
         yarnTypeName: usage.yarnTypeName,
         totalUsed: usage.usedCount,
         colors: [usage],
      });
   }

   return [...groups.values()]
      .map((group) => ({
         ...group,
         colors: [...group.colors].sort((a, b) => a.yarnColorName.localeCompare(b.yarnColorName)),
      }))
      .sort((a, b) => a.yarnTypeName.localeCompare(b.yarnTypeName));
});

const expandedTypeIds = ref<number[]>([]);
const initializedExpandedTypes = ref(false);
const showYarnActions = ref(false);
const activeYarn = ref<ProjectYarnUsageRow | null>(null);

function syncExpandedTypeIds(groups: ProjectYarnTypeGroup[]) {
   const availableIds = groups.map((group) => group.yarnTypeId);

   if (!initializedExpandedTypes.value) {
      expandedTypeIds.value = [...availableIds];
      initializedExpandedTypes.value = true;
      return;
   }

   expandedTypeIds.value = expandedTypeIds.value.filter((id) => availableIds.includes(id));
}

watch(groupedYarnUsages, syncExpandedTypeIds, { immediate: true });

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

function openYarnActions(yarn: ProjectYarnUsageRow) {
   activeYarn.value = yarn;
   showYarnActions.value = true;
}

function handleEditYarn() {
   if (!activeYarn.value) return;
   emit('edit', activeYarn.value);
}

function handleDeleteYarn() {
   if (!activeYarn.value) return;
   emit('delete', activeYarn.value.id);
}
</script>

<template>
   <div class="space-y-3">
      <div v-if="pending" class="text-sm wooly-muted">{{ $t('generic.loading') }}</div>

      <div v-else-if="groupedYarnUsages.length" v-auto-animate class="grid grid-cols-1 gap-3">
         <YarnTypeCollapsibleCard
            v-for="group in groupedYarnUsages"
            :key="group.yarnTypeId"
            :title="group.yarnTypeName"
            :subtitle="`${group.colors.length} ${$t('yarn.color', group.colors.length)}`"
            :expanded="isExpanded(group.yarnTypeId)"
            :ariaLabel="$t('actions.open-type', { type: $t('yarn.type') })"
            card-class="wooly-shell w-full"
            title-class="text-pink-900 dark:text-pink-100"
            @toggle="toggleExpanded(group.yarnTypeId)"
         >
            <template #header-right>
               <span class="rounded-md bg-amber-50/70 px-2 py-1 text-xs dark:bg-amber-950/30">
                  {{ $t('yarn.used') }}: {{ group.totalUsed }}
               </span>
            </template>

            <template #expanded-content>
               <div class="divide-y divide-slate-200/80 dark:divide-slate-700/80">
                  <div v-for="yarn in group.colors" :key="yarn.id" class="py-2 first:pt-0 last:pb-0">
                     <div class="space-y-2">
                        <div class="flex items-start justify-between gap-2">
                           <p class="font-medium truncate">{{ yarn.yarnColorName }}</p>

                           <div class="flex items-center gap-1">
                              <UButton
                                 icon="i-heroicons-ellipsis-vertical-16-solid"
                                 variant="ghost"
                                 color="neutral"
                                 size="xs"
                                 class="tap-target tap-target-icon"
                                 :aria-label="$t('actions.open-menu')"
                                 @click.stop="openYarnActions(yarn)"
                              />
                           </div>
                        </div>

                        <div class="rounded-xl bg-pink-50/70 p-2 dark:bg-pink-950/35">
                           <div class="flex items-center justify-between gap-2">
                              <small class="text-pink-800 dark:text-pink-200">{{ $t('yarn.used') }}</small>

                              <div class="flex items-center gap-2">
                                 <UButton
                                    icon="i-heroicons-minus-16-solid"
                                    variant="soft"
                                    color="error"
                                    size="xs"
                                    class="tap-target tap-target-icon"
                                    :aria-label="$t('actions.decrease-count', { type: $t('yarn.color') })"
                                    @click.stop="emit('adjust', { yarn, increment: false })"
                                 />

                                 <p class="min-w-10 text-center text-base font-semibold text-pink-900 dark:text-pink-100">
                                    {{ yarn.usedCount }}
                                 </p>

                                 <UButton
                                    icon="i-heroicons-plus-16-solid"
                                    variant="soft"
                                    color="success"
                                    size="xs"
                                    class="tap-target tap-target-icon"
                                    :aria-label="$t('actions.increase-count', { type: $t('yarn.color') })"
                                    @click.stop="emit('adjust', { yarn, increment: true })"
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </template>
         </YarnTypeCollapsibleCard>
      </div>

      <div v-else class="text-sm wooly-muted">{{ $t('generic.no-results-for-type', { type: $t('navigation.yarn') }) }}</div>

      <ModalsYarnColorActions
         v-model:open="showYarnActions"
         :color-name="activeYarn?.yarnColorName"
         @edit="handleEditYarn"
         @delete="handleDeleteYarn"
      />
   </div>
</template>
