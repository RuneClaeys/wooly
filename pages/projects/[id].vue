<script lang="ts" setup>
const route = useRoute("projects-id");

const { projectRouter } = useTrpcClient();

//#region Get Project
const { data } = projectRouter.get.useQuery(+route.params.id);
//#endregion
</script>

<template>
  <div>{{ data }}</div>
</template>

<style lang="scss" scoped></style>
