<script setup lang="ts">
import type { SelectPart, SelectProjectPhoto, SelectYarnSkein } from '~/db/schema';

interface Props {
   projectId: number;
   projectName: string;
   projectStatus: boolean;
   parts: SelectPart[] | null;
   photos: SelectProjectPhoto[] | null;
   skeinUsages: any[] | null;
   skeinCatalog: SelectYarnSkein[] | null;
   pendingParts: boolean;
   pendingPhotos: boolean;
   pendingSkeins: boolean;
   uploadingPhoto: boolean;
   photoError: string | null;
}

interface Emits {
   (e: 'edit-part', part: SelectPart): void;
   (e: 'delete-part', id: number): void;
   (e: 'adjust-part', payload: { part: SelectPart; increment: boolean }): void;
   (e: 'toggle-part-completed', payload: { partId: number; completed: boolean }): void;
   (e: 'edit-skein', skein: any): void;
   (e: 'delete-skein', id: number): void;
   (e: 'adjust-skein', payload: { skein: any; increment: boolean }): void;
   (e: 'create-part'): void;
   (e: 'create-skein'): void;
   (e: 'upload-photo'): void;
   (e: 'open-photo', id: number): void;
   (e: 'delete-photo', photo: SelectProjectPhoto): void;
}

defineProps<Props>();
defineEmits<Emits>();

const route = useRoute();
const router = useRouter();

const tabs = ['overview', 'photos', 'skeins'] as const;
type TabKey = (typeof tabs)[number];
const activeTab = computed<TabKey>(() => {
   const rawTab = route.query.tab;
   const tab = Array.isArray(rawTab) ? rawTab[0] : rawTab;

   if (tab === 'parts') return 'overview';
   if (tab && tabs.includes(tab as TabKey)) return tab as TabKey;
   return 'overview';
});

function goToTab(tab: TabKey) {
   router.push({
      path: route.path,
      query: {
         ...route.query,
         tab,
      },
   });
}

onMounted(() => {
   if (!route.query.tab) {
      router.replace({
         path: route.path,
         query: {
            ...route.query,
            tab: 'overview',
         },
      });
   }
});
</script>

<template>
   <div class="space-y-4">
      <!-- Tab Navigation -->
      <div class="flex gap-1 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-0 -mx-4 sm:mx-0 overflow-x-auto">
         <button
            v-for="tab in tabs"
            :key="tab"
            :aria-selected="activeTab === tab"
            role="tab"
            class="px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
            :class="[
               activeTab === tab
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300',
            ]"
            @click="goToTab(tab)"
         >
            {{ $t(`tabs.${tab}`) }}
            <div v-if="activeTab === tab" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
         </button>
      </div>

      <!-- Tab Content -->
      <div class="px-4 sm:px-0">
         <!-- Overview Tab (parts-first) -->
         <div v-show="activeTab === 'overview'" class="space-y-4 wooly-scale-up">
            <TabParts
               :project-id="projectId"
               :parts="parts"
               :pending="pendingParts"
               @create="$emit('create-part')"
               @edit="$emit('edit-part', $event)"
               @delete="$emit('delete-part', $event)"
               @adjust="$emit('adjust-part', $event)"
               @toggle-completed="$emit('toggle-part-completed', $event)"
            />
         </div>

         <!-- Photos Tab -->
         <div v-show="activeTab === 'photos'" class="space-y-4 wooly-scale-up">
            <TabPhotos
               :project-id="projectId"
               :photos="photos"
               :pending="pendingPhotos"
               :uploading-photo="uploadingPhoto"
               :photo-error="photoError"
               @upload="$emit('upload-photo')"
               @open="$emit('open-photo', $event)"
               @delete="$emit('delete-photo', $event)"
            />
         </div>

         <!-- Skeins Tab -->
         <div v-show="activeTab === 'skeins'" class="space-y-4 wooly-scale-up">
            <TabOverview
               :project-id="projectId"
               :project-name="projectName"
               :project-status="projectStatus"
               :skein-usages="skeinUsages"
               :skein-catalog="skeinCatalog"
               :pending="pendingSkeins"
               @create="$emit('create-skein')"
               @edit="$emit('edit-skein', $event)"
               @delete="$emit('delete-skein', $event)"
               @adjust="$emit('adjust-skein', $event)"
            />
         </div>
      </div>
   </div>
</template>
