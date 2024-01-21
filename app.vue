<script lang="ts" setup>
import type { SessionStatus } from '@sidebase/nuxt-auth/dist/runtime/types';

const { setLocale } = useI18n();
const { status } = useAuth();
const { userRouter } = useTrpcClient();

async function getUserInfo(status: SessionStatus) {
   if (status !== 'authenticated') return;

   const user = await userRouter.me.query();
   setLocale(user.locale ?? 'en');
}

watch(status, getUserInfo, { immediate: true });
</script>

<template>
   <VitePwaManifest />
   <NuxtPage />
   <UNotifications />
   <ModalsConfirmation />
</template>
