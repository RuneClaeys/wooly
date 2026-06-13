<script lang="ts" setup>
import type { SelectPart } from '~/db/schema';

//#region Globals
const route = useRoute('projects-id');
const { projectRouter, partRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { t } = useI18n();
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');
const fabColor = computed(() => (isDark.value ? 'neutral' : 'primary'));
const fabVariant = computed(() => (isDark.value ? 'soft' : 'solid'));
//#endregion

//#region Get Project
const { data } = projectRouter.get.useQuery(+route.params.id);

const { sorting, query } = useSorting('parts');

const input = computed(() => ({
   projectId: +route.params.id,
   sorting: query.value,
}));

const { data: parts, execute: refresh, pending } = partRouter.list.useQuery(input, { watch: [input], deep: true });
//#endregion

//#region Add Part
const showCreatePartForm = ref(false);
const sortDelay = ref<ReturnType<typeof setTimeout> | undefined>(undefined);

async function createPart(payload: { part: { name: string; counter: number }; done: () => void }) {
   const response = await partRouter.create.mutate({
      projectId: +route.params.id,
      name: payload.part.name,
      counter: payload.part.counter,
   });

   if (response) refresh();
   showCreatePartForm.value = false;
   payload.done();
}

async function deletePart(id: number) {
   promptDeleteConfirmation(t('parts.part'), async (done) => {
      await partRouter.delete.mutate(id);
      done();
      parts.value = (parts.value ?? []).filter((part) => part.id !== id);
   });
}

async function incrementOrDecrement(part: Required<SelectPart>, increment: boolean) {
   try {
      part.counter += increment ? 1 : -1;
      await partRouter.update.mutate({ ...part });
      if (sortDelay.value) clearTimeout(sortDelay.value);

      sortDelay.value = setTimeout(() => {
         refresh();
      }, 1000);
   } catch {
      part.counter -= increment ? 1 : -1;
   }
}
//#endregion

//#region Edit Part
const showEditProjectForm = ref(false);
const partToEdit = ref<SelectPart | undefined>(undefined);

async function changePart(payload: { part: { name: string; counter: number }; done: () => void }) {
   const response = await partRouter.update.mutate({ ...payload.part, id: partToEdit.value!.id });
   if (response) refresh();
   showEditProjectForm.value = false;
   payload.done();
}

function editPart(part: SelectPart) {
   partToEdit.value = { ...part };
   showEditProjectForm.value = true;
}

//#endregion
</script>

<template>
   <NuxtLayout :root="false" :title="data?.name ?? $t('generic.loading')" navigate-back-to="/">
      <div class="space-y-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
         <LayoutHeading v-model:sorting="sorting" :title="$t('parts.part', 2)" />

         <div v-auto-animate class="grid grid-cols-1 gap-3" :class="{ 'opacity-75': pending }">
            <UCard v-for="part in parts ?? []" :key="part.id" class="wooly-shell wooly-pop w-full">
               <div class="space-y-4">
                  <div class="flex items-start justify-between gap-2">
                     <p class="wooly-title text-base text-pink-900 dark:text-pink-100">{{ part.name }}</p>

                     <div class="flex items-center gap-1">
                        <UButton
                           icon="i-heroicons-pencil-16-solid"
                           variant="ghost"
                           color="neutral"
                           size="md"
                           class="tap-target tap-target-icon"
                           :aria-label="$t('actions.edit-type', { type: $t('parts.part') })"
                           @click.stop="editPart(part)"
                        />
                        <UButton
                           icon="i-heroicons-trash-16-solid"
                           variant="ghost"
                           color="error"
                           size="md"
                           class="tap-target tap-target-icon"
                           :aria-label="$t('actions.delete-type', { type: $t('parts.part') })"
                           @click.stop="deletePart(part.id)"
                        />
                     </div>
                  </div>

                  <div class="rounded-xl bg-pink-50/70 p-2 dark:bg-pink-950/35">
                     <div class="flex items-center justify-between gap-2">
                        <small class="text-pink-800 dark:text-pink-200">{{ $t('parts.row-count') }}</small>

                        <div class="flex items-center gap-2">
                           <UButton
                              icon="i-heroicons-minus-16-solid"
                              variant="soft"
                              color="error"
                              size="md"
                              class="tap-target tap-target-icon"
                              :aria-label="$t('actions.decrease-count', { type: $t('parts.part') })"
                              @click.stop="incrementOrDecrement(part, false)"
                           />

                           <p class="min-w-10 text-center text-lg font-semibold text-pink-900 dark:text-pink-100">{{ part.counter }}</p>

                           <UButton
                              icon="i-heroicons-plus-16-solid"
                              variant="soft"
                              color="success"
                              size="md"
                              class="tap-target tap-target-icon"
                              :aria-label="$t('actions.increase-count', { type: $t('parts.part') })"
                              @click.stop="incrementOrDecrement(part, true)"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </UCard>
         </div>

         <div v-if="!pending && !parts?.length" class="wooly-shell px-6 py-10 text-center">
            <p class="text-pink-900 dark:text-pink-100">{{ $t('generic.no-results-for-type', { type: $t('parts.part', 2) }) }}</p>
         </div>

         <UButton
            class="wooly-fab tap-target tap-target-icon"
            size="xl"
            icon="i-heroicons-plus-16-solid"
            :color="fabColor"
            :variant="fabVariant"
            :aria-label="$t('actions.create-type', { type: $t('parts.part') })"
            @click="showCreatePartForm = true"
         />

         <ModalsPart v-model="showCreatePartForm" @save-part="createPart" />
         <ModalsPart v-model="showEditProjectForm" :initial-part="partToEdit" @save-part="changePart" />
      </div>
   </NuxtLayout>
</template>
