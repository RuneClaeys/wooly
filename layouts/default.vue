<script lang="ts" setup>
//#region Globals
const { status } = useAuth();
const router = useRouter();

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

function toggleColorMode() {
   colorMode.value = isDark.value ? 'light' : 'dark';
   colorMode.preference = colorMode.value;
}
//#endregion

//#region Props & Emits
defineProps({
   title: { type: String, default: 'Wooly' },
   root: { type: Boolean, default: true },
   navigateBackTo: { type: String, default: '/' },
});
//#endregion
</script>

<template>
   <div class="h-100">
      <header class="bg-pink-400 text-white dark:bg-pink-900">
         <UContainer class="flex py-3">
            <div class="min-w-16 flex justify-start items-center">
               <UButton
                  v-if="!root"
                  icon="i-heroicons-arrow-left-16-solid"
                  color="black"
                  variant="ghost"
                  aria-label="Theme"
                  @click="navigateTo(navigateBackTo)"
               />
            </div>

            <div class="flex-1 flex justify-center items-center">
               <h2>{{ title ?? 'Wooly' }}</h2>
            </div>

            <div class="min-w-16 flex justify-center items-center">
               <UButton
                  :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
                  variant="ghost"
                  color="black"
                  aria-label="Theme"
                  @click="toggleColorMode"
               />
               <UButton
                  v-if="status === 'authenticated'"
                  icon="i-heroicons-cog-6-tooth-20-solid"
                  variant="ghost"
                  color="black"
                  aria-label="Settings"
                  @click="$router.push('/settings')"
               />
            </div>
         </UContainer>
      </header>

      <UContainer>
         <slot></slot>
      </UContainer>
   </div>
</template>
