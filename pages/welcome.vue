<script lang="ts" setup>
definePageMeta({
   auth: {
      unauthenticatedOnly: true,
      navigateAuthenticatedTo: '/',
   },
});

const { signIn } = useAuth();
</script>

<template>
   <NuxtLayout>
      <div class="flex flex-col items-center p-5 gap-5">
         <p>Hello welcome to Wooly DIY</p>

         <UButton @click="signIn('google')" :icon="'i-heroicons-user-solid'">Sign In with google</UButton>
      </div>
   </NuxtLayout>
</template>

<style lang="scss" scoped></style>
