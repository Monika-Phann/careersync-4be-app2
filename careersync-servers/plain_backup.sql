--
-- PostgreSQL database dump
--

\restrict GB9MkWIdifc8F5O8p1TtAi01o6ZqkbFJJYUuac65W5Dc3qUXa0RwY6IO0jxi2MF

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-31 10:43:31

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 905 (class 1247 OID 139769)
-- Name: enum_Acc_User_gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Acc_User_gender" AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE public."enum_Acc_User_gender" OWNER TO postgres;

--
-- TOC entry 908 (class 1247 OID 139776)
-- Name: enum_Acc_User_types_user; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Acc_User_types_user" AS ENUM (
    'student',
    'professional',
    'institution'
);


ALTER TYPE public."enum_Acc_User_types_user" OWNER TO postgres;

--
-- TOC entry 917 (class 1247 OID 139820)
-- Name: enum_Booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Booking_status" AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled'
);


ALTER TYPE public."enum_Booking_status" OWNER TO postgres;

--
-- TOC entry 929 (class 1247 OID 139889)
-- Name: enum_Invoice_payment_method_snapshot; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Invoice_payment_method_snapshot" AS ENUM (
    'card',
    'bank_transfer',
    'cash'
);


ALTER TYPE public."enum_Invoice_payment_method_snapshot" OWNER TO postgres;

--
-- TOC entry 932 (class 1247 OID 139896)
-- Name: enum_Invoice_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Invoice_status" AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);


ALTER TYPE public."enum_Invoice_status" OWNER TO postgres;

--
-- TOC entry 950 (class 1247 OID 139989)
-- Name: enum_Mentor_Documents_document_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Mentor_Documents_document_type" AS ENUM (
    'cv',
    'certificate',
    'portfolio'
);


ALTER TYPE public."enum_Mentor_Documents_document_type" OWNER TO postgres;

--
-- TOC entry 944 (class 1247 OID 139956)
-- Name: enum_Mentor_approval_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Mentor_approval_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public."enum_Mentor_approval_status" OWNER TO postgres;

--
-- TOC entry 941 (class 1247 OID 139949)
-- Name: enum_Mentor_gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Mentor_gender" AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE public."enum_Mentor_gender" OWNER TO postgres;

--
-- TOC entry 962 (class 1247 OID 140045)
-- Name: enum_Payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Payment_status" AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);


ALTER TYPE public."enum_Payment_status" OWNER TO postgres;

--
-- TOC entry 977 (class 1247 OID 140116)
-- Name: enum_Users_role_name; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Users_role_name" AS ENUM (
    'admin',
    'mentor',
    'acc_user'
);


ALTER TYPE public."enum_Users_role_name" OWNER TO postgres;

--
-- TOC entry 980 (class 1247 OID 140124)
-- Name: enum_Users_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Users_status" AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'unverified',
    'verified',
    'blocked'
);


ALTER TYPE public."enum_Users_status" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 139783)
-- Name: Acc_User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Acc_User" (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    gender public."enum_Acc_User_gender" NOT NULL,
    dob date NOT NULL,
    types_user public."enum_Acc_User_types_user" NOT NULL,
    institution_name character varying(255) NOT NULL,
    profile_image character varying(255) NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Acc_User" OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 139805)
-- Name: Admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Admin" (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    full_name character varying(255),
    phone character varying(50),
    profile_image character varying(255),
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Admin" OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 139829)
-- Name: Booking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Booking" (
    id uuid NOT NULL,
    schedule_timeslot_id uuid NOT NULL,
    mentor_id uuid NOT NULL,
    acc_user_id uuid NOT NULL,
    position_id uuid NOT NULL,
    session_id uuid NOT NULL,
    cancelled_by uuid,
    updated_by uuid,
    mentor_name_snapshot character varying(255) NOT NULL,
    acc_user_name_snapshot character varying(255) NOT NULL,
    position_name_snapshot character varying(255) NOT NULL,
    session_price_snapshot numeric(10,2) NOT NULL,
    start_date_snapshot timestamp with time zone NOT NULL,
    end_date_snapshot timestamp with time zone NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public."enum_Booking_status" DEFAULT 'pending'::public."enum_Booking_status" NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Booking" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 139861)
-- Name: Certificate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Certificate" (
    id uuid NOT NULL,
    booking_id uuid,
    position_id uuid,
    acc_user_id uuid,
    mentor_id uuid,
    issued_by uuid,
    issue_date date NOT NULL,
    certificate_number character varying(100) NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Certificate" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 139877)
-- Name: Industry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Industry" (
    id uuid NOT NULL,
    industry_name character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Industry" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 139905)
-- Name: Invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invoice" (
    id uuid NOT NULL,
    payment_id uuid NOT NULL,
    mentor_id uuid,
    acc_user_id uuid,
    total_amount numeric(10,2) NOT NULL,
    mentor_name_snapshot character varying(255) NOT NULL,
    mentor_position_snapshot character varying(255) NOT NULL,
    acc_user_name_snapshot character varying(255) NOT NULL,
    start_date_snapshot timestamp with time zone NOT NULL,
    end_date_snapshot timestamp with time zone NOT NULL,
    session_price_snapshot numeric(10,2) NOT NULL,
    payment_method_snapshot public."enum_Invoice_payment_method_snapshot" NOT NULL,
    status public."enum_Invoice_status" DEFAULT 'pending'::public."enum_Invoice_status" NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 139931)
-- Name: Login_Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Login_Session" (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    row_num integer,
    refresh_token text NOT NULL,
    access_token text NOT NULL,
    device_info text,
    expired_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Login_Session" OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 139963)
-- Name: Mentor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Mentor" (
    id uuid NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    gender public."enum_Mentor_gender" NOT NULL,
    dob date NOT NULL,
    phone character varying(50) NOT NULL,
    job_title character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    position_id uuid NOT NULL,
    industry_id uuid NOT NULL,
    expertise_areas text,
    experience_years integer,
    company_name character varying(255),
    social_media character varying(255),
    about_mentor text,
    profile_image character varying(255),
    approval_status public."enum_Mentor_approval_status" DEFAULT 'pending'::public."enum_Mentor_approval_status" NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejected_by uuid,
    rejected_at timestamp with time zone,
    rejection_reason text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    session_rate numeric(10,2),
    meeting_location character varying(255),
    session_agenda_pdf character varying(500),
    portfolio_pdf character varying(500)
);


ALTER TABLE public."Mentor" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 139995)
-- Name: Mentor_Documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Mentor_Documents" (
    id uuid NOT NULL,
    mentor_id uuid NOT NULL,
    document_type public."enum_Mentor_Documents_document_type" DEFAULT 'cv'::public."enum_Mentor_Documents_document_type" NOT NULL,
    document_url text NOT NULL,
    is_primary_cv boolean DEFAULT false,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Mentor_Documents" OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 140011)
-- Name: Mentor_Education; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Mentor_Education" (
    id uuid NOT NULL,
    mentor_id uuid NOT NULL,
    university_name character varying(255) NOT NULL,
    degree_name character varying(255) NOT NULL,
    field_of_study character varying(255),
    year_graduated integer NOT NULL,
    grade_gpa character varying(10),
    activities text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Mentor_Education" OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 140026)
-- Name: Password_Reset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Password_Reset" (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    row_num integer,
    reset_token text NOT NULL,
    expires_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Password_Reset" OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 140053)
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id uuid NOT NULL,
    booking_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    commission numeric(10,2) NOT NULL,
    transaction_id character varying(255),
    pay_date timestamp with time zone,
    status public."enum_Payment_status" DEFAULT 'pending'::public."enum_Payment_status" NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 140070)
-- Name: Position; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Position" (
    id uuid NOT NULL,
    industry_id uuid,
    position_name character varying(255) NOT NULL,
    image_position character varying(255),
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Position" OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 140084)
-- Name: Schedule_Timeslot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Schedule_Timeslot" (
    id uuid NOT NULL,
    mentor_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    is_booked boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    booking_id uuid,
    session_id uuid NOT NULL
);


ALTER TABLE public."Schedule_Timeslot" OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 140096)
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id uuid NOT NULL,
    mentor_id uuid NOT NULL,
    position_id uuid NOT NULL,
    price numeric(10,2) NOT NULL,
    agenda_pdf character varying(255),
    location_name character varying(255) NOT NULL,
    location_map_url text NOT NULL,
    is_available boolean DEFAULT true,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 173450)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    role_name public."enum_Users_role_name" DEFAULT 'acc_user'::public."enum_Users_role_name" NOT NULL,
    status public."enum_Users_status" DEFAULT 'pending'::public."enum_Users_status" NOT NULL,
    email_verified_at timestamp with time zone,
    last_login timestamp with time zone,
    last_password_change timestamp with time zone,
    created_by uuid,
    verify_token character varying(255),
    verify_token_exp timestamp with time zone,
    email_verified boolean DEFAULT false,
    reset_token character varying(255),
    reset_token_exp timestamp with time zone,
    refresh_token text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 5305 (class 0 OID 139783)
-- Dependencies: 220
-- Data for Name: Acc_User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Acc_User" (id, user_id, first_name, last_name, phone, gender, dob, types_user, institution_name, profile_image, deleted_at, created_at, updated_at) FROM stdin;
268f5ab5-c950-4107-a98d-b5b41030eb35	7261525e-c0ea-430e-80a0-ff0b643db895	Monika	Phann	+85570372794	female	2006-03-07	student	anb	default.png	\N	2025-12-30 10:08:11.205+07	2025-12-30 10:08:11.205+07
\.


--
-- TOC entry 5306 (class 0 OID 139805)
-- Dependencies: 221
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Admin" (id, user_id, full_name, phone, profile_image, deleted_at, created_at, updated_at) FROM stdin;
7bb3401b-b1d3-4dab-ac8e-26b82b036bda	36299d1b-b94d-4a3e-9cc0-5c60e925f15c	Super Admin	+1234567890	default-admin.png	\N	2025-12-30 09:59:50.774+07	2025-12-30 09:59:50.774+07
\.


--
-- TOC entry 5307 (class 0 OID 139829)
-- Dependencies: 222
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Booking" (id, schedule_timeslot_id, mentor_id, acc_user_id, position_id, session_id, cancelled_by, updated_by, mentor_name_snapshot, acc_user_name_snapshot, position_name_snapshot, session_price_snapshot, start_date_snapshot, end_date_snapshot, total_amount, status, deleted_at, created_at, updated_at) FROM stdin;
a371a34c-3092-43ef-8a45-5a4a57d91503	96548218-6f4c-4836-88c8-322448f5afa0	5838e7ad-f02c-4605-a4d1-96e239ae7317	268f5ab5-c950-4107-a98d-b5b41030eb35	7b9528ba-39a4-4e6a-9311-9f928e399d50	834b4a79-b714-4985-be2b-eccea96c4c80	\N	\N	Satina Ni Ka	Monika Phann	Doctor (General Practitioner)	90.00	2025-12-30 08:33:00+07	2026-02-01 08:33:00+07	90.00	completed	\N	2025-12-30 15:34:10.329+07	2025-12-30 15:35:12.821+07
\.


--
-- TOC entry 5308 (class 0 OID 139861)
-- Dependencies: 223
-- Data for Name: Certificate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Certificate" (id, booking_id, position_id, acc_user_id, mentor_id, issued_by, issue_date, certificate_number, deleted_at, created_at, updated_at) FROM stdin;
0afa55b1-61d5-4bb8-b665-2123c3e0a7f7	a371a34c-3092-43ef-8a45-5a4a57d91503	7b9528ba-39a4-4e6a-9311-9f928e399d50	268f5ab5-c950-4107-a98d-b5b41030eb35	5838e7ad-f02c-4605-a4d1-96e239ae7317	5838e7ad-f02c-4605-a4d1-96e239ae7317	2025-12-30	CERT-2025-384732	\N	2025-12-30 15:35:12.827+07	2025-12-30 15:35:12.827+07
\.


--
-- TOC entry 5309 (class 0 OID 139877)
-- Dependencies: 224
-- Data for Name: Industry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Industry" (id, industry_name, created_at, updated_at) FROM stdin;
09b5b76d-b487-449a-a445-772cb22d8338	Software & Technology	2025-12-30 10:36:09.892+07	2025-12-30 10:36:09.892+07
d92dd7e8-d535-4ba0-b62d-9599b5130104	Data Science & Analytics	2025-12-30 10:36:44.042+07	2025-12-30 10:36:44.042+07
0320c37b-d74d-4845-978f-fbe5262408d1	Digital Marketing	2025-12-30 10:36:59.79+07	2025-12-30 10:36:59.79+07
6b6e19bc-6bc1-4998-9dc8-f4173b2d1d15	Finance & Accounting	2025-12-30 10:37:21.169+07	2025-12-30 10:37:21.169+07
549126a4-47db-4ba7-b7f7-ad4fe7c96217	Design & Creative	2025-12-30 10:37:37.174+07	2025-12-30 10:37:37.174+07
7e453eae-fcca-44be-a6e2-b255df0cc5f1	Product Management	2025-12-30 10:37:52.097+07	2025-12-30 10:37:52.097+07
859a7563-84b7-444f-9ce3-2790c571a6f4	Human Resources (HR)	2025-12-30 10:38:07.726+07	2025-12-30 10:38:07.726+07
627ca610-0876-431e-947d-92f4868e15c9	Sales & Business Development	2025-12-30 10:38:22.118+07	2025-12-30 10:38:22.118+07
17869604-c6aa-4354-8d8e-fb51fb36c7cc	Engineering	2025-12-30 10:38:47.019+07	2025-12-30 10:38:47.019+07
252d30a8-6592-4f30-9a21-ca0ca254a1e8	Healthcare & Medicine	2025-12-30 10:39:40.397+07	2025-12-30 10:39:40.397+07
\.


--
-- TOC entry 5310 (class 0 OID 139905)
-- Dependencies: 225
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Invoice" (id, payment_id, mentor_id, acc_user_id, total_amount, mentor_name_snapshot, mentor_position_snapshot, acc_user_name_snapshot, start_date_snapshot, end_date_snapshot, session_price_snapshot, payment_method_snapshot, status, deleted_at, created_at, updated_at) FROM stdin;
5e6c72d9-1414-49c5-bbb2-d4bdd899584c	7e393685-be02-42a2-9274-d5880270c044	5838e7ad-f02c-4605-a4d1-96e239ae7317	268f5ab5-c950-4107-a98d-b5b41030eb35	90.00	Satina Ni Ka	Doctor (General Practitioner)	Monika Phann	2025-12-30 08:33:00+07	2026-02-01 08:33:00+07	90.00	cash	pending	\N	2025-12-30 15:34:29.563+07	2025-12-30 15:34:29.563+07
\.


--
-- TOC entry 5311 (class 0 OID 139931)
-- Dependencies: 226
-- Data for Name: Login_Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Login_Session" (id, user_id, row_num, refresh_token, access_token, device_info, expired_at, deleted_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5312 (class 0 OID 139963)
-- Dependencies: 227
-- Data for Name: Mentor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Mentor" (id, first_name, last_name, gender, dob, phone, job_title, user_id, position_id, industry_id, expertise_areas, experience_years, company_name, social_media, about_mentor, profile_image, approval_status, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, deleted_at, created_at, updated_at, session_rate, meeting_location, session_agenda_pdf, portfolio_pdf) FROM stdin;
dd90ab6c-2a39-4996-8f3d-4601bf562862	Monika	Monika	male	2000-07-07	070372794	Senior developer	11ce76da-c0c1-4267-a8a5-efb43ed61e9f	7d57f830-33a6-4a35-8219-8051698f0399	d92dd7e8-d535-4ba0-b62d-9599b5130104	AI	5	Google	https://gemini.google.com/app	Yes, you can trust me	profile-1767069876533-166390274.png	approved	7bb3401b-b1d3-4dab-ac8e-26b82b036bda	2025-12-30 11:45:53.751+07	\N	\N	\N	\N	2025-12-30 11:44:36.851+07	2025-12-30 11:45:53.751+07	\N	\N	\N	\N
9d48265b-677a-40d9-a9af-cb56e3b100bf	Satina	Khun	female	2000-01-01	070372794	AI	f5c4ba19-4007-479e-9b8f-b36a3797c207	00db0189-5edc-4a81-b55e-ede63fdf927d	d92dd7e8-d535-4ba0-b62d-9599b5130104	AI	5	Google	https://gemini.google.com/app	yes	profile-1767075498480-829744567.png	approved	7bb3401b-b1d3-4dab-ac8e-26b82b036bda	2025-12-30 13:19:23.744+07	\N	\N	\N	\N	2025-12-30 13:18:18.632+07	2025-12-30 13:19:23.744+07	\N	\N	\N	\N
af9c2f03-b695-4afc-af0d-d4750eb74918	AI	Ni Ka	female	2000-01-01	070372794	AI	69d7d306-7420-49cb-8b44-266d98fd66cf	4227b384-88d1-4175-9daf-7576eea597bd	6b6e19bc-6bc1-4998-9dc8-f4173b2d1d15	AI	8	Freelance	https://gemini.google.com/u/1/app/55c174cd8228dd9a?pageId=none	yes	profile-1767076077093-851984868.jpg	approved	7bb3401b-b1d3-4dab-ac8e-26b82b036bda	2025-12-30 13:28:32.815+07	\N	\N	\N	\N	2025-12-30 13:27:57.219+07	2025-12-30 13:28:32.815+07	\N	\N	\N	\N
5838e7ad-f02c-4605-a4d1-96e239ae7317	Satina	Ni Ka	female	2000-10-10	070372794	AI	43847ba2-09b0-49e7-9c10-5c4bc26916a2	7b9528ba-39a4-4e6a-9311-9f928e399d50	252d30a8-6592-4f30-9a21-ca0ca254a1e8	AI	5	Google	https://gemini.google.com/u/1/app/55c174cd8228dd9a?pageId=none	hort klang	profile-1767076779416-486277376.png	approved	7bb3401b-b1d3-4dab-ac8e-26b82b036bda	2025-12-30 13:40:57.184+07	\N	\N	\N	\N	2025-12-30 13:39:39.579+07	2025-12-30 13:40:57.184+07	\N	\N	\N	\N
\.


--
-- TOC entry 5313 (class 0 OID 139995)
-- Dependencies: 228
-- Data for Name: Mentor_Documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Mentor_Documents" (id, mentor_id, document_type, document_url, is_primary_cv, deleted_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5314 (class 0 OID 140011)
-- Dependencies: 229
-- Data for Name: Mentor_Education; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Mentor_Education" (id, mentor_id, university_name, degree_name, field_of_study, year_graduated, grade_gpa, activities, deleted_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5315 (class 0 OID 140026)
-- Dependencies: 230
-- Data for Name: Password_Reset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Password_Reset" (id, user_id, row_num, reset_token, expires_at, deleted_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5316 (class 0 OID 140053)
-- Dependencies: 231
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, booking_id, amount, commission, transaction_id, pay_date, status, deleted_at, created_at, updated_at) FROM stdin;
7e393685-be02-42a2-9274-d5880270c044	a371a34c-3092-43ef-8a45-5a4a57d91503	90.00	18.00	\N	\N	pending	\N	2025-12-30 15:34:29.553+07	2025-12-30 15:34:29.553+07
\.


--
-- TOC entry 5317 (class 0 OID 140070)
-- Dependencies: 232
-- Data for Name: Position; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Position" (id, industry_id, position_name, image_position, description, created_at, updated_at) FROM stdin;
9bf99e7a-7b0f-4c8c-a2f2-aa58c1dd6f7c	09b5b76d-b487-449a-a445-772cb22d8338	Frontend Developer	\N	\N	2025-12-30 10:52:43.952046+07	2025-12-30 10:52:43.952046+07
e1555ab0-4fed-4d7c-86e6-bb8dcc73fd99	09b5b76d-b487-449a-a445-772cb22d8338	Backend Developer	\N	\N	2025-12-30 10:52:43.963565+07	2025-12-30 10:52:43.963565+07
ca324e39-e034-4bf9-88c8-9a2c8e22f1f9	09b5b76d-b487-449a-a445-772cb22d8338	Full Stack Developer	\N	\N	2025-12-30 10:52:43.968794+07	2025-12-30 10:52:43.968794+07
9c0927c6-5ded-4c41-8580-24aefc9856fb	09b5b76d-b487-449a-a445-772cb22d8338	DevOps Engineer	\N	\N	2025-12-30 10:52:43.975354+07	2025-12-30 10:52:43.975354+07
4457ceb0-24b9-4003-a349-dde8eca4d63e	09b5b76d-b487-449a-a445-772cb22d8338	Cybersecurity Analyst	\N	\N	2025-12-30 10:52:43.980669+07	2025-12-30 10:52:43.980669+07
00db0189-5edc-4a81-b55e-ede63fdf927d	d92dd7e8-d535-4ba0-b62d-9599b5130104	Data Scientist	\N	\N	2025-12-30 10:52:43.987019+07	2025-12-30 10:52:43.987019+07
7d57f830-33a6-4a35-8219-8051698f0399	d92dd7e8-d535-4ba0-b62d-9599b5130104	Data Analyst	\N	\N	2025-12-30 10:52:43.992651+07	2025-12-30 10:52:43.992651+07
df3c0613-5392-4c60-99a8-fd0c53d678ea	d92dd7e8-d535-4ba0-b62d-9599b5130104	Machine Learning Engineer	\N	\N	2025-12-30 10:52:44.001268+07	2025-12-30 10:52:44.001268+07
f1fca9be-58d2-4fcc-896f-28dcc441f88f	0320c37b-d74d-4845-978f-fbe5262408d1	SEO Specialist	\N	\N	2025-12-30 10:52:44.010067+07	2025-12-30 10:52:44.010067+07
39173b4b-bc11-481e-9f41-4d7f7ed138e4	0320c37b-d74d-4845-978f-fbe5262408d1	Social Media Manager	\N	\N	2025-12-30 10:52:44.015153+07	2025-12-30 10:52:44.015153+07
0bc70ddf-2ef9-40b4-adf0-6a149e03f227	0320c37b-d74d-4845-978f-fbe5262408d1	Content Strategist	\N	\N	2025-12-30 10:52:44.021505+07	2025-12-30 10:52:44.021505+07
1d4c66ed-2af9-4991-955f-3457b80100fa	6b6e19bc-6bc1-4998-9dc8-f4173b2d1d15	Investment Banker	\N	\N	2025-12-30 10:52:44.03588+07	2025-12-30 10:52:44.03588+07
4227b384-88d1-4175-9daf-7576eea597bd	6b6e19bc-6bc1-4998-9dc8-f4173b2d1d15	Auditor	\N	\N	2025-12-30 10:52:44.04535+07	2025-12-30 10:52:44.04535+07
ae0ea5d8-9595-4dda-99db-f171579a42aa	6b6e19bc-6bc1-4998-9dc8-f4173b2d1d15	Financial Analyst	\N	\N	2025-12-30 10:52:44.051323+07	2025-12-30 10:52:44.051323+07
57fdc914-fdc9-4d7c-9499-2ec3ab2cbf18	549126a4-47db-4ba7-b7f7-ad4fe7c96217	UI/UX Designer	\N	\N	2025-12-30 10:52:44.059803+07	2025-12-30 10:52:44.059803+07
958cb505-52c4-45e6-a1e5-11fbc1878f66	549126a4-47db-4ba7-b7f7-ad4fe7c96217	Graphic Designer	\N	\N	2025-12-30 10:52:44.065111+07	2025-12-30 10:52:44.065111+07
03ef64b4-d968-43de-b730-18e455aebd87	549126a4-47db-4ba7-b7f7-ad4fe7c96217	Video Editor	\N	\N	2025-12-30 10:52:44.071837+07	2025-12-30 10:52:44.071837+07
33425a08-7c6c-4f6c-9ae5-0e85e817decf	7e453eae-fcca-44be-a6e2-b255df0cc5f1	Product Manager	\N	\N	2025-12-30 10:52:44.07885+07	2025-12-30 10:52:44.07885+07
d883585d-0bf0-4154-971a-139303454b96	7e453eae-fcca-44be-a6e2-b255df0cc5f1	Project Manager	\N	\N	2025-12-30 10:52:44.083274+07	2025-12-30 10:52:44.083274+07
6dcb3262-9743-4e55-8397-dfef67c914ae	859a7563-84b7-444f-9ce3-2790c571a6f4	HR Recruiter	\N	\N	2025-12-30 10:52:44.089213+07	2025-12-30 10:52:44.089213+07
164925fa-7b47-4ab8-9faa-d26a093e182e	859a7563-84b7-444f-9ce3-2790c571a6f4	Talent Acquisition Manager	\N	\N	2025-12-30 10:52:44.097485+07	2025-12-30 10:52:44.097485+07
2d09dc72-7b67-491b-8da4-1ae02e5e46d9	627ca610-0876-431e-947d-92f4868e15c9	Sales Representative	\N	\N	2025-12-30 10:52:44.104934+07	2025-12-30 10:52:44.104934+07
d0ab5846-9a8e-4edb-be3f-5dc69504d179	627ca610-0876-431e-947d-92f4868e15c9	Business Development Manager	\N	\N	2025-12-30 10:52:44.111391+07	2025-12-30 10:52:44.111391+07
81a28dfb-6d92-4e2b-b723-ac0c51a9a3c5	17869604-c6aa-4354-8d8e-fb51fb36c7cc	Civil Engineer	\N	\N	2025-12-30 10:52:44.118264+07	2025-12-30 10:52:44.118264+07
2f9bbda7-513e-462a-a953-986e300c497d	17869604-c6aa-4354-8d8e-fb51fb36c7cc	Mechanical Engineer	\N	\N	2025-12-30 10:52:44.125391+07	2025-12-30 10:52:44.125391+07
dcdcb14d-1f1c-48ae-ac6e-51090a2a1277	17869604-c6aa-4354-8d8e-fb51fb36c7cc	Electrical Engineer	\N	\N	2025-12-30 10:52:44.135793+07	2025-12-30 10:52:44.135793+07
7b9528ba-39a4-4e6a-9311-9f928e399d50	252d30a8-6592-4f30-9a21-ca0ca254a1e8	Doctor (General Practitioner)	\N	\N	2025-12-30 10:52:44.142986+07	2025-12-30 10:52:44.142986+07
9ac8f2e9-57e5-4c15-8d1f-26d350be860b	252d30a8-6592-4f30-9a21-ca0ca254a1e8	Nurse	\N	\N	2025-12-30 10:55:19.182691+07	2025-12-30 10:55:19.182691+07
\.


--
-- TOC entry 5318 (class 0 OID 140084)
-- Dependencies: 233
-- Data for Name: Schedule_Timeslot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Schedule_Timeslot" (id, mentor_id, start_time, end_time, is_booked, created_at, updated_at, booking_id, session_id) FROM stdin;
96548218-6f4c-4836-88c8-322448f5afa0	5838e7ad-f02c-4605-a4d1-96e239ae7317	2025-12-30 08:33:00+07	2026-02-01 08:33:00+07	t	2025-12-30 15:33:25.078+07	2025-12-30 15:34:10.341+07	a371a34c-3092-43ef-8a45-5a4a57d91503	834b4a79-b714-4985-be2b-eccea96c4c80
\.


--
-- TOC entry 5319 (class 0 OID 140096)
-- Dependencies: 234
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, mentor_id, position_id, price, agenda_pdf, location_name, location_map_url, is_available, deleted_at, created_at, updated_at) FROM stdin;
e96218c9-dcfc-4fe6-acdb-ced4c29aee1c	5838e7ad-f02c-4605-a4d1-96e239ae7317	7b9528ba-39a4-4e6a-9311-9f928e399d50	60.00	agenda-1767078459480-386078904.pdf	connexion	https://www.google.com/maps/place/Connexion/@11.5523251,104.940202,17z/data=!3m1!4b1!4m6!3m5!1s0x310957184bf08e1b:0x365bb9c7c55cd1f!8m2!3d11.5523251!4d104.9427769!16s%2Fg%2F11vl3z1vyr?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D	t	\N	2025-12-30 14:07:39.488+07	2025-12-30 14:07:39.488+07
834b4a79-b714-4985-be2b-eccea96c4c80	5838e7ad-f02c-4605-a4d1-96e239ae7317	7b9528ba-39a4-4e6a-9311-9f928e399d50	90.00	agenda-1767078516362-532693035.pdf	Koh Norea	https://www.google.com/maps/place/Connexion/@11.5523251,104.940202,17z/data=!3m1!4b1!4m6!3m5!1s0x310957184bf08e1b:0x365bb9c7c55cd1f!8m2!3d11.5523251!4d104.9427769!16s%2Fg%2F11vl3z1vyr?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D	t	\N	2025-12-30 14:08:36.368+07	2025-12-30 14:08:36.368+07
\.


--
-- TOC entry 5320 (class 0 OID 173450)
-- Dependencies: 235
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, email, password, role_name, status, email_verified_at, last_login, last_password_change, created_by, verify_token, verify_token_exp, email_verified, reset_token, reset_token_exp, refresh_token, created_at, updated_at) FROM stdin;
36299d1b-b94d-4a3e-9cc0-5c60e925f15c	careersync168@gmail.com	$2b$10$Gwrw1HYbuyfETlMHe244U.sckDM2ehhkzgoBZf2ODW6Oc.tBStsie	admin	verified	\N	\N	\N	\N	\N	\N	t	\N	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM2Mjk5ZDFiLWI5NGQtNGEzZS05Y2MwLTVjNjBlOTI1ZjE1YyIsImlhdCI6MTc2NzA3NjgyMSwiZXhwIjoxNzY3NjgxNjIxfQ.Aq2rZRc-lyJ5GYCiPEftC6aQ74g95mrUFFcIr7rss58	2025-12-30 09:59:50.765+07	2025-12-30 13:40:21.113+07
43847ba2-09b0-49e7-9c10-5c4bc26916a2	leaderteam522@gmail.com	$2b$10$C2UevUDI/qQTOC2.LzFagepvnMMKAKZbfrWFJRiCwhs47/ReO2QJG	mentor	verified	\N	\N	\N	\N	\N	\N	t	\N	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzODQ3YmEyLTA5YjAtNDllNy05YzEwLTVjNGJjMjY5MTZhMiIsImlhdCI6MTc2NzA4MzYyMywiZXhwIjoxNzY3Njg4NDIzfQ.AnKv6k6XXAUYNza5YuFiNuP6iiRMfFhizDexux-pnIg	2025-12-30 13:39:39.575+07	2025-12-30 15:33:43.759+07
7261525e-c0ea-430e-80a0-ff0b643db895	nika00tgi@gmail.com	$2b$10$bH.4ee/LsA1tZemM3a.NleR2CcRNTM4xeJFEYp0WlsRLmV/h8BlTK	acc_user	pending	\N	\N	\N	\N	\N	\N	t	\N	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjcyNjE1MjVlLWMwZWEtNDMwZS04MGEwLWZmMGI2NDNkYjg5NSIsImlhdCI6MTc2NzA4MzYzNSwiZXhwIjoxNzY3Njg4NDM1fQ.aWSQhkhoKlH4HGpd57FlKpfPa9mXMO4N1GF-E2uwLPU	2025-12-30 10:08:11.199+07	2025-12-30 15:33:55.872+07
f5c4ba19-4007-479e-9b8f-b36a3797c207	satinakhun2@gmai.com	$2b$10$Lz.ACHtxZboXHDePPcOe0eeHvPUHdT2k4FqBvd3jPFhq47kYFpOUi	mentor	verified	\N	\N	\N	\N	\N	\N	t	\N	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY1YzRiYTE5LTQwMDctNDc5ZS05YjhmLWIzNmEzNzk3YzIwNyIsImlhdCI6MTc2NzA3NTgwMiwiZXhwIjoxNzY3NjgwNjAyfQ.rC3k5Un0uVsmm8UyR7xQ15hpyQMkP2Wb3q1cmZCDYVQ	2025-12-30 13:18:18.623+07	2025-12-30 13:23:22.522+07
11ce76da-c0c1-4267-a8a5-efb43ed61e9f	monika003006@gmail.com	$2b$10$u3ra7vTD6rw4biEEaYYqNejdOvkcpRFICq7KT9/bT57C2W2VibFrG	mentor	verified	\N	\N	\N	\N	\N	\N	t	\N	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExY2U3NmRhLWMwYzEtNDI2Ny1hOGE1LWVmYjQzZWQ2MWU5ZiIsImlhdCI6MTc2NzA3NTgyMSwiZXhwIjoxNzY3NjgwNjIxfQ.vxZq9_tDH8qmFtFSNQuAaoa9oZjEZw8N3yJW6Ft_u2k	2025-12-30 11:44:36.838+07	2025-12-30 13:23:41.188+07
69d7d306-7420-49cb-8b44-266d98fd66cf	satinakhun1@gmai.com	$2b$10$j8uZVd67pYKFEC4DAqdln.OG.xuBN53p8JfEcgfeMMhh9kSBdi9yS	mentor	verified	\N	\N	\N	\N	\N	\N	t	\N	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDdkMzA2LTc0MjAtNDljYi04YjQ0LTI2NmQ5OGZkNjZjZiIsImlhdCI6MTc2NzA3NjI4NiwiZXhwIjoxNzY3NjgxMDg2fQ.8V8vA5EK476RihwwCbexK1KZsWO3fLv4nRt9or35GzQ	2025-12-30 13:27:57.216+07	2025-12-30 13:31:26.387+07
\.


--
-- TOC entry 4998 (class 2606 OID 139801)
-- Name: Acc_User Acc_User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Acc_User"
    ADD CONSTRAINT "Acc_User_pkey" PRIMARY KEY (id);


--
-- TOC entry 5000 (class 2606 OID 139803)
-- Name: Acc_User Acc_User_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Acc_User"
    ADD CONSTRAINT "Acc_User_user_id_key" UNIQUE (user_id);


--
-- TOC entry 5003 (class 2606 OID 139815)
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);


--
-- TOC entry 5005 (class 2606 OID 139817)
-- Name: Admin Admin_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_user_id_key" UNIQUE (user_id);


--
-- TOC entry 5008 (class 2606 OID 139852)
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- TOC entry 5010 (class 2606 OID 139854)
-- Name: Booking Booking_schedule_timeslot_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_schedule_timeslot_id_key" UNIQUE (schedule_timeslot_id);


--
-- TOC entry 5018 (class 2606 OID 174324)
-- Name: Certificate Certificate_certificate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_certificate_number_key" UNIQUE (certificate_number);


--
-- TOC entry 5020 (class 2606 OID 174326)
-- Name: Certificate Certificate_certificate_number_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_certificate_number_key1" UNIQUE (certificate_number);


--
-- TOC entry 5022 (class 2606 OID 174328)
-- Name: Certificate Certificate_certificate_number_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_certificate_number_key2" UNIQUE (certificate_number);


--
-- TOC entry 5024 (class 2606 OID 174322)
-- Name: Certificate Certificate_certificate_number_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_certificate_number_key3" UNIQUE (certificate_number);


--
-- TOC entry 5026 (class 2606 OID 139870)
-- Name: Certificate Certificate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_pkey" PRIMARY KEY (id);


--
-- TOC entry 5032 (class 2606 OID 174094)
-- Name: Industry Industry_industry_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Industry"
    ADD CONSTRAINT "Industry_industry_name_key" UNIQUE (industry_name);


--
-- TOC entry 5034 (class 2606 OID 174096)
-- Name: Industry Industry_industry_name_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Industry"
    ADD CONSTRAINT "Industry_industry_name_key1" UNIQUE (industry_name);


--
-- TOC entry 5036 (class 2606 OID 174098)
-- Name: Industry Industry_industry_name_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Industry"
    ADD CONSTRAINT "Industry_industry_name_key2" UNIQUE (industry_name);


--
-- TOC entry 5038 (class 2606 OID 174092)
-- Name: Industry Industry_industry_name_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Industry"
    ADD CONSTRAINT "Industry_industry_name_key3" UNIQUE (industry_name);


--
-- TOC entry 5040 (class 2606 OID 139885)
-- Name: Industry Industry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Industry"
    ADD CONSTRAINT "Industry_pkey" PRIMARY KEY (id);


--
-- TOC entry 5042 (class 2606 OID 139927)
-- Name: Invoice Invoice_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_payment_id_key" UNIQUE (payment_id);


--
-- TOC entry 5044 (class 2606 OID 139925)
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- TOC entry 5049 (class 2606 OID 139943)
-- Name: Login_Session Login_Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Login_Session"
    ADD CONSTRAINT "Login_Session_pkey" PRIMARY KEY (id);


--
-- TOC entry 5051 (class 2606 OID 174343)
-- Name: Login_Session Login_Session_row_num_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Login_Session"
    ADD CONSTRAINT "Login_Session_row_num_key" UNIQUE (row_num);


--
-- TOC entry 5053 (class 2606 OID 174345)
-- Name: Login_Session Login_Session_row_num_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Login_Session"
    ADD CONSTRAINT "Login_Session_row_num_key1" UNIQUE (row_num);


--
-- TOC entry 5055 (class 2606 OID 174347)
-- Name: Login_Session Login_Session_row_num_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Login_Session"
    ADD CONSTRAINT "Login_Session_row_num_key2" UNIQUE (row_num);


--
-- TOC entry 5057 (class 2606 OID 174341)
-- Name: Login_Session Login_Session_row_num_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Login_Session"
    ADD CONSTRAINT "Login_Session_row_num_key3" UNIQUE (row_num);


--
-- TOC entry 5067 (class 2606 OID 140009)
-- Name: Mentor_Documents Mentor_Documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mentor_Documents"
    ADD CONSTRAINT "Mentor_Documents_pkey" PRIMARY KEY (id);


--
-- TOC entry 5070 (class 2606 OID 140024)
-- Name: Mentor_Education Mentor_Education_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mentor_Education"
    ADD CONSTRAINT "Mentor_Education_pkey" PRIMARY KEY (id);


--
-- TOC entry 5061 (class 2606 OID 139983)
-- Name: Mentor Mentor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mentor"
    ADD CONSTRAINT "Mentor_pkey" PRIMARY KEY (id);


--
-- TOC entry 5073 (class 2606 OID 140037)
-- Name: Password_Reset Password_Reset_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_pkey" PRIMARY KEY (id);


--
-- TOC entry 5075 (class 2606 OID 174373)
-- Name: Password_Reset Password_Reset_reset_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_reset_token_key" UNIQUE (reset_token);


--
-- TOC entry 5077 (class 2606 OID 174375)
-- Name: Password_Reset Password_Reset_reset_token_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_reset_token_key1" UNIQUE (reset_token);


--
-- TOC entry 5079 (class 2606 OID 174377)
-- Name: Password_Reset Password_Reset_reset_token_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_reset_token_key2" UNIQUE (reset_token);


--
-- TOC entry 5081 (class 2606 OID 174371)
-- Name: Password_Reset Password_Reset_reset_token_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_reset_token_key3" UNIQUE (reset_token);


--
-- TOC entry 5083 (class 2606 OID 174363)
-- Name: Password_Reset Password_Reset_row_num_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_row_num_key" UNIQUE (row_num);


--
-- TOC entry 5085 (class 2606 OID 174365)
-- Name: Password_Reset Password_Reset_row_num_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_row_num_key1" UNIQUE (row_num);


--
-- TOC entry 5087 (class 2606 OID 174367)
-- Name: Password_Reset Password_Reset_row_num_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_row_num_key2" UNIQUE (row_num);


--
-- TOC entry 5089 (class 2606 OID 174361)
-- Name: Password_Reset Password_Reset_row_num_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_row_num_key3" UNIQUE (row_num);


--
-- TOC entry 5093 (class 2606 OID 140067)
-- Name: Payment Payment_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_booking_id_key" UNIQUE (booking_id);


--
-- TOC entry 5095 (class 2606 OID 140065)
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- TOC entry 5099 (class 2606 OID 140080)
-- Name: Position Position_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_pkey" PRIMARY KEY (id);


--
-- TOC entry 5101 (class 2606 OID 174112)
-- Name: Position Position_position_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_position_name_key" UNIQUE (position_name);


--
-- TOC entry 5103 (class 2606 OID 174114)
-- Name: Position Position_position_name_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_position_name_key1" UNIQUE (position_name);


--
-- TOC entry 5105 (class 2606 OID 174116)
-- Name: Position Position_position_name_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_position_name_key2" UNIQUE (position_name);


--
-- TOC entry 5107 (class 2606 OID 174110)
-- Name: Position Position_position_name_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_position_name_key3" UNIQUE (position_name);


--
-- TOC entry 5110 (class 2606 OID 140095)
-- Name: Schedule_Timeslot Schedule_Timeslot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule_Timeslot"
    ADD CONSTRAINT "Schedule_Timeslot_pkey" PRIMARY KEY (id);


--
-- TOC entry 5112 (class 2606 OID 140111)
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- TOC entry 5117 (class 2606 OID 174064)
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 5119 (class 2606 OID 174066)
-- Name: Users Users_email_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key1" UNIQUE (email);


--
-- TOC entry 5121 (class 2606 OID 174062)
-- Name: Users Users_email_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key2" UNIQUE (email);


--
-- TOC entry 5123 (class 2606 OID 173466)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 5001 (class 1259 OID 139804)
-- Name: acc__user_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX acc__user_user_id ON public."Acc_User" USING btree (user_id);


--
-- TOC entry 5006 (class 1259 OID 139818)
-- Name: admin_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admin_user_id ON public."Admin" USING btree (user_id);


--
-- TOC entry 5011 (class 1259 OID 139856)
-- Name: booking_acc_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_acc_user_id ON public."Booking" USING btree (acc_user_id);


--
-- TOC entry 5012 (class 1259 OID 174249)
-- Name: booking_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_created_at ON public."Booking" USING btree (created_at);


--
-- TOC entry 5013 (class 1259 OID 139855)
-- Name: booking_mentor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_mentor_id ON public."Booking" USING btree (mentor_id);


--
-- TOC entry 5014 (class 1259 OID 139859)
-- Name: booking_schedule_timeslot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_schedule_timeslot_id ON public."Booking" USING btree (schedule_timeslot_id);


--
-- TOC entry 5015 (class 1259 OID 139860)
-- Name: booking_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_session_id ON public."Booking" USING btree (session_id);


--
-- TOC entry 5016 (class 1259 OID 174247)
-- Name: booking_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_status ON public."Booking" USING btree (status);


--
-- TOC entry 5027 (class 1259 OID 139874)
-- Name: certificate_acc_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX certificate_acc_user_id ON public."Certificate" USING btree (acc_user_id);


--
-- TOC entry 5028 (class 1259 OID 139876)
-- Name: certificate_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX certificate_booking_id ON public."Certificate" USING btree (booking_id);


--
-- TOC entry 5029 (class 1259 OID 174329)
-- Name: certificate_certificate_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX certificate_certificate_number ON public."Certificate" USING btree (certificate_number);


--
-- TOC entry 5030 (class 1259 OID 139875)
-- Name: certificate_mentor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX certificate_mentor_id ON public."Certificate" USING btree (mentor_id);


--
-- TOC entry 5045 (class 1259 OID 139930)
-- Name: invoice_acc_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoice_acc_user_id ON public."Invoice" USING btree (acc_user_id);


--
-- TOC entry 5046 (class 1259 OID 139929)
-- Name: invoice_mentor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoice_mentor_id ON public."Invoice" USING btree (mentor_id);


--
-- TOC entry 5047 (class 1259 OID 139928)
-- Name: invoice_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoice_payment_id ON public."Invoice" USING btree (payment_id);


--
-- TOC entry 5058 (class 1259 OID 174348)
-- Name: login__session_refresh_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX login__session_refresh_token ON public."Login_Session" USING btree (refresh_token);


--
-- TOC entry 5059 (class 1259 OID 139946)
-- Name: login__session_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX login__session_user_id ON public."Login_Session" USING btree (user_id);


--
-- TOC entry 5068 (class 1259 OID 140010)
-- Name: mentor__documents_mentor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mentor__documents_mentor_id ON public."Mentor_Documents" USING btree (mentor_id);


--
-- TOC entry 5071 (class 1259 OID 140025)
-- Name: mentor__education_mentor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mentor__education_mentor_id ON public."Mentor_Education" USING btree (mentor_id);


--
-- TOC entry 5062 (class 1259 OID 174150)
-- Name: mentor_approval_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mentor_approval_status ON public."Mentor" USING btree (approval_status);


--
-- TOC entry 5063 (class 1259 OID 139986)
-- Name: mentor_industry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mentor_industry_id ON public."Mentor" USING btree (industry_id);


--
-- TOC entry 5064 (class 1259 OID 139985)
-- Name: mentor_position_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mentor_position_id ON public."Mentor" USING btree (position_id);


--
-- TOC entry 5065 (class 1259 OID 139987)
-- Name: mentor_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mentor_user_id ON public."Mentor" USING btree (user_id);


--
-- TOC entry 5090 (class 1259 OID 174378)
-- Name: password__reset_reset_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX password__reset_reset_token ON public."Password_Reset" USING btree (reset_token);


--
-- TOC entry 5091 (class 1259 OID 140042)
-- Name: password__reset_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX password__reset_user_id ON public."Password_Reset" USING btree (user_id);


--
-- TOC entry 5096 (class 1259 OID 140068)
-- Name: payment_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_booking_id ON public."Payment" USING btree (booking_id);


--
-- TOC entry 5097 (class 1259 OID 174261)
-- Name: payment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_status ON public."Payment" USING btree (status);


--
-- TOC entry 5108 (class 1259 OID 140083)
-- Name: position_industry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX position_industry_id ON public."Position" USING btree (industry_id);


--
-- TOC entry 5113 (class 1259 OID 174189)
-- Name: session_is_available; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX session_is_available ON public."Session" USING btree (is_available);


--
-- TOC entry 5114 (class 1259 OID 140112)
-- Name: session_mentor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX session_mentor_id ON public."Session" USING btree (mentor_id);


--
-- TOC entry 5115 (class 1259 OID 140113)
-- Name: session_position_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX session_position_id ON public."Session" USING btree (position_id);


--
-- TOC entry 5124 (class 1259 OID 174067)
-- Name: users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email ON public."Users" USING btree (email);


--
-- TOC entry 5125 (class 1259 OID 174086)
-- Name: users_reset_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_reset_token ON public."Users" USING btree (reset_token);


--
-- TOC entry 5126 (class 1259 OID 174072)
-- Name: users_role_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_name ON public."Users" USING btree (role_name);


--
-- TOC entry 5127 (class 1259 OID 174076)
-- Name: users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_status ON public."Users" USING btree (status);


--
-- TOC entry 5128 (class 1259 OID 174083)
-- Name: users_verify_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_verify_token ON public."Users" USING btree (verify_token);


--
-- TOC entry 5129 (class 2606 OID 174159)
-- Name: Acc_User Acc_User_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Acc_User"
    ADD CONSTRAINT "Acc_User_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5130 (class 2606 OID 174120)
-- Name: Admin Admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5131 (class 2606 OID 174223)
-- Name: Booking Booking_acc_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_acc_user_id_fkey" FOREIGN KEY (acc_user_id) REFERENCES public."Acc_User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5132 (class 2606 OID 174218)
-- Name: Booking Booking_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_mentor_id_fkey" FOREIGN KEY (mentor_id) REFERENCES public."Mentor"(id) ON UPDATE CASCADE;


--
-- TOC entry 5133 (class 2606 OID 174228)
-- Name: Booking Booking_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_position_id_fkey" FOREIGN KEY (position_id) REFERENCES public."Position"(id) ON UPDATE CASCADE;


--
-- TOC entry 5134 (class 2606 OID 174213)
-- Name: Booking Booking_schedule_timeslot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_schedule_timeslot_id_fkey" FOREIGN KEY (schedule_timeslot_id) REFERENCES public."Schedule_Timeslot"(id) ON UPDATE CASCADE;


--
-- TOC entry 5135 (class 2606 OID 174233)
-- Name: Booking Booking_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public."Session"(id) ON UPDATE CASCADE;


--
-- TOC entry 5136 (class 2606 OID 174303)
-- Name: Certificate Certificate_acc_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_acc_user_id_fkey" FOREIGN KEY (acc_user_id) REFERENCES public."Acc_User"(id) ON UPDATE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 174293)
-- Name: Certificate Certificate_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5138 (class 2606 OID 174313)
-- Name: Certificate Certificate_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_issued_by_fkey" FOREIGN KEY (issued_by) REFERENCES public."Mentor"(id) ON UPDATE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 174308)
-- Name: Certificate Certificate_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_mentor_id_fkey" FOREIGN KEY (mentor_id) REFERENCES public."Mentor"(id) ON UPDATE CASCADE;


--
-- TOC entry 5140 (class 2606 OID 174298)
-- Name: Certificate Certificate_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_position_id_fkey" FOREIGN KEY (position_id) REFERENCES public."Position"(id) ON UPDATE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 174275)
-- Name: Invoice Invoice_acc_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_acc_user_id_fkey" FOREIGN KEY (acc_user_id) REFERENCES public."Acc_User"(id) ON UPDATE CASCADE;


--
-- TOC entry 5142 (class 2606 OID 174270)
-- Name: Invoice Invoice_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_mentor_id_fkey" FOREIGN KEY (mentor_id) REFERENCES public."Mentor"(id) ON UPDATE CASCADE;


--
-- TOC entry 5143 (class 2606 OID 174265)
-- Name: Invoice Invoice_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5144 (class 2606 OID 174333)
-- Name: Login_Session Login_Session_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Login_Session"
    ADD CONSTRAINT "Login_Session_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5145 (class 2606 OID 174152)
-- Name: Mentor Mentor_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mentor"
    ADD CONSTRAINT "Mentor_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES public."Admin"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5146 (class 2606 OID 174143)
-- Name: Mentor Mentor_industry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mentor"
    ADD CONSTRAINT "Mentor_industry_id_fkey" FOREIGN KEY (industry_id) REFERENCES public."Industry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5147 (class 2606 OID 174138)
-- Name: Mentor Mentor_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mentor"
    ADD CONSTRAINT "Mentor_position_id_fkey" FOREIGN KEY (position_id) REFERENCES public."Position"(id) ON UPDATE CASCADE;


--
-- TOC entry 5148 (class 2606 OID 174133)
-- Name: Mentor Mentor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mentor"
    ADD CONSTRAINT "Mentor_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5149 (class 2606 OID 174353)
-- Name: Password_Reset Password_Reset_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Password_Reset"
    ADD CONSTRAINT "Password_Reset_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5150 (class 2606 OID 174252)
-- Name: Payment Payment_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5151 (class 2606 OID 174102)
-- Name: Position Position_industry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_industry_id_fkey" FOREIGN KEY (industry_id) REFERENCES public."Industry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5152 (class 2606 OID 174203)
-- Name: Schedule_Timeslot Schedule_Timeslot_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule_Timeslot"
    ADD CONSTRAINT "Schedule_Timeslot_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5153 (class 2606 OID 174192)
-- Name: Schedule_Timeslot Schedule_Timeslot_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule_Timeslot"
    ADD CONSTRAINT "Schedule_Timeslot_mentor_id_fkey" FOREIGN KEY (mentor_id) REFERENCES public."Mentor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5154 (class 2606 OID 174208)
-- Name: Schedule_Timeslot Schedule_Timeslot_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule_Timeslot"
    ADD CONSTRAINT "Schedule_Timeslot_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5155 (class 2606 OID 174174)
-- Name: Session Session_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_mentor_id_fkey" FOREIGN KEY (mentor_id) REFERENCES public."Mentor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5156 (class 2606 OID 174179)
-- Name: Session Session_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_position_id_fkey" FOREIGN KEY (position_id) REFERENCES public."Position"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5157 (class 2606 OID 174078)
-- Name: Users Users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


-- Completed on 2025-12-31 10:43:31

--
-- PostgreSQL database dump complete
--

\unrestrict GB9MkWIdifc8F5O8p1TtAi01o6ZqkbFJJYUuac65W5Dc3qUXa0RwY6IO0jxi2MF

