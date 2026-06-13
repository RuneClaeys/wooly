<script lang="ts" setup>
const { status } = useAuth();

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

function toggleColorMode() {
   colorMode.value = isDark.value ? 'light' : 'dark';
   colorMode.preference = colorMode.value;
}

defineProps({
   title: { type: String, default: 'Wooly' },
   root: { type: Boolean, default: true },
   navigateBackTo: { type: String, default: '/' },
});
</script>

<template>
   <div class="relative min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
         <div class="absolute -left-16 top-28 h-44 w-44 rounded-full bg-pink-200/45 blur-3xl dark:bg-pink-400/20" />
         <div class="absolute right-2 top-10 h-36 w-36 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-400/15" />
         <div class="absolute bottom-16 right-8 h-52 w-52 rounded-full bg-fuchsia-200/25 blur-3xl dark:bg-fuchsia-300/10" />
      </div>

      <header class="sticky top-0 z-20 pt-[max(0.75rem,env(safe-area-inset-top))]">
         <UContainer>
            <div class="wooly-shell wooly-pop flex items-center justify-between gap-3 px-3 py-2 md:px-5 md:py-3">
               <div class="flex min-w-16 items-center justify-start gap-2">
                  <UBadge variant="soft" color="primary" class="hidden md:inline-flex">Wooly</UBadge>

                  <UButton
                     v-if="!root"
                     icon="i-heroicons-arrow-left-16-solid"
                     color="neutral"
                     variant="soft"
                     size="md"
                     class="tap-target tap-target-icon"
                     aria-label="Back"
                     @click="navigateTo(navigateBackTo)"
                  />
               </div>

               <div class="flex flex-1 items-center justify-center px-1 text-center">
                  <h1 class="wooly-title max-w-full truncate text-base text-pink-900 dark:text-pink-100 md:text-lg">
                     {{ title ?? 'Wooly' }}
                  </h1>
               </div>

               <div class="flex min-w-16 items-center justify-end gap-1">
                  <UButton
                     :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
                     variant="ghost"
                     color="neutral"
                     size="md"
                     class="tap-target tap-target-icon"
                     aria-label="Theme"
                     @click="toggleColorMode"
                  />

                  <UButton
                     v-if="status === 'authenticated'"
                     icon="i-heroicons-cog-6-tooth-20-solid"
                     variant="ghost"
                     color="neutral"
                     size="md"
                     class="tap-target tap-target-icon"
                     aria-label="Settings"
                     @click="$router.push('/settings')"
                  />
               </div>
            </div>
         </UContainer>
      </header>

      <main class="relative z-10 pt-5 md:pt-7">
         <UContainer>
            <section class="wooly-fade-up">
               <slot />
            </section>
         </UContainer>
      </main>
   </div>
</template>
