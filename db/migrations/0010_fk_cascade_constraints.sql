-- Enforce referential integrity at the database level.
-- The application already deletes child rows in code; these foreign keys add a
-- safety net so a failed code path can no longer leave orphaned rows.
-- Additive only: no foreign keys existed before this migration.

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_users_id_fk;
ALTER TABLE projects ADD CONSTRAINT projects_user_id_users_id_fk
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE project_photos DROP CONSTRAINT IF EXISTS project_photos_project_id_projects_id_fk;
ALTER TABLE project_photos ADD CONSTRAINT project_photos_project_id_projects_id_fk
   FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_project_id_projects_id_fk;
ALTER TABLE parts ADD CONSTRAINT parts_project_id_projects_id_fk
   FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE bingo_boards DROP CONSTRAINT IF EXISTS bingo_boards_user_id_users_id_fk;
ALTER TABLE bingo_boards ADD CONSTRAINT bingo_boards_user_id_users_id_fk
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE bingo_cells DROP CONSTRAINT IF EXISTS bingo_cells_board_id_bingo_boards_id_fk;
ALTER TABLE bingo_cells ADD CONSTRAINT bingo_cells_board_id_bingo_boards_id_fk
   FOREIGN KEY (board_id) REFERENCES bingo_boards(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE bingo_cells DROP CONSTRAINT IF EXISTS bingo_cells_linked_project_id_projects_id_fk;
ALTER TABLE bingo_cells ADD CONSTRAINT bingo_cells_linked_project_id_projects_id_fk
   FOREIGN KEY (linked_project_id) REFERENCES projects(id) ON DELETE set null ON UPDATE no action;

ALTER TABLE bingo_cell_progress DROP CONSTRAINT IF EXISTS bingo_cell_progress_cell_id_bingo_cells_id_fk;
ALTER TABLE bingo_cell_progress ADD CONSTRAINT bingo_cell_progress_cell_id_bingo_cells_id_fk
   FOREIGN KEY (cell_id) REFERENCES bingo_cells(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE year_goals DROP CONSTRAINT IF EXISTS year_goals_user_id_users_id_fk;
ALTER TABLE year_goals ADD CONSTRAINT year_goals_user_id_users_id_fk
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE year_goals DROP CONSTRAINT IF EXISTS year_goals_linked_project_id_projects_id_fk;
ALTER TABLE year_goals ADD CONSTRAINT year_goals_linked_project_id_projects_id_fk
   FOREIGN KEY (linked_project_id) REFERENCES projects(id) ON DELETE set null ON UPDATE no action;

ALTER TABLE year_goal_progress DROP CONSTRAINT IF EXISTS year_goal_progress_goal_id_year_goals_id_fk;
ALTER TABLE year_goal_progress ADD CONSTRAINT year_goal_progress_goal_id_year_goals_id_fk
   FOREIGN KEY (goal_id) REFERENCES year_goals(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE yarn_types DROP CONSTRAINT IF EXISTS yarn_types_user_id_users_id_fk;
ALTER TABLE yarn_types ADD CONSTRAINT yarn_types_user_id_users_id_fk
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE yarn_colors DROP CONSTRAINT IF EXISTS yarn_colors_yarn_type_id_yarn_types_id_fk;
ALTER TABLE yarn_colors ADD CONSTRAINT yarn_colors_yarn_type_id_yarn_types_id_fk
   FOREIGN KEY (yarn_type_id) REFERENCES yarn_types(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE project_yarns DROP CONSTRAINT IF EXISTS project_yarns_project_id_projects_id_fk;
ALTER TABLE project_yarns ADD CONSTRAINT project_yarns_project_id_projects_id_fk
   FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE project_yarns DROP CONSTRAINT IF EXISTS project_yarns_yarn_color_id_yarn_colors_id_fk;
ALTER TABLE project_yarns ADD CONSTRAINT project_yarns_yarn_color_id_yarn_colors_id_fk
   FOREIGN KEY (yarn_color_id) REFERENCES yarn_colors(id) ON DELETE cascade ON UPDATE no action;
