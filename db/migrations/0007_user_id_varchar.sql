ALTER TABLE "users"
ALTER COLUMN "id" TYPE varchar(255) USING "id"::varchar(255);
--> statement-breakpoint
ALTER TABLE "projects"
ALTER COLUMN "user_id" TYPE varchar(255) USING "user_id"::varchar(255);
--> statement-breakpoint
ALTER TABLE "bingo_boards"
ALTER COLUMN "user_id" TYPE varchar(255) USING "user_id"::varchar(255);
--> statement-breakpoint
ALTER TABLE "yarn_types"
ALTER COLUMN "user_id" TYPE varchar(255) USING "user_id"::varchar(255);