CREATE TABLE "skeins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"project_id" integer NOT NULL
);