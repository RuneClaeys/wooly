<script setup lang="ts">
interface Props {
   projectId: number;
}

defineProps<Props>();

const route = useRoute();

const tabs = ['overview', 'photos', 'yarn'] as const;
type TabKey = (typeof tabs)[number];

function tabPath(projectId: number, tab: TabKey) {
   return `/projects/${projectId}/${tab}`;
}

function isTabActive(projectId: number, tab: TabKey) {
   return route.path === tabPath(projectId, tab);
}
</script>

<template>
   <div class="flex gap-1 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-0 -mx-4 sm:mx-0 overflow-x-auto">
      <NuxtLink
         v-for="tab in tabs"
         :key="tab"
         :to="tabPath(projectId, tab)"
         :aria-selected="isTabActive(projectId, tab)"
         role="tab"
         class="px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
         :class="[
            isTabActive(projectId, tab)
               ? 'text-primary-600 dark:text-primary-400'
               : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300',
         ]"
      >
         {{ $t(`tabs.${tab}`) }}
         <div
            v-if="isTabActive(projectId, tab)"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
         />
      </NuxtLink>
   </div>
</template>
