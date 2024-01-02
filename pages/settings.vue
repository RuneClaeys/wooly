<script lang="ts" setup>
const { signOut } = useAuth();
</script>

<template>
   <NuxtLayout>
      <div class="flex flex-col items-center p-5 gap-5">
         <p>Settings</p>

         <UButton @click="signOut()" :icon="'i-heroicons-user-solid'">Sign In with google</UButton>
      </div>
   </NuxtLayout>
</template>

<style lang="scss" scoped></style>
