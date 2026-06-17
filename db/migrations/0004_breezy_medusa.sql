CREATE TABLE "bingo_boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"size" integer DEFAULT 3 NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"user_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bingo_cell_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"cell_id" integer NOT NULL,
	"baseline_value" integer DEFAULT 0 NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"auto_completed" boolean DEFAULT false NOT NULL,
	"manual_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "bingo_cells" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" integer NOT NULL,
	"position" integer NOT NULL,
	"kind" varchar(40) NOT NULL,
	"label" text,
	"linked_project_id" integer,
	"target_value" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "project_skeins" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"skein_id" integer NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "yarn_skeins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "completed_at" timestamp;