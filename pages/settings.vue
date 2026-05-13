<script lang="ts" setup>
const { signOut } = useAuth();
const { userRouter } = useTrpcClient();
const { t } = useI18n();
const { locale: changeDayjsLocale } = useDayjs();
const { locale, setLocale } = useI18n();

const locales = computed(() => [
   { value: 'en', label: 'English' },
   { value: 'nl', label: 'Nederlands' },
]);

function updateLocale(locale: 'en' | 'nl') {
   setLocale(locale);
   changeDayjsLocale(locale);
   userRouter.updateLocale.mutate(locale);
}

useDefaultLayout(() => ({
   title: t('settings.setting', 2),
   root: false,
}));
</script>

<template>
   <div class="flex flex-col py-5 gap-5">
      <p>{{ $t('settings.setting', 2) }}</p>

      <UFormField :label="$t('generic.language')" :name="'language'" :class="'max-w-60'">
         <USelect :model-value="locale" :name="'language'" :items="locales" @update:model-value="updateLocale" />
      </UFormField>

      <UButton @click="signOut()" variant="link" :icon="'i-heroicons-arrow-right-end-on-rectangle-16-solid'" :class="'max-w-40 p-0'">
         {{ $t('settings.logout') }}
      </UButton>
   </div>
</template>
