<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false });

defineProps<{
   title?: string;
   description?: string;
   ui?: Record<string, unknown>;
}>();

const isMobile = useMediaQuery('(max-width: 639px)');
</script>

<template>
   <UDrawer v-if="isMobile" v-model:open="open" :title="title" :description="description">
      <template #body>
         <slot name="body" />
      </template>
      <template v-if="$slots.footer" #footer>
         <slot name="footer" />
      </template>
   </UDrawer>
   <UModal v-else v-model:open="open" :title="title" :description="description" :ui="ui">
      <template #body>
         <slot name="body" />
      </template>
      <template v-if="$slots.footer" #footer>
         <slot name="footer" />
      </template>
   </UModal>
</template>
