

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


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."attendance_type" AS ENUM (
    'FUNERAL',
    'CONDOLENCE_VISIT'
);


ALTER TYPE "public"."attendance_type" OWNER TO "postgres";


CREATE TYPE "public"."delivery_method" AS ENUM (
    'MAIL',
    'HAND',
    'DELIVERY',
    'OTHER'
);


ALTER TYPE "public"."delivery_method" OWNER TO "postgres";


CREATE TYPE "public"."invitation_status" AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'expired',
    'canceled'
);


ALTER TYPE "public"."invitation_status" OWNER TO "postgres";


CREATE TYPE "public"."invitation_type" AS ENUM (
    'email',
    'share'
);


ALTER TYPE "public"."invitation_type" OWNER TO "postgres";


CREATE TYPE "public"."offering_type" AS ENUM (
    'FLOWER',
    'INCENSE',
    'FOOD',
    'MONEY',
    'OTHER'
);


ALTER TYPE "public"."offering_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_invitation"("p_invitation_token" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitation kouden_invitations%ROWTYPE;
BEGIN
    -- 招待を取得
    SELECT * INTO v_invitation
    FROM kouden_invitations
    WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    AND expires_at > now();

    -- 招待が見つからない場合
    IF v_invitation.id IS NULL THEN
        RAISE EXCEPTION '有効な招待が見つかりません';
    END IF;

    -- 共有リンクの場合、使用回数制限をチェック
    IF v_invitation.invitation_type = 'share' AND v_invitation.max_uses IS NOT NULL THEN
        IF v_invitation.used_count >= v_invitation.max_uses THEN
            RAISE EXCEPTION '招待リンクの使用回数制限に達しました';
        END IF;
    END IF;

    -- メンバーとして追加
    INSERT INTO kouden_members (
        kouden_id,
        user_id,
        role_id,
        added_by,
        invitation_id
    ) VALUES (
        v_invitation.kouden_id,
        p_user_id,
        v_invitation.role_id,
        v_invitation.created_by,
        v_invitation.id
    );

    -- 招待のステータスを更新
    UPDATE kouden_invitations
    SET status = 'accepted',
        updated_at = now()
    WHERE id = v_invitation.id;
END;
$$;


ALTER FUNCTION "public"."accept_invitation"("p_invitation_token" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_kouden_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    editor_role_id UUID;
BEGIN
    -- 編集者ロールのIDを取得
    SELECT id INTO editor_role_id
    FROM kouden_roles
    WHERE kouden_id = NEW.id
    AND name = '編集者'
    LIMIT 1;

    -- 香典帳のオーナーをメンバーとして追加
    INSERT INTO kouden_members (
        kouden_id,
        user_id,
        role_id,
        added_by
    ) VALUES (
        NEW.id,
        NEW.owner_id,
        editor_role_id,
        NEW.created_by
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_kouden_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_locks"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM kouden_entry_locks
    WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_locks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_kouden_related_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- 関連する招待情報の削除
    DELETE FROM kouden_invitations WHERE kouden_id = OLD.id;
    
    -- 関連するメンバー情報の削除
    DELETE FROM kouden_members WHERE kouden_id = OLD.id;
    
    -- 関連するロール情報の削除
    DELETE FROM kouden_roles WHERE kouden_id = OLD.id;
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."cleanup_kouden_related_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_admin_audit_log"("p_action" character varying, "p_target_type" character varying, "p_target_id" "uuid", "p_details" "jsonb" DEFAULT NULL::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_admin_id UUID;
    v_log_id UUID;
BEGIN
    -- Get the current user's ID
    v_admin_id := auth.uid();
    
    -- Check if the user is an admin
    IF NOT is_admin(v_admin_id) THEN
        RAISE EXCEPTION 'User is not an admin';
    END IF;

    -- Insert the audit log
    INSERT INTO admin_audit_logs (
        admin_id,
        action,
        target_type,
        target_id,
        details,
        ip_address
    ) VALUES (
        v_admin_id,
        p_action,
        p_target_type,
        p_target_id,
        p_details,
        p_ip_address
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."create_admin_audit_log"("p_action" character varying, "p_target_type" character varying, "p_target_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_kouden_roles"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- 編集者ロールの作成
    INSERT INTO kouden_roles (kouden_id, name, description, permissions, created_by)
    VALUES (
        NEW.id,
        'editor',
        '香典帳の内容を編集できます',
        ARRAY['view', 'edit']::TEXT[],
        NEW.created_by
    );

    -- 閲覧者ロールの作成
    INSERT INTO kouden_roles (kouden_id, name, description, permissions, created_by)
    VALUES (
        NEW.id,
        'viewer',
        '香典帳の内容を閲覧できます',
        ARRAY['view']::TEXT[],
        NEW.created_by
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_kouden_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invitation"("p_kouden_id" "uuid", "p_email" "text", "p_role_id" "uuid", "p_created_by" "uuid", "p_type" "public"."invitation_type" DEFAULT 'email'::"public"."invitation_type", "p_max_uses" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitation_id UUID;
    v_invitation_token UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 有効期限を24時間後に設定
    v_expires_at := NOW() + INTERVAL '24 hours';
    
    -- 新しいトークンを生成
    v_invitation_token := gen_random_uuid();
    
    -- メールタイプの場合、既存の有効な招待をチェック
    IF p_type = 'email' AND p_email IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM kouden_invitations
            WHERE kouden_id = p_kouden_id
            AND email = p_email
            AND status = 'pending'
            AND expires_at > NOW()
        ) THEN
            RAISE EXCEPTION 'すでに有効な招待が存在します';
        END IF;
    END IF;

    -- 招待を作成
    INSERT INTO kouden_invitations (
        kouden_id,
        email,
        role_id,
        invitation_token,
        status,
        expires_at,
        created_by,
        invitation_type,
        max_uses
    ) VALUES (
        p_kouden_id,
        p_email,
        p_role_id,
        v_invitation_token,
        'pending',
        v_expires_at,
        p_created_by,
        p_type,
        p_max_uses
    )
    RETURNING id INTO v_invitation_id;

    RETURN v_invitation_id;
END;
$$;


ALTER FUNCTION "public"."create_invitation"("p_kouden_id" "uuid", "p_email" "text", "p_role_id" "uuid", "p_created_by" "uuid", "p_type" "public"."invitation_type", "p_max_uses" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invitation_token"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.invitation_token IS NULL THEN
        NEW.invitation_token := encode(gen_random_bytes(32), 'hex');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_invitation_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_invitation_used_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- 招待IDがある場合のみカウントを更新
    IF NEW.invitation_id IS NOT NULL THEN
        UPDATE kouden_invitations
        SET used_count = used_count + 1
        WHERE id = NEW.invitation_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_invitation_used_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_default_relationships"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- デフォルトの関係性を追加
    INSERT INTO relationships (
        kouden_id,
        name,
        description,
        is_default,
        created_by
    ) VALUES
    (NEW.id, '親族', '故人の親族', true, NEW.created_by),
    (NEW.id, '友人', '故人の友人', true, NEW.created_by),
    (NEW.id, '知人', '故人の知人', true, NEW.created_by),
    (NEW.id, '会社関係', '故人の会社関係者', true, NEW.created_by),
    (NEW.id, '近所', '故人の近所の方', true, NEW.created_by),
    (NEW.id, 'その他', 'その他の関係', true, NEW.created_by);

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_default_relationships"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_default_relationships"("kouden_id" "uuid", "owner_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- デフォルトの関係性を挿入
    INSERT INTO relationships (kouden_id, name, description, is_default, created_by)
    VALUES
        (kouden_id, '仕事関係', '職場の同僚や取引先など', TRUE, owner_id),
        (kouden_id, '友人', '友人や知人など', TRUE, owner_id),
        (kouden_id, '親族', '親族や家族など', TRUE, owner_id),
        (kouden_id, 'その他', 'その他の関係', TRUE, owner_id)
    ON CONFLICT (kouden_id, name) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."initialize_default_relationships"("kouden_id" "uuid", "owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_uid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admin_users 
        WHERE user_id = user_uid
    );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_debug"("p_action" "text", "p_details" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO debug_logs (action, user_id, details)
    VALUES (p_action, auth.uid(), p_details)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_debug"("p_action" "text", "p_details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_kouden_entry_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- 現在のユーザーIDを取得（トリガー内でauth.uid()が動作しない場合の対策）
    current_user_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO kouden_entry_audit_logs (entry_id, user_id, action, changes)
        VALUES (NEW.id, COALESCE(current_user_id, NEW.created_by), 'create', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO kouden_entry_audit_logs (entry_id, user_id, action, changes)
        VALUES (NEW.id, COALESCE(current_user_id, NEW.last_modified_by), 'update', jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        ));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO kouden_entry_audit_logs (entry_id, user_id, action, changes)
        VALUES (OLD.id, COALESCE(current_user_id, OLD.created_by), 'delete', to_jsonb(OLD));
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;


ALTER FUNCTION "public"."log_kouden_entry_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_member"("p_kouden_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- メンバーの存在確認
    IF NOT EXISTS (
        SELECT 1 FROM kouden_members
        WHERE kouden_id = p_kouden_id
        AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'メンバーが見つかりません';
    END IF;

    -- メンバーを削除
    DELETE FROM kouden_members
    WHERE kouden_id = p_kouden_id
    AND user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."remove_member"("p_kouden_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_invitation_token"("token" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- 招待の有効性を確認
    IF NOT EXISTS (
        SELECT 1 
        FROM kouden_invitations 
        WHERE invitation_token = token
        AND status = 'pending'
        AND expires_at > now()
        AND (max_uses IS NULL OR used_count < max_uses)
    ) THEN
        RAISE EXCEPTION '無効な招待トークンです';
    END IF;

    -- セッション設定に招待トークンを設定
    PERFORM set_config('app.current_invitation_token', token::text, true);
END;
$$;


ALTER FUNCTION "public"."set_invitation_token"("token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_admin_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_admin_users_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_kouden_entry_locks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_kouden_entry_locks_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_kouden_entry_modified"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.last_modified_at = NOW();
    NEW.last_modified_by = auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_kouden_entry_modified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_member_role"("p_kouden_id" "uuid", "p_user_id" "uuid", "p_role_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- メンバーの存在確認
    IF NOT EXISTS (
        SELECT 1 FROM kouden_members
        WHERE kouden_id = p_kouden_id
        AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'メンバーが見つかりません';
    END IF;

    -- ロールの存在確認
    IF NOT EXISTS (
        SELECT 1 FROM kouden_roles
        WHERE id = p_role_id
        AND kouden_id = p_kouden_id
    ) THEN
        RAISE EXCEPTION 'ロールが見つかりません';
    END IF;

    -- ロールを更新
    UPDATE kouden_members
    SET role_id = p_role_id,
        updated_at = now()
    WHERE kouden_id = p_kouden_id
    AND user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."update_member_role"("p_kouden_id" "uuid", "p_user_id" "uuid", "p_role_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_support_ticket_comments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_support_ticket_comments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_support_tickets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_support_tickets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_system_announcements_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_system_announcements_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action" character varying(100) NOT NULL,
    "target_type" character varying(50) NOT NULL,
    "target_id" "uuid" NOT NULL,
    "details" "jsonb",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_target_type" CHECK ((("target_type")::"text" = ANY ((ARRAY['user'::character varying, 'kouden'::character varying, 'announcement'::character varying, 'support_ticket'::character varying, 'admin'::character varying])::"text"[])))
);


ALTER TABLE "public"."admin_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(50) DEFAULT 'admin'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."debug_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "action" "text",
    "user_id" "uuid",
    "details" "jsonb"
);


ALTER TABLE "public"."debug_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kouden_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "kouden_id" "uuid" NOT NULL,
    "name" "text",
    "organization" "text",
    "position" "text",
    "amount" integer NOT NULL,
    "postal_code" "text",
    "address" "text",
    "phone_number" "text",
    "relationship_id" "uuid",
    "attendance_type" "text" NOT NULL,
    "has_offering" boolean DEFAULT false NOT NULL,
    "is_return_completed" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" NOT NULL,
    "version" integer DEFAULT 1,
    "last_modified_at" timestamp with time zone DEFAULT "now"(),
    "last_modified_by" "uuid",
    CONSTRAINT "kouden_entries_attendance_type_check" CHECK (("attendance_type" = ANY (ARRAY['FUNERAL'::"text", 'CONDOLENCE_VISIT'::"text", 'ABSENT'::"text"])))
);


ALTER TABLE "public"."kouden_entries" OWNER TO "postgres";


COMMENT ON COLUMN "public"."kouden_entries"."name" IS 'ご芳名(任意)';



COMMENT ON COLUMN "public"."kouden_entries"."address" IS '住所（任意）';



CREATE TABLE IF NOT EXISTS "public"."kouden_entry_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "changes" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "kouden_entry_audit_logs_action_check" CHECK (("action" = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text"])))
);


ALTER TABLE "public"."kouden_entry_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kouden_entry_locks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "locked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:05:00'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."kouden_entry_locks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kouden_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kouden_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "invitation_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "public"."invitation_status" DEFAULT 'pending'::"public"."invitation_status" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "max_uses" integer,
    "used_count" integer DEFAULT 0 NOT NULL,
    "kouden_data" "jsonb",
    CONSTRAINT "valid_kouden_data" CHECK (
CASE
    WHEN ("kouden_data" IS NOT NULL) THEN (("kouden_data" ? 'id'::"text") AND ("kouden_data" ? 'title'::"text") AND ("kouden_data" ? 'description'::"text"))
    ELSE true
END)
);


ALTER TABLE "public"."kouden_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kouden_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "kouden_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "added_by" "uuid" NOT NULL,
    "invitation_id" "uuid"
);


ALTER TABLE "public"."kouden_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kouden_roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "kouden_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."kouden_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."koudens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    CONSTRAINT "koudens_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."koudens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offerings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "kouden_entry_id" "uuid",
    "type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "offerings_type_check" CHECK (("type" = ANY (ARRAY['FLOWER'::"text", 'INCENSE'::"text", 'FOOD'::"text", 'MONEY'::"text", 'OTHER'::"text"])))
);


ALTER TABLE "public"."offerings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kouden_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."return_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "kouden_entry_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "price" integer NOT NULL,
    "delivery_method" "text" NOT NULL,
    "sent_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "return_items_delivery_method_check" CHECK (("delivery_method" = ANY (ARRAY['shipping'::"text", 'hand_delivery'::"text"])))
);


ALTER TABLE "public"."return_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subject" "text" NOT NULL,
    "content" "text" NOT NULL,
    "status" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_announcements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "priority" character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "published_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_priority" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."system_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_admin_reply" boolean DEFAULT false NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_messages" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."debug_logs"
    ADD CONSTRAINT "debug_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kouden_entries"
    ADD CONSTRAINT "kouden_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kouden_entry_audit_logs"
    ADD CONSTRAINT "kouden_entry_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kouden_entry_locks"
    ADD CONSTRAINT "kouden_entry_locks_entry_id_key" UNIQUE ("entry_id");



ALTER TABLE ONLY "public"."kouden_entry_locks"
    ADD CONSTRAINT "kouden_entry_locks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kouden_invitations"
    ADD CONSTRAINT "kouden_invitations_invitation_token_key" UNIQUE ("invitation_token");



ALTER TABLE ONLY "public"."kouden_invitations"
    ADD CONSTRAINT "kouden_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kouden_members"
    ADD CONSTRAINT "kouden_members_kouden_id_user_id_key" UNIQUE ("kouden_id", "user_id");



ALTER TABLE ONLY "public"."kouden_members"
    ADD CONSTRAINT "kouden_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kouden_roles"
    ADD CONSTRAINT "kouden_roles_kouden_id_name_key" UNIQUE ("kouden_id", "name");



ALTER TABLE ONLY "public"."kouden_roles"
    ADD CONSTRAINT "kouden_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."koudens"
    ADD CONSTRAINT "koudens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offerings"
    ADD CONSTRAINT "offerings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_kouden_id_name_key" UNIQUE ("kouden_id", "name");



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."return_items"
    ADD CONSTRAINT "return_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_announcements"
    ADD CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "unique_admin_user" UNIQUE ("user_id");



CREATE INDEX "idx_kouden_entries_created_by" ON "public"."kouden_entries" USING "btree" ("created_by");



CREATE INDEX "idx_kouden_entries_kouden_id" ON "public"."kouden_entries" USING "btree" ("kouden_id");



CREATE INDEX "idx_kouden_entries_relationship_id" ON "public"."kouden_entries" USING "btree" ("relationship_id");



CREATE INDEX "idx_kouden_entry_audit_logs_created_at" ON "public"."kouden_entry_audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_kouden_entry_audit_logs_entry_id" ON "public"."kouden_entry_audit_logs" USING "btree" ("entry_id");



CREATE INDEX "idx_kouden_entry_audit_logs_user_id" ON "public"."kouden_entry_audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_kouden_entry_locks_entry_id" ON "public"."kouden_entry_locks" USING "btree" ("entry_id");



CREATE INDEX "idx_kouden_entry_locks_expires_at" ON "public"."kouden_entry_locks" USING "btree" ("expires_at");



CREATE INDEX "idx_kouden_entry_locks_user_id" ON "public"."kouden_entry_locks" USING "btree" ("user_id");



CREATE INDEX "idx_kouden_invitations_kouden_id" ON "public"."kouden_invitations" USING "btree" ("kouden_id");



CREATE INDEX "idx_kouden_invitations_status" ON "public"."kouden_invitations" USING "btree" ("status");



CREATE INDEX "idx_kouden_invitations_token" ON "public"."kouden_invitations" USING "btree" ("invitation_token");



CREATE INDEX "idx_kouden_members_kouden_id" ON "public"."kouden_members" USING "btree" ("kouden_id");



CREATE INDEX "idx_kouden_members_user_id" ON "public"."kouden_members" USING "btree" ("user_id");



CREATE INDEX "idx_kouden_members_user_kouden" ON "public"."kouden_members" USING "btree" ("user_id", "kouden_id");



CREATE INDEX "idx_kouden_roles_kouden_id" ON "public"."kouden_roles" USING "btree" ("kouden_id");



CREATE INDEX "idx_koudens_created_by" ON "public"."koudens" USING "btree" ("created_by");



CREATE INDEX "idx_koudens_owner_created" ON "public"."koudens" USING "btree" ("owner_id", "created_at" DESC);



CREATE INDEX "idx_koudens_owner_created_at" ON "public"."koudens" USING "btree" ("owner_id", "created_at" DESC);



CREATE INDEX "idx_koudens_owner_id" ON "public"."koudens" USING "btree" ("owner_id");



CREATE INDEX "idx_return_items_kouden_entry_id" ON "public"."return_items" USING "btree" ("kouden_entry_id");



CREATE OR REPLACE TRIGGER "cleanup_kouden_related_data_trigger" BEFORE DELETE ON "public"."koudens" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_kouden_related_data"();



CREATE OR REPLACE TRIGGER "create_default_kouden_roles_trigger" AFTER INSERT ON "public"."koudens" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_kouden_roles"();



CREATE OR REPLACE TRIGGER "increment_used_count" AFTER INSERT ON "public"."kouden_members" FOR EACH ROW EXECUTE FUNCTION "public"."increment_invitation_used_count"();



CREATE OR REPLACE TRIGGER "log_kouden_entry_changes" AFTER INSERT OR UPDATE ON "public"."kouden_entries" FOR EACH ROW EXECUTE FUNCTION "public"."log_kouden_entry_changes"();



CREATE OR REPLACE TRIGGER "log_kouden_entry_delete" BEFORE DELETE ON "public"."kouden_entries" FOR EACH ROW EXECUTE FUNCTION "public"."log_kouden_entry_changes"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."kouden_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."relationships" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_add_kouden_owner" AFTER INSERT ON "public"."koudens" FOR EACH ROW EXECUTE FUNCTION "public"."add_kouden_owner"();



CREATE OR REPLACE TRIGGER "trigger_initialize_default_relationships" AFTER INSERT ON "public"."koudens" FOR EACH ROW EXECUTE FUNCTION "public"."initialize_default_relationships"();



CREATE OR REPLACE TRIGGER "update_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_admin_users_updated_at"();



CREATE OR REPLACE TRIGGER "update_kouden_entries_updated_at" BEFORE UPDATE ON "public"."kouden_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_kouden_entry_locks_updated_at" BEFORE UPDATE ON "public"."kouden_entry_locks" FOR EACH ROW EXECUTE FUNCTION "public"."update_kouden_entry_locks_updated_at"();



CREATE OR REPLACE TRIGGER "update_kouden_entry_modified" BEFORE UPDATE ON "public"."kouden_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_kouden_entry_modified"();



CREATE OR REPLACE TRIGGER "update_kouden_members_updated_at" BEFORE UPDATE ON "public"."kouden_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_kouden_roles_updated_at" BEFORE UPDATE ON "public"."kouden_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_koudens_updated_at" BEFORE UPDATE ON "public"."koudens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_return_items_updated_at" BEFORE UPDATE ON "public"."return_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_announcements_updated_at" BEFORE UPDATE ON "public"."system_announcements" FOR EACH ROW EXECUTE FUNCTION "public"."update_system_announcements_updated_at"();



ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kouden_entries"
    ADD CONSTRAINT "kouden_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kouden_entries"
    ADD CONSTRAINT "kouden_entries_kouden_id_fkey" FOREIGN KEY ("kouden_id") REFERENCES "public"."koudens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kouden_entries"
    ADD CONSTRAINT "kouden_entries_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kouden_entry_audit_logs"
    ADD CONSTRAINT "kouden_entry_audit_logs_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."kouden_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kouden_entry_audit_logs"
    ADD CONSTRAINT "kouden_entry_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kouden_entry_locks"
    ADD CONSTRAINT "kouden_entry_locks_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."kouden_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kouden_entry_locks"
    ADD CONSTRAINT "kouden_entry_locks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kouden_invitations"
    ADD CONSTRAINT "kouden_invitations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."kouden_invitations"
    ADD CONSTRAINT "kouden_invitations_kouden_id_fkey" FOREIGN KEY ("kouden_id") REFERENCES "public"."koudens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kouden_invitations"
    ADD CONSTRAINT "kouden_invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."kouden_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kouden_members"
    ADD CONSTRAINT "kouden_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kouden_members"
    ADD CONSTRAINT "kouden_members_kouden_id_fkey" FOREIGN KEY ("kouden_id") REFERENCES "public"."koudens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kouden_members"
    ADD CONSTRAINT "kouden_members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."kouden_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kouden_members"
    ADD CONSTRAINT "kouden_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kouden_roles"
    ADD CONSTRAINT "kouden_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kouden_roles"
    ADD CONSTRAINT "kouden_roles_kouden_id_fkey" FOREIGN KEY ("kouden_id") REFERENCES "public"."koudens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."koudens"
    ADD CONSTRAINT "koudens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."koudens"
    ADD CONSTRAINT "koudens_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offerings"
    ADD CONSTRAINT "offerings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."offerings"
    ADD CONSTRAINT "offerings_kouden_entry_id_fkey" FOREIGN KEY ("kouden_entry_id") REFERENCES "public"."kouden_entries"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_kouden_id_fkey" FOREIGN KEY ("kouden_id") REFERENCES "public"."koudens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."return_items"
    ADD CONSTRAINT "return_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."return_items"
    ADD CONSTRAINT "return_items_kouden_entry_id_fkey" FOREIGN KEY ("kouden_entry_id") REFERENCES "public"."kouden_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."system_announcements"
    ADD CONSTRAINT "system_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete announcements" ON "public"."system_announcements" FOR DELETE TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can insert announcements" ON "public"."system_announcements" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update announcements" ON "public"."system_announcements" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view admin_users" ON "public"."admin_users" FOR SELECT TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all announcements" ON "public"."system_announcements" FOR SELECT TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view audit logs" ON "public"."admin_audit_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Allow insert debug logs" ON "public"."debug_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow read own debug logs" ON "public"."debug_logs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Super admins can delete admin_users" ON "public"."admin_users" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "admin_users_1"
  WHERE (("admin_users_1"."user_id" = "auth"."uid"()) AND (("admin_users_1"."role")::"text" = 'super_admin'::"text")))));



CREATE POLICY "Super admins can insert admin_users" ON "public"."admin_users" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "admin_users_1"
  WHERE (("admin_users_1"."user_id" = "auth"."uid"()) AND (("admin_users_1"."role")::"text" = 'super_admin'::"text")))));



CREATE POLICY "Super admins can update admin_users" ON "public"."admin_users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "admin_users_1"
  WHERE (("admin_users_1"."user_id" = "auth"."uid"()) AND (("admin_users_1"."role")::"text" = 'super_admin'::"text")))));



CREATE POLICY "System can insert audit logs" ON "public"."admin_audit_logs" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Users can delete return_items of their koudens" ON "public"."return_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."kouden_entries"
     JOIN "public"."koudens" ON (("koudens"."id" = "kouden_entries"."kouden_id")))
  WHERE (("kouden_entries"."id" = "return_items"."kouden_entry_id") AND ("koudens"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert return_items to their koudens" ON "public"."return_items" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."kouden_entries"
     JOIN "public"."koudens" ON (("koudens"."id" = "kouden_entries"."kouden_id")))
  WHERE (("kouden_entries"."id" = "return_items"."kouden_entry_id") AND ("koudens"."owner_id" = "auth"."uid"())))) AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update return_items of their koudens" ON "public"."return_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."kouden_entries"
     JOIN "public"."koudens" ON (("koudens"."id" = "kouden_entries"."kouden_id")))
  WHERE (("kouden_entries"."id" = "return_items"."kouden_entry_id") AND ("koudens"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."kouden_entries"
     JOIN "public"."koudens" ON (("koudens"."id" = "kouden_entries"."kouden_id")))
  WHERE (("kouden_entries"."id" = "return_items"."kouden_entry_id") AND ("koudens"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view published announcements" ON "public"."system_announcements" FOR SELECT TO "authenticated" USING (((("status")::"text" = 'published'::"text") AND (("published_at" IS NULL) OR ("published_at" <= "now"())) AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "Users can view return_items of their koudens" ON "public"."return_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."kouden_entries"
     JOIN "public"."koudens" ON (("koudens"."id" = "kouden_entries"."kouden_id")))
  WHERE (("kouden_entries"."id" = "return_items"."kouden_entry_id") AND ("koudens"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "basic_access" ON "public"."koudens" TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"()) OR ("id" IN ( SELECT "kouden_members"."kouden_id"
   FROM "public"."kouden_members"
  WHERE ("kouden_members"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."debug_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "editor_crud_access" ON "public"."kouden_entries" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."kouden_members" "m"
     JOIN "public"."kouden_roles" "r" ON (("m"."role_id" = "r"."id")))
  WHERE (("m"."kouden_id" = "kouden_entries"."kouden_id") AND ("m"."user_id" = "auth"."uid"()) AND ("r"."name" = '編集者'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."kouden_members" "m"
     JOIN "public"."kouden_roles" "r" ON (("m"."role_id" = "r"."id")))
  WHERE (("m"."kouden_id" = "kouden_entries"."kouden_id") AND ("m"."user_id" = "auth"."uid"()) AND ("r"."name" = '編集者'::"text")))));



CREATE POLICY "invitation_link_access" ON "public"."kouden_invitations" FOR SELECT USING ((("status" = 'pending'::"public"."invitation_status") AND ("expires_at" > "now"()) AND (("max_uses" IS NULL) OR ("used_count" < "max_uses"))));



ALTER TABLE "public"."kouden_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kouden_entry_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kouden_entry_locks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kouden_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kouden_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kouden_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kouden_roles_member_access" ON "public"."kouden_roles" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "kouden_members"."role_id"
   FROM "public"."kouden_members"
  WHERE ("kouden_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "kouden_roles_simple_access" ON "public"."kouden_roles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."koudens"
  WHERE (("koudens"."id" = "kouden_roles"."kouden_id") AND ("koudens"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."koudens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "koudens_insert_policy" ON "public"."koudens" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "members_basic_access" ON "public"."kouden_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "members_invitation_insert" ON "public"."kouden_members" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."kouden_invitations"
  WHERE (("kouden_invitations"."id" = "kouden_members"."invitation_id") AND ("kouden_invitations"."invitation_token" = ("current_setting"('app.current_invitation_token'::"text", true))::"uuid") AND ("kouden_invitations"."status" = 'pending'::"public"."invitation_status") AND ("kouden_invitations"."expires_at" > "now"()) AND (("kouden_invitations"."max_uses" IS NULL) OR ("kouden_invitations"."used_count" < "kouden_invitations"."max_uses"))))));



CREATE POLICY "members_management" ON "public"."kouden_members" TO "authenticated" USING (("added_by" = "auth"."uid"())) WITH CHECK (("added_by" = "auth"."uid"()));



CREATE POLICY "members_owner_delete" ON "public"."kouden_members" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."koudens"
  WHERE (("koudens"."id" = "kouden_members"."kouden_id") AND ("koudens"."owner_id" = "auth"."uid"())))));



CREATE POLICY "members_owner_update" ON "public"."kouden_members" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."koudens"
  WHERE (("koudens"."id" = "kouden_members"."kouden_id") AND ("koudens"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."offerings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_access" ON "public"."koudens" TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "owner_crud_access" ON "public"."kouden_entries" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."koudens" "k"
  WHERE (("k"."id" = "kouden_entries"."kouden_id") AND ("k"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."koudens" "k"
  WHERE (("k"."id" = "kouden_entries"."kouden_id") AND ("k"."owner_id" = "auth"."uid"())))));



CREATE POLICY "owner_invitation_access" ON "public"."kouden_invitations" USING ((EXISTS ( SELECT 1
   FROM "public"."koudens" "k"
  WHERE (("k"."id" = "kouden_invitations"."kouden_id") AND ("k"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."return_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "viewer_read_access" ON "public"."kouden_entries" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."kouden_members" "m"
     JOIN "public"."kouden_roles" "r" ON (("m"."role_id" = "r"."id")))
  WHERE (("m"."kouden_id" = "kouden_entries"."kouden_id") AND ("m"."user_id" = "auth"."uid"()) AND ("r"."name" = '閲覧者'::"text")))));



CREATE POLICY "システムは監査ログを作成できる" ON "public"."kouden_entry_audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "ユーザーは自分が作成した関係性を削除できる" ON "public"."relationships" FOR DELETE USING ((("created_by" = "auth"."uid"()) AND (NOT "is_default")));



CREATE POLICY "ユーザーは自分が作成した関係性を更新できる" ON "public"."relationships" FOR UPDATE USING ((("created_by" = "auth"."uid"()) AND (NOT "is_default")));



CREATE POLICY "ユーザーは自分が作成した香典帳に関係性を追" ON "public"."relationships" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."koudens"
  WHERE (("koudens"."id" = "relationships"."kouden_id") AND ("koudens"."created_by" = "auth"."uid"())))));



CREATE POLICY "ユーザーは自分が作成した香典帳の関係性を閲" ON "public"."relationships" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."koudens"
  WHERE (("koudens"."id" = "relationships"."kouden_id") AND ("koudens"."created_by" = "auth"."uid"())))));



CREATE POLICY "ユーザーは自分のチケットにのみメッセージを" ON "public"."ticket_messages" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."support_tickets"
  WHERE (("support_tickets"."id" = "ticket_messages"."ticket_id") AND ("support_tickets"."user_id" = "auth"."uid"())))) AND (NOT "is_admin_reply")));



CREATE POLICY "ユーザーは自分のチケットのみ閲覧可能" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "ユーザーは自分のチケットのメッセージのみ閲" ON "public"."ticket_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."support_tickets"
  WHERE (("support_tickets"."id" = "ticket_messages"."ticket_id") AND ("support_tickets"."user_id" = "auth"."uid"())))));



CREATE POLICY "ユーザーは自分のロックを削除できる" ON "public"."kouden_entry_locks" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "管理者は全ての操作が可能" ON "public"."support_tickets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "管理者は全ての操作が可能" ON "public"."ticket_messages" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."accept_invitation"("p_invitation_token" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_invitation"("p_invitation_token" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invitation"("p_invitation_token" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_kouden_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_kouden_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_kouden_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_locks"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_locks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_locks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_kouden_related_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_kouden_related_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_kouden_related_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_admin_audit_log"("p_action" character varying, "p_target_type" character varying, "p_target_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."create_admin_audit_log"("p_action" character varying, "p_target_type" character varying, "p_target_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_admin_audit_log"("p_action" character varying, "p_target_type" character varying, "p_target_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_kouden_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_kouden_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_kouden_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invitation"("p_kouden_id" "uuid", "p_email" "text", "p_role_id" "uuid", "p_created_by" "uuid", "p_type" "public"."invitation_type", "p_max_uses" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_invitation"("p_kouden_id" "uuid", "p_email" "text", "p_role_id" "uuid", "p_created_by" "uuid", "p_type" "public"."invitation_type", "p_max_uses" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invitation"("p_kouden_id" "uuid", "p_email" "text", "p_role_id" "uuid", "p_created_by" "uuid", "p_type" "public"."invitation_type", "p_max_uses" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_invitation_used_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_invitation_used_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_invitation_used_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_default_relationships"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_default_relationships"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_default_relationships"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_default_relationships"("kouden_id" "uuid", "owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_default_relationships"("kouden_id" "uuid", "owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_default_relationships"("kouden_id" "uuid", "owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_debug"("p_action" "text", "p_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_debug"("p_action" "text", "p_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_debug"("p_action" "text", "p_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_kouden_entry_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_kouden_entry_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_kouden_entry_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_member"("p_kouden_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_member"("p_kouden_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_member"("p_kouden_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invitation_token"("token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_invitation_token"("token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invitation_token"("token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_users_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_users_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_users_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_kouden_entry_locks_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_kouden_entry_locks_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_kouden_entry_locks_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_kouden_entry_modified"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_kouden_entry_modified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_kouden_entry_modified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_member_role"("p_kouden_id" "uuid", "p_user_id" "uuid", "p_role_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_member_role"("p_kouden_id" "uuid", "p_user_id" "uuid", "p_role_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_member_role"("p_kouden_id" "uuid", "p_user_id" "uuid", "p_role_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_support_ticket_comments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_support_ticket_comments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_support_ticket_comments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_support_tickets_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_support_tickets_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_support_tickets_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_system_announcements_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_system_announcements_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_system_announcements_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."debug_logs" TO "anon";
GRANT ALL ON TABLE "public"."debug_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."debug_logs" TO "service_role";



GRANT ALL ON TABLE "public"."kouden_entries" TO "anon";
GRANT ALL ON TABLE "public"."kouden_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."kouden_entries" TO "service_role";



GRANT ALL ON TABLE "public"."kouden_entry_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."kouden_entry_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."kouden_entry_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."kouden_entry_locks" TO "anon";
GRANT ALL ON TABLE "public"."kouden_entry_locks" TO "authenticated";
GRANT ALL ON TABLE "public"."kouden_entry_locks" TO "service_role";



GRANT ALL ON TABLE "public"."kouden_invitations" TO "anon";
GRANT ALL ON TABLE "public"."kouden_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."kouden_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."kouden_members" TO "anon";
GRANT ALL ON TABLE "public"."kouden_members" TO "authenticated";
GRANT ALL ON TABLE "public"."kouden_members" TO "service_role";



GRANT ALL ON TABLE "public"."kouden_roles" TO "anon";
GRANT ALL ON TABLE "public"."kouden_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."kouden_roles" TO "service_role";



GRANT ALL ON TABLE "public"."koudens" TO "authenticated";
GRANT ALL ON TABLE "public"."koudens" TO "service_role";
GRANT SELECT ON TABLE "public"."koudens" TO "anon";



GRANT ALL ON TABLE "public"."offerings" TO "anon";
GRANT ALL ON TABLE "public"."offerings" TO "authenticated";
GRANT ALL ON TABLE "public"."offerings" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."relationships" TO "anon";
GRANT ALL ON TABLE "public"."relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."relationships" TO "service_role";



GRANT ALL ON TABLE "public"."return_items" TO "anon";
GRANT ALL ON TABLE "public"."return_items" TO "authenticated";
GRANT ALL ON TABLE "public"."return_items" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."system_announcements" TO "anon";
GRANT ALL ON TABLE "public"."system_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."system_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_messages" TO "anon";
GRANT ALL ON TABLE "public"."ticket_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_messages" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
