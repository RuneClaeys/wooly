ALTER TABLE "bingo_cells"
ADD COLUMN "linked_part_ids" jsonb;

ALTER TABLE "year_goals"
ADD COLUMN "linked_part_ids" jsonb;
