<script setup lang="ts">
const route = useRoute();

const tabs = [
   {
      key: 'projects',
      icon: 'i-heroicons-folder-open-20-solid',
      to: '/',
      isActive: (path: string) => path === '/' || path.startsWith('/projects/'),
   },
   {
      key: 'bingo',
      icon: 'i-heroicons-squares-2x2-20-solid',
      to: '/bingo',
      isActive: (path: string) => path === '/bingo' || path.startsWith('/bingo/'),
   },
   {
      key: 'year-goals',
      icon: 'i-heroicons-calendar-days-20-solid',
      to: '/year-goals',
      isActive: (path: string) => path === '/year-goals' || path.startsWith('/year-goals/'),
   },
   {
      key: 'yarn',
      icon: 'i-heroicons-archive-box-20-solid',
      to: '/yarn',
      isActive: (path: string) => path === '/yarn' || path.startsWith('/yarn/'),
   },
] as const;
</script>

<template>
   <nav class="fixed inset-x-0 bottom-0 z-30 pb-[max(0.5rem,env(safe-area-inset-bottom))]" aria-label="Main navigation">
      <UContainer class="w-full max-w-300 px-3 md:px-4">
         <div class="wooly-shell wooly-pop grid grid-cols-4 gap-1 p-1.5">
            <NuxtLink
               v-for="tab in tabs"
               :key="tab.key"
               :to="tab.to"
               class="flex min-h-12 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-xs font-medium transition"
               :class="
                  tab.isActive(route.path)
                     ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
                     : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
               "
            >
               <UIcon :name="tab.icon" class="mb-0.5 h-5 w-5" />
               <span>{{ $t(`navigation.${tab.key}`) }}</span>
            </NuxtLink>
         </div>
      </UContainer>
   </nav>
</template>
