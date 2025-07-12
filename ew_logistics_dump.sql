--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    user_id integer,
    name character varying(500) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    subcategory character varying(100) NOT NULL,
    phone character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    address character varying(500) NOT NULL,
    website character varying(255),
    rating numeric(3,2) DEFAULT '0'::numeric,
    reviews_count integer DEFAULT 0,
    verified boolean DEFAULT false,
    views integer DEFAULT 0,
    favorites integer DEFAULT 0,
    notes text,
    services json,
    business_hours json,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'active'::text,
    is_premium boolean DEFAULT false,
    views_count integer DEFAULT 0,
    last_refreshed timestamp with time zone,
    CONSTRAINT companies_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text])))
);


ALTER TABLE public.companies OWNER TO "ew-user";

--
-- Name: COLUMN companies.status; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.companies.status IS '状态';


--
-- Name: COLUMN companies.is_premium; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.companies.is_premium IS '是否为高级帖子';


--
-- Name: COLUMN companies.views_count; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.companies.views_count IS '浏览次数';


--
-- Name: COLUMN companies.last_refreshed; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.companies.last_refreshed IS '最后刷新时间';


--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.companies_id_seq OWNER TO "ew-user";

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    company character varying(255) NOT NULL,
    location character varying(100) NOT NULL,
    salary character varying(100) NOT NULL,
    work_type character varying(50) NOT NULL,
    experience character varying(50) NOT NULL,
    description text NOT NULL,
    contact_phone character varying(50),
    contact_email character varying(255),
    contact_person character varying(100),
    views integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'active'::text,
    is_premium boolean DEFAULT false,
    views_count integer DEFAULT 0,
    last_refreshed timestamp with time zone,
    CONSTRAINT jobs_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'filled'::text, 'cancelled'::text])))
);


ALTER TABLE public.jobs OWNER TO "ew-user";

--
-- Name: COLUMN jobs.status; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.jobs.status IS '状态';


--
-- Name: COLUMN jobs.is_premium; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.jobs.is_premium IS '是否为高级帖子';


--
-- Name: COLUMN jobs.views_count; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.jobs.views_count IS '浏览次数';


--
-- Name: COLUMN jobs.last_refreshed; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.jobs.last_refreshed IS '最后刷新时间';


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jobs_id_seq OWNER TO "ew-user";

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO "ew-user";

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_id_seq OWNER TO "ew-user";

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO "ew-user";

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.knex_migrations_lock_index_seq OWNER TO "ew-user";

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: land_loads; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.land_loads (
    id integer NOT NULL,
    user_id integer,
    origin character varying(500) NOT NULL,
    destination character varying(500) NOT NULL,
    origin_display character varying(500),
    destination_display character varying(500),
    distance_info json,
    pickup_date date NOT NULL,
    delivery_date date,
    weight character varying(100) NOT NULL,
    commodity character varying(255),
    cargo_value character varying(100),
    pallets integer,
    freight_class character varying(50),
    service_type text NOT NULL,
    truck_type character varying(255),
    equipment character varying(255),
    rate character varying(100),
    max_rate character varying(100),
    company_name character varying(255) NOT NULL,
    contact_phone character varying(50) NOT NULL,
    contact_email character varying(255),
    ewid character varying(100),
    shipping_number character varying(255),
    notes text,
    special_requirements text,
    rating numeric(3,2) DEFAULT '0'::numeric,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'active'::text,
    is_premium boolean DEFAULT false,
    views_count integer DEFAULT 0,
    last_refreshed timestamp with time zone,
    CONSTRAINT land_loads_service_type_check CHECK ((service_type = ANY (ARRAY['FTL'::text, 'LTL'::text, 'FTL/LTL'::text]))),
    CONSTRAINT land_loads_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text, 'cancelled'::text])))
);


ALTER TABLE public.land_loads OWNER TO "ew-user";

--
-- Name: COLUMN land_loads.status; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.land_loads.status IS '状态';


--
-- Name: COLUMN land_loads.is_premium; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.land_loads.is_premium IS '是否为高级帖子';


--
-- Name: COLUMN land_loads.views_count; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.land_loads.views_count IS '浏览次数';


--
-- Name: COLUMN land_loads.last_refreshed; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.land_loads.last_refreshed IS '最后刷新时间';


--
-- Name: land_loads_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.land_loads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.land_loads_id_seq OWNER TO "ew-user";

--
-- Name: land_loads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.land_loads_id_seq OWNED BY public.land_loads.id;


--
-- Name: land_trucks; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.land_trucks (
    id integer NOT NULL,
    user_id integer,
    current_location character varying(500) NOT NULL,
    preferred_destination character varying(500) NOT NULL,
    available_date date NOT NULL,
    truck_type character varying(255) NOT NULL,
    capacity character varying(100) NOT NULL,
    service_type text NOT NULL,
    company_name character varying(255) NOT NULL,
    contact_phone character varying(50) NOT NULL,
    contact_email character varying(255) NOT NULL,
    ewid character varying(100),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    length character varying(50) NOT NULL,
    volume character varying(100) NOT NULL,
    contact_name character varying(255) NOT NULL,
    preferred_origin character varying(500) NOT NULL,
    status text DEFAULT 'active'::text,
    is_premium boolean DEFAULT false,
    views_count integer DEFAULT 0,
    last_refreshed timestamp with time zone,
    CONSTRAINT land_trucks_service_type_check CHECK ((service_type = ANY (ARRAY['FTL'::text, 'LTL'::text, 'FTL/LTL'::text]))),
    CONSTRAINT land_trucks_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text, 'cancelled'::text])))
);


ALTER TABLE public.land_trucks OWNER TO "ew-user";

--
-- Name: COLUMN land_trucks.status; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.land_trucks.status IS '状态';


--
-- Name: COLUMN land_trucks.is_premium; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.land_trucks.is_premium IS '是否为高级帖子';


--
-- Name: COLUMN land_trucks.views_count; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.land_trucks.views_count IS '浏览次数';


--
-- Name: COLUMN land_trucks.last_refreshed; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.land_trucks.last_refreshed IS '最后刷新时间';


--
-- Name: land_trucks_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.land_trucks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.land_trucks_id_seq OWNER TO "ew-user";

--
-- Name: land_trucks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.land_trucks_id_seq OWNED BY public.land_trucks.id;


--
-- Name: premium_posts; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.premium_posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_type text NOT NULL,
    post_id integer NOT NULL,
    premium_type text NOT NULL,
    credits_cost integer NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT premium_posts_post_type_check CHECK ((post_type = ANY (ARRAY['load'::text, 'truck'::text, 'company'::text, 'job'::text, 'resume'::text]))),
    CONSTRAINT premium_posts_premium_type_check CHECK ((premium_type = ANY (ARRAY['top'::text, 'highlight'::text, 'urgent'::text])))
);


ALTER TABLE public.premium_posts OWNER TO "ew-user";

--
-- Name: COLUMN premium_posts.post_type; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.premium_posts.post_type IS '帖子类型';


--
-- Name: COLUMN premium_posts.post_id; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.premium_posts.post_id IS '帖子ID';


--
-- Name: COLUMN premium_posts.premium_type; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.premium_posts.premium_type IS '高级类型';


--
-- Name: COLUMN premium_posts.credits_cost; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.premium_posts.credits_cost IS '消费积分';


--
-- Name: COLUMN premium_posts.start_time; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.premium_posts.start_time IS '开始时间';


--
-- Name: COLUMN premium_posts.end_time; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.premium_posts.end_time IS '结束时间';


--
-- Name: COLUMN premium_posts.is_active; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.premium_posts.is_active IS '是否有效';


--
-- Name: premium_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.premium_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.premium_posts_id_seq OWNER TO "ew-user";

--
-- Name: premium_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.premium_posts_id_seq OWNED BY public.premium_posts.id;


--
-- Name: resumes; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.resumes (
    id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    "position" character varying(100) NOT NULL,
    experience character varying(50) NOT NULL,
    location character varying(100) NOT NULL,
    phone character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    skills text NOT NULL,
    summary text,
    expected_salary character varying(100),
    work_type_preference character varying(50),
    views integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'active'::text,
    is_premium boolean DEFAULT false,
    views_count integer DEFAULT 0,
    last_refreshed timestamp with time zone,
    CONSTRAINT resumes_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'hired'::text])))
);


ALTER TABLE public.resumes OWNER TO "ew-user";

--
-- Name: COLUMN resumes.status; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.resumes.status IS '状态';


--
-- Name: COLUMN resumes.is_premium; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.resumes.is_premium IS '是否为高级帖子';


--
-- Name: COLUMN resumes.views_count; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.resumes.views_count IS '浏览次数';


--
-- Name: COLUMN resumes.last_refreshed; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.resumes.last_refreshed IS '最后刷新时间';


--
-- Name: resumes_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.resumes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resumes_id_seq OWNER TO "ew-user";

--
-- Name: resumes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.resumes_id_seq OWNED BY public.resumes.id;


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.system_config (
    id integer NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value text NOT NULL,
    description character varying(500),
    data_type text DEFAULT 'string'::text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT system_config_data_type_check CHECK ((data_type = ANY (ARRAY['string'::text, 'number'::text, 'boolean'::text, 'json'::text])))
);


ALTER TABLE public.system_config OWNER TO "ew-user";

--
-- Name: system_config_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.system_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_config_id_seq OWNER TO "ew-user";

--
-- Name: system_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.system_config_id_seq OWNED BY public.system_config.id;


--
-- Name: user_credits_log; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.user_credits_log (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    balance_after integer NOT NULL,
    description character varying(500),
    reference_type character varying(50),
    reference_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT user_credits_log_type_check CHECK ((type = ANY (ARRAY['earn'::text, 'spend'::text, 'refund'::text, 'admin_adjust'::text])))
);


ALTER TABLE public.user_credits_log OWNER TO "ew-user";

--
-- Name: COLUMN user_credits_log.type; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.user_credits_log.type IS '积分变动类型';


--
-- Name: COLUMN user_credits_log.amount; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.user_credits_log.amount IS '变动金额（正数增加，负数减少）';


--
-- Name: COLUMN user_credits_log.balance_after; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.user_credits_log.balance_after IS '变动后余额';


--
-- Name: COLUMN user_credits_log.description; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.user_credits_log.description IS '变动描述';


--
-- Name: COLUMN user_credits_log.reference_type; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.user_credits_log.reference_type IS '关联类型：load, truck, recharge等';


--
-- Name: COLUMN user_credits_log.reference_id; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.user_credits_log.reference_id IS '关联ID';


--
-- Name: user_credits_log_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.user_credits_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_credits_log_id_seq OWNER TO "ew-user";

--
-- Name: user_credits_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.user_credits_log_id_seq OWNED BY public.user_credits_log.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: ew-user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    phone character varying(50),
    company_name character varying(255),
    company_type character varying(100),
    user_type text DEFAULT 'shipper'::text,
    address character varying(500),
    city character varying(100),
    state character varying(50),
    zip_code character varying(20),
    business_license character varying(255),
    mc_number character varying(50),
    dot_number character varying(50),
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    credits integer DEFAULT 100,
    total_credits_earned integer DEFAULT 100,
    total_credits_spent integer DEFAULT 0,
    cognito_sub character varying(255),
    CONSTRAINT users_user_type_check CHECK ((user_type = ANY (ARRAY['shipper'::text, 'carrier'::text, 'broker'::text, 'admin'::text])))
);


ALTER TABLE public.users OWNER TO "ew-user";

--
-- Name: COLUMN users.credits; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.users.credits IS '用户积分余额';


--
-- Name: COLUMN users.total_credits_earned; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.users.total_credits_earned IS '累计获得积分';


--
-- Name: COLUMN users.total_credits_spent; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.users.total_credits_spent IS '累计消费积分';


--
-- Name: COLUMN users.cognito_sub; Type: COMMENT; Schema: public; Owner: ew-user
--

COMMENT ON COLUMN public.users.cognito_sub IS 'AWS Cognito用户ID';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: ew-user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO "ew-user";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ew-user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: land_loads id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.land_loads ALTER COLUMN id SET DEFAULT nextval('public.land_loads_id_seq'::regclass);


--
-- Name: land_trucks id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.land_trucks ALTER COLUMN id SET DEFAULT nextval('public.land_trucks_id_seq'::regclass);


--
-- Name: premium_posts id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.premium_posts ALTER COLUMN id SET DEFAULT nextval('public.premium_posts_id_seq'::regclass);


--
-- Name: resumes id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.resumes ALTER COLUMN id SET DEFAULT nextval('public.resumes_id_seq'::regclass);


--
-- Name: system_config id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.system_config ALTER COLUMN id SET DEFAULT nextval('public.system_config_id_seq'::regclass);


--
-- Name: user_credits_log id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.user_credits_log ALTER COLUMN id SET DEFAULT nextval('public.user_credits_log_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.companies (id, user_id, name, description, category, subcategory, phone, email, address, website, rating, reviews_count, verified, views, favorites, notes, services, business_hours, is_active, is_featured, created_at, updated_at, status, is_premium, views_count, last_refreshed) FROM stdin;
2	8	测试企业 - 3:11:09 PM	专业物流服务企业	物流企业	货运代理	400-123-4567	test@company.com	北京市朝阳区建国路88号	\N	0.00	0	f	1	0	\N	\N	\N	t	f	2025-07-02 15:11:09.902622-04	2025-07-02 15:11:09.902622-04	active	f	0	\N
3	8	测试企业 - 3:11:28 PM	专业物流服务企业	物流企业	货运代理	400-123-4567	test@company.com	北京市朝阳区建国路88号	\N	0.00	0	f	1	0	\N	\N	\N	t	f	2025-07-02 15:11:28.576787-04	2025-07-02 15:11:28.576787-04	active	f	0	\N
4	7	Jiaxuan Chen	请问请问吃	仓储货代	收货仓	+1 02135096697	cjx18002146886@outlook.com	APT1	\N	0.00	0	f	1	0	\N	\N	\N	t	f	2025-07-02 15:14:29.585467-04	2025-07-08 16:34:32.912-04	active	f	0	\N
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.jobs (id, user_id, title, category, company, location, salary, work_type, experience, description, contact_phone, contact_email, contact_person, views, is_active, is_featured, created_at, updated_at, status, is_premium, views_count, last_refreshed) FROM stdin;
1	\N	sadas	CLASS B 司机	asdasd	纽约	asdasd	兼职	1-3年	asdasd	asdas	cjx18002146886@outlook.com	asdasd	0	t	f	2025-07-01 16:17:42.482-04	2025-07-01 16:17:42.482-04	active	f	0	\N
\.


--
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.knex_migrations (id, name, batch, migration_time) FROM stdin;
6	001_create_users_table.js	1	2025-07-01 15:29:49.846-04
7	002_create_land_freight_tables.js	1	2025-07-01 15:29:49.866-04
8	003_create_companies_table.js	1	2025-07-01 15:29:49.874-04
9	004_create_jobs_table.js	1	2025-07-01 15:29:49.88-04
10	005_create_resumes_table.js	1	2025-07-01 15:29:49.886-04
12	006_add_user_management_system.js	2	2025-07-02 13:18:51.381-04
13	007_add_cognito_support.js	3	2025-07-08 15:28:24.526-04
\.


--
-- Data for Name: knex_migrations_lock; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.knex_migrations_lock (index, is_locked) FROM stdin;
1	0
\.


--
-- Data for Name: land_loads; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.land_loads (id, user_id, origin, destination, origin_display, destination_display, distance_info, pickup_date, delivery_date, weight, commodity, cargo_value, pallets, freight_class, service_type, truck_type, equipment, rate, max_rate, company_name, contact_phone, contact_email, ewid, shipping_number, notes, special_requirements, rating, is_active, created_at, updated_at, status, is_premium, views_count, last_refreshed) FROM stdin;
11	1	广东省广州市	北京市朝阳区	广州市天河区	北京市朝阳区建国门	\N	2024-01-15	2024-01-18	25000	电子设备	150000	\N	\N	FTL	厢式货车	\N	8500	9000	顺丰物流	13800138001	shipper@example.com	EWL20240115001	SF2024011501	货物贵重，请小心搬运	需要恒温运输	4.80	t	2025-07-02 14:37:25.809874-04	2025-07-02 14:37:25.809874-04	active	f	0	\N
12	2	浙江省杭州市	上海市浦东新区	杭州市滨江区	上海市浦东新区陆家嘴	\N	2024-01-16	2024-01-17	15000	服装纺织品	80000	12	\N	LTL	平板车	\N	3500	4000	示例物流公司	13800138003	demo@example.com	EWL20240116001	DM2024011601	标准货物运输	无特殊要求	4.50	t	2025-07-02 14:37:25.809874-04	2025-07-02 14:37:25.809874-04	active	f	0	\N
13	1	江苏省南京市	四川省成都市	南京市鼓楼区	成都市高新区	\N	2024-01-18	2024-01-22	35000	机械设备	280000	\N	\N	FTL	低平板车	\N	12000	13500	顺丰物流	13800138001	shipper@example.com	EWL20240118001	SF2024011801	超重货物，需专业设备	需要起重设备协助装卸	4.90	t	2025-07-02 14:37:25.809874-04	2025-07-02 14:37:25.809874-04	active	f	0	\N
15	8	北京市朝阳区	上海市浦东新区	北京市朝阳区	上海市浦东新区	\N	2024-12-30	\N	10吨	\N	\N	\N	\N	FTL	厢式车	\N	3000元	\N	测试物流公司	13800138000	\N	EWL20250702005	\N	测试货源 - 3:11:28 PM	\N	0.00	t	2025-07-02 15:11:28.569718-04	2025-07-02 15:46:30.631-04	active	f	0	2025-07-02 15:11:28.591-04
19	9	Brooklyn, NY 11231, USA	Watts, CA 90002, USA	New York, NY 11231	Los Angeles, CA 90002	{"distance":"2,804 mi","duration":"1 day 17 hours","distanceValue":4512573,"durationValue":147955}	2025-07-31	\N	44	\N		\N	\N	FTL	平板车 (Flatbed)	\N	\N		UNIVERSITY OF WISCONSIN - MADISON	+1 02135096697	cjx18002146886@outlook.com	EWL20250702009	\N	\N		0.00	t	2025-07-02 17:00:05.883839-04	2025-07-02 17:00:05.883839-04	active	t	0	\N
20	9	100 Cooper St	55 kennedy dr	Ottawa, ON K2P	Malden, MA 02148	{"distance":"428 mi","duration":"6 hours 43 mins","distanceValue":688258,"durationValue":24189}	2025-07-05	\N	55	机械设备 (Machinery)	50k-75k	\N	\N	FTL	超重车 (Heavy Haul)	\N	\N		UNIVERSITY OF WISCONSIN - MADISON	2135096697	jc6292@columbia.edu	EWL20250702010	\N	\N	zdvadaacf	0.00	t	2025-07-02 17:01:03.22895-04	2025-07-02 17:01:03.22895-04	active	t	0	\N
21	7	Hauppauge, NY 11788, USA	Flushing, NY 11354, USA	Hauppauge, NY 11788	Queens, NY 11354	{"distance":"37.9 mi","duration":"45 mins","distanceValue":60949,"durationValue":2674}	2025-07-31	\N	498	\N		\N	\N	FTL	干货车 (Dry Van)	\N	\N		EW-Josh	+1 02135096697	cjx18002146886@outlook.com	EWL20250705001	\N	\N		0.00	t	2025-07-05 08:04:28.936461-04	2025-07-08 16:34:22.652-04	active	f	0	\N
17	7	Dockweiler, CA 90007, USA	Flushing, NY 11354, USA	Los Angeles, CA 90007	Queens, NY 11354	{"distance":"2,808 mi","duration":"1 day 17 hours","distanceValue":4518751,"durationValue":147466}	2025-07-29	\N	127	\N		\N	\N	FTL	冷藏车 (Refrigerated)	\N	\N		UNIVERSITY OF WISCONSIN - MADISON	2135096697	cjx18002146886@outlook.com	EWL20250702007	\N	\N		0.00	t	2025-07-02 16:22:47.932212-04	2025-07-08 16:34:29.294-04	active	f	0	\N
18	7	New York, NY 10034, USA	Monona, WI 53716, USA	New York, NY 10034	Monona, WI 53716	{"distance":"937 mi","duration":"14 hours 16 mins","distanceValue":1508353,"durationValue":51338}	2025-08-06	\N	34	\N		\N	\N	FTL	冷藏车 (Refrigerated)	\N	\N		UNIVERSITY OF WISCONSIN - MADISON	2135096697	cjx18002146886@outlook.com	EWL20250702008	\N	\N		0.00	t	2025-07-02 16:58:23.171496-04	2025-07-08 16:34:29.671-04	active	f	0	\N
16	7	Hauppauge, NY 11788, USA	Flushing, NY 11354, USA	Hauppauge, NY 11788	Queens, NY 11354	{"distance":"37.9 mi","duration":"45 mins","distanceValue":60949,"durationValue":2674}	2025-07-30	\N	72.8	电子设备 (Electronics) - fff	\N	3	\N	LTL		\N	\N		UNIVERSITY OF WISCONSIN - MADISON	2135096697	cjx18002146886@outlook.com	EWL20250702006	\N	\N		0.00	t	2025-07-02 16:02:21.778641-04	2025-07-08 16:34:30.014-04	active	f	0	\N
14	7	Flushing, NY 11354, USA	Hauppauge, NY 11788, USA	Queens, NY 11354	Hauppauge, NY 11788	{"distance":"38.0 mi","duration":"45 mins","distanceValue":61157,"durationValue":2692}	2025-07-31	\N	154	\N		\N	\N	FTL	冷藏车 (Refrigerated)	\N	\N		UNIVERSITY OF WISCONSIN - MADISON	+1 02135096697	cjx18002146886@outlook.com	EWL20250702004	\N	\N		0.00	t	2025-07-02 14:58:44.02741-04	2025-07-08 16:34:30.227-04	active	f	0	\N
24	1	New York, NY 10034, USA	Dockweiler, CA 90007, USA	New York, NY 10034	Los Angeles, CA 90007	{"distance":"2,799 mi","duration":"1 day 17 hours","distanceValue":4504892,"durationValue":146846}	2025-07-19	\N	145	食品饮料 (Food & Beverages)	25k-50k	\N	\N	FTL	平板车 (Flatbed)	\N	\N		个不听话	24234234		EWL20250709001	\N	\N		0.00	t	2025-07-09 11:03:56.077755-04	2025-07-09 11:03:56.077755-04	active	t	0	\N
22	7	Hauppauge, NY 11788, USA	Flushing, NY 11354, USA	Hauppauge, NY 11788	Queens, NY 11354	{"distance":"37.9 mi","duration":"45 mins","distanceValue":60949,"durationValue":2674}	2025-07-24	\N	11	机械设备 (Machinery) - 阿达	\N	5	\N	LTL		\N	\N		UNIVERSITY OF WISCONSIN - MADISON	2135096697	cjx18002146886@outlook.com	EWL20250707001	\N	\N		0.00	t	2025-07-07 10:34:48.281253-04	2025-07-10 17:24:09.332-04	active	t	0	\N
23	7	Flushing, NY 11352, USA	Hauppauge, NY 11788, USA	Queens, NY 11352	Hauppauge, NY 11788	{"distance":"36.3 mi","duration":"48 mins","distanceValue":58423,"durationValue":2892}	2025-07-17	\N	33	汽车配件 (Auto Parts)	25k-50k	\N	\N	FTL	平板车 (Flatbed)	\N	\N		UNIVERSITY OF WISCONSIN - MADISON	+1 02135096697	cjx18002146886@outlook.com	EWL20250708001	\N	\N		0.00	t	2025-07-08 16:41:46.221309-04	2025-07-10 17:24:09.682-04	active	t	0	\N
25	7	New York, NY 10034, USA	Flushing, NY 11354, USA	New York, NY 10034	Queens, NY 11354	{"distance":"12.3 mi","duration":"26 mins","distanceValue":19822,"durationValue":1584}	2025-07-23	\N	69	\N		\N	\N	FTL	干货车 (Dry Van)	\N	\N		UNIVERSITY OF WISCONSIN - MADISON	+1 02135096697	cjx18002146886@outlook.com	EWL20250710001	\N	\N		0.00	t	2025-07-10 13:30:41.910339-04	2025-07-10 17:24:10.112-04	active	t	0	\N
26	7	New York, NY 10034, USA	Flushing, NY 11354, USA	New York, NY 10034	Queens, NY 11354	{"distance":"12.3 mi","duration":"26 mins","distanceValue":19822,"durationValue":1584}	2025-07-16	\N	97.0	\N		\N	\N	FTL	平板车 (Flatbed)	\N	\N		UNIVERSITY OF WISCONSIN - MADISON	+1 02135096697	cjx18002146886@outlook.com	EWL20250710002	\N	\N		0.00	t	2025-07-10 17:47:53.27751-04	2025-07-10 17:47:53.27751-04	active	t	0	\N
27	1	New York, NY 10034, USA	Flushing, NY 11354, USA	New York, NY 10034	Queens, NY 11354	{"distance":"12.3 mi","duration":"26 mins","distanceValue":19822,"durationValue":1584}	2025-08-09	\N	44	\N		\N	\N	FTL	干货车 (Dry Van)	\N	\N		44444	444444		EWL20250711001	\N	\N		0.00	t	2025-07-11 09:43:45.612847-04	2025-07-11 09:43:45.612847-04	active	t	0	\N
28	1	Hauppauge, NY 11788, USA	Monona, WI 53713, USA	Hauppauge, NY 11788	Monona, WI 53713	{"distance":"980 mi","duration":"15 hours 4 mins","distanceValue":1576886,"durationValue":54244}	2025-07-17	\N	33	\N		\N	\N	FTL	干货车 (Dry Van)	\N	\N		134134	234234		EWL20250711002	\N	\N		0.00	t	2025-07-11 12:38:08.822414-04	2025-07-11 12:38:08.822414-04	active	t	0	\N
29	7	Dockweiler, CA 90007, USA	Flushing, NY 11354, USA	Los Angeles, CA 90007	Queens, NY 11354	{"distance":"2,807 mi","duration":"1 day 17 hours","distanceValue":4516828,"durationValue":147257}	2025-07-31	\N	44	\N		\N	\N	FTL	干货车 (Dry Van)	\N	\N		UNIVERSITY OF WISCONSIN - MADISON	+1 02135096697	cjx18002146886@outlook.com	EWL20250711003	\N	\N		0.00	t	2025-07-11 16:08:22.355846-04	2025-07-11 16:08:22.355846-04	active	t	0	\N
\.


--
-- Data for Name: land_trucks; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.land_trucks (id, user_id, current_location, preferred_destination, available_date, truck_type, capacity, service_type, company_name, contact_phone, contact_email, ewid, notes, is_active, created_at, updated_at, length, volume, contact_name, preferred_origin, status, is_premium, views_count, last_refreshed) FROM stdin;
33	7	Hauppauge, NY 11788, USA	Dockweiler, CA 90007, USA	2025-07-02	干货车 (Dry Van)	66,000 lbs以上	FTL/LTL		6465298575		EWT20250702002		t	2025-07-02 17:31:19.522847-04	2025-07-08 16:34:31.697-04	43 ft	10,500 cu ft以上	Pengguang Weng	Monona, WI 53713, USA	active	t	0	\N
32	7	Hauppauge, NY 11788, USA	Hauppauge, NY 11788, USA	2025-07-19	平板车 (Flatbed)	22,000-44,000 lbs	FTL/LTL		2135096697	jiaxuan9527@gmail.com	EWT20250702001	adfacfavrc	t	2025-07-02 16:01:29.554443-04	2025-07-08 16:34:32.102-04	43 ft	3,500-7,000 cu ft	Jiaxuan	Flushing, NY 11354, USA	active	f	0	\N
34	7	Hauppauge, NY 11788, USA	Hauppauge, NY 11788, USA	2025-07-08	平板车 (Flatbed)	2,000-6,600 lbs	FTL	UNIVERSITY OF WISCONSIN - MADISON	2135096697	cjx18002146886@outlook.com	EWT20250708001		t	2025-07-08 16:35:22.605331-04	2025-07-08 16:35:22.605331-04	22 ft	1,800 cu ft以下	Jiaxuan Chen	Flushing, NY 11354, USA	active	t	0	\N
\.


--
-- Data for Name: premium_posts; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.premium_posts (id, user_id, post_type, post_id, premium_type, credits_cost, start_time, end_time, is_active, created_at, updated_at) FROM stdin;
2	9	load	19	top	50	2025-07-02 17:00:05.899-04	2025-07-03 17:00:05.899-04	t	2025-07-02 17:00:05.89463-04	2025-07-02 17:00:05.89463-04
3	9	load	20	highlight	30	2025-07-02 17:01:03.238-04	2025-07-03 17:01:03.238-04	t	2025-07-02 17:01:03.235614-04	2025-07-02 17:01:03.235614-04
4	7	truck	33	top	50	2025-07-02 17:31:19.531-04	2025-07-03 17:31:19.531-04	t	2025-07-02 17:31:19.528887-04	2025-07-02 17:31:19.528887-04
5	7	load	22	top	50	2025-07-07 10:34:48.291-04	2025-07-08 10:34:48.291-04	t	2025-07-07 10:34:48.287632-04	2025-07-07 10:34:48.287632-04
6	7	truck	34	top	50	2025-07-08 16:35:22.619-04	2025-07-09 16:35:22.619-04	t	2025-07-08 16:35:22.61327-04	2025-07-08 16:35:22.61327-04
7	7	load	23	top	50	2025-07-08 16:41:46.252-04	2025-07-09 16:41:46.252-04	t	2025-07-08 16:41:46.243847-04	2025-07-08 16:41:46.243847-04
8	1	load	24	highlight	30	2025-07-09 11:03:56.097-04	2025-07-10 11:03:56.097-04	t	2025-07-09 11:03:56.089577-04	2025-07-09 11:03:56.089577-04
9	7	load	25	top	50	2025-07-10 13:30:41.924-04	2025-07-11 13:30:41.924-04	t	2025-07-10 13:30:41.91959-04	2025-07-10 13:30:41.91959-04
10	7	load	26	highlight	30	2025-07-10 17:47:53.292-04	2025-07-11 17:47:53.292-04	t	2025-07-10 17:47:53.286533-04	2025-07-10 17:47:53.286533-04
11	1	load	27	top	50	2025-07-11 09:43:45.632-04	2025-07-12 09:43:45.632-04	t	2025-07-11 09:43:45.625568-04	2025-07-11 09:43:45.625568-04
12	1	load	28	top	50	2025-07-11 12:38:08.836-04	2025-07-12 12:38:08.836-04	t	2025-07-11 12:38:08.83167-04	2025-07-11 12:38:08.83167-04
13	7	load	29	top	50	2025-07-11 16:08:22.371-04	2025-07-12 16:08:22.371-04	t	2025-07-11 16:08:22.365079-04	2025-07-11 16:08:22.365079-04
\.


--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.resumes (id, user_id, name, "position", experience, location, phone, email, skills, summary, expected_salary, work_type_preference, views, is_active, is_featured, created_at, updated_at, status, is_premium, views_count, last_refreshed) FROM stdin;
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.system_config (id, config_key, config_value, description, data_type, created_at, updated_at) FROM stdin;
25	post_costs.load	10	发布货源信息消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
26	post_costs.truck	10	发布车源信息消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
27	post_costs.company	20	发布企业信息消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
28	post_costs.job	15	发布职位信息消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
29	post_costs.resume	5	发布简历信息消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
30	premium_costs.top_24h	50	置顶24小时消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
31	premium_costs.top_72h	120	置顶72小时消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
32	premium_costs.top_168h	250	置顶7天消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
33	premium_costs.highlight	30	高亮显示消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
34	premium_costs.urgent	20	紧急标记消费积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
35	user_registration_bonus	500	用户注册奖励积分	number	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
36	recharge_rates	{"100": 10, "500": 45, "1000": 85, "2000": 160, "5000": 380}	充值积分比例 {积分数量: 价格}	json	2025-07-02 14:54:06.203839-04	2025-07-02 14:54:06.203839-04
\.


--
-- Data for Name: user_credits_log; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.user_credits_log (id, user_id, type, amount, balance_after, description, reference_type, reference_id, created_at, updated_at) FROM stdin;
7	7	spend	-10	90	发布货源信息	load	14	2025-07-02 14:58:44.033501-04	2025-07-02 14:58:44.033501-04
8	8	spend	-20	80	发布企业信息	company	2	2025-07-02 15:11:09.906677-04	2025-07-02 15:11:09.906677-04
9	8	spend	-10	70	发布货源信息	load	15	2025-07-02 15:11:28.571841-04	2025-07-02 15:11:28.571841-04
10	8	spend	-20	50	发布企业信息	company	3	2025-07-02 15:11:28.579282-04	2025-07-02 15:11:28.579282-04
11	7	spend	-20	70	发布企业信息	company	4	2025-07-02 15:14:29.588706-04	2025-07-02 15:14:29.588706-04
12	7	spend	-10	60	发布车源信息	truck	32	2025-07-02 16:01:29.557635-04	2025-07-02 16:01:29.557635-04
13	7	spend	-10	50	发布货源信息	load	16	2025-07-02 16:02:21.781877-04	2025-07-02 16:02:21.781877-04
14	7	spend	-10	40	发布货源信息	load	17	2025-07-02 16:22:47.935278-04	2025-07-02 16:22:47.935278-04
15	7	spend	-10	30	发布货源信息	load	18	2025-07-02 16:58:23.17588-04	2025-07-02 16:58:23.17588-04
16	9	spend	-10	90	发布货源信息	load	19	2025-07-02 17:00:05.889461-04	2025-07-02 17:00:05.889461-04
17	9	spend	-50	40	置顶 - 货源信息	premium_load	19	2025-07-02 17:00:05.897263-04	2025-07-02 17:00:05.897263-04
18	9	spend	-10	30	发布货源信息	load	20	2025-07-02 17:01:03.231688-04	2025-07-02 17:01:03.231688-04
19	9	spend	-30	0	高亮 - 货源信息	premium_load	20	2025-07-02 17:01:03.23702-04	2025-07-02 17:01:03.23702-04
20	7	earn	500	530	充值 $45 获得 500 积分	recharge	\N	2025-07-02 17:30:28.79968-04	2025-07-02 17:30:28.79968-04
21	7	spend	-10	520	发布车源信息	truck	33	2025-07-02 17:31:19.526284-04	2025-07-02 17:31:19.526284-04
22	7	spend	-50	470	置顶 - 车源信息	premium_truck	33	2025-07-02 17:31:19.530313-04	2025-07-02 17:31:19.530313-04
23	7	spend	-10	460	发布货源信息	load	21	2025-07-05 08:04:28.941536-04	2025-07-05 08:04:28.941536-04
24	7	spend	-10	450	发布货源信息	load	22	2025-07-07 10:34:48.284819-04	2025-07-07 10:34:48.284819-04
25	7	spend	-50	400	置顶 - 货源信息	premium_load	22	2025-07-07 10:34:48.289528-04	2025-07-07 10:34:48.289528-04
26	7	spend	-10	390	发布车源信息	truck	34	2025-07-08 16:35:22.60921-04	2025-07-08 16:35:22.60921-04
27	7	spend	-50	340	置顶 - 车源信息	premium_truck	34	2025-07-08 16:35:22.616275-04	2025-07-08 16:35:22.616275-04
28	7	earn	500	840	充值 $45 获得 500 积分	recharge	\N	2025-07-08 16:36:25.260213-04	2025-07-08 16:36:25.260213-04
29	7	spend	-10	830	发布货源信息	load	23	2025-07-08 16:41:46.23935-04	2025-07-08 16:41:46.23935-04
30	7	spend	-50	780	置顶 - 货源信息	premium_load	23	2025-07-08 16:41:46.248545-04	2025-07-08 16:41:46.248545-04
31	1	spend	-10	90	发布货源信息	load	24	2025-07-09 11:03:56.085258-04	2025-07-09 11:03:56.085258-04
32	1	spend	-30	60	高亮 - 货源信息	premium_load	24	2025-07-09 11:03:56.093564-04	2025-07-09 11:03:56.093564-04
33	7	spend	-10	770	发布货源信息	load	25	2025-07-10 13:30:41.916002-04	2025-07-10 13:30:41.916002-04
34	7	spend	-50	720	置顶 - 货源信息	premium_load	25	2025-07-10 13:30:41.921734-04	2025-07-10 13:30:41.921734-04
35	7	spend	-10	710	发布货源信息	load	26	2025-07-10 17:47:53.282318-04	2025-07-10 17:47:53.282318-04
36	7	spend	-30	680	高亮 - 货源信息	premium_load	26	2025-07-10 17:47:53.288791-04	2025-07-10 17:47:53.288791-04
37	1	spend	-10	50	发布货源信息	load	27	2025-07-11 09:43:45.620787-04	2025-07-11 09:43:45.620787-04
38	1	spend	-50	0	置顶 - 货源信息	premium_load	27	2025-07-11 09:43:45.628857-04	2025-07-11 09:43:45.628857-04
39	1	earn	500	500	充值 $45 获得 500 积分	recharge	\N	2025-07-11 09:44:02.14641-04	2025-07-11 09:44:02.14641-04
40	1	spend	-10	490	发布货源信息	load	28	2025-07-11 12:38:08.82724-04	2025-07-11 12:38:08.82724-04
41	1	spend	-50	440	置顶 - 货源信息	premium_load	28	2025-07-11 12:38:08.835026-04	2025-07-11 12:38:08.835026-04
42	10	earn	2000	2100	充值 $160 获得 2000 积分	recharge	\N	2025-07-11 12:39:16.919724-04	2025-07-11 12:39:16.919724-04
43	7	spend	-10	670	发布货源信息	load	29	2025-07-11 16:08:22.361711-04	2025-07-11 16:08:22.361711-04
44	7	spend	-50	620	置顶 - 货源信息	premium_load	29	2025-07-11 16:08:22.368298-04	2025-07-11 16:08:22.368298-04
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: ew-user
--

COPY public.users (id, email, password, first_name, last_name, phone, company_name, company_type, user_type, address, city, state, zip_code, business_license, mc_number, dot_number, is_verified, is_active, last_login_at, created_at, updated_at, credits, total_credits_earned, total_credits_spent, cognito_sub) FROM stdin;
2	carrier@test.com	$2a$12$715tBMpAC/BoTpYzUMC.qut7KWBDXqiL2oeIhB0/C2ihNAoQ8DnP2	Test	Carrier	13800138002	测试承运商公司	trucking	carrier	浙江省杭州市滨江区测试地址2号	杭州	浙江	310000	BL987654321	MC123456	DOT123456	t	t	\N	2025-07-02 14:37:25.804-04	2025-07-02 14:37:25.804-04	100	100	0	\N
3	demo@example.com	$2a$12$qQCssJJLK0iYWQaHYaFUiO481c3xglV65SOFFLpLbIkBhux.HmEKi	Demo	User	13800138003	示例物流公司	logistics	shipper	北京市朝阳区示例地址3号	北京	北京	100000	BL111222333	\N	\N	t	t	\N	2025-07-02 14:37:25.804-04	2025-07-02 14:37:25.804-04	100	100	0	\N
1	shipper@test.com	$2a$12$715tBMpAC/BoTpYzUMC.qut7KWBDXqiL2oeIhB0/C2ihNAoQ8DnP2	Test	Shipper	13800138001	测试货主公司	logistics	shipper	广东省深圳市福田区测试地址1号	深圳	广东	518000	BL123456789	\N	\N	t	t	2025-07-08 16:33:20.232-04	2025-07-02 14:37:25.804-04	2025-07-08 16:33:20.232-04	440	600	160	\N
10	jia@ds.com	$2a$12$TCxnLPVJnEAeWakpc0cHs.mwE2I4/K63ZLMQLl9dlXigsLd1k/Cki	ad	asd	123123	sda	corporation	shipper					123123	\N	\N	f	t	\N	2025-07-11 12:38:53.529609-04	2025-07-11 12:38:53.529609-04	2100	2100	0	\N
7	cjx18002146886@outlook.com	$2a$12$634aVTPmssepQvnOUsvhbOibSG8AHfhoJHQwqDuOxof2mC3AacIP.	Jiaxuan	Chen	12135096697	UNIVERSITY OF WISCONSIN - MADISON	llc	shipper					UNIVERSITY OF WISCONSIN - MADISON	\N	\N	f	t	2025-07-10 17:21:59.743-04	2025-07-02 14:57:48.382902-04	2025-07-10 17:21:59.743-04	620	1100	480	\N
8	test@example.com	$2a$12$ykXt6YzWFwV4zQkqDb7v4OWNjXkiB89G217WRVFuaab45KJkru7f.	测试	用户	13800138000	测试物流公司	\N	shipper	北京市朝阳区建国路88号	\N	\N	\N	\N	\N	\N	f	t	2025-07-02 15:46:30.601-04	2025-07-02 15:11:03.543074-04	2025-07-02 15:46:30.601-04	50	100	50	\N
9	jiaxuan9527@gmail.com	$2a$12$ZL4T0NqnKxLRNeYU2e9e0eOKmmfH3V/h5MwDEtPFmPh7VQMn.g/Fu	Pengguang	Weng	16465298575	UNIVERSITY OF WISCONSIN - MADISON	corporation	shipper					UNIVERSITY OF WISCONSIN - MADISON	\N	\N	f	t	2025-07-10 14:21:04.767-04	2025-07-02 16:59:23.545545-04	2025-07-10 14:21:04.767-04	0	100	100	\N
\.


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.companies_id_seq', 4, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, true);


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 13, true);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, true);


--
-- Name: land_loads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.land_loads_id_seq', 29, true);


--
-- Name: land_trucks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.land_trucks_id_seq', 34, true);


--
-- Name: premium_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.premium_posts_id_seq', 13, true);


--
-- Name: resumes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.resumes_id_seq', 1, false);


--
-- Name: system_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.system_config_id_seq', 36, true);


--
-- Name: user_credits_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.user_credits_log_id_seq', 44, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ew-user
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: land_loads land_loads_ewid_unique; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.land_loads
    ADD CONSTRAINT land_loads_ewid_unique UNIQUE (ewid);


--
-- Name: land_loads land_loads_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.land_loads
    ADD CONSTRAINT land_loads_pkey PRIMARY KEY (id);


--
-- Name: land_trucks land_trucks_ewid_key; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.land_trucks
    ADD CONSTRAINT land_trucks_ewid_key UNIQUE (ewid);


--
-- Name: land_trucks land_trucks_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.land_trucks
    ADD CONSTRAINT land_trucks_pkey PRIMARY KEY (id);


--
-- Name: premium_posts premium_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.premium_posts
    ADD CONSTRAINT premium_posts_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (id);


--
-- Name: system_config system_config_config_key_unique; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_config_key_unique UNIQUE (config_key);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (id);


--
-- Name: premium_posts unique_premium_post; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.premium_posts
    ADD CONSTRAINT unique_premium_post UNIQUE (post_type, post_id, premium_type, start_time);


--
-- Name: user_credits_log user_credits_log_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.user_credits_log
    ADD CONSTRAINT user_credits_log_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: companies_category_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_category_index ON public.companies USING btree (category);


--
-- Name: companies_created_at_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_created_at_index ON public.companies USING btree (created_at);


--
-- Name: companies_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_is_active_index ON public.companies USING btree (is_active);


--
-- Name: companies_is_premium_created_at_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_is_premium_created_at_index ON public.companies USING btree (is_premium, created_at);


--
-- Name: companies_name_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_name_index ON public.companies USING btree (name);


--
-- Name: companies_rating_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_rating_index ON public.companies USING btree (rating);


--
-- Name: companies_status_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_status_is_active_index ON public.companies USING btree (status, is_active);


--
-- Name: companies_subcategory_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_subcategory_index ON public.companies USING btree (subcategory);


--
-- Name: companies_user_id_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_user_id_index ON public.companies USING btree (user_id);


--
-- Name: companies_verified_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX companies_verified_index ON public.companies USING btree (verified);


--
-- Name: jobs_category_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX jobs_category_index ON public.jobs USING btree (category);


--
-- Name: jobs_created_at_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX jobs_created_at_index ON public.jobs USING btree (created_at);


--
-- Name: jobs_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX jobs_is_active_index ON public.jobs USING btree (is_active);


--
-- Name: jobs_is_premium_created_at_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX jobs_is_premium_created_at_index ON public.jobs USING btree (is_premium, created_at);


--
-- Name: jobs_location_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX jobs_location_index ON public.jobs USING btree (location);


--
-- Name: jobs_status_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX jobs_status_is_active_index ON public.jobs USING btree (status, is_active);


--
-- Name: jobs_work_type_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX jobs_work_type_index ON public.jobs USING btree (work_type);


--
-- Name: land_loads_destination_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_loads_destination_index ON public.land_loads USING btree (destination);


--
-- Name: land_loads_ewid_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_loads_ewid_index ON public.land_loads USING btree (ewid);


--
-- Name: land_loads_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_loads_is_active_index ON public.land_loads USING btree (is_active);


--
-- Name: land_loads_is_premium_created_at_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_loads_is_premium_created_at_index ON public.land_loads USING btree (is_premium, created_at);


--
-- Name: land_loads_origin_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_loads_origin_index ON public.land_loads USING btree (origin);


--
-- Name: land_loads_pickup_date_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_loads_pickup_date_index ON public.land_loads USING btree (pickup_date);


--
-- Name: land_loads_service_type_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_loads_service_type_index ON public.land_loads USING btree (service_type);


--
-- Name: land_loads_status_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_loads_status_is_active_index ON public.land_loads USING btree (status, is_active);


--
-- Name: land_loads_user_id_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_loads_user_id_index ON public.land_loads USING btree (user_id);


--
-- Name: land_trucks_available_date_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_trucks_available_date_index ON public.land_trucks USING btree (available_date);


--
-- Name: land_trucks_current_location_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_trucks_current_location_index ON public.land_trucks USING btree (current_location);


--
-- Name: land_trucks_ewid_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_trucks_ewid_index ON public.land_trucks USING btree (ewid);


--
-- Name: land_trucks_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_trucks_is_active_index ON public.land_trucks USING btree (is_active);


--
-- Name: land_trucks_is_premium_created_at_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_trucks_is_premium_created_at_index ON public.land_trucks USING btree (is_premium, created_at);


--
-- Name: land_trucks_preferred_destination_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_trucks_preferred_destination_index ON public.land_trucks USING btree (preferred_destination);


--
-- Name: land_trucks_service_type_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_trucks_service_type_index ON public.land_trucks USING btree (service_type);


--
-- Name: land_trucks_status_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_trucks_status_is_active_index ON public.land_trucks USING btree (status, is_active);


--
-- Name: land_trucks_user_id_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX land_trucks_user_id_index ON public.land_trucks USING btree (user_id);


--
-- Name: premium_posts_end_time_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX premium_posts_end_time_index ON public.premium_posts USING btree (end_time);


--
-- Name: premium_posts_post_type_post_id_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX premium_posts_post_type_post_id_index ON public.premium_posts USING btree (post_type, post_id);


--
-- Name: premium_posts_premium_type_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX premium_posts_premium_type_is_active_index ON public.premium_posts USING btree (premium_type, is_active);


--
-- Name: resumes_created_at_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX resumes_created_at_index ON public.resumes USING btree (created_at);


--
-- Name: resumes_experience_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX resumes_experience_index ON public.resumes USING btree (experience);


--
-- Name: resumes_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX resumes_is_active_index ON public.resumes USING btree (is_active);


--
-- Name: resumes_is_premium_created_at_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX resumes_is_premium_created_at_index ON public.resumes USING btree (is_premium, created_at);


--
-- Name: resumes_location_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX resumes_location_index ON public.resumes USING btree (location);


--
-- Name: resumes_position_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX resumes_position_index ON public.resumes USING btree ("position");


--
-- Name: resumes_status_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX resumes_status_is_active_index ON public.resumes USING btree (status, is_active);


--
-- Name: system_config_config_key_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX system_config_config_key_index ON public.system_config USING btree (config_key);


--
-- Name: user_credits_log_reference_type_reference_id_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX user_credits_log_reference_type_reference_id_index ON public.user_credits_log USING btree (reference_type, reference_id);


--
-- Name: user_credits_log_type_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX user_credits_log_type_index ON public.user_credits_log USING btree (type);


--
-- Name: user_credits_log_user_id_created_at_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX user_credits_log_user_id_created_at_index ON public.user_credits_log USING btree (user_id, created_at);


--
-- Name: users_cognito_sub_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX users_cognito_sub_index ON public.users USING btree (cognito_sub);


--
-- Name: users_dot_number_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX users_dot_number_index ON public.users USING btree (dot_number);


--
-- Name: users_email_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX users_email_index ON public.users USING btree (email);


--
-- Name: users_is_active_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX users_is_active_index ON public.users USING btree (is_active);


--
-- Name: users_mc_number_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX users_mc_number_index ON public.users USING btree (mc_number);


--
-- Name: users_user_type_index; Type: INDEX; Schema: public; Owner: ew-user
--

CREATE INDEX users_user_type_index ON public.users USING btree (user_type);


--
-- Name: companies companies_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: land_loads land_loads_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.land_loads
    ADD CONSTRAINT land_loads_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: land_trucks land_trucks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.land_trucks
    ADD CONSTRAINT land_trucks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: premium_posts premium_posts_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.premium_posts
    ADD CONSTRAINT premium_posts_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resumes resumes_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_credits_log user_credits_log_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: ew-user
--

ALTER TABLE ONLY public.user_credits_log
    ADD CONSTRAINT user_credits_log_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: ew-josh
--

GRANT ALL ON SCHEMA public TO "ew-user";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: ew-josh
--

ALTER DEFAULT PRIVILEGES FOR ROLE "ew-josh" IN SCHEMA public GRANT ALL ON TABLES  TO "ew-user";


--
-- PostgreSQL database dump complete
--

