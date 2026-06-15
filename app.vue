<script lang="ts" setup>
const { setLocale } = useI18n();
const { status } = useAuth();
const { userRouter } = useTrpcClient();

async function syncUserLocale(currentStatus: string) {
   if (currentStatus !== 'authenticated') return;

   try {
      const user = await userRouter.me.query();
      setLocale(user.locale ?? 'en');
   } catch {
      setLocale('en');
   }
}

watch(status, (nextStatus) => syncUserLocale(nextStatus), { immediate: true });
</script>

<template>
   <VitePwaManifest />

   <UApp>
      <NuxtPage />
      <ModalsConfirmation />
   </UApp>
</template>
