<script lang="ts" setup>
const { signOut } = useAuth();
const { userRouter } = useTrpcClient();

const { locale, setLocale } = useI18n();

type Locale = 'en' | 'nl';
const supportedLocales: Locale[] = ['en', 'nl'];

const locales = computed(() => [
   { value: 'en', label: 'English' },
   { value: 'nl', label: 'Nederlands' },
]);

function updateLocale(nextLocale: string) {
   if (!supportedLocales.includes(nextLocale as Locale)) return;

   const localeValue = nextLocale as Locale;
   setLocale(localeValue);
   userRouter.updateLocale.mutate(localeValue);
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
                  <ResponsiveSelect
                     class="wooly-select-clean"
                     :title="$t('generic.language')"
                     :value="locale"
                     :items="locales"
                     @update:value="(value) => updateLocale(String(value ?? ''))"
                  />
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
