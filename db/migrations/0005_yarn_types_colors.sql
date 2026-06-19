CREATE TABLE "yarn_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"skein_weight_grams" integer,
	"thickness_mm" real,
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "yarn_colors" (
	"id" serial PRIMARY KEY NOT NULL,
	"yarn_type_id" integer NOT NULL,
	"name" text NOT NULL,
	"stash_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "project_yarns" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"yarn_color_id" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO "yarn_types" ("name", "skein_weight_grams", "thickness_mm", "user_id", "created_at", "updated_at")
SELECT "name", NULL, NULL, "user_id", "created_at", "updated_at"
FROM "yarn_skeins";
--> statement-breakpoint
INSERT INTO "yarn_colors" ("yarn_type_id", "name", "stash_count", "created_at", "updated_at")
SELECT yt."id", ys."name", 0, ys."created_at", ys."updated_at"
FROM "yarn_skeins" ys
INNER JOIN "yarn_types" yt ON yt."name" = ys."name" AND yt."user_id" = ys."user_id";
--> statement-breakpoint
INSERT INTO "project_yarns" ("project_id", "yarn_color_id", "used_count", "created_at", "updated_at")
SELECT ps."project_id", yc."id", ps."count", ps."created_at", ps."updated_at"
FROM "project_skeins" ps
INNER JOIN "yarn_skeins" ys ON ys."id" = ps."skein_id"
INNER JOIN "yarn_types" yt ON yt."name" = ys."name" AND yt."user_id" = ys."user_id"
INNER JOIN "yarn_colors" yc ON yc."yarn_type_id" = yt."id" AND yc."name" = ys."name";
--> statement-breakpoint
DROP TABLE "project_skeins";
--> statement-breakpoint
DROP TABLE "yarn_skeins";
