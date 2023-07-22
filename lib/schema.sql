
CREATE TABLE todolists (
  id serial PRIMARY KEY,
  title text NOT NULL UNIQUE,
  username text NOT NULL
);

CREATE TABLE todos (
  id serial PRIMARY KEY,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  username text NOT NULL,
  todolist_id integer 
    NOT NULL
    REFERENCES todolists (id) 
    ON DELETE CASCADE
);

-- insert statements for seed data

INSERT INTO todolists (title) 
VALUES 
  ('Work Todos'),
  ('Home Todos'),
  ('Additional Todos'),
  ('social Todos')
;

INSERT INTO todos (title, done, todolist_id)
VALUES 
  ('Get coffee', true, 1),
  ('Chat with co-workers', true, 1),
  ('Duck out of meeting', false, 1), 
  ('Feed the cats', true, 2),
  ('Go to bed', true, 2),
  ('Buy milk', true, 2),
  ('Study for Launch School', true, 2), 
  ('Go to Libby''s birthday party', false, 4)
; 


CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);






