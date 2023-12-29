<script setup lang="ts">
const { projectRouter } = useTrpcClient();

//#region List Projects
const { data, execute: refresh } = projectRouter.list.useQuery(undefined);
//#endregion

//#region Create Project
const newProject = ref<{ name: string }>({ name: "" });

async function createProject() {
  await projectRouter.create.mutate(newProject.value);
  refresh();
  newProject.value.name = "";
}
//#endregion

//#region Delete Project
async function deleteProject(id: number) {
  await projectRouter.delete.mutate(id);
  refresh();
}
//#endregion
</script>

<template>
  <div>
    <div v-auto-animate class="list">
      <NuxtLink
        v-for="project in data ?? []"
        :prefetch="true"
        :key="project.id"
        :to="{ name: 'projects-id', params: { id: project.id } }"
        class="list__item"
      >
        <p>{{ project.name }}</p>

        <button @click="deleteProject(project.id)">x</button>
      </NuxtLink>
    </div>

    <form @submit.prevent="createProject()">
      <label>
        Name:
        <input type="text" v-model="newProject.name" />

        <button>Submit</button>
      </label>
    </form>
  </div>
</template>

<style scoped>
.list {
  list-style: none;
  padding: 0;
}

.list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
}

.list__item:hover {
  background: #eee;
}

.list__item button {
  background: transparent;
  border: none;
  cursor: pointer;
  height: 1.5rem;
  width: 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.list__item button:hover {
  background-color: red;
  color: white;
}
</style>
