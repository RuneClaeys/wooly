<script lang="ts" setup>
const { signOut } = useAuth();
const { userRouter } = useTrpcClient();

const { locale, setLocale } = useI18n();

const locales = computed(() => [
   { value: 'en', label: 'English' },
   { value: 'nl', label: 'Nederlands' },
]);

function updateLocale(locale: 'en' | 'nl') {
   setLocale(locale);
   userRouter.updateLocale.mutate(locale);
}
</script>

<template>
   <NuxtLayout :root="false" :title="$t('settings.setting', 2)">
      <div class="mx-auto max-w-2xl">
         <UCard class="wooly-shell wooly-pop">
            <template #header>
               <h2 class="wooly-title text-lg text-pink-900 dark:text-pink-100">{{ $t('settings.setting', 2) }}</h2>
            </template>

            <div class="flex flex-col gap-5">
               <UFormField :label="$t('generic.language')" name="language" class="max-w-xs">
                  <USelect :model-value="locale" :items="locales" @update:model-value="updateLocale" />
               </UFormField>

               <UButton
                  @click="signOut()"
                  variant="soft"
                  color="neutral"
                  icon="i-heroicons-arrow-right-end-on-rectangle-16-solid"
                  class="max-w-44"
               >
                  {{ $t('settings.logout') }}
               </UButton>
            </div>
         </UCard>
      </div>
   </NuxtLayout>
</template>
