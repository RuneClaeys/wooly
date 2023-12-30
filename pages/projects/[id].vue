<script lang="ts" setup>
import type { SelectPart } from '~/db/schema';

const route = useRoute('projects-id');
const { projectRouter } = useTrpcClient();

//#region Get Project
const { data, execute } = projectRouter.get.useQuery(+route.params.id);
//#endregion

//#region Add Part
const newPart = ref<{ name: string }>({ name: '' });

async function addPart() {
   const response = await projectRouter.partRouter.create.mutate({
      projectId: +route.params.id,
      name: newPart.value.name,
      count: 0,
   });
   newPart.value.name = '';

   if (response) data.value?.parts.push(response);
}

async function increment(part: Required<SelectPart>) {
   try {
      part.counter++;
      await projectRouter.partRouter.update.mutate({ ...part });
   } catch {
      part.counter--;
   }
}

async function decrement(part: Required<SelectPart>) {
   try {
      part.counter--;
      await projectRouter.partRouter.update.mutate({ ...part });
   } catch {
      part.counter++;
   }
}
</script>

<template>
   <div>
      <h3>{{ data?.name }}</h3>

      <ul>
         <li v-for="part in data?.parts ?? []" :key="part.id">
            {{ part.name }}

            <button @click="decrement(part)">-</button>
            <span>{{ part.counter }}</span>
            <button @click="increment(part)">+</button>
         </li>
      </ul>

      <form @submit.prevent="addPart()">
         <label>
            Name:
            <input type="text" v-model="newPart.name" />

            <button>Submit</button>
         </label>
      </form>
   </div>
</template>

<style lang="scss" scoped></style>
