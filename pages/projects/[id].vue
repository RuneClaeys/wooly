<script lang="ts" setup>
import { useRouteNumericParam } from '~/composables/useRouteNumericParam';

const { projectRouter } = useTrpcClient();
const projectId = useRouteNumericParam('id');
const route = useRoute();
const router = useRouter();

const { data } = projectRouter.get.useQuery(projectId);

onMounted(() => {
   const rawTab = route.query.tab;
   const tab = Array.isArray(rawTab) ? rawTab[0] : rawTab;

   if (!tab) return;

   const target = tab === 'parts' ? 'overview' : tab === 'skeins' ? 'yarn' : tab;
   if (!['overview', 'photos', 'yarn'].includes(target)) return;

   router.replace(`/projects/${projectId.value}/${target}`);
});
</script>

<template>
   <NuxtLayout :root="false" :title="data?.name ?? $t('generic.loading')" navigate-back-to="/">
      <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
         <ProjectBreadcrumb :project-name="data?.name ?? $t('generic.loading')" />
         <ProjectDetailTabs :project-id="projectId" />
         <NuxtPage />
      </div>
   </NuxtLayout>
</template>
