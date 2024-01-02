<script lang="ts" setup>
const { signOut } = useAuth();
</script>

<template>
   <NuxtLayout :root="false">
      <div class="flex flex-col items-center p-5 gap-5">
         <p>Settings</p>

         <UButton @click="signOut()" :icon="'i-heroicons-arrow-right-end-on-rectangle-16-solid'">Sign Out</UButton>
      </div>
   </NuxtLayout>
</template>

<style lang="scss" scoped></style>
