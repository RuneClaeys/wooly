<script lang="ts" setup>
const { setLocale } = useI18n();
const { status } = useAuth();
const { userRouter } = useTrpcClient();
const route = useRoute();
const { t } = useI18n();

const isMainTabPage = computed(
   () => route.path === '/' || route.path === '/bingo' || route.path === '/yarn' || route.path === '/year-goals',
);

const mainTabTitle = computed(() => {
   if (route.path === '/bingo') return t('bingo.board', 2);
   if (route.path === '/year-goals') return t('year-goals.title');
   if (route.path === '/yarn') return t('trackers.skeins-used');
   return t('projects.projects');
});

async function syncUserLocale(currentStatus: string) {
   if (currentStatus !== 'authenticated') return;

   try {
      const user = await userRouter.me.query();
      setLocale(user.locale ?? 'en');
   } catch {
      setLocale('en');
   }
}

function handleAuthStatusChange(nextStatus: string) {
   void syncUserLocale(nextStatus);
}

watch(status, handleAuthStatusChange, { immediate: true });
</script>

<template>
   <VitePwaManifest />

   <UApp>
      <NuxtLayout v-if="isMainTabPage" :title="mainTabTitle">
         <NuxtPage />
      </NuxtLayout>

      <NuxtPage v-else />

      <ModalsConfirmation />
   </UApp>
</template>
