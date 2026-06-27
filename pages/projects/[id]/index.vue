<script setup lang="ts">
import { useRouteNumericParam } from '~/composables/useRouteNumericParam';

const projectId = useRouteNumericParam('id');

await navigateTo(`/projects/${projectId.value}/overview`, { replace: true });
</script>
