<script setup lang="ts">
defineProps<{
   title: string;
   subtitle?: string;
   expanded: boolean;
   ariaLabel: string;
   cardClass?: string;
   titleClass?: string;
}>();

const emit = defineEmits<{
   toggle: [];
}>();
</script>

<template>
   <UCard :class="cardClass ?? 'wooly-shell'">
      <div :class="expanded ? 'space-y-3' : 'space-y-2'">
         <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex items-start gap-1.5">
               <UButton
                  :icon="expanded ? 'i-heroicons-chevron-up-16-solid' : 'i-heroicons-chevron-down-16-solid'"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  class="mt-0.5"
                  :aria-label="ariaLabel"
                  @click="emit('toggle')"
               />

               <button type="button" class="text-left min-w-0" @click="emit('toggle')">
                  <p class="wooly-title text-base truncate" :class="titleClass">{{ title }}</p>
                  <p v-if="subtitle" class="text-xs wooly-muted">{{ subtitle }}</p>
               </button>
            </div>

            <div class="flex items-center gap-1">
               <slot name="header-right" />
            </div>
         </div>

         <slot v-if="expanded" name="expanded-top" />
         <slot v-if="!expanded" name="collapsed-content" />
         <slot v-if="expanded" name="expanded-content" />
      </div>
   </UCard>
</template>
