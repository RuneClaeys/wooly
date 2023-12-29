import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Users
export const users = sqliteTable('users', {
   id: integer('id').primaryKey(),
   firstName: text('first_name'),
   lastName: text('last_name'),
   email: text('email').unique(),
   createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
   projects: many(projects),
}));

export type SelectUser = typeof users.$inferSelect;

// Projects
export const projects = sqliteTable('projects', {
   id: integer('id').primaryKey(),
   name: text('name'),
   createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
   userId: integer('user_id')
      .notNull()
      .references(() => users.id),
});

export const projectsRelations = relations(projects, ({ one }) => ({
   user: one(users, {
      fields: [projects.userId],
      references: [users.id],
   }),
}));
