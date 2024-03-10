<script lang="ts" setup>
const { t } = useI18n();

definePageMeta({
   auth: {
      unauthenticatedOnly: true,
      navigateAuthenticatedTo: '/',
   },
});

const { signIn } = useAuth();

useDefaultLayout(() => ({
   title: t('generic.login'),
   root: true,
}));
</script>

<template>
   <div class="flex flex-col items-center p-5 gap-5">
      <p>{{ $t('welcome.welcome-to-app', { appName: $t('app-name') }) }}</p>

      <UButton @click="signIn('google')" :icon="'i-heroicons-user-solid'">
         {{ $t('welcome.login-with-google') }}
      </UButton>
   </div>
</template>
