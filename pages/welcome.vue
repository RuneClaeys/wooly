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
   <div>
      <NuxtLayout>
         <div class="flex flex-col items-center p-5 gap-5">
            <p>{{ $t('welcome.welcome-to-app', { appName: $t('app-name') }) }}</p>

            <UButton @click="signIn('google')" :icon="'i-heroicons-user-solid'">
               {{ $t('welcome.login-with-google') }}
            </UButton>
         </div>
      </NuxtLayout>
   </div>
</template>

<style lang="scss" scoped></style>
