ALTER TABLE "yarn_types" ADD COLUMN IF NOT EXISTS "skein_weight_grams" integer;
--> statement-breakpoint
ALTER TABLE "yarn_types" ADD COLUMN IF NOT EXISTS "thickness_mm" real;
--> statement-breakpoint
ALTER TABLE "yarn_types" DROP COLUMN IF EXISTS "weight";
