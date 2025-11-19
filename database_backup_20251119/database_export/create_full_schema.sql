-- ============================================
-- EW Logistics 完整数据库结构
-- 包含序列、表、约束等
-- ============================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ============================================
-- 第一步：创建所有序列
-- ============================================

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

-- ============================================
-- 第二步：创建所有表
-- ============================================



-- 表: companies
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER NOT NULL DEFAULT nextval('companies_id_seq'::regclass),
    user_id INTEGER,
    name VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    website VARCHAR(255),
    verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    views INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    services JSON,
    business_hours JSON,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active'::text,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    views_count INTEGER NOT NULL DEFAULT 0,
    last_refreshed TIMESTAMP WITH TIME ZONE
);


-- 表: customers
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
    company_name VARCHAR(255) NOT NULL,
    wechat_group_name VARCHAR(255),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 表: employee_order_comments
CREATE TABLE IF NOT EXISTS employee_order_comments (
    id INTEGER NOT NULL DEFAULT nextval('employee_order_comments_id_seq'::regclass),
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT true,
    attachments JSON,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 表: employee_order_logs
CREATE TABLE IF NOT EXISTS employee_order_logs (
    id INTEGER NOT NULL DEFAULT nextval('employee_order_logs_id_seq'::regclass),
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    old_value VARCHAR(500),
    new_value VARCHAR(500),
    description TEXT,
    changes JSON,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 表: employee_orders
CREATE TABLE IF NOT EXISTS employee_orders (
    id INTEGER NOT NULL DEFAULT nextval('employee_orders_id_seq'::regclass),
    order_number VARCHAR(100) NOT NULL,
    customer_id INTEGER,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(200),
    customer_phone VARCHAR(50),
    order_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'::text,
    priority TEXT NOT NULL DEFAULT 'normal'::text,
    cargo_description TEXT NOT NULL,
    cargo_weight NUMERIC(10,2),
    cargo_volume NUMERIC(10,2),
    cargo_quantity INTEGER,
    cargo_unit VARCHAR(50),
    origin_address VARCHAR(500),
    origin_city VARCHAR(100),
    origin_state VARCHAR(100),
    origin_country VARCHAR(100),
    origin_zipcode VARCHAR(20),
    destination_address VARCHAR(500),
    destination_city VARCHAR(100),
    destination_state VARCHAR(100),
    destination_country VARCHAR(100),
    destination_zipcode VARCHAR(20),
    pickup_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    quoted_price NUMERIC(12,2),
    final_price NUMERIC(12,2),
    currency VARCHAR(10) DEFAULT 'USD'::character varying,
    paid_amount NUMERIC(12,2) DEFAULT '0'::numeric,
    payment_status TEXT DEFAULT 'unpaid'::text,
    created_by INTEGER NOT NULL,
    assigned_to INTEGER,
    updated_by INTEGER,
    notes TEXT,
    internal_notes TEXT,
    attachments JSON,
    tracking_info JSON,
    custom_fields JSON,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quote_date DATE,
    inquiry_company VARCHAR(200),
    ew_quote_number VARCHAR(100),
    shipment_number VARCHAR(100),
    cargo_description_detailed TEXT,
    weight_list TEXT,
    total_weight_lbs NUMERIC(12,2),
    dimensions_list TEXT,
    total_volume NUMERIC(12,2),
    cargo_value NUMERIC(12,2),
    address_type VARCHAR(20) DEFAULT 'Commercial'::character varying,
    ew_quote_price NUMERIC(12,2),
    actual_pallets INTEGER,
    total_dat NUMERIC(12,2),
    driver_payment NUMERIC(12,2),
    truck_size VARCHAR(50),
    platform_quote_1 NUMERIC(12,2),
    platform_quote_2 NUMERIC(12,2),
    pre_quote_price NUMERIC(12,2),
    ew_final_price NUMERIC(12,2),
    dat_sales_1 NUMERIC(12,2),
    dat_sales_2 NUMERIC(12,2),
    dat_sales_3 NUMERIC(12,2),
    profit NUMERIC(12,2),
    sub_status VARCHAR(50),
    confirmed_by INTEGER,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_by INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    truck_payment NUMERIC(12,2),
    mc_number VARCHAR(50),
    truck_company_name VARCHAR(200),
    truck_contact VARCHAR(200),
    cargo_type VARCHAR(100),
    transport_distance NUMERIC(10,2),
    total_area_pallets NUMERIC(10,2),
    ideal_quote NUMERIC(12,2),
    truck_pallets INTEGER,
    tql_price_1 NUMERIC(12,2),
    tql_price_2 NUMERIC(12,2),
    other_api_price NUMERIC(12,2),
    quote_reference NUMERIC(12,2),
    quote_ref_10 NUMERIC(12,2),
    quote_ref_20 NUMERIC(12,2),
    quote_ref_30 NUMERIC(12,2),
    needs_claim BOOLEAN DEFAULT false,
    claim_reason TEXT,
    claim_requested_at TIMESTAMP WITH TIME ZONE,
    claim_requested_by INTEGER,
    cancelled_by INTEGER,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    backup_driver_1_name VARCHAR(200),
    backup_driver_1_phone VARCHAR(50),
    backup_driver_2_name VARCHAR(200),
    backup_driver_2_phone VARCHAR(50),
    backup_driver_3_name VARCHAR(200),
    backup_driver_3_phone VARCHAR(50)
);


-- 表: employee_permissions
CREATE TABLE IF NOT EXISTS employee_permissions (
    id INTEGER NOT NULL DEFAULT nextval('employee_permissions_id_seq'::regclass),
    permission_key VARCHAR(100) NOT NULL,
    permission_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 表: employee_role_permissions
CREATE TABLE IF NOT EXISTS employee_role_permissions (
    id INTEGER NOT NULL DEFAULT nextval('employee_role_permissions_id_seq'::regclass),
    role TEXT NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 表: employee_statistics
CREATE TABLE IF NOT EXISTS employee_statistics (
    id INTEGER NOT NULL DEFAULT nextval('employee_statistics_id_seq'::regclass),
    employee_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,
    orders_created INTEGER NOT NULL DEFAULT 0,
    orders_completed INTEGER NOT NULL DEFAULT 0,
    orders_cancelled INTEGER NOT NULL DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT '0'::numeric,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 表: fba_comment_likes
CREATE TABLE IF NOT EXISTS fba_comment_likes (
    id INTEGER NOT NULL DEFAULT nextval('fba_comment_likes_id_seq'::regclass),
    comment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 表: fba_comments
CREATE TABLE IF NOT EXISTS fba_comments (
    id INTEGER NOT NULL DEFAULT nextval('fba_comments_id_seq'::regclass),
    fba_location_id VARCHAR(20) NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 表: fba_exchanges
CREATE TABLE IF NOT EXISTS fba_exchanges (
    id INTEGER NOT NULL DEFAULT nextval('fba_exchanges_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    fba_location_id INTEGER,
    fba_code VARCHAR(50) NOT NULL,
    exchange_type VARCHAR(20) NOT NULL,
    cargo_type VARCHAR(20) NOT NULL,
    pricing_strategy VARCHAR(20) DEFAULT '市价'::character varying,
    appointment_date DATE NOT NULL,
    appointment_time TIME WITHOUT TIME ZONE NOT NULL,
    time_zone VARCHAR(10) DEFAULT 'PDT'::character varying,
    contact_person VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    user_phone VARCHAR(20),
    company_name VARCHAR(200),
    description TEXT DEFAULT ''::text,
    status VARCHAR(20) DEFAULT 'active'::character varying,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_urgent BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITHOUT TIME ZONE
);


-- 表: fba_locations
CREATE TABLE IF NOT EXISTS fba_locations (
    id INTEGER NOT NULL DEFAULT nextval('fba_locations_id_seq'::regclass),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States'::character varying,
    type VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 表: fba_media_files
CREATE TABLE IF NOT EXISTS fba_media_files (
    id INTEGER NOT NULL DEFAULT nextval('fba_media_files_id_seq'::regclass),
    comment_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 表: jobs
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER NOT NULL DEFAULT nextval('jobs_id_seq'::regclass),
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    salary VARCHAR(100) NOT NULL,
    work_type VARCHAR(50) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_person VARCHAR(100),
    views INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active'::text,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    views_count INTEGER NOT NULL DEFAULT 0,
    last_refreshed TIMESTAMP WITH TIME ZONE
);


-- 表: knex_migrations
CREATE TABLE IF NOT EXISTS knex_migrations (
    id INTEGER NOT NULL DEFAULT nextval('knex_migrations_id_seq'::regclass),
    name VARCHAR(255),
    batch INTEGER,
    migration_time TIMESTAMP WITH TIME ZONE
);


-- 表: knex_migrations_lock
CREATE TABLE IF NOT EXISTS knex_migrations_lock (
    index INTEGER NOT NULL DEFAULT nextval('knex_migrations_lock_index_seq'::regclass),
    is_locked INTEGER
);


-- 表: land_loads
CREATE TABLE IF NOT EXISTS land_loads (
    id INTEGER NOT NULL DEFAULT nextval('land_loads_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    origin VARCHAR(500) NOT NULL,
    destination VARCHAR(500) NOT NULL,
    origin_display VARCHAR(500),
    destination_display VARCHAR(500),
    distance_info JSON,
    pickup_date DATE NOT NULL,
    delivery_date DATE,
    weight VARCHAR(100) NOT NULL,
    commodity VARCHAR(255),
    cargo_value VARCHAR(100),
    pallets INTEGER,
    freight_class VARCHAR(50),
    service_type TEXT NOT NULL,
    truck_type VARCHAR(255),
    equipment VARCHAR(255),
    rate VARCHAR(100),
    max_rate VARCHAR(100),
    company_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    ewid VARCHAR(100),
    shipping_number VARCHAR(255),
    notes TEXT,
    special_requirements TEXT,
    rating NUMERIC(3,2) NOT NULL DEFAULT '0'::numeric,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active'::text,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    views_count INTEGER NOT NULL DEFAULT 0,
    last_refreshed TIMESTAMP WITH TIME ZONE
);


-- 表: land_trucks
CREATE TABLE IF NOT EXISTS land_trucks (
    id INTEGER NOT NULL DEFAULT nextval('land_trucks_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    current_location VARCHAR(500) NOT NULL,
    preferred_destination VARCHAR(500),
    preferred_origin VARCHAR(500),
    available_date DATE NOT NULL,
    truck_type VARCHAR(255) NOT NULL,
    equipment VARCHAR(255),
    capacity VARCHAR(100) NOT NULL,
    length VARCHAR(100),
    volume VARCHAR(100),
    truck_features VARCHAR(500),
    driver_license VARCHAR(100),
    service_type TEXT NOT NULL,
    rate_range VARCHAR(100),
    rate VARCHAR(100),
    company_name VARCHAR(255),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    ewid VARCHAR(100),
    notes TEXT,
    rating NUMERIC(3,2) NOT NULL DEFAULT '0'::numeric,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active'::text,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    views_count INTEGER NOT NULL DEFAULT 0,
    last_refreshed TIMESTAMP WITH TIME ZONE
);


-- 表: premium_posts
CREATE TABLE IF NOT EXISTS premium_posts (
    id INTEGER NOT NULL DEFAULT nextval('premium_posts_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    post_type TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    premium_type TEXT NOT NULL,
    credits_cost INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 表: rentals
CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER NOT NULL DEFAULT nextval('rentals_id_seq'::regclass),
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(255),
    sub_category VARCHAR(100),
    location VARCHAR(100) NOT NULL,
    price VARCHAR(100) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    specifications TEXT,
    images TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_person VARCHAR(100),
    rental_period VARCHAR(50),
    views INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    company VARCHAR(255)
);


-- 表: resumes
CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER NOT NULL DEFAULT nextval('resumes_id_seq'::regclass),
    user_id INTEGER,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    skills TEXT NOT NULL,
    summary TEXT,
    expected_salary VARCHAR(100),
    work_type_preference VARCHAR(50),
    views INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active'::text,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    views_count INTEGER NOT NULL DEFAULT 0,
    last_refreshed TIMESTAMP WITH TIME ZONE
);


-- 表: sales
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER NOT NULL DEFAULT nextval('sales_id_seq'::regclass),
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(255),
    sub_category VARCHAR(100),
    location VARCHAR(100) NOT NULL,
    price VARCHAR(100) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    specifications TEXT,
    images TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_person VARCHAR(100),
    views INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    company VARCHAR(255)
);


-- 表: system_config
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER NOT NULL DEFAULT nextval('system_config_id_seq'::regclass),
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(500),
    data_type TEXT DEFAULT 'string'::text,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 表: user_credits_log
CREATE TABLE IF NOT EXISTS user_credits_log (
    id INTEGER NOT NULL DEFAULT nextval('user_credits_log_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description VARCHAR(500),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 表: users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    user_type TEXT NOT NULL DEFAULT 'shipper'::text,
    company_name VARCHAR(255),
    company_type VARCHAR(100),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    business_license VARCHAR(100),
    mc_number VARCHAR(50),
    dot_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    credits INTEGER NOT NULL DEFAULT 100,
    total_credits_earned INTEGER NOT NULL DEFAULT 100,
    total_credits_spent INTEGER NOT NULL DEFAULT 0,
    cognito_sub VARCHAR(255),
    is_employee BOOLEAN NOT NULL DEFAULT false,
    employee_role TEXT,
    employee_id VARCHAR(50),
    employee_since TIMESTAMP WITH TIME ZONE
);


-- 表: users_backup_20251003
CREATE TABLE IF NOT EXISTS users_backup_20251003 (
    id INTEGER,
    email VARCHAR(255),
    password VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    user_type TEXT,
    company_name VARCHAR(255),
    company_type VARCHAR(100),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    business_license VARCHAR(100),
    mc_number VARCHAR(50),
    dot_number VARCHAR(50),
    is_active BOOLEAN,
    is_verified BOOLEAN,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    credits INTEGER,
    total_credits_earned INTEGER,
    total_credits_spent INTEGER,
    cognito_sub VARCHAR(255)
);


-- ============================================
-- 数据导入 (从CSV文件)
-- ============================================
-- 请使用以下命令导入数据：
-- COPY companies FROM '/path/to/database_export/companies_data.csv' WITH CSV HEADER;
-- COPY customers FROM '/path/to/database_export/customers_data.csv' WITH CSV HEADER;
-- COPY employee_order_comments FROM '/path/to/database_export/employee_order_comments_data.csv' WITH CSV HEADER;
-- COPY employee_order_logs FROM '/path/to/database_export/employee_order_logs_data.csv' WITH CSV HEADER;
-- COPY employee_orders FROM '/path/to/database_export/employee_orders_data.csv' WITH CSV HEADER;
-- COPY employee_permissions FROM '/path/to/database_export/employee_permissions_data.csv' WITH CSV HEADER;
-- COPY employee_role_permissions FROM '/path/to/database_export/employee_role_permissions_data.csv' WITH CSV HEADER;
-- COPY employee_statistics FROM '/path/to/database_export/employee_statistics_data.csv' WITH CSV HEADER;
-- COPY fba_comment_likes FROM '/path/to/database_export/fba_comment_likes_data.csv' WITH CSV HEADER;
-- COPY fba_comments FROM '/path/to/database_export/fba_comments_data.csv' WITH CSV HEADER;
-- COPY fba_exchanges FROM '/path/to/database_export/fba_exchanges_data.csv' WITH CSV HEADER;
-- COPY fba_locations FROM '/path/to/database_export/fba_locations_data.csv' WITH CSV HEADER;
-- COPY fba_media_files FROM '/path/to/database_export/fba_media_files_data.csv' WITH CSV HEADER;
-- COPY jobs FROM '/path/to/database_export/jobs_data.csv' WITH CSV HEADER;
-- COPY knex_migrations FROM '/path/to/database_export/knex_migrations_data.csv' WITH CSV HEADER;
-- COPY knex_migrations_lock FROM '/path/to/database_export/knex_migrations_lock_data.csv' WITH CSV HEADER;
-- COPY land_loads FROM '/path/to/database_export/land_loads_data.csv' WITH CSV HEADER;
-- COPY land_trucks FROM '/path/to/database_export/land_trucks_data.csv' WITH CSV HEADER;
-- COPY premium_posts FROM '/path/to/database_export/premium_posts_data.csv' WITH CSV HEADER;
-- COPY rentals FROM '/path/to/database_export/rentals_data.csv' WITH CSV HEADER;
-- COPY resumes FROM '/path/to/database_export/resumes_data.csv' WITH CSV HEADER;
-- COPY sales FROM '/path/to/database_export/sales_data.csv' WITH CSV HEADER;
-- COPY system_config FROM '/path/to/database_export/system_config_data.csv' WITH CSV HEADER;
-- COPY user_credits_log FROM '/path/to/database_export/user_credits_log_data.csv' WITH CSV HEADER;
-- COPY users FROM '/path/to/database_export/users_data.csv' WITH CSV HEADER;
-- COPY users_backup_20251003 FROM '/path/to/database_export/users_backup_20251003_data.csv' WITH CSV HEADER;
