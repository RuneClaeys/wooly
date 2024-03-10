<script lang="ts" setup>
import type { SessionStatus } from '@sidebase/nuxt-auth/dist/runtime/types';

const { setLocale } = useI18n();
const { status } = useAuth();
const { userRouter } = useTrpcClient();

async function getUserInfo(status: SessionStatus) {
   if (status !== 'authenticated') return;

   const user = await userRouter.me.query();
   document.body.lang = user.locale ?? 'en';
   setLocale(user.locale ?? 'en');
}

watch(status, getUserInfo, { immediate: true });
</script>

<template>
   <VitePwaManifest />
   <UNotifications />
   <ModalsConfirmation />

   <NuxtLayout>
      <NuxtPage />
   </NuxtLayout>
</template>

<style>
.page-enter-active,
.page-leave-active {
   transition: all 0.2s ease-in-out;
}
.page-enter-from,
.page-leave-to {
   opacity: 0;
}
</style>
