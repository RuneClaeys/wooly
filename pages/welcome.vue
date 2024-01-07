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
         <p>Welkom op Wooly</p>

         <UButton @click="signIn('google')" :icon="'i-heroicons-user-solid'">Log in met Google</UButton>
      </div>
   </NuxtLayout>
</template>

<style lang="scss" scoped></style>
