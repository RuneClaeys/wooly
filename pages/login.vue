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
      <div class="mx-auto mt-6 max-w-xl">
         <UCard class="wooly-shell wooly-pop">
            <template #header>
               <div class="space-y-2 text-center">
                  <UBadge color="primary" variant="soft">Wooly</UBadge>
                  <h2 class="wooly-title text-2xl text-pink-900 dark:text-pink-100">
                     {{ $t('welcome.welcome-to-app', { appName: $t('app-name') }) }}
                  </h2>
               </div>
            </template>

            <div class="flex flex-col items-center gap-4 py-2">
               <p class="text-center text-sm text-pink-900/75 dark:text-pink-100/75">{{ $t('welcome.login-description') }}</p>

               <UButton size="lg" color="primary" icon="i-heroicons-user-solid" @click="signIn('google')">
                  {{ $t('welcome.login-with-google') }}
               </UButton>
            </div>
         </UCard>
      </div>
   </NuxtLayout>
</template>
