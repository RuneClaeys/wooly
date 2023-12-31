<script lang="ts" setup>
definePageMeta({
   auth: {
      unauthenticatedOnly: true,
      navigateAuthenticatedTo: '/',
   },
});

const { signIn } = useAuth();
</script>

<template>
   <div>
      Hello welcome to Wooly DIY

      <button @click="() => signIn('google')">singin using google</button>
   </div>
</template>

<style lang="scss" scoped></style>
