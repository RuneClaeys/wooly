CREATE TABLE year_goals (
   id serial PRIMARY KEY,
   year integer NOT NULL,
   kind varchar(40) NOT NULL,
   label text,
   linked_project_id integer,
   target_value integer,
   created_at timestamp DEFAULT CURRENT_TIMESTAMP,
   updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
   user_id varchar(255) NOT NULL
);

CREATE TABLE year_goal_progress (
   id serial PRIMARY KEY,
   goal_id integer NOT NULL,
   baseline_value integer NOT NULL DEFAULT 0,
   current_value integer NOT NULL DEFAULT 0,
   auto_completed boolean NOT NULL DEFAULT false,
   manual_completed boolean NOT NULL DEFAULT false,
   completed_at timestamp,
   updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);
