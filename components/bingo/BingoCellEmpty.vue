<script setup lang="ts">
defineProps<{
   position: number;
}>();

const emit = defineEmits<{
   (e: 'create', position: number): void;
}>();
</script>

<template>
   <button
      class="group relative aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/20 transition-all duration-200 hover:border-primary-400 hover:bg-gradient-to-br hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-950/30 dark:hover:to-primary-900/20 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md"
      :aria-label="$t('actions.create-type', { type: $t('bingo.cell') })"
      @click="emit('create', position)"
   >
      <div class="text-center space-y-2">
         <div class="mx-auto h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center">
            <UIcon name="i-heroicons-plus-16-solid" class="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
         </div>
         <p class="hidden sm:block text-sm font-semibold text-primary-700 dark:text-primary-300">{{ $t('bingo.add-cell') }}</p>
         <p class="hidden sm:block text-xs text-slate-500 dark:text-slate-400">{{ $t('bingo.empty-slot') }}</p>
      </div>
   </button>
</template>
