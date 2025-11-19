                     create_statement                     
----------------------------------------------------------
 CREATE TABLE IF NOT EXISTS companies ();
 CREATE TABLE IF NOT EXISTS customers ();
 CREATE TABLE IF NOT EXISTS employee_order_comments ();
 CREATE TABLE IF NOT EXISTS employee_order_logs ();
 CREATE TABLE IF NOT EXISTS employee_orders ();
 CREATE TABLE IF NOT EXISTS employee_permissions ();
 CREATE TABLE IF NOT EXISTS employee_role_permissions ();
 CREATE TABLE IF NOT EXISTS employee_statistics ();
 CREATE TABLE IF NOT EXISTS fba_comment_likes ();
 CREATE TABLE IF NOT EXISTS fba_comments ();
 CREATE TABLE IF NOT EXISTS fba_exchanges ();
 CREATE TABLE IF NOT EXISTS fba_locations ();
 CREATE TABLE IF NOT EXISTS fba_media_files ();
 CREATE TABLE IF NOT EXISTS jobs ();
 CREATE TABLE IF NOT EXISTS knex_migrations ();
 CREATE TABLE IF NOT EXISTS knex_migrations_lock ();
 CREATE TABLE IF NOT EXISTS land_loads ();
 CREATE TABLE IF NOT EXISTS land_trucks ();
 CREATE TABLE IF NOT EXISTS premium_posts ();
 CREATE TABLE IF NOT EXISTS rentals ();
 CREATE TABLE IF NOT EXISTS resumes ();
 CREATE TABLE IF NOT EXISTS sales ();
 CREATE TABLE IF NOT EXISTS system_config ();
 CREATE TABLE IF NOT EXISTS user_credits_log ();
 CREATE TABLE IF NOT EXISTS users ();
 CREATE TABLE IF NOT EXISTS users_backup_20251003 ();
(26 rows)

                         create_sequence                         
-----------------------------------------------------------------
 CREATE SEQUENCE IF NOT EXISTS companies_id_seq;
 CREATE SEQUENCE IF NOT EXISTS customers_id_seq;
 CREATE SEQUENCE IF NOT EXISTS employee_order_comments_id_seq;
 CREATE SEQUENCE IF NOT EXISTS employee_order_logs_id_seq;
 CREATE SEQUENCE IF NOT EXISTS employee_orders_id_seq;
 CREATE SEQUENCE IF NOT EXISTS employee_permissions_id_seq;
 CREATE SEQUENCE IF NOT EXISTS employee_role_permissions_id_seq;
 CREATE SEQUENCE IF NOT EXISTS employee_statistics_id_seq;
 CREATE SEQUENCE IF NOT EXISTS fba_comment_likes_id_seq;
 CREATE SEQUENCE IF NOT EXISTS fba_comments_id_seq;
 CREATE SEQUENCE IF NOT EXISTS fba_exchanges_id_seq;
 CREATE SEQUENCE IF NOT EXISTS fba_locations_id_seq;
 CREATE SEQUENCE IF NOT EXISTS fba_media_files_id_seq;
 CREATE SEQUENCE IF NOT EXISTS jobs_id_seq;
 CREATE SEQUENCE IF NOT EXISTS knex_migrations_id_seq;
 CREATE SEQUENCE IF NOT EXISTS knex_migrations_lock_index_seq;
 CREATE SEQUENCE IF NOT EXISTS land_loads_id_seq;
 CREATE SEQUENCE IF NOT EXISTS land_trucks_id_seq;
 CREATE SEQUENCE IF NOT EXISTS premium_posts_id_seq;
 CREATE SEQUENCE IF NOT EXISTS rentals_id_seq;
 CREATE SEQUENCE IF NOT EXISTS resumes_id_seq;
 CREATE SEQUENCE IF NOT EXISTS sales_id_seq;
 CREATE SEQUENCE IF NOT EXISTS system_config_id_seq;
 CREATE SEQUENCE IF NOT EXISTS user_credits_log_id_seq;
 CREATE SEQUENCE IF NOT EXISTS users_id_seq;
(25 rows)

