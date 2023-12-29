<script lang="ts" setup>
const { signOut } = useAuth();
</script>

<template>
  <NuxtPage />

  <button @click="signOut()">signout</button>
</template>
