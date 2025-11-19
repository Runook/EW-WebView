                                              List of relations
 Schema |           Name            | Type  | Owner  | Persistence | Access method |    Size    | Description 
--------+---------------------------+-------+--------+-------------+---------------+------------+-------------
 public | companies                 | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | customers                 | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | employee_order_comments   | table | ewjosh | permanent   | heap          | 8192 bytes | 
 public | employee_order_logs       | table | ewjosh | permanent   | heap          | 64 kB      | 
 public | employee_orders           | table | ewjosh | permanent   | heap          | 48 kB      | 
 public | employee_permissions      | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | employee_role_permissions | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | employee_statistics       | table | ewjosh | permanent   | heap          | 0 bytes    | 
 public | fba_comment_likes         | table | ewjosh | permanent   | heap          | 0 bytes    | 
 public | fba_comments              | table | ewjosh | permanent   | heap          | 8192 bytes | 
 public | fba_exchanges             | table | ewjosh | permanent   | heap          | 48 kB      | 
 public | fba_locations             | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | fba_media_files           | table | ewjosh | permanent   | heap          | 8192 bytes | 
 public | jobs                      | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | knex_migrations           | table | ewjosh | permanent   | heap          | 8192 bytes | 
 public | knex_migrations_lock      | table | ewjosh | permanent   | heap          | 8192 bytes | 
 public | land_loads                | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | land_trucks               | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | premium_posts             | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | rentals                   | table | ewjosh | permanent   | heap          | 1776 kB    | 
 public | resumes                   | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | sales                     | table | ewjosh | permanent   | heap          | 1784 kB    | 
 public | system_config             | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | user_credits_log          | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | users                     | table | ewjosh | permanent   | heap          | 16 kB      | 
 public | users_backup_20251003     | table | ewjosh | permanent   | heap          | 16 kB      | 
(26 rows)

                       List of relations
 Schema |               Name               |   Type   | Owner  
--------+----------------------------------+----------+--------
 public | companies_id_seq                 | sequence | ewjosh
 public | customers_id_seq                 | sequence | ewjosh
 public | employee_order_comments_id_seq   | sequence | ewjosh
 public | employee_order_logs_id_seq       | sequence | ewjosh
 public | employee_orders_id_seq           | sequence | ewjosh
 public | employee_permissions_id_seq      | sequence | ewjosh
 public | employee_role_permissions_id_seq | sequence | ewjosh
 public | employee_statistics_id_seq       | sequence | ewjosh
 public | fba_comment_likes_id_seq         | sequence | ewjosh
 public | fba_comments_id_seq              | sequence | ewjosh
 public | fba_exchanges_id_seq             | sequence | ewjosh
 public | fba_locations_id_seq             | sequence | ewjosh
 public | fba_media_files_id_seq           | sequence | ewjosh
 public | jobs_id_seq                      | sequence | ewjosh
 public | knex_migrations_id_seq           | sequence | ewjosh
 public | knex_migrations_lock_index_seq   | sequence | ewjosh
 public | land_loads_id_seq                | sequence | ewjosh
 public | land_trucks_id_seq               | sequence | ewjosh
 public | premium_posts_id_seq             | sequence | ewjosh
 public | rentals_id_seq                   | sequence | ewjosh
 public | resumes_id_seq                   | sequence | ewjosh
 public | sales_id_seq                     | sequence | ewjosh
 public | system_config_id_seq             | sequence | ewjosh
 public | user_credits_log_id_seq          | sequence | ewjosh
 public | users_id_seq                     | sequence | ewjosh
(25 rows)

                                         Table "public.companies"
     Column     |           Type           | Collation | Nullable |                Default                
----------------+--------------------------+-----------+----------+---------------------------------------
 id             | integer                  |           | not null | nextval('companies_id_seq'::regclass)
 user_id        | integer                  |           |          | 
 name           | character varying(500)   |           | not null | 
 description    | text                     |           | not null | 
 category       | character varying(100)   |           | not null | 
 subcategory    | character varying(100)   |           | not null | 
 phone          | character varying(50)    |           | not null | 
 email          | character varying(255)   |           | not null | 
 address        | character varying(500)   |           | not null | 
 website        | character varying(255)   |           |          | 
 verified       | boolean                  |           | not null | false
 is_active      | boolean                  |           | not null | true
 is_featured    | boolean                  |           | not null | false
 views          | integer                  |           | not null | 0
 notes          | text                     |           |          | 
 services       | json                     |           |          | 
 business_hours | json                     |           |          | 
 created_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 status         | text                     |           | not null | 'active'::text
 is_premium     | boolean                  |           | not null | false
 views_count    | integer                  |           | not null | 0
 last_refreshed | timestamp with time zone |           |          | 
Indexes:
    "companies_pkey" PRIMARY KEY, btree (id)
    "companies_category_index" btree (category)
    "companies_created_at_index" btree (created_at)
    "companies_is_active_index" btree (is_active)
    "companies_is_featured_index" btree (is_featured)
    "companies_is_premium_created_at_index" btree (is_premium, created_at)
    "companies_name_index" btree (name)
    "companies_status_is_active_index" btree (status, is_active)
    "companies_subcategory_index" btree (subcategory)
    "companies_user_id_index" btree (user_id)
    "companies_verified_index" btree (verified)
Check constraints:
    "companies_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text]))
Foreign-key constraints:
    "companies_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

                                            Table "public.customers"
      Column       |            Type             | Collation | Nullable |                Default                
-------------------+-----------------------------+-----------+----------+---------------------------------------
 id                | integer                     |           | not null | nextval('customers_id_seq'::regclass)
 company_name      | character varying(255)      |           | not null | 
 wechat_group_name | character varying(255)      |           |          | 
 contact_person    | character varying(100)      |           |          | 
 contact_phone     | character varying(50)       |           |          | 
 contact_email     | character varying(255)      |           |          | 
 notes             | text                        |           |          | 
 created_by        | integer                     |           |          | 
 created_at        | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at        | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "customers_pkey" PRIMARY KEY, btree (id)
    "idx_customers_company_name" btree (company_name)
    "idx_customers_wechat_group" btree (wechat_group_name)

                                       Table "public.employee_order_comments"
   Column    |           Type           | Collation | Nullable |                       Default                       
-------------+--------------------------+-----------+----------+-----------------------------------------------------
 id          | integer                  |           | not null | nextval('employee_order_comments_id_seq'::regclass)
 order_id    | integer                  |           | not null | 
 user_id     | integer                  |           | not null | 
 comment     | text                     |           | not null | 
 is_internal | boolean                  |           | not null | true
 attachments | json                     |           |          | 
 is_deleted  | boolean                  |           | not null | false
 created_at  | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at  | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
Indexes:
    "employee_order_comments_pkey" PRIMARY KEY, btree (id)
    "employee_order_comments_order_id_created_at_index" btree (order_id, created_at)
    "employee_order_comments_user_id_index" btree (user_id)
Foreign-key constraints:
    "employee_order_comments_order_id_foreign" FOREIGN KEY (order_id) REFERENCES employee_orders(id) ON DELETE CASCADE
    "employee_order_comments_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

                                       Table "public.employee_order_logs"
   Column    |           Type           | Collation | Nullable |                     Default                     
-------------+--------------------------+-----------+----------+-------------------------------------------------
 id          | integer                  |           | not null | nextval('employee_order_logs_id_seq'::regclass)
 order_id    | integer                  |           | not null | 
 user_id     | integer                  |           | not null | 
 action_type | text                     |           | not null | 
 old_value   | character varying(500)   |           |          | 
 new_value   | character varying(500)   |           |          | 
 description | text                     |           |          | 
 changes     | json                     |           |          | 
 created_at  | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at  | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
Indexes:
    "employee_order_logs_pkey" PRIMARY KEY, btree (id)
    "employee_order_logs_action_type_index" btree (action_type)
    "employee_order_logs_order_id_created_at_index" btree (order_id, created_at)
    "employee_order_logs_user_id_index" btree (user_id)
Check constraints:
    "employee_order_logs_action_type_check" CHECK (action_type = ANY (ARRAY['created'::text, 'updated'::text, 'status_changed'::text, 'assigned'::text, 'commented'::text, 'attachment_added'::text, 'attachment_removed'::text, 'claim_requested'::text, 'claim_resolved'::text, 'order_cancelled'::text, 'order_confirmed'::text, 'order_completed'::text]))
Foreign-key constraints:
    "employee_order_logs_order_id_foreign" FOREIGN KEY (order_id) REFERENCES employee_orders(id) ON DELETE CASCADE
    "employee_order_logs_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

                                               Table "public.employee_orders"
           Column           |           Type           | Collation | Nullable |                   Default                   
----------------------------+--------------------------+-----------+----------+---------------------------------------------
 id                         | integer                  |           | not null | nextval('employee_orders_id_seq'::regclass)
 order_number               | character varying(100)   |           | not null | 
 customer_id                | integer                  |           |          | 
 customer_name              | character varying(200)   |           | not null | 
 customer_email             | character varying(200)   |           |          | 
 customer_phone             | character varying(50)    |           |          | 
 order_type                 | text                     |           | not null | 
 status                     | text                     |           | not null | 'draft'::text
 priority                   | text                     |           | not null | 'normal'::text
 cargo_description          | text                     |           | not null | 
 cargo_weight               | numeric(10,2)            |           |          | 
 cargo_volume               | numeric(10,2)            |           |          | 
 cargo_quantity             | integer                  |           |          | 
 cargo_unit                 | character varying(50)    |           |          | 
 origin_address             | character varying(500)   |           |          | 
 origin_city                | character varying(100)   |           |          | 
 origin_state               | character varying(100)   |           |          | 
 origin_country             | character varying(100)   |           |          | 
 origin_zipcode             | character varying(20)    |           |          | 
 destination_address        | character varying(500)   |           |          | 
 destination_city           | character varying(100)   |           |          | 
 destination_state          | character varying(100)   |           |          | 
 destination_country        | character varying(100)   |           |          | 
 destination_zipcode        | character varying(20)    |           |          | 
 pickup_date                | timestamp with time zone |           |          | 
 delivery_date              | timestamp with time zone |           |          | 
 estimated_delivery         | timestamp with time zone |           |          | 
 quoted_price               | numeric(12,2)            |           |          | 
 final_price                | numeric(12,2)            |           |          | 
 currency                   | character varying(10)    |           |          | 'USD'::character varying
 paid_amount                | numeric(12,2)            |           |          | '0'::numeric
 payment_status             | text                     |           |          | 'unpaid'::text
 created_by                 | integer                  |           | not null | 
 assigned_to                | integer                  |           |          | 
 updated_by                 | integer                  |           |          | 
 notes                      | text                     |           |          | 
 internal_notes             | text                     |           |          | 
 attachments                | json                     |           |          | 
 tracking_info              | json                     |           |          | 
 custom_fields              | json                     |           |          | 
 is_deleted                 | boolean                  |           | not null | false
 created_at                 | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at                 | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 quote_date                 | date                     |           |          | 
 inquiry_company            | character varying(200)   |           |          | 
 ew_quote_number            | character varying(100)   |           |          | 
 shipment_number            | character varying(100)   |           |          | 
 cargo_description_detailed | text                     |           |          | 
 weight_list                | text                     |           |          | 
 total_weight_lbs           | numeric(12,2)            |           |          | 
 dimensions_list            | text                     |           |          | 
 total_volume               | numeric(12,2)            |           |          | 
 cargo_value                | numeric(12,2)            |           |          | 
 address_type               | character varying(20)    |           |          | 'Commercial'::character varying
 ew_quote_price             | numeric(12,2)            |           |          | 
 actual_pallets             | integer                  |           |          | 
 total_dat                  | numeric(12,2)            |           |          | 
 driver_payment             | numeric(12,2)            |           |          | 
 truck_size                 | character varying(50)    |           |          | 
 platform_quote_1           | numeric(12,2)            |           |          | 
 platform_quote_2           | numeric(12,2)            |           |          | 
 pre_quote_price            | numeric(12,2)            |           |          | 
 ew_final_price             | numeric(12,2)            |           |          | 
 dat_sales_1                | numeric(12,2)            |           |          | 
 dat_sales_2                | numeric(12,2)            |           |          | 
 dat_sales_3                | numeric(12,2)            |           |          | 
 profit                     | numeric(12,2)            |           |          | 
 sub_status                 | character varying(50)    |           |          | 
 confirmed_by               | integer                  |           |          | 
 confirmed_at               | timestamp with time zone |           |          | 
 completed_by               | integer                  |           |          | 
 completed_at               | timestamp with time zone |           |          | 
 truck_payment              | numeric(12,2)            |           |          | 
 mc_number                  | character varying(50)    |           |          | 
 truck_company_name         | character varying(200)   |           |          | 
 truck_contact              | character varying(200)   |           |          | 
 cargo_type                 | character varying(100)   |           |          | 
 transport_distance         | numeric(10,2)            |           |          | 
 total_area_pallets         | numeric(10,2)            |           |          | 
 ideal_quote                | numeric(12,2)            |           |          | 
 truck_pallets              | integer                  |           |          | 
 tql_price_1                | numeric(12,2)            |           |          | 
 tql_price_2                | numeric(12,2)            |           |          | 
 other_api_price            | numeric(12,2)            |           |          | 
 quote_reference            | numeric(12,2)            |           |          | 
 quote_ref_10               | numeric(12,2)            |           |          | 
 quote_ref_20               | numeric(12,2)            |           |          | 
 quote_ref_30               | numeric(12,2)            |           |          | 
 needs_claim                | boolean                  |           |          | false
 claim_reason               | text                     |           |          | 
 claim_requested_at         | timestamp with time zone |           |          | 
 claim_requested_by         | integer                  |           |          | 
 cancelled_by               | integer                  |           |          | 
 cancelled_at               | timestamp with time zone |           |          | 
 backup_driver_1_name       | character varying(200)   |           |          | 
 backup_driver_1_phone      | character varying(50)    |           |          | 
 backup_driver_2_name       | character varying(200)   |           |          | 
 backup_driver_2_phone      | character varying(50)    |           |          | 
 backup_driver_3_name       | character varying(200)   |           |          | 
 backup_driver_3_phone      | character varying(50)    |           |          | 
Indexes:
    "employee_orders_pkey" PRIMARY KEY, btree (id)
    "employee_orders_assigned_to_status_index" btree (assigned_to, status)
    "employee_orders_confirmed_by_index" btree (confirmed_by)
    "employee_orders_created_by_created_at_index" btree (created_by, created_at)
    "employee_orders_customer_id_index" btree (customer_id)
    "employee_orders_delivery_date_index" btree (delivery_date)
    "employee_orders_ew_quote_number_index" btree (ew_quote_number)
    "employee_orders_order_number_index" btree (order_number)
    "employee_orders_order_number_unique" UNIQUE CONSTRAINT, btree (order_number)
    "employee_orders_order_type_status_index" btree (order_type, status)
    "employee_orders_pickup_date_index" btree (pickup_date)
    "employee_orders_priority_status_index" btree (priority, status)
    "employee_orders_quote_date_index" btree (quote_date)
    "employee_orders_shipment_number_index" btree (shipment_number)
    "employee_orders_status_is_deleted_index" btree (status, is_deleted)
    "employee_orders_status_sub_status_index" btree (status, sub_status)
Check constraints:
    "employee_orders_order_type_check" CHECK (order_type = ANY (ARRAY['land_freight'::text, 'sea_freight'::text, 'air_freight'::text, 'warehouse'::text, 'customs'::text, 'other'::text]))
    "employee_orders_payment_status_check" CHECK (payment_status = ANY (ARRAY['unpaid'::text, 'partial'::text, 'paid'::text, 'refunded'::text]))
    "employee_orders_priority_check" CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))
    "employee_orders_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'on_hold'::text, 'quote'::text, 'ordered'::text]))
Foreign-key constraints:
    "employee_orders_assigned_to_foreign" FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    "employee_orders_cancelled_by_foreign" FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
    "employee_orders_completed_by_foreign" FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
    "employee_orders_confirmed_by_foreign" FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
    "employee_orders_created_by_foreign" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    "employee_orders_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
    "employee_orders_updated_by_foreign" FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
Referenced by:
    TABLE "employee_order_comments" CONSTRAINT "employee_order_comments_order_id_foreign" FOREIGN KEY (order_id) REFERENCES employee_orders(id) ON DELETE CASCADE
    TABLE "employee_order_logs" CONSTRAINT "employee_order_logs_order_id_foreign" FOREIGN KEY (order_id) REFERENCES employee_orders(id) ON DELETE CASCADE

                                         Table "public.employee_permissions"
     Column      |           Type           | Collation | Nullable |                     Default                      
-----------------+--------------------------+-----------+----------+--------------------------------------------------
 id              | integer                  |           | not null | nextval('employee_permissions_id_seq'::regclass)
 permission_key  | character varying(100)   |           | not null | 
 permission_name | character varying(200)   |           | not null | 
 description     | character varying(500)   |           |          | 
 category        | text                     |           | not null | 
 created_at      | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at      | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
Indexes:
    "employee_permissions_pkey" PRIMARY KEY, btree (id)
    "employee_permissions_category_index" btree (category)
    "employee_permissions_permission_key_unique" UNIQUE CONSTRAINT, btree (permission_key)
Check constraints:
    "employee_permissions_category_check" CHECK (category = ANY (ARRAY['order'::text, 'customer'::text, 'employee'::text, 'report'::text, 'system'::text]))
Referenced by:
    TABLE "employee_role_permissions" CONSTRAINT "employee_role_permissions_permission_id_foreign" FOREIGN KEY (permission_id) REFERENCES employee_permissions(id) ON DELETE CASCADE

                                        Table "public.employee_role_permissions"
    Column     |           Type           | Collation | Nullable |                        Default                        
---------------+--------------------------+-----------+----------+-------------------------------------------------------
 id            | integer                  |           | not null | nextval('employee_role_permissions_id_seq'::regclass)
 role          | text                     |           | not null | 
 permission_id | integer                  |           | not null | 
 created_at    | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at    | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
Indexes:
    "employee_role_permissions_pkey" PRIMARY KEY, btree (id)
    "employee_role_permissions_role_index" btree (role)
    "employee_role_permissions_role_permission_id_unique" UNIQUE CONSTRAINT, btree (role, permission_id)
Check constraints:
    "employee_role_permissions_role_check" CHECK (role = ANY (ARRAY['employee'::text, 'manager'::text, 'admin'::text]))
Foreign-key constraints:
    "employee_role_permissions_permission_id_foreign" FOREIGN KEY (permission_id) REFERENCES employee_permissions(id) ON DELETE CASCADE

                                          Table "public.employee_statistics"
      Column      |           Type           | Collation | Nullable |                     Default                     
------------------+--------------------------+-----------+----------+-------------------------------------------------
 id               | integer                  |           | not null | nextval('employee_statistics_id_seq'::regclass)
 employee_id      | integer                  |           | not null | 
 stat_date        | date                     |           | not null | 
 orders_created   | integer                  |           | not null | 0
 orders_completed | integer                  |           | not null | 0
 orders_cancelled | integer                  |           | not null | 0
 total_revenue    | numeric(12,2)            |           |          | '0'::numeric
 created_at       | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at       | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
Indexes:
    "employee_statistics_pkey" PRIMARY KEY, btree (id)
    "employee_statistics_employee_id_stat_date_index" btree (employee_id, stat_date)
    "employee_statistics_employee_id_stat_date_unique" UNIQUE CONSTRAINT, btree (employee_id, stat_date)
    "employee_statistics_stat_date_index" btree (stat_date)
Foreign-key constraints:
    "employee_statistics_employee_id_foreign" FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE

                                        Table "public.fba_comment_likes"
   Column   |            Type             | Collation | Nullable |                    Default                    
------------+-----------------------------+-----------+----------+-----------------------------------------------
 id         | integer                     |           | not null | nextval('fba_comment_likes_id_seq'::regclass)
 comment_id | integer                     |           | not null | 
 user_id    | integer                     |           | not null | 
 created_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "fba_comment_likes_pkey" PRIMARY KEY, btree (id)
    "fba_comment_likes_comment_id_user_id_key" UNIQUE CONSTRAINT, btree (comment_id, user_id)
Foreign-key constraints:
    "fba_comment_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES fba_comments(id)
    "fba_comment_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)

                                           Table "public.fba_comments"
     Column      |            Type             | Collation | Nullable |                 Default                  
-----------------+-----------------------------+-----------+----------+------------------------------------------
 id              | integer                     |           | not null | nextval('fba_comments_id_seq'::regclass)
 fba_location_id | character varying(20)       |           | not null | 
 user_id         | integer                     |           | not null | 
 parent_id       | integer                     |           |          | 
 content         | text                        |           | not null | 
 is_deleted      | boolean                     |           |          | false
 created_at      | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at      | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "fba_comments_pkey" PRIMARY KEY, btree (id)
    "idx_fba_comments_created" btree (created_at)
    "idx_fba_comments_deleted" btree (is_deleted)
    "idx_fba_comments_location" btree (fba_location_id)
    "idx_fba_comments_parent" btree (parent_id)
    "idx_fba_comments_user" btree (user_id)
Foreign-key constraints:
    "fba_comments_fba_location_id_fkey" FOREIGN KEY (fba_location_id) REFERENCES fba_locations(code)
    "fba_comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES fba_comments(id)
    "fba_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
Referenced by:
    TABLE "fba_comment_likes" CONSTRAINT "fba_comment_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES fba_comments(id)
    TABLE "fba_comments" CONSTRAINT "fba_comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES fba_comments(id)
    TABLE "fba_media_files" CONSTRAINT "fba_media_files_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES fba_comments(id)

                                           Table "public.fba_exchanges"
      Column      |            Type             | Collation | Nullable |                  Default                  
------------------+-----------------------------+-----------+----------+-------------------------------------------
 id               | integer                     |           | not null | nextval('fba_exchanges_id_seq'::regclass)
 user_id          | integer                     |           | not null | 
 fba_location_id  | integer                     |           |          | 
 fba_code         | character varying(50)       |           | not null | 
 exchange_type    | character varying(20)       |           | not null | 
 cargo_type       | character varying(20)       |           | not null | 
 pricing_strategy | character varying(20)       |           |          | '市价'::character varying
 appointment_date | date                        |           | not null | 
 appointment_time | time without time zone      |           | not null | 
 time_zone        | character varying(10)       |           |          | 'PDT'::character varying
 contact_person   | character varying(100)      |           | not null | 
 contact_phone    | character varying(20)       |           | not null | 
 user_phone       | character varying(20)       |           |          | 
 company_name     | character varying(200)      |           |          | 
 description      | text                        |           |          | ''::text
 status           | character varying(20)       |           |          | 'active'::character varying
 view_count       | integer                     |           |          | 0
 created_at       | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at       | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 is_urgent        | boolean                     |           | not null | false
 expires_at       | timestamp without time zone |           |          | 
Indexes:
    "fba_exchanges_pkey" PRIMARY KEY, btree (id)
Check constraints:
    "fba_exchanges_cargo_type_check" CHECK (cargo_type::text = ANY (ARRAY['地板'::character varying, '卡板'::character varying]::text[]))
    "fba_exchanges_exchange_type_check" CHECK (exchange_type::text = ANY (ARRAY['出让预约'::character varying, '寻求预约'::character varying]::text[]))
    "fba_exchanges_pricing_strategy_check" CHECK (pricing_strategy::text = ANY (ARRAY['急需'::character varying::text, '好价'::character varying::text, '市价'::character varying::text, '普通'::character varying::text]))
    "fba_exchanges_status_check" CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'completed'::character varying]::text[]))

                                         Table "public.fba_locations"
   Column    |            Type             | Collation | Nullable |                  Default                  
-------------+-----------------------------+-----------+----------+-------------------------------------------
 id          | integer                     |           | not null | nextval('fba_locations_id_seq'::regclass)
 code        | character varying(20)       |           | not null | 
 name        | character varying(255)      |           | not null | 
 address     | text                        |           | not null | 
 city        | character varying(100)      |           |          | 
 state       | character varying(100)      |           |          | 
 zip_code    | character varying(20)       |           |          | 
 country     | character varying(100)      |           |          | 'United States'::character varying
 type        | character varying(50)       |           |          | 
 description | text                        |           |          | 
 is_active   | boolean                     |           |          | true
 created_at  | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 updated_at  | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "fba_locations_pkey" PRIMARY KEY, btree (id)
    "fba_locations_code_key" UNIQUE CONSTRAINT, btree (code)
    "idx_fba_locations_city" btree (city)
    "idx_fba_locations_code" btree (code)
    "idx_fba_locations_is_active" btree (is_active)
    "idx_fba_locations_state" btree (state)
    "idx_fba_locations_type" btree (type)
Referenced by:
    TABLE "fba_comments" CONSTRAINT "fba_comments_fba_location_id_fkey" FOREIGN KEY (fba_location_id) REFERENCES fba_locations(code)

                                        Table "public.fba_media_files"
   Column   |            Type             | Collation | Nullable |                   Default                   
------------+-----------------------------+-----------+----------+---------------------------------------------
 id         | integer                     |           | not null | nextval('fba_media_files_id_seq'::regclass)
 comment_id | integer                     |           | not null | 
 file_name  | character varying(255)      |           | not null | 
 file_url   | character varying(500)      |           | not null | 
 file_type  | character varying(100)      |           | not null | 
 file_size  | integer                     |           |          | 
 created_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "fba_media_files_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "fba_media_files_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES fba_comments(id)

                                         Table "public.jobs"
     Column     |           Type           | Collation | Nullable |             Default              
----------------+--------------------------+-----------+----------+----------------------------------
 id             | integer                  |           | not null | nextval('jobs_id_seq'::regclass)
 user_id        | integer                  |           |          | 
 title          | character varying(255)   |           | not null | 
 category       | character varying(100)   |           | not null | 
 company        | character varying(255)   |           | not null | 
 location       | character varying(100)   |           | not null | 
 salary         | character varying(100)   |           | not null | 
 work_type      | character varying(50)    |           | not null | 
 experience     | character varying(50)    |           | not null | 
 description    | text                     |           | not null | 
 contact_phone  | character varying(50)    |           |          | 
 contact_email  | character varying(255)   |           |          | 
 contact_person | character varying(100)   |           |          | 
 views          | integer                  |           | not null | 0
 is_active      | boolean                  |           | not null | true
 is_featured    | boolean                  |           | not null | false
 created_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 status         | text                     |           | not null | 'active'::text
 is_premium     | boolean                  |           | not null | false
 views_count    | integer                  |           | not null | 0
 last_refreshed | timestamp with time zone |           |          | 
Indexes:
    "jobs_pkey" PRIMARY KEY, btree (id)
    "jobs_category_index" btree (category)
    "jobs_created_at_index" btree (created_at)
    "jobs_is_active_index" btree (is_active)
    "jobs_is_premium_created_at_index" btree (is_premium, created_at)
    "jobs_location_index" btree (location)
    "jobs_status_is_active_index" btree (status, is_active)
    "jobs_work_type_index" btree (work_type)
Check constraints:
    "jobs_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'filled'::text, 'cancelled'::text]))
Foreign-key constraints:
    "jobs_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL

                                         Table "public.knex_migrations"
     Column     |           Type           | Collation | Nullable |                   Default                   
----------------+--------------------------+-----------+----------+---------------------------------------------
 id             | integer                  |           | not null | nextval('knex_migrations_id_seq'::regclass)
 name           | character varying(255)   |           |          | 
 batch          | integer                  |           |          | 
 migration_time | timestamp with time zone |           |          | 
Indexes:
    "knex_migrations_pkey" PRIMARY KEY, btree (id)

                               Table "public.knex_migrations_lock"
  Column   |  Type   | Collation | Nullable |                       Default                       
-----------+---------+-----------+----------+-----------------------------------------------------
 index     | integer |           | not null | nextval('knex_migrations_lock_index_seq'::regclass)
 is_locked | integer |           |          | 
Indexes:
    "knex_migrations_lock_pkey" PRIMARY KEY, btree (index)

                                            Table "public.land_loads"
        Column        |           Type           | Collation | Nullable |                Default                 
----------------------+--------------------------+-----------+----------+----------------------------------------
 id                   | integer                  |           | not null | nextval('land_loads_id_seq'::regclass)
 user_id              | integer                  |           | not null | 
 origin               | character varying(500)   |           | not null | 
 destination          | character varying(500)   |           | not null | 
 origin_display       | character varying(500)   |           |          | 
 destination_display  | character varying(500)   |           |          | 
 distance_info        | json                     |           |          | 
 pickup_date          | date                     |           | not null | 
 delivery_date        | date                     |           |          | 
 weight               | character varying(100)   |           | not null | 
 commodity            | character varying(255)   |           |          | 
 cargo_value          | character varying(100)   |           |          | 
 pallets              | integer                  |           |          | 
 freight_class        | character varying(50)    |           |          | 
 service_type         | text                     |           | not null | 
 truck_type           | character varying(255)   |           |          | 
 equipment            | character varying(255)   |           |          | 
 rate                 | character varying(100)   |           |          | 
 max_rate             | character varying(100)   |           |          | 
 company_name         | character varying(255)   |           |          | 
 contact_phone        | character varying(50)    |           |          | 
 contact_email        | character varying(255)   |           |          | 
 ewid                 | character varying(100)   |           |          | 
 shipping_number      | character varying(255)   |           |          | 
 notes                | text                     |           |          | 
 special_requirements | text                     |           |          | 
 rating               | numeric(3,2)             |           | not null | '0'::numeric
 is_active            | boolean                  |           | not null | true
 created_at           | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at           | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 status               | text                     |           | not null | 'active'::text
 is_premium           | boolean                  |           | not null | false
 views_count          | integer                  |           | not null | 0
 last_refreshed       | timestamp with time zone |           |          | 
Indexes:
    "land_loads_pkey" PRIMARY KEY, btree (id)
    "land_loads_destination_index" btree (destination)
    "land_loads_ewid_index" btree (ewid)
    "land_loads_ewid_unique" UNIQUE CONSTRAINT, btree (ewid)
    "land_loads_is_active_index" btree (is_active)
    "land_loads_is_premium_created_at_index" btree (is_premium, created_at)
    "land_loads_origin_index" btree (origin)
    "land_loads_pickup_date_index" btree (pickup_date)
    "land_loads_service_type_index" btree (service_type)
    "land_loads_status_is_active_index" btree (status, is_active)
    "land_loads_user_id_index" btree (user_id)
Check constraints:
    "land_loads_service_type_check" CHECK (service_type = ANY (ARRAY['FTL'::text, 'LTL'::text]))
    "land_loads_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text, 'cancelled'::text]))
Foreign-key constraints:
    "land_loads_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

                                            Table "public.land_trucks"
        Column         |           Type           | Collation | Nullable |                 Default                 
-----------------------+--------------------------+-----------+----------+-----------------------------------------
 id                    | integer                  |           | not null | nextval('land_trucks_id_seq'::regclass)
 user_id               | integer                  |           | not null | 
 current_location      | character varying(500)   |           | not null | 
 preferred_destination | character varying(500)   |           |          | 
 preferred_origin      | character varying(500)   |           |          | 
 available_date        | date                     |           | not null | 
 truck_type            | character varying(255)   |           | not null | 
 equipment             | character varying(255)   |           |          | 
 capacity              | character varying(100)   |           | not null | 
 length                | character varying(100)   |           |          | 
 volume                | character varying(100)   |           |          | 
 truck_features        | character varying(500)   |           |          | 
 driver_license        | character varying(100)   |           |          | 
 service_type          | text                     |           | not null | 
 rate_range            | character varying(100)   |           |          | 
 rate                  | character varying(100)   |           |          | 
 company_name          | character varying(255)   |           |          | 
 contact_name          | character varying(100)   |           |          | 
 contact_phone         | character varying(50)    |           |          | 
 contact_email         | character varying(255)   |           |          | 
 ewid                  | character varying(100)   |           |          | 
 notes                 | text                     |           |          | 
 rating                | numeric(3,2)             |           | not null | '0'::numeric
 is_active             | boolean                  |           | not null | true
 created_at            | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at            | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 status                | text                     |           | not null | 'active'::text
 is_premium            | boolean                  |           | not null | false
 views_count           | integer                  |           | not null | 0
 last_refreshed        | timestamp with time zone |           |          | 
Indexes:
    "land_trucks_pkey" PRIMARY KEY, btree (id)
    "land_trucks_available_date_index" btree (available_date)
    "land_trucks_current_location_index" btree (current_location)
    "land_trucks_ewid_index" btree (ewid)
    "land_trucks_ewid_unique" UNIQUE CONSTRAINT, btree (ewid)
    "land_trucks_is_active_index" btree (is_active)
    "land_trucks_is_premium_created_at_index" btree (is_premium, created_at)
    "land_trucks_preferred_destination_index" btree (preferred_destination)
    "land_trucks_service_type_index" btree (service_type)
    "land_trucks_status_is_active_index" btree (status, is_active)
    "land_trucks_user_id_index" btree (user_id)
Check constraints:
    "land_trucks_service_type_check" CHECK (service_type = ANY (ARRAY['FTL'::text, 'LTL'::text]))
    "land_trucks_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text, 'cancelled'::text]))
Foreign-key constraints:
    "land_trucks_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

                                        Table "public.premium_posts"
    Column    |           Type           | Collation | Nullable |                  Default                  
--------------+--------------------------+-----------+----------+-------------------------------------------
 id           | integer                  |           | not null | nextval('premium_posts_id_seq'::regclass)
 user_id      | integer                  |           | not null | 
 post_type    | text                     |           | not null | 
 post_id      | integer                  |           | not null | 
 premium_type | text                     |           | not null | 
 credits_cost | integer                  |           | not null | 
 start_time   | timestamp with time zone |           | not null | 
 end_time     | timestamp with time zone |           | not null | 
 is_active    | boolean                  |           | not null | true
 created_at   | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at   | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
Indexes:
    "premium_posts_pkey" PRIMARY KEY, btree (id)
    "premium_posts_end_time_index" btree (end_time)
    "premium_posts_post_type_post_id_index" btree (post_type, post_id)
    "premium_posts_premium_type_is_active_index" btree (premium_type, is_active)
    "unique_premium_post" UNIQUE CONSTRAINT, btree (post_type, post_id, premium_type, start_time)
Check constraints:
    "premium_posts_post_type_check" CHECK (post_type = ANY (ARRAY['load'::text, 'truck'::text, 'company'::text, 'job'::text, 'resume'::text]))
    "premium_posts_premium_type_check" CHECK (premium_type = ANY (ARRAY['top'::text, 'highlight'::text, 'urgent'::text]))
Foreign-key constraints:
    "premium_posts_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

                                         Table "public.rentals"
     Column     |           Type           | Collation | Nullable |               Default               
----------------+--------------------------+-----------+----------+-------------------------------------
 id             | integer                  |           | not null | nextval('rentals_id_seq'::regclass)
 user_id        | integer                  |           |          | 
 title          | character varying(255)   |           | not null | 
 category       | character varying(100)   |           | not null | 
 brand          | character varying(255)   |           |          | 
 sub_category   | character varying(100)   |           |          | 
 location       | character varying(100)   |           | not null | 
 price          | character varying(100)   |           | not null | 
 condition      | character varying(50)    |           | not null | 
 description    | text                     |           | not null | 
 specifications | text                     |           |          | 
 images         | text                     |           |          | 
 contact_phone  | character varying(50)    |           |          | 
 contact_email  | character varying(255)   |           |          | 
 contact_person | character varying(100)   |           |          | 
 rental_period  | character varying(50)    |           |          | 
 views          | integer                  |           | not null | 0
 is_active      | boolean                  |           | not null | true
 is_featured    | boolean                  |           | not null | false
 created_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 company        | character varying(255)   |           |          | 
Indexes:
    "rentals_pkey" PRIMARY KEY, btree (id)
    "idx_rentals_company" btree (company)
    "rentals_condition_index" btree (condition)
    "rentals_created_at_index" btree (created_at)
    "rentals_is_active_index" btree (is_active)
    "rentals_location_index" btree (location)
    "rentals_rental_period_index" btree (rental_period)
    "rentals_sub_category_index" btree (sub_category)
Foreign-key constraints:
    "rentals_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL

                                            Table "public.resumes"
        Column        |           Type           | Collation | Nullable |               Default               
----------------------+--------------------------+-----------+----------+-------------------------------------
 id                   | integer                  |           | not null | nextval('resumes_id_seq'::regclass)
 user_id              | integer                  |           |          | 
 name                 | character varying(100)   |           | not null | 
 position             | character varying(100)   |           | not null | 
 experience           | character varying(50)    |           | not null | 
 location             | character varying(100)   |           | not null | 
 phone                | character varying(50)    |           | not null | 
 email                | character varying(255)   |           | not null | 
 skills               | text                     |           | not null | 
 summary              | text                     |           |          | 
 expected_salary      | character varying(100)   |           |          | 
 work_type_preference | character varying(50)    |           |          | 
 views                | integer                  |           | not null | 0
 is_active            | boolean                  |           | not null | true
 is_featured          | boolean                  |           | not null | false
 created_at           | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at           | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 status               | text                     |           | not null | 'active'::text
 is_premium           | boolean                  |           | not null | false
 views_count          | integer                  |           | not null | 0
 last_refreshed       | timestamp with time zone |           |          | 
Indexes:
    "resumes_pkey" PRIMARY KEY, btree (id)
    "resumes_created_at_index" btree (created_at)
    "resumes_experience_index" btree (experience)
    "resumes_is_active_index" btree (is_active)
    "resumes_is_premium_created_at_index" btree (is_premium, created_at)
    "resumes_location_index" btree (location)
    "resumes_position_index" btree ("position")
    "resumes_status_is_active_index" btree (status, is_active)
Check constraints:
    "resumes_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'hired'::text]))
Foreign-key constraints:
    "resumes_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL

                                         Table "public.sales"
     Column     |           Type           | Collation | Nullable |              Default              
----------------+--------------------------+-----------+----------+-----------------------------------
 id             | integer                  |           | not null | nextval('sales_id_seq'::regclass)
 user_id        | integer                  |           |          | 
 title          | character varying(255)   |           | not null | 
 category       | character varying(100)   |           | not null | 
 brand          | character varying(255)   |           |          | 
 sub_category   | character varying(100)   |           |          | 
 location       | character varying(100)   |           | not null | 
 price          | character varying(100)   |           | not null | 
 condition      | character varying(50)    |           | not null | 
 description    | text                     |           | not null | 
 specifications | text                     |           |          | 
 images         | text                     |           |          | 
 contact_phone  | character varying(50)    |           |          | 
 contact_email  | character varying(255)   |           |          | 
 contact_person | character varying(100)   |           |          | 
 views          | integer                  |           | not null | 0
 is_active      | boolean                  |           | not null | true
 is_featured    | boolean                  |           | not null | false
 created_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 company        | character varying(255)   |           |          | 
Indexes:
    "sales_pkey" PRIMARY KEY, btree (id)
    "idx_sales_brand" btree (brand)
    "idx_sales_category" btree (category)
    "idx_sales_company" btree (company)
    "sales_condition_index" btree (condition)
    "sales_created_at_index" btree (created_at)
    "sales_is_active_index" btree (is_active)
    "sales_location_index" btree (location)
    "sales_sub_category_index" btree (sub_category)
Foreign-key constraints:
    "sales_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    "sales_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL

                                        Table "public.system_config"
    Column    |           Type           | Collation | Nullable |                  Default                  
--------------+--------------------------+-----------+----------+-------------------------------------------
 id           | integer                  |           | not null | nextval('system_config_id_seq'::regclass)
 config_key   | character varying(100)   |           | not null | 
 config_value | text                     |           | not null | 
 description  | character varying(500)   |           |          | 
 data_type    | text                     |           |          | 'string'::text
 created_at   | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at   | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
Indexes:
    "system_config_pkey" PRIMARY KEY, btree (id)
    "system_config_config_key_index" btree (config_key)
    "system_config_config_key_unique" UNIQUE CONSTRAINT, btree (config_key)
Check constraints:
    "system_config_data_type_check" CHECK (data_type = ANY (ARRAY['string'::text, 'number'::text, 'boolean'::text, 'json'::text]))

                                         Table "public.user_credits_log"
     Column     |           Type           | Collation | Nullable |                   Default                    
----------------+--------------------------+-----------+----------+----------------------------------------------
 id             | integer                  |           | not null | nextval('user_credits_log_id_seq'::regclass)
 user_id        | integer                  |           | not null | 
 type           | text                     |           | not null | 
 amount         | integer                  |           | not null | 
 balance_after  | integer                  |           | not null | 
 description    | character varying(500)   |           |          | 
 reference_type | character varying(50)    |           |          | 
 reference_id   | integer                  |           |          | 
 created_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at     | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
Indexes:
    "user_credits_log_pkey" PRIMARY KEY, btree (id)
    "user_credits_log_reference_type_reference_id_index" btree (reference_type, reference_id)
    "user_credits_log_type_index" btree (type)
    "user_credits_log_user_id_created_at_index" btree (user_id, created_at)
Check constraints:
    "user_credits_log_type_check" CHECK (type = ANY (ARRAY['earn'::text, 'spend'::text, 'refund'::text, 'admin_adjust'::text]))
Foreign-key constraints:
    "user_credits_log_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

                                            Table "public.users"
        Column        |           Type           | Collation | Nullable |              Default              
----------------------+--------------------------+-----------+----------+-----------------------------------
 id                   | integer                  |           | not null | nextval('users_id_seq'::regclass)
 email                | character varying(255)   |           | not null | 
 password             | character varying(255)   |           |          | 
 first_name           | character varying(100)   |           |          | 
 last_name            | character varying(100)   |           |          | 
 phone                | character varying(50)    |           |          | 
 user_type            | text                     |           | not null | 'shipper'::text
 company_name         | character varying(255)   |           |          | 
 company_type         | character varying(100)   |           |          | 
 address              | character varying(500)   |           |          | 
 city                 | character varying(100)   |           |          | 
 state                | character varying(100)   |           |          | 
 zip_code             | character varying(20)    |           |          | 
 business_license     | character varying(100)   |           |          | 
 mc_number            | character varying(50)    |           |          | 
 dot_number           | character varying(50)    |           |          | 
 is_active            | boolean                  |           | not null | true
 is_verified          | boolean                  |           | not null | false
 last_login_at        | timestamp with time zone |           |          | 
 created_at           | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 updated_at           | timestamp with time zone |           | not null | CURRENT_TIMESTAMP
 credits              | integer                  |           | not null | 100
 total_credits_earned | integer                  |           | not null | 100
 total_credits_spent  | integer                  |           | not null | 0
 cognito_sub          | character varying(255)   |           |          | 
 is_employee          | boolean                  |           | not null | false
 employee_role        | text                     |           |          | 
 employee_id          | character varying(50)    |           |          | 
 employee_since       | timestamp with time zone |           |          | 
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_cognito_sub_index" btree (cognito_sub)
    "users_cognito_sub_unique" UNIQUE CONSTRAINT, btree (cognito_sub)
    "users_email_unique" UNIQUE CONSTRAINT, btree (email)
    "users_employee_id_unique" UNIQUE CONSTRAINT, btree (employee_id)
    "users_is_active_index" btree (is_active)
    "users_user_type_index" btree (user_type)
Check constraints:
    "users_employee_role_check" CHECK (employee_role = ANY (ARRAY['employee'::text, 'manager'::text, 'admin'::text]))
Referenced by:
    TABLE "companies" CONSTRAINT "companies_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "employee_order_comments" CONSTRAINT "employee_order_comments_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "employee_order_logs" CONSTRAINT "employee_order_logs_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "employee_orders" CONSTRAINT "employee_orders_assigned_to_foreign" FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    TABLE "employee_orders" CONSTRAINT "employee_orders_cancelled_by_foreign" FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
    TABLE "employee_orders" CONSTRAINT "employee_orders_completed_by_foreign" FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
    TABLE "employee_orders" CONSTRAINT "employee_orders_confirmed_by_foreign" FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
    TABLE "employee_orders" CONSTRAINT "employee_orders_created_by_foreign" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    TABLE "employee_orders" CONSTRAINT "employee_orders_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
    TABLE "employee_orders" CONSTRAINT "employee_orders_updated_by_foreign" FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    TABLE "employee_statistics" CONSTRAINT "employee_statistics_employee_id_foreign" FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "fba_comment_likes" CONSTRAINT "fba_comment_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
    TABLE "fba_comments" CONSTRAINT "fba_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
    TABLE "jobs" CONSTRAINT "jobs_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    TABLE "land_loads" CONSTRAINT "land_loads_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "land_trucks" CONSTRAINT "land_trucks_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "premium_posts" CONSTRAINT "premium_posts_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "rentals" CONSTRAINT "rentals_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    TABLE "resumes" CONSTRAINT "resumes_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    TABLE "sales" CONSTRAINT "sales_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    TABLE "sales" CONSTRAINT "sales_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    TABLE "user_credits_log" CONSTRAINT "user_credits_log_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

                       Table "public.users_backup_20251003"
        Column        |           Type           | Collation | Nullable | Default 
----------------------+--------------------------+-----------+----------+---------
 id                   | integer                  |           |          | 
 email                | character varying(255)   |           |          | 
 password             | character varying(255)   |           |          | 
 first_name           | character varying(100)   |           |          | 
 last_name            | character varying(100)   |           |          | 
 phone                | character varying(50)    |           |          | 
 user_type            | text                     |           |          | 
 company_name         | character varying(255)   |           |          | 
 company_type         | character varying(100)   |           |          | 
 address              | character varying(500)   |           |          | 
 city                 | character varying(100)   |           |          | 
 state                | character varying(100)   |           |          | 
 zip_code             | character varying(20)    |           |          | 
 business_license     | character varying(100)   |           |          | 
 mc_number            | character varying(50)    |           |          | 
 dot_number           | character varying(50)    |           |          | 
 is_active            | boolean                  |           |          | 
 is_verified          | boolean                  |           |          | 
 last_login_at        | timestamp with time zone |           |          | 
 created_at           | timestamp with time zone |           |          | 
 updated_at           | timestamp with time zone |           |          | 
 credits              | integer                  |           |          | 
 total_credits_earned | integer                  |           |          | 
 total_credits_spent  | integer                  |           |          | 
 cognito_sub          | character varying(255)   |           |          | 

