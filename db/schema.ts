import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Users
export const users = pgTable('users', {
   id: varchar('id', { length: 255 }).primaryKey(),
   firstName: text('first_name'),
   lastName: text('last_name'),
   email: varchar('email', { length: 255 }).unique(),
   locale: varchar('locale', { length: 255 }).notNull().default('en'),
   createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
   projects: many(projects),
}));

export type SelectUser = typeof users.$inferSelect;

// Projects
export const projects = pgTable('projects', {
   id: serial('id').primaryKey(),
   name: text('name'),
   finished: boolean('finished').notNull().default(false),
   createdAt: timestamp('created_at').defaultNow(),
   updatedAt: timestamp('updated_at').defaultNow(),
   userId: varchar('user_id', { length: 255 }).notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
   user: one(users, {
      fields: [projects.userId],
      references: [users.id],
   }),
   parts: many(parts),
}));

export type InsertProject = Omit<typeof projects.$inferInsert, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};
export type SelectProject = Omit<typeof projects.$inferSelect, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};

// parts
export const parts = pgTable('parts', {
   id: serial('id').primaryKey(),
   name: text('name'),
   counter: integer('count').notNull().default(0),
   createdAt: timestamp('created_at').defaultNow(),
   updatedAt: timestamp('updated_at').defaultNow(),
   projectId: integer('project_id').notNull(),
});

export const partsRelations = relations(parts, ({ one }) => ({
   project: one(projects, {
      fields: [parts.projectId],
      references: [projects.id],
   }),
}));

export type SelectPart = Omit<typeof parts.$inferSelect, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};
export type InsertPart = Omit<typeof parts.$inferInsert, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};
