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
      <div class="relative mx-auto mt-6 max-w-xl">
         <div class="pointer-events-none absolute -right-10 -top-8 h-24 w-24 rounded-full bg-pink-200/50 blur-2xl dark:bg-pink-300/20" />
         <div class="pointer-events-none absolute -bottom-6 -left-8 h-28 w-28 rounded-full bg-rose-200/45 blur-2xl dark:bg-indigo-300/20" />

         <UCard class="wooly-shell wooly-pop relative z-10">
            <template #header>
               <div class="space-y-2 text-center">
                  <UBadge color="primary" variant="soft">Wooly</UBadge>
                  <h2 class="wooly-title text-2xl">
                     {{ $t('welcome.welcome-to-app', { appName: $t('app-name') }) }}
                  </h2>
               </div>
            </template>

            <div class="flex flex-col items-center gap-4 py-2">
               <p class="wooly-muted text-center text-sm">{{ $t('welcome.login-description') }}</p>

               <UButton size="lg" color="primary" icon="i-heroicons-user-solid" @click="signIn('google')">
                  {{ $t('welcome.login-with-google') }}
               </UButton>
            </div>
         </UCard>
      </div>
   </NuxtLayout>
</template>
