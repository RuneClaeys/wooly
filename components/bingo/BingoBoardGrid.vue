<script setup lang="ts">
import BingoCellCard from './BingoCellCard.vue';
import BingoCellEmpty from './BingoCellEmpty.vue';

interface BingoCellItem {
   id: number;
   boardId: number;
   position: number;
   kind: 'project_finish' | 'parts_count' | 'skeins_count' | 'free_text';
   label: string | null;
   linkedProjectId: number | null;
   linkedProjectName: string | null;
   targetValue: number | null;
   baselineValue: number | null;
   currentValue: number | null;
   autoCompleted: boolean | null;
   manualCompleted: boolean | null;
   completedAt: string | null;
}

const props = defineProps<{
   size: number;
   cells: BingoCellItem[];
}>();

const emit = defineEmits<{
   (e: 'edit-cell', cell: BingoCellItem): void;
   (e: 'delete-cell', id: number): void;
   (e: 'create-cell', position: number): void;
   (e: 'toggle-manual', payload: { cellId: number; completed: boolean }): void;
   (e: 'set-progress', payload: { cellId: number; currentValue: number }): void;
}>();

const totalSlots = computed(() => props.size * props.size);

const cellByPosition = computed(() => {
   const map = new Map<number, BingoCellItem>();
   for (const cell of props.cells) {
      map.set(cell.position, cell);
   }
   return map;
});

const positions = computed(() => Array.from({ length: totalSlots.value }, (_, index) => index + 1));
</script>

<template>
   <div
      class="grid gap-2 sm:gap-3 overflow-x-auto p-1"
      :style="{
         gridTemplateColumns: `repeat(${size}, minmax(120px, 1fr))`,
      }"
   >
      <template v-for="position in positions" :key="position">
         <BingoCellCard
            v-if="cellByPosition.get(position)"
            :position="position"
            :cell="cellByPosition.get(position)!"
            @edit="emit('edit-cell', $event)"
            @delete="emit('delete-cell', $event)"
            @toggle-manual="emit('toggle-manual', $event)"
            @set-progress="emit('set-progress', $event)"
         />

         <BingoCellEmpty v-else :position="position" @create="emit('create-cell', $event)" />
      </template>
   </div>
</template>
