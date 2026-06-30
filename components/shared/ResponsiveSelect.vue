<script setup lang="ts">
interface SelectItem {
   label: string;
   value: string | number | null;
}

interface Props {
   value: string | number | null;
   items: SelectItem[];
   placeholder?: string;
   disabled?: boolean;
   clearable?: boolean;
   searchable?: boolean;
   size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
   title?: string;
   searchPlaceholder?: string;
   noResultsText?: string;
}

const props = withDefaults(defineProps<Props>(), {
   placeholder: '',
   disabled: false,
   clearable: false,
   searchable: true,
   size: 'md',
   title: '',
   searchPlaceholder: '',
   noResultsText: '',
});

const emit = defineEmits<{ (e: 'update:value', value: any): void }>();
const { t, locale } = useI18n();

const isMobile = useMediaQuery('(max-width: 639px)');
const drawerOpen = ref(false);
const searchQuery = ref('');

function valuesEqual(a: string | number | null | undefined, b: string | number | null | undefined) {
   if (a === b) return true;
   if (a === null || a === undefined || b === null || b === undefined) return false;
   return String(a) === String(b);
}

const sortedItems = computed(() => {
   return [...props.items].sort((left, right) => left.label.localeCompare(right.label, locale.value));
});

const selectedItem = computed(() => sortedItems.value.find((item) => valuesEqual(item.value, props.value)) ?? null);
const placeholderLabel = computed(() => props.placeholder || t('form.select-placeholder'));
const triggerLabel = computed(() => selectedItem.value?.label || placeholderLabel.value);
const drawerTitle = computed(() => props.title || t('form.select-options'));
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder || t('form.select-search-placeholder'));
const resolvedNoResultsText = computed(() => props.noResultsText || t('form.select-no-results'));

const filteredItems = computed(() => {
   if (!props.searchable) return sortedItems.value;

   const query = searchQuery.value.trim().toLowerCase();
   if (!query) return sortedItems.value;

   return sortedItems.value.filter((item) => item.label.toLowerCase().includes(query));
});

function openDrawer() {
   if (props.disabled) return;
   searchQuery.value = '';
   drawerOpen.value = true;
}

function selectValue(value: string | number | null) {
   emit('update:value', value);
   drawerOpen.value = false;
}

function clearValue() {
   if (!props.clearable) return;
   emit('update:value', null);
   drawerOpen.value = false;
}
</script>

<template>
   <div class="wooly-responsive-select w-full">
      <USelectMenu
         v-if="!isMobile"
         :model-value="value"
         :items="sortedItems"
         value-key="value"
         :placeholder="placeholderLabel"
         :search-input="searchable"
         :disabled="disabled"
         :clear="clearable"
         :size="size"
         class="w-full"
         @update:model-value="emit('update:value', $event as string | number | null)"
      />

      <div v-else>
         <button
            type="button"
            class="wooly-responsive-select-trigger flex min-h-11 w-full items-center justify-between gap-2 rounded-[0.8rem] px-3.5 py-2.5 text-left"
            :disabled="disabled"
            @click="openDrawer"
         >
            <span :class="selectedItem ? 'text-inherit' : 'text-slate-500 dark:text-slate-400'">{{ triggerLabel }}</span>
            <UIcon name="i-heroicons-chevron-up-down-16-solid" class="h-4 w-4 opacity-70" />
         </button>

         <UDrawer v-model:open="drawerOpen" :title="drawerTitle" nested>
            <template #body>
               <div class="space-y-3 px-4 py-3">
                  <UInput
                     v-if="searchable"
                     v-model="searchQuery"
                     icon="i-heroicons-magnifying-glass-16-solid"
                     :placeholder="resolvedSearchPlaceholder"
                     class="w-full"
                  />

                  <UButton
                     v-if="clearable && value !== null"
                     color="neutral"
                     variant="ghost"
                     block
                     class="justify-start"
                     icon="i-heroicons-x-mark-16-solid"
                     @click="clearValue"
                  >
                     {{ $t('form.select-clear') }}
                  </UButton>

                  <div v-if="filteredItems.length" class="space-y-1">
                     <UButton
                        v-for="item in filteredItems"
                        :key="String(item.value)"
                        color="neutral"
                        :variant="valuesEqual(item.value, value) ? 'soft' : 'ghost'"
                        block
                        class="justify-between"
                        @click="selectValue(item.value)"
                     >
                        <span>{{ item.label }}</span>
                        <UIcon v-if="valuesEqual(item.value, value)" name="i-heroicons-check-16-solid" class="h-4 w-4" />
                     </UButton>
                  </div>

                  <p v-else class="wooly-muted py-2 text-sm">{{ resolvedNoResultsText }}</p>
               </div>
            </template>
         </UDrawer>
      </div>
   </div>
</template>
