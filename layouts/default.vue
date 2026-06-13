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
         <div class="wooly-orb absolute -left-16 top-24 h-48 w-48 rounded-full bg-pink-200/48 blur-3xl dark:bg-pink-400/18" />
         <div class="wooly-orb-slow absolute right-3 top-8 h-36 w-36 rounded-full bg-rose-200/42 blur-3xl dark:bg-indigo-300/14" />
         <div class="wooly-orb absolute bottom-14 right-8 h-56 w-56 rounded-full bg-fuchsia-200/28 blur-3xl dark:bg-fuchsia-300/10" />
         <div class="wooly-orb-slow absolute left-1/3 top-1/2 h-40 w-40 rounded-full bg-orange-100/35 blur-3xl dark:bg-rose-300/12" />
      </div>

      <header class="sticky top-0 z-20 pt-[max(0.75rem,env(safe-area-inset-top))]">
         <UContainer class="w-full max-w-300">
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
                  <h1 class="wooly-title max-w-full truncate text-base md:text-lg">
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
         <UContainer class="w-full max-w-300">
            <section class="wooly-fade-up">
               <slot />
            </section>
         </UContainer>
      </main>
   </div>
</template>
