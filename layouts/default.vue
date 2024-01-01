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
});
//#endregion

//#region Navigation
function navigateBack() {
   if (window.history.state.back) {
      return router.push(window.history.state.back);
   }
   return router.push('/');
}
//#endregion
</script>

<template>
   <div>
      <header class="bg-pink-300 dark:bg-pink-900">
         <UContainer class="flex py-3">
            <div class="min-w-7 flex justify-center items-center">
               <UButton
                  v-if="!root"
                  icon="i-heroicons-arrow-left-16-solid"
                  color="white"
                  variant="ghost"
                  aria-label="Theme"
                  @click="navigateBack"
               />
            </div>

            <div class="flex-1 flex justify-center items-center">
               <h2>{{ title ?? 'Wooly' }}</h2>
            </div>

            <div class="min-w-7 flex justify-center items-center">
               <UButton
                  :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
                  color="white"
                  variant="ghost"
                  aria-label="Theme"
                  @click="toggleColorMode"
               />
               <UButton
                  v-if="status === 'authenticated'"
                  icon="i-heroicons-cog-6-tooth-20-solid"
                  color="white"
                  variant="ghost"
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

<style lang="scss" scoped></style>
