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

function shouldIgnoreCardToggle(target: EventTarget | null): boolean {
   if (!(target instanceof Element)) {
      return false;
   }

   return Boolean(target.closest('button, a, input, select, textarea, [role="button"], [data-no-card-toggle="true"]'));
}

function handleCardClick(event: MouseEvent) {
   if (shouldIgnoreCardToggle(event.target)) {
      return;
   }

   emit('toggle');
}

function handleCardKeydown(event: KeyboardEvent) {
   if (event.key !== 'Enter' && event.key !== ' ') {
      return;
   }

   if (shouldIgnoreCardToggle(event.target)) {
      return;
   }

   event.preventDefault();
   emit('toggle');
}
</script>

<template>
   <UCard :class="cardClass ?? 'wooly-shell'">
      <div
         :class="expanded ? 'space-y-3' : 'space-y-2'"
         role="button"
         tabindex="0"
         :aria-expanded="expanded"
         @click="handleCardClick"
         @keydown="handleCardKeydown"
      >
         <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex items-start gap-1.5">
               <UButton
                  :icon="expanded ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'"
                  variant="ghost"
                  color="neutral"
                  size="md"
                  class="mt-0.5"
                  :aria-label="ariaLabel"
                  @click="emit('toggle')"
               />

               <div class="text-left min-w-0">
                  <p class="wooly-title text-base truncate" :class="titleClass">{{ title }}</p>
                  <p v-if="subtitle" class="text-xs wooly-muted">{{ subtitle }}</p>
               </div>
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
