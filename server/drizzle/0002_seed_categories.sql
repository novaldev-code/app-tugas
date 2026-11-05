INSERT INTO "categories" ("name", "is_default", "sort_order")
VALUES
  ('Pribadi', true, 1),
  ('Pekerjaan', true, 2),
  ('Belajar', true, 3)
ON CONFLICT DO NOTHING;
