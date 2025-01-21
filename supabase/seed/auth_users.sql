--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.10 (Homebrew)

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

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	0e59589d-b0f1-4fbd-9d53-a13dcf99fcaa	authenticated	authenticated	akms0929roll@gmail.com	\N	2025-01-14 00:21:27.838993+00	\N		\N		\N			\N	2025-01-20 05:22:41.984998+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "101776956563670005137", "name": "菅井瑛正", "email": "akms0929roll@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLk52BcNirNw2Jv-WX6oTOg4BPhn2w0LjQv_z64OSPe6YOHRmvQ=s96-c", "full_name": "菅井瑛正", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLk52BcNirNw2Jv-WX6oTOg4BPhn2w0LjQv_z64OSPe6YOHRmvQ=s96-c", "provider_id": "101776956563670005137", "email_verified": true, "phone_verified": false}	\N	2025-01-14 00:21:27.815554+00	2025-01-20 05:22:41.986787+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	3083d95c-b34d-49fe-bf50-1efd90b78262	authenticated	authenticated	akms0929ama@gmail.com	\N	2025-01-09 12:07:46.542432+00	\N		\N		\N			\N	2025-01-20 05:23:15.543965+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "101827281131688245094", "name": "akimasa sugai", "email": "akms0929ama@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLQ2Gm6lwpcUjnZwsMg7pG2rpIUJ9yAIhYS133CG7osen3t8kFQ=s96-c", "full_name": "akimasa sugai", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLQ2Gm6lwpcUjnZwsMg7pG2rpIUJ9yAIhYS133CG7osen3t8kFQ=s96-c", "provider_id": "101827281131688245094", "email_verified": true, "phone_verified": false}	\N	2025-01-09 12:07:46.520507+00	2025-01-20 10:36:31.377841+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	93da4ffc-3abb-4e2e-bdf4-f855cb252296	authenticated	authenticated	goldsugar7@gmail.com	\N	2025-01-18 13:17:32.009084+00	\N		\N		\N			\N	2025-01-19 13:51:55.79078+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "103597199757891301803", "name": "Hiroe Sugai", "email": "goldsugar7@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIctCXCS19Fu-CrzAKldS2lRun0LRXSTO1r-b1dBTgtvmritQ=s96-c", "full_name": "Hiroe Sugai", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIctCXCS19Fu-CrzAKldS2lRun0LRXSTO1r-b1dBTgtvmritQ=s96-c", "provider_id": "103597199757891301803", "email_verified": true, "phone_verified": false}	\N	2025-01-18 13:17:31.98903+00	2025-01-19 13:51:55.798697+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	97b6075c-7436-44c5-83ea-c8cbe5370094	authenticated	authenticated	jyyr8885@gmail.com	\N	2025-01-20 06:33:04.973427+00	\N		\N		\N			\N	2025-01-20 08:38:18.535335+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "106472164147911844663", "name": "鈴木潤", "email": "jyyr8885@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocL-fQuyjn0q7BFS6H7Axi3Yd9sJHJSsfvjD_V1DvDn4nHuyYw=s96-c", "full_name": "鈴木潤", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocL-fQuyjn0q7BFS6H7Axi3Yd9sJHJSsfvjD_V1DvDn4nHuyYw=s96-c", "provider_id": "106472164147911844663", "email_verified": true, "phone_verified": false}	\N	2025-01-20 06:33:04.951396+00	2025-01-20 08:38:18.541905+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- PostgreSQL database dump complete
--

