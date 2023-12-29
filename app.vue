<script setup lang="ts">
const { hello } = useTrpcClient();

const form = ref({ name: "" });

const { data, execute } = hello.useQuery(form, { immediate: false });
</script>

<template>
  <div>
    <form @submit.prevent="() => execute()">
      <label>
        What is your name?
        <input v-model="form.name" :placeholder="'name...'" />

        <button>Submit</button>
      </label>
    </form>

    <div v-if="data">
      <p>Hello {{ data?.greeting }}</p>
    </div>
  </div>
</template>

<style scoped></style>
