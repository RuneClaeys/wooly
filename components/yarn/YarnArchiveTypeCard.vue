<script setup lang="ts">
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

const props = defineProps<{
   type: ArchiveType;
   expanded: boolean;
}>();

const emit = defineEmits<{
   toggle: [typeId: number];
   'create-color': [type: ArchiveType];
   'edit-type': [type: ArchiveType];
   'delete-type': [type: ArchiveType];
   'add-manual-used': [color: ArchiveColor];
   'set-current-stash': [color: ArchiveColor];
   'edit-color': [payload: { type: ArchiveType; color: ArchiveColor }];
   'delete-color': [color: ArchiveColor];
}>();

const { t } = useI18n();
const showTypeActions = ref(false);
const showColorActions = ref(false);
const activeColor = ref<ArchiveColor | null>(null);

const specsText = computed(() => {
   const specs = [
      props.type.skeinWeightGrams ? `${t('yarn.skein-weight-grams-short')}: ${props.type.skeinWeightGrams}g` : null,
      props.type.thicknessMm ? `${t('yarn.thickness-mm-short')}: ${props.type.thicknessMm}mm` : null,
   ].filter(Boolean);

   return specs.join(' • ') || t('yarn.specs-not-set');
});

function openColorActions(color: ArchiveColor) {
   activeColor.value = color;
   showColorActions.value = true;
}

function handleCreateColor() {
   emit('create-color', props.type);
}

function handleEditType() {
   emit('edit-type', props.type);
}

function handleDeleteType() {
   emit('delete-type', props.type);
}

function handleEditColor() {
   if (!activeColor.value) return;
   emit('edit-color', { type: props.type, color: activeColor.value });
}

function handleAddManualUsed() {
   if (!activeColor.value) return;
   emit('add-manual-used', activeColor.value);
}

function handleSetCurrentStash() {
   if (!activeColor.value) return;
   emit('set-current-stash', activeColor.value);
}

function handleDeleteColor() {
   if (!activeColor.value) return;
   emit('delete-color', activeColor.value);
}
</script>

<template>
   <YarnTypeCollapsibleCard
      :title="type.name"
      :subtitle="expanded ? specsText : undefined"
      :expanded="expanded"
      :ariaLabel="$t('actions.open-type', { type: $t('yarn.type') })"
      @toggle="emit('toggle', type.id)"
   >
      <template #header-right>
         <UButton
            icon="i-heroicons-ellipsis-vertical-16-solid"
            variant="ghost"
            color="neutral"
            size="sm"
            :aria-label="$t('actions.open-menu')"
            @click="showTypeActions = true"
         />
      </template>

      <template #expanded-top>
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
      </template>

      <template #collapsed-content>
         <div class="flex flex-wrap items-center gap-2 text-[11px]">
            <span class="rounded-md bg-primary-50/60 px-2 py-1 dark:bg-primary-950/30">
               {{ $t('yarn.stash') }}: {{ type.stashCount }}
            </span>
            <span class="rounded-md bg-amber-50/70 px-2 py-1 dark:bg-amber-950/30"> {{ $t('yarn.used') }}: {{ type.usedCount }} </span>
            <span
               class="rounded-md px-2 py-1"
               :class="type.remainingCount < 0 ? 'bg-red-50/80 dark:bg-red-950/30' : 'bg-emerald-50/70 dark:bg-emerald-950/30'"
            >
               {{ $t('yarn.remaining') }}: {{ type.remainingCount }}
            </span>
         </div>
      </template>

      <template #expanded-content>
         <div class="pt-1">
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
                                 color.remainingCount < 0 ? 'bg-red-50/80 dark:bg-red-950/30' : 'bg-emerald-50/70 dark:bg-emerald-950/30'
                              "
                           >
                              {{ $t('yarn.remaining') }}: {{ color.remainingCount }}
                           </span>
                        </div>
                     </div>

                     <div class="flex items-center gap-1">
                        <UButton
                           icon="i-heroicons-ellipsis-vertical-16-solid"
                           variant="ghost"
                           color="neutral"
                           size="xs"
                           :aria-label="$t('actions.open-menu')"
                           @click="openColorActions(color)"
                        />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </template>
   </YarnTypeCollapsibleCard>

   <ModalsYarnTypeActions
      v-model:open="showTypeActions"
      :type-name="type.name"
      @create-color="handleCreateColor"
      @edit="handleEditType"
      @delete="handleDeleteType"
   />
   <ModalsYarnColorActions
      v-model:open="showColorActions"
      :color-name="activeColor?.name"
      allow-adjust-usage
      allow-set-current-stash
      @adjust-usage="handleAddManualUsed"
      @set-current-stash="handleSetCurrentStash"
      @edit="handleEditColor"
      @delete="handleDeleteColor"
   />
</template>
