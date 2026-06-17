import { relations, sql } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Users
export const users = pgTable('users', {
   id: varchar('id', { length: 255 }).primaryKey(),
   firstName: text('first_name'),
   lastName: text('last_name'),
   email: varchar('email', { length: 255 }).unique(),
   locale: varchar('locale', { length: 255 }).notNull().default('en'),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
   projects: many(projects),
   yarnSkeins: many(yarnSkeins),
   bingoBoards: many(bingoBoards),
}));

export type SelectUser = typeof users.$inferSelect;

// Projects
export const projects = pgTable('projects', {
   id: serial('id').primaryKey(),
   name: text('name'),
   finished: boolean('finished').notNull().default(false),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
   userId: varchar('user_id', { length: 255 }).notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
   user: one(users, {
      fields: [projects.userId],
      references: [users.id],
   }),
   parts: many(parts),
   skeinUsages: many(projectSkeins),
   photos: many(projectPhotos),
   linkedBingoCells: many(bingoCells),
}));

export type InsertProject = Omit<typeof projects.$inferInsert, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};
export type SelectProject = Omit<typeof projects.$inferSelect, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};

// project photos
export const projectPhotos = pgTable('project_photos', {
   id: serial('id').primaryKey(),
   name: text('name').notNull(),
   url: text('url').notNull(),
   pathname: text('pathname').notNull(),
   contentType: text('content_type').notNull(),
   size: integer('size').notNull(),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   projectId: integer('project_id').notNull(),
});

export const projectPhotosRelations = relations(projectPhotos, ({ one }) => ({
   project: one(projects, {
      fields: [projectPhotos.projectId],
      references: [projects.id],
   }),
}));

export type SelectProjectPhoto = Omit<typeof projectPhotos.$inferSelect, 'createdAt'> & {
   createdAt?: string | null;
};

// parts
export const parts = pgTable('parts', {
   id: serial('id').primaryKey(),
   name: text('name'),
   counter: integer('count').notNull().default(0),
   completed: boolean('completed').notNull().default(false),
   completedAt: timestamp('completed_at'),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
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

// bingo boards
export const bingoBoards = pgTable('bingo_boards', {
   id: serial('id').primaryKey(),
   name: text('name').notNull(),
   size: integer('size').notNull().default(3),
   endDate: timestamp('end_date').notNull(),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
   userId: varchar('user_id', { length: 255 }).notNull(),
});

export const bingoBoardsRelations = relations(bingoBoards, ({ one, many }) => ({
   user: one(users, {
      fields: [bingoBoards.userId],
      references: [users.id],
   }),
   cells: many(bingoCells),
}));

export type SelectBingoBoard = Omit<typeof bingoBoards.$inferSelect, 'createdAt' | 'updatedAt' | 'endDate'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
   endDate: string | null;
};

export type InsertBingoBoard = Omit<typeof bingoBoards.$inferInsert, 'createdAt' | 'updatedAt' | 'endDate'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
   endDate: string | Date;
};

// bingo cells
export const bingoCells = pgTable('bingo_cells', {
   id: serial('id').primaryKey(),
   boardId: integer('board_id').notNull(),
   position: integer('position').notNull(),
   kind: varchar('kind', { length: 40 }).notNull(),
   label: text('label'),
   linkedProjectId: integer('linked_project_id'),
   targetValue: integer('target_value'),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const bingoCellsRelations = relations(bingoCells, ({ one }) => ({
   board: one(bingoBoards, {
      fields: [bingoCells.boardId],
      references: [bingoBoards.id],
   }),
   linkedProject: one(projects, {
      fields: [bingoCells.linkedProjectId],
      references: [projects.id],
   }),
   progress: one(bingoCellProgress, {
      fields: [bingoCells.id],
      references: [bingoCellProgress.cellId],
   }),
}));

export type SelectBingoCell = Omit<typeof bingoCells.$inferSelect, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};

export type InsertBingoCell = Omit<typeof bingoCells.$inferInsert, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};

// bingo cell progress
export const bingoCellProgress = pgTable('bingo_cell_progress', {
   id: serial('id').primaryKey(),
   cellId: integer('cell_id').notNull(),
   baselineValue: integer('baseline_value').notNull().default(0),
   currentValue: integer('current_value').notNull().default(0),
   autoCompleted: boolean('auto_completed').notNull().default(false),
   manualCompleted: boolean('manual_completed').notNull().default(false),
   completedAt: timestamp('completed_at'),
   updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const bingoCellProgressRelations = relations(bingoCellProgress, ({ one }) => ({
   cell: one(bingoCells, {
      fields: [bingoCellProgress.cellId],
      references: [bingoCells.id],
   }),
}));

export type SelectBingoCellProgress = Omit<typeof bingoCellProgress.$inferSelect, 'updatedAt' | 'completedAt'> & {
   updatedAt?: string | null;
   completedAt?: string | null;
};

export type InsertBingoCellProgress = Omit<typeof bingoCellProgress.$inferInsert, 'updatedAt' | 'completedAt'> & {
   updatedAt?: string | null;
   completedAt?: string | null;
};

// yarn skeins
export const yarnSkeins = pgTable('yarn_skeins', {
   id: serial('id').primaryKey(),
   name: text('name').notNull(),
   userId: varchar('user_id', { length: 255 }).notNull(),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const yarnSkeinsRelations = relations(yarnSkeins, ({ one, many }) => ({
   user: one(users, {
      fields: [yarnSkeins.userId],
      references: [users.id],
   }),
   usages: many(projectSkeins),
}));

export type SelectYarnSkein = Omit<typeof yarnSkeins.$inferSelect, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};
export type InsertYarnSkein = Omit<typeof yarnSkeins.$inferInsert, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};

// project yarn skeins
export const projectSkeins = pgTable('project_skeins', {
   id: serial('id').primaryKey(),
   projectId: integer('project_id').notNull(),
   skeinId: integer('skein_id').notNull(),
   counter: integer('count').notNull().default(0),
   createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const projectSkeinsRelations = relations(projectSkeins, ({ one }) => ({
   project: one(projects, {
      fields: [projectSkeins.projectId],
      references: [projects.id],
   }),
   yarnSkein: one(yarnSkeins, {
      fields: [projectSkeins.skeinId],
      references: [yarnSkeins.id],
   }),
}));

export type SelectProjectSkein = Omit<typeof projectSkeins.$inferSelect, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};
export type InsertProjectSkein = Omit<typeof projectSkeins.$inferInsert, 'createdAt' | 'updatedAt'> & {
   createdAt?: string | null;
   updatedAt?: string | null;
};
