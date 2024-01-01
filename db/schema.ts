import { relations, sql } from 'drizzle-orm';
import { int, mysqlTable, serial, text, timestamp, varchar } from 'drizzle-orm/mysql-core';

// Users
export const users = mysqlTable('users', {
   id: varchar('id', { length: 255 }).primaryKey(),
   firstName: text('first_name'),
   lastName: text('last_name'),
   email: varchar('email', { length: 255 }).unique(),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
   projects: many(projects),
}));

export type SelectUser = typeof users.$inferSelect;

// Projects
export const projects = mysqlTable('projects', {
   id: serial('id').primaryKey(),
   name: text('name'),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   userId: varchar('user_id', { length: 255 }).notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
   user: one(users, {
      fields: [projects.userId],
      references: [users.id],
   }),
   parts: many(parts),
}));

export type InsertProject = typeof projects.$inferInsert;
export type SelectProject = typeof projects.$inferSelect;

// parts
export const parts = mysqlTable('parts', {
   id: serial('id').primaryKey(),
   name: text('name'),
   counter: int('count').notNull().default(0),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   projectId: int('project_id').notNull(),
});

export const partsRelations = relations(parts, ({ one }) => ({
   project: one(projects, {
      fields: [parts.projectId],
      references: [projects.id],
   }),
}));

export type SelectPart = Omit<typeof parts.$inferSelect, 'createdAt'> & { createdAt?: string | null };
export type InsertPart = Omit<typeof parts.$inferInsert, 'createdAt'> & { createdAt?: string | null };
