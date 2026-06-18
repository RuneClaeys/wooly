<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { bingoRouter } = useTrpcClient();
const { promptDeleteConfirmation } = useConfirmation();
const { success: showSuccessToast, error: showErrorToast } = useToast();
const { t } = useI18n();

const { data: boards, execute: refreshBoards, pending } = bingoRouter.listBoards.useQuery();

const showCreateBoard = ref(false);
const showEditBoard = ref(false);
const boardToEdit = ref<any | undefined>(undefined);

async function createBoard(payload: { board: { name: string; size: 3 | 4; endDate: string }; done: () => void }) {
   try {
      await bingoRouter.createBoard.mutate(payload.board);
      await refreshBoards();
      payload.done();
      showCreateBoard.value = false;
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

function editBoard(board: any) {
   boardToEdit.value = { ...board };
   showEditBoard.value = true;
}

async function updateBoard(payload: { board: { name: string; size: 3 | 4; endDate: string }; done: () => void }) {
   if (!boardToEdit.value) return;

   try {
      await bingoRouter.updateBoardMeta.mutate({
         id: boardToEdit.value.id,
         name: payload.board.name,
         size: payload.board.size,
         endDate: payload.board.endDate,
      });
      await refreshBoards();
      payload.done();
      showEditBoard.value = false;
      showSuccessToast(t('actions.save'));
   } catch {
      showErrorToast(t('actions.save'));
   }
}

async function deleteBoard(boardId: number) {
   promptDeleteConfirmation(t('bingo.board'), async (done) => {
      try {
         await bingoRouter.deleteBoard.mutate(boardId);
         done();
         await refreshBoards();
         showSuccessToast(t('actions.delete'));
      } catch {
         showErrorToast(t('actions.confirm-delete-type', { type: t('bingo.board') }));
      }
   });
}

function openBoard(boardId: number) {
   navigateTo({ name: 'bingo-id', params: { id: boardId } });
}
</script>

<template>
   <div class="space-y-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <BingoBoardsSection
         :boards="boards"
         :pending="pending"
         @create="showCreateBoard = true"
         @open="openBoard"
         @edit="editBoard"
         @delete="deleteBoard"
      />

      <ModalsBingoBoard v-model="showCreateBoard" @save-board="createBoard" />
      <ModalsBingoBoard v-model="showEditBoard" :initial-board="boardToEdit" @save-board="updateBoard" />
   </div>
</template>
