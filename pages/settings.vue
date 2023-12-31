<script lang="ts" setup>
const { signOut } = useAuth();
</script>

<template>
   <div>
      <button @click="signOut({ redirect: true })">SignOut</button>
   </div>
</template>

<style lang="scss" scoped></style>
