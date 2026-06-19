<script setup lang="ts">
defineProps<{
   projectName: string;
}>();
</script>

<template>
   <nav class="flex items-center gap-2 px-4 sm:px-0" aria-label="breadcrumb">
      <NuxtLink to="/" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
         {{ $t('projects.projects') }}
      </NuxtLink>
      <UIcon name="i-heroicons-chevron-right-16-solid" class="w-4 h-4 text-slate-400 dark:text-slate-600" />
      <span class="text-sm wooly-text-main font-medium">
         {{ projectName }}
      </span>
   </nav>
</template>
