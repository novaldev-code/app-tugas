CREATE UNIQUE INDEX "idx_categories_user_name_nocase" ON "categories" USING btree ("user_id", lower("name")) NULLS NOT DISTINCT;
