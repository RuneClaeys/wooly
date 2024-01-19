<script lang="ts" setup>
const { signOut } = useAuth();
</script>

<template>
   <div>
      <NuxtLayout :root="false">
         <div class="flex flex-col items-center p-5 gap-5">
            <p>{{ $t('settings.setting', 2) }}</p>

            <UButton @click="signOut()" :icon="'i-heroicons-arrow-right-end-on-rectangle-16-solid'">
               {{ $t('settings.logout') }}
            </UButton>
         </div>
      </NuxtLayout>
   </div>
</template>

<style lang="scss" scoped></style>
