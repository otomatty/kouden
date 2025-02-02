create type "public"."attendance_type" as enum ('FUNERAL', 'CONDOLENCE_VISIT');

create type "public"."delivery_method" as enum ('MAIL', 'HAND', 'DELIVERY', 'OTHER');

create type "public"."invitation_status" as enum ('pending', 'accepted', 'rejected', 'expired', 'canceled');

create type "public"."invitation_type" as enum ('email', 'share');

create type "public"."offering_type" as enum ('FLOWER', 'INCENSE', 'FOOD', 'MONEY', 'OTHER');

create table "public"."admin_audit_logs" (
    "id" uuid not null default uuid_generate_v4(),
    "admin_id" uuid not null,
    "action" character varying(100) not null,
    "target_type" character varying(50) not null,
    "target_id" uuid not null,
    "details" jsonb,
    "ip_address" inet,
    "created_at" timestamp with time zone default now()
);


alter table "public"."admin_audit_logs" enable row level security;

create table "public"."admin_users" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "role" character varying(50) not null default 'admin'::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."admin_users" enable row level security;

create table "public"."debug_logs" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default now(),
    "action" text,
    "user_id" uuid,
    "details" jsonb
);


alter table "public"."debug_logs" enable row level security;

create table "public"."kouden_entries" (
    "id" uuid not null default uuid_generate_v4(),
    "kouden_id" uuid not null,
    "name" text,
    "organization" text,
    "position" text,
    "amount" integer not null,
    "postal_code" text,
    "address" text,
    "phone_number" text,
    "relationship_id" uuid,
    "attendance_type" text not null,
    "has_offering" boolean not null default false,
    "is_return_completed" boolean not null default false,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "version" integer default 1,
    "last_modified_at" timestamp with time zone default now(),
    "last_modified_by" uuid
);


alter table "public"."kouden_entries" enable row level security;

create table "public"."kouden_entry_audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "entry_id" uuid not null,
    "user_id" uuid not null,
    "action" text not null,
    "changes" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."kouden_entry_audit_logs" enable row level security;

create table "public"."kouden_entry_locks" (
    "id" uuid not null default gen_random_uuid(),
    "entry_id" uuid not null,
    "user_id" uuid not null,
    "locked_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone not null default (now() + '00:05:00'::interval),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."kouden_entry_locks" enable row level security;

create table "public"."kouden_invitations" (
    "id" uuid not null default gen_random_uuid(),
    "kouden_id" uuid not null,
    "role_id" uuid not null,
    "invitation_token" uuid not null default gen_random_uuid(),
    "status" invitation_status not null default 'pending'::invitation_status,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone not null default (now() + '7 days'::interval),
    "updated_at" timestamp with time zone not null default now(),
    "max_uses" integer,
    "used_count" integer not null default 0,
    "kouden_data" jsonb
);


alter table "public"."kouden_invitations" enable row level security;

create table "public"."kouden_members" (
    "id" uuid not null default uuid_generate_v4(),
    "kouden_id" uuid not null,
    "user_id" uuid not null,
    "role_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "added_by" uuid not null,
    "invitation_id" uuid
);


alter table "public"."kouden_members" enable row level security;

create table "public"."kouden_roles" (
    "id" uuid not null default uuid_generate_v4(),
    "kouden_id" uuid not null,
    "name" text not null,
    "description" text,
    "permissions" text[] not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
);


alter table "public"."kouden_roles" enable row level security;

create table "public"."koudens" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "owner_id" uuid not null,
    "status" text not null default 'active'::text
);


alter table "public"."koudens" enable row level security;

create table "public"."offering_entries" (
    "id" uuid not null default uuid_generate_v4(),
    "offering_id" uuid not null,
    "kouden_entry_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
);


alter table "public"."offering_entries" enable row level security;

create table "public"."offering_photos" (
    "id" uuid not null default uuid_generate_v4(),
    "offering_id" uuid not null,
    "storage_key" text not null,
    "caption" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
);


alter table "public"."offering_photos" enable row level security;

create table "public"."offerings" (
    "id" uuid not null default uuid_generate_v4(),
    "kouden_id" uuid not null,
    "type" text not null,
    "description" text,
    "quantity" integer not null default 1,
    "price" integer,
    "provider_name" text not null,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
);


alter table "public"."offerings" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "display_name" text not null,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."profiles" enable row level security;

create table "public"."relationships" (
    "id" uuid not null default gen_random_uuid(),
    "kouden_id" uuid not null,
    "name" text not null,
    "description" text,
    "is_default" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null
);


alter table "public"."relationships" enable row level security;

create table "public"."return_items" (
    "id" uuid not null default uuid_generate_v4(),
    "kouden_entry_id" uuid not null,
    "name" text not null,
    "price" integer not null,
    "delivery_method" text not null,
    "sent_date" date,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
);


alter table "public"."return_items" enable row level security;

create table "public"."support_tickets" (
    "id" uuid not null default gen_random_uuid(),
    "subject" text not null,
    "content" text not null,
    "status" text not null,
    "priority" text not null,
    "user_id" uuid not null,
    "assigned_to" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "resolved_at" timestamp with time zone
);


alter table "public"."support_tickets" enable row level security;

create table "public"."system_announcements" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "content" text not null,
    "priority" character varying(20) not null default 'normal'::character varying,
    "status" character varying(20) not null default 'draft'::character varying,
    "published_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "category" character varying(50) not null default 'other'::character varying
);


alter table "public"."system_announcements" enable row level security;

create table "public"."telegrams" (
    "id" uuid not null default uuid_generate_v4(),
    "kouden_id" uuid not null,
    "kouden_entry_id" uuid,
    "sender_name" text not null,
    "sender_organization" text,
    "sender_position" text,
    "message" text,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null
);


alter table "public"."telegrams" enable row level security;

create table "public"."ticket_messages" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid not null,
    "content" text not null,
    "is_admin_reply" boolean not null default false,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."ticket_messages" enable row level security;

create table "public"."user_announcement_reads" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "announcement_id" uuid not null,
    "is_read" boolean default false
);


alter table "public"."user_announcement_reads" enable row level security;

create table "public"."user_settings" (
    "id" uuid not null,
    "guide_mode" boolean default true,
    "theme" text default 'system'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."user_settings" enable row level security;

CREATE UNIQUE INDEX admin_audit_logs_pkey ON public.admin_audit_logs USING btree (id);

CREATE UNIQUE INDEX admin_users_pkey ON public.admin_users USING btree (id);

CREATE UNIQUE INDEX debug_logs_pkey ON public.debug_logs USING btree (id);

CREATE INDEX idx_kouden_entries_created_by ON public.kouden_entries USING btree (created_by);

CREATE INDEX idx_kouden_entries_kouden_id ON public.kouden_entries USING btree (kouden_id);

CREATE INDEX idx_kouden_entries_relationship_id ON public.kouden_entries USING btree (relationship_id);

CREATE INDEX idx_kouden_entry_audit_logs_created_at ON public.kouden_entry_audit_logs USING btree (created_at);

CREATE INDEX idx_kouden_entry_audit_logs_entry_id ON public.kouden_entry_audit_logs USING btree (entry_id);

CREATE INDEX idx_kouden_entry_audit_logs_user_id ON public.kouden_entry_audit_logs USING btree (user_id);

CREATE INDEX idx_kouden_entry_locks_entry_id ON public.kouden_entry_locks USING btree (entry_id);

CREATE INDEX idx_kouden_entry_locks_expires_at ON public.kouden_entry_locks USING btree (expires_at);

CREATE INDEX idx_kouden_entry_locks_user_id ON public.kouden_entry_locks USING btree (user_id);

CREATE INDEX idx_kouden_invitations_kouden_id ON public.kouden_invitations USING btree (kouden_id);

CREATE INDEX idx_kouden_invitations_status ON public.kouden_invitations USING btree (status);

CREATE INDEX idx_kouden_invitations_token ON public.kouden_invitations USING btree (invitation_token);

CREATE INDEX idx_kouden_members_kouden_id ON public.kouden_members USING btree (kouden_id);

CREATE INDEX idx_kouden_members_user_id ON public.kouden_members USING btree (user_id);

CREATE INDEX idx_kouden_members_user_kouden ON public.kouden_members USING btree (user_id, kouden_id);

CREATE INDEX idx_kouden_roles_kouden_id ON public.kouden_roles USING btree (kouden_id);

CREATE INDEX idx_koudens_created_by ON public.koudens USING btree (created_by);

CREATE INDEX idx_koudens_owner_created ON public.koudens USING btree (owner_id, created_at DESC);

CREATE INDEX idx_koudens_owner_created_at ON public.koudens USING btree (owner_id, created_at DESC);

CREATE INDEX idx_koudens_owner_id ON public.koudens USING btree (owner_id);

CREATE INDEX idx_offering_entries_kouden_entry_id ON public.offering_entries USING btree (kouden_entry_id);

CREATE INDEX idx_offering_entries_offering_id ON public.offering_entries USING btree (offering_id);

CREATE INDEX idx_offering_photos_offering_id ON public.offering_photos USING btree (offering_id);

CREATE INDEX idx_offerings_created_by ON public.offerings USING btree (created_by);

CREATE INDEX idx_offerings_kouden_id ON public.offerings USING btree (kouden_id);

CREATE INDEX idx_return_items_kouden_entry_id ON public.return_items USING btree (kouden_entry_id);

CREATE INDEX idx_telegrams_created_by ON public.telegrams USING btree (created_by);

CREATE INDEX idx_telegrams_kouden_entry_id ON public.telegrams USING btree (kouden_entry_id);

CREATE INDEX idx_telegrams_kouden_id ON public.telegrams USING btree (kouden_id);

CREATE UNIQUE INDEX kouden_entries_pkey ON public.kouden_entries USING btree (id);

CREATE UNIQUE INDEX kouden_entry_audit_logs_pkey ON public.kouden_entry_audit_logs USING btree (id);

CREATE UNIQUE INDEX kouden_entry_locks_entry_id_key ON public.kouden_entry_locks USING btree (entry_id);

CREATE UNIQUE INDEX kouden_entry_locks_pkey ON public.kouden_entry_locks USING btree (id);

CREATE UNIQUE INDEX kouden_invitations_invitation_token_key ON public.kouden_invitations USING btree (invitation_token);

CREATE UNIQUE INDEX kouden_invitations_pkey ON public.kouden_invitations USING btree (id);

CREATE UNIQUE INDEX kouden_members_kouden_id_user_id_key ON public.kouden_members USING btree (kouden_id, user_id);

CREATE UNIQUE INDEX kouden_members_pkey ON public.kouden_members USING btree (id);

CREATE UNIQUE INDEX kouden_roles_kouden_id_name_key ON public.kouden_roles USING btree (kouden_id, name);

CREATE UNIQUE INDEX kouden_roles_pkey ON public.kouden_roles USING btree (id);

CREATE UNIQUE INDEX koudens_pkey ON public.koudens USING btree (id);

CREATE UNIQUE INDEX offering_entries_offering_id_kouden_entry_id_key ON public.offering_entries USING btree (offering_id, kouden_entry_id);

CREATE UNIQUE INDEX offering_entries_pkey ON public.offering_entries USING btree (id);

CREATE UNIQUE INDEX offering_photos_pkey ON public.offering_photos USING btree (id);

CREATE UNIQUE INDEX offerings_pkey ON public.offerings USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX relationships_kouden_id_name_key ON public.relationships USING btree (kouden_id, name);

CREATE UNIQUE INDEX relationships_pkey ON public.relationships USING btree (id);

CREATE UNIQUE INDEX return_items_pkey ON public.return_items USING btree (id);

CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id);

CREATE UNIQUE INDEX system_announcements_pkey ON public.system_announcements USING btree (id);

CREATE UNIQUE INDEX telegrams_pkey ON public.telegrams USING btree (id);

CREATE UNIQUE INDEX ticket_messages_pkey ON public.ticket_messages USING btree (id);

CREATE UNIQUE INDEX unique_admin_user ON public.admin_users USING btree (user_id);

CREATE UNIQUE INDEX user_announcement_reads_pkey ON public.user_announcement_reads USING btree (id);

CREATE UNIQUE INDEX user_announcement_reads_user_id_announcement_id_key ON public.user_announcement_reads USING btree (user_id, announcement_id);

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (id);

alter table "public"."admin_audit_logs" add constraint "admin_audit_logs_pkey" PRIMARY KEY using index "admin_audit_logs_pkey";

alter table "public"."admin_users" add constraint "admin_users_pkey" PRIMARY KEY using index "admin_users_pkey";

alter table "public"."debug_logs" add constraint "debug_logs_pkey" PRIMARY KEY using index "debug_logs_pkey";

alter table "public"."kouden_entries" add constraint "kouden_entries_pkey" PRIMARY KEY using index "kouden_entries_pkey";

alter table "public"."kouden_entry_audit_logs" add constraint "kouden_entry_audit_logs_pkey" PRIMARY KEY using index "kouden_entry_audit_logs_pkey";

alter table "public"."kouden_entry_locks" add constraint "kouden_entry_locks_pkey" PRIMARY KEY using index "kouden_entry_locks_pkey";

alter table "public"."kouden_invitations" add constraint "kouden_invitations_pkey" PRIMARY KEY using index "kouden_invitations_pkey";

alter table "public"."kouden_members" add constraint "kouden_members_pkey" PRIMARY KEY using index "kouden_members_pkey";

alter table "public"."kouden_roles" add constraint "kouden_roles_pkey" PRIMARY KEY using index "kouden_roles_pkey";

alter table "public"."koudens" add constraint "koudens_pkey" PRIMARY KEY using index "koudens_pkey";

alter table "public"."offering_entries" add constraint "offering_entries_pkey" PRIMARY KEY using index "offering_entries_pkey";

alter table "public"."offering_photos" add constraint "offering_photos_pkey" PRIMARY KEY using index "offering_photos_pkey";

alter table "public"."offerings" add constraint "offerings_pkey" PRIMARY KEY using index "offerings_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."relationships" add constraint "relationships_pkey" PRIMARY KEY using index "relationships_pkey";

alter table "public"."return_items" add constraint "return_items_pkey" PRIMARY KEY using index "return_items_pkey";

alter table "public"."support_tickets" add constraint "support_tickets_pkey" PRIMARY KEY using index "support_tickets_pkey";

alter table "public"."system_announcements" add constraint "system_announcements_pkey" PRIMARY KEY using index "system_announcements_pkey";

alter table "public"."telegrams" add constraint "telegrams_pkey" PRIMARY KEY using index "telegrams_pkey";

alter table "public"."ticket_messages" add constraint "ticket_messages_pkey" PRIMARY KEY using index "ticket_messages_pkey";

alter table "public"."user_announcement_reads" add constraint "user_announcement_reads_pkey" PRIMARY KEY using index "user_announcement_reads_pkey";

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."admin_audit_logs" add constraint "admin_audit_logs_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES auth.users(id) not valid;

alter table "public"."admin_audit_logs" validate constraint "admin_audit_logs_admin_id_fkey";

alter table "public"."admin_audit_logs" add constraint "valid_target_type" CHECK (((target_type)::text = ANY ((ARRAY['user'::character varying, 'kouden'::character varying, 'announcement'::character varying, 'support_ticket'::character varying, 'admin'::character varying])::text[]))) not valid;

alter table "public"."admin_audit_logs" validate constraint "valid_target_type";

alter table "public"."admin_users" add constraint "admin_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."admin_users" validate constraint "admin_users_user_id_fkey";

alter table "public"."admin_users" add constraint "unique_admin_user" UNIQUE using index "unique_admin_user";

alter table "public"."kouden_entries" add constraint "kouden_entries_attendance_type_check" CHECK ((attendance_type = ANY (ARRAY['FUNERAL'::text, 'CONDOLENCE_VISIT'::text, 'ABSENT'::text]))) not valid;

alter table "public"."kouden_entries" validate constraint "kouden_entries_attendance_type_check";

alter table "public"."kouden_entries" add constraint "kouden_entries_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."kouden_entries" validate constraint "kouden_entries_created_by_fkey";

alter table "public"."kouden_entries" add constraint "kouden_entries_kouden_id_fkey" FOREIGN KEY (kouden_id) REFERENCES koudens(id) ON DELETE CASCADE not valid;

alter table "public"."kouden_entries" validate constraint "kouden_entries_kouden_id_fkey";

alter table "public"."kouden_entries" add constraint "kouden_entries_last_modified_by_fkey" FOREIGN KEY (last_modified_by) REFERENCES auth.users(id) not valid;

alter table "public"."kouden_entries" validate constraint "kouden_entries_last_modified_by_fkey";

alter table "public"."kouden_entry_audit_logs" add constraint "kouden_entry_audit_logs_action_check" CHECK ((action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text]))) not valid;

alter table "public"."kouden_entry_audit_logs" validate constraint "kouden_entry_audit_logs_action_check";

alter table "public"."kouden_entry_audit_logs" add constraint "kouden_entry_audit_logs_entry_id_fkey" FOREIGN KEY (entry_id) REFERENCES kouden_entries(id) ON DELETE CASCADE not valid;

alter table "public"."kouden_entry_audit_logs" validate constraint "kouden_entry_audit_logs_entry_id_fkey";

alter table "public"."kouden_entry_audit_logs" add constraint "kouden_entry_audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."kouden_entry_audit_logs" validate constraint "kouden_entry_audit_logs_user_id_fkey";

alter table "public"."kouden_entry_locks" add constraint "kouden_entry_locks_entry_id_fkey" FOREIGN KEY (entry_id) REFERENCES kouden_entries(id) ON DELETE CASCADE not valid;

alter table "public"."kouden_entry_locks" validate constraint "kouden_entry_locks_entry_id_fkey";

alter table "public"."kouden_entry_locks" add constraint "kouden_entry_locks_entry_id_key" UNIQUE using index "kouden_entry_locks_entry_id_key";

alter table "public"."kouden_entry_locks" add constraint "kouden_entry_locks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."kouden_entry_locks" validate constraint "kouden_entry_locks_user_id_fkey";

alter table "public"."kouden_invitations" add constraint "kouden_invitations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."kouden_invitations" validate constraint "kouden_invitations_created_by_fkey";

alter table "public"."kouden_invitations" add constraint "kouden_invitations_invitation_token_key" UNIQUE using index "kouden_invitations_invitation_token_key";

alter table "public"."kouden_invitations" add constraint "kouden_invitations_kouden_id_fkey" FOREIGN KEY (kouden_id) REFERENCES koudens(id) ON DELETE CASCADE not valid;

alter table "public"."kouden_invitations" validate constraint "kouden_invitations_kouden_id_fkey";

alter table "public"."kouden_invitations" add constraint "kouden_invitations_role_id_fkey" FOREIGN KEY (role_id) REFERENCES kouden_roles(id) ON DELETE CASCADE not valid;

alter table "public"."kouden_invitations" validate constraint "kouden_invitations_role_id_fkey";

alter table "public"."kouden_invitations" add constraint "valid_kouden_data" CHECK (
CASE
    WHEN (kouden_data IS NOT NULL) THEN ((kouden_data ? 'id'::text) AND (kouden_data ? 'title'::text) AND (kouden_data ? 'description'::text))
    ELSE true
END) not valid;

alter table "public"."kouden_invitations" validate constraint "valid_kouden_data";

alter table "public"."kouden_members" add constraint "kouden_members_added_by_fkey" FOREIGN KEY (added_by) REFERENCES auth.users(id) not valid;

alter table "public"."kouden_members" validate constraint "kouden_members_added_by_fkey";

alter table "public"."kouden_members" add constraint "kouden_members_kouden_id_fkey" FOREIGN KEY (kouden_id) REFERENCES koudens(id) ON DELETE CASCADE not valid;

alter table "public"."kouden_members" validate constraint "kouden_members_kouden_id_fkey";

alter table "public"."kouden_members" add constraint "kouden_members_kouden_id_user_id_key" UNIQUE using index "kouden_members_kouden_id_user_id_key";

alter table "public"."kouden_members" add constraint "kouden_members_role_id_fkey" FOREIGN KEY (role_id) REFERENCES kouden_roles(id) ON DELETE CASCADE not valid;

alter table "public"."kouden_members" validate constraint "kouden_members_role_id_fkey";

alter table "public"."kouden_members" add constraint "kouden_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."kouden_members" validate constraint "kouden_members_user_id_fkey";

alter table "public"."kouden_roles" add constraint "kouden_roles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."kouden_roles" validate constraint "kouden_roles_created_by_fkey";

alter table "public"."kouden_roles" add constraint "kouden_roles_kouden_id_fkey" FOREIGN KEY (kouden_id) REFERENCES koudens(id) ON DELETE CASCADE not valid;

alter table "public"."kouden_roles" validate constraint "kouden_roles_kouden_id_fkey";

alter table "public"."kouden_roles" add constraint "kouden_roles_kouden_id_name_key" UNIQUE using index "kouden_roles_kouden_id_name_key";

alter table "public"."koudens" add constraint "koudens_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."koudens" validate constraint "koudens_created_by_fkey";

alter table "public"."koudens" add constraint "koudens_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."koudens" validate constraint "koudens_owner_id_fkey";

alter table "public"."koudens" add constraint "koudens_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text]))) not valid;

alter table "public"."koudens" validate constraint "koudens_status_check";

alter table "public"."offering_entries" add constraint "offering_entries_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."offering_entries" validate constraint "offering_entries_created_by_fkey";

alter table "public"."offering_entries" add constraint "offering_entries_kouden_entry_id_fkey" FOREIGN KEY (kouden_entry_id) REFERENCES kouden_entries(id) ON DELETE CASCADE not valid;

alter table "public"."offering_entries" validate constraint "offering_entries_kouden_entry_id_fkey";

alter table "public"."offering_entries" add constraint "offering_entries_offering_id_fkey" FOREIGN KEY (offering_id) REFERENCES offerings(id) ON DELETE CASCADE not valid;

alter table "public"."offering_entries" validate constraint "offering_entries_offering_id_fkey";

alter table "public"."offering_entries" add constraint "offering_entries_offering_id_kouden_entry_id_key" UNIQUE using index "offering_entries_offering_id_kouden_entry_id_key";

alter table "public"."offering_photos" add constraint "offering_photos_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."offering_photos" validate constraint "offering_photos_created_by_fkey";

alter table "public"."offering_photos" add constraint "offering_photos_offering_id_fkey" FOREIGN KEY (offering_id) REFERENCES offerings(id) ON DELETE CASCADE not valid;

alter table "public"."offering_photos" validate constraint "offering_photos_offering_id_fkey";

alter table "public"."offerings" add constraint "offerings_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."offerings" validate constraint "offerings_created_by_fkey";

alter table "public"."offerings" add constraint "offerings_kouden_id_fkey" FOREIGN KEY (kouden_id) REFERENCES koudens(id) ON DELETE CASCADE not valid;

alter table "public"."offerings" validate constraint "offerings_kouden_id_fkey";

alter table "public"."offerings" add constraint "offerings_type_check" CHECK ((type = ANY (ARRAY['FLOWER'::text, 'FOOD'::text, 'OTHER'::text]))) not valid;

alter table "public"."offerings" validate constraint "offerings_type_check";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."relationships" add constraint "relationships_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."relationships" validate constraint "relationships_created_by_fkey";

alter table "public"."relationships" add constraint "relationships_kouden_id_fkey" FOREIGN KEY (kouden_id) REFERENCES koudens(id) ON DELETE CASCADE not valid;

alter table "public"."relationships" validate constraint "relationships_kouden_id_fkey";

alter table "public"."relationships" add constraint "relationships_kouden_id_name_key" UNIQUE using index "relationships_kouden_id_name_key";

alter table "public"."return_items" add constraint "return_items_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."return_items" validate constraint "return_items_created_by_fkey";

alter table "public"."return_items" add constraint "return_items_delivery_method_check" CHECK ((delivery_method = ANY (ARRAY['shipping'::text, 'hand_delivery'::text]))) not valid;

alter table "public"."return_items" validate constraint "return_items_delivery_method_check";

alter table "public"."return_items" add constraint "return_items_kouden_entry_id_fkey" FOREIGN KEY (kouden_entry_id) REFERENCES kouden_entries(id) ON DELETE CASCADE not valid;

alter table "public"."return_items" validate constraint "return_items_kouden_entry_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_assigned_to_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_priority_check";

alter table "public"."support_tickets" add constraint "support_tickets_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text]))) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_status_check";

alter table "public"."support_tickets" add constraint "support_tickets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_user_id_fkey";

alter table "public"."system_announcements" add constraint "system_announcements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."system_announcements" validate constraint "system_announcements_created_by_fkey";

alter table "public"."system_announcements" add constraint "valid_category" CHECK (((category)::text = ANY ((ARRAY['system'::character varying, 'feature'::character varying, 'important'::character varying, 'event'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."system_announcements" validate constraint "valid_category";

alter table "public"."system_announcements" add constraint "valid_priority" CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))) not valid;

alter table "public"."system_announcements" validate constraint "valid_priority";

alter table "public"."system_announcements" add constraint "valid_status" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[]))) not valid;

alter table "public"."system_announcements" validate constraint "valid_status";

alter table "public"."telegrams" add constraint "telegrams_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."telegrams" validate constraint "telegrams_created_by_fkey";

alter table "public"."telegrams" add constraint "telegrams_kouden_entry_id_fkey" FOREIGN KEY (kouden_entry_id) REFERENCES kouden_entries(id) ON DELETE CASCADE not valid;

alter table "public"."telegrams" validate constraint "telegrams_kouden_entry_id_fkey";

alter table "public"."telegrams" add constraint "telegrams_kouden_id_fkey" FOREIGN KEY (kouden_id) REFERENCES koudens(id) ON DELETE CASCADE not valid;

alter table "public"."telegrams" validate constraint "telegrams_kouden_id_fkey";

alter table "public"."ticket_messages" add constraint "ticket_messages_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."ticket_messages" validate constraint "ticket_messages_created_by_fkey";

alter table "public"."ticket_messages" add constraint "ticket_messages_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE not valid;

alter table "public"."ticket_messages" validate constraint "ticket_messages_ticket_id_fkey";

alter table "public"."user_announcement_reads" add constraint "user_announcement_reads_announcement_id_fkey" FOREIGN KEY (announcement_id) REFERENCES system_announcements(id) not valid;

alter table "public"."user_announcement_reads" validate constraint "user_announcement_reads_announcement_id_fkey";

alter table "public"."user_announcement_reads" add constraint "user_announcement_reads_user_id_announcement_id_key" UNIQUE using index "user_announcement_reads_user_id_announcement_id_key";

alter table "public"."user_announcement_reads" add constraint "user_announcement_reads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_announcement_reads" validate constraint "user_announcement_reads_user_id_fkey";

alter table "public"."user_settings" add constraint "user_settings_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_settings" validate constraint "user_settings_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_invitation_token uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.add_kouden_owner()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    editor_role_id UUID;
BEGIN
    -- 編集者ロールのIDを取得（nameを'editor'に修正）
    SELECT id INTO editor_role_id
    FROM kouden_roles
    WHERE kouden_id = NEW.id
    AND name = 'editor'
    LIMIT 1;

    IF editor_role_id IS NULL THEN
        RAISE EXCEPTION 'Editor role not found for kouden_id: %', NEW.id;
    END IF;

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
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM kouden_entry_locks
    WHERE expires_at < NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_kouden_related_data()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- 関連する招待情報の削除
    DELETE FROM kouden_invitations WHERE kouden_id = OLD.id;
    
    -- 関連するメンバー情報の削除
    DELETE FROM kouden_members WHERE kouden_id = OLD.id;
    
    -- 関連するロール情報の削除
    DELETE FROM kouden_roles WHERE kouden_id = OLD.id;
    
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_admin_audit_log(p_action character varying, p_target_type character varying, p_target_id uuid, p_details jsonb DEFAULT NULL::jsonb, p_ip_address inet DEFAULT NULL::inet)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_announcement_reads_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- 新規ユーザーに対して公開中のお知らせの未読状態を作成
    INSERT INTO user_announcement_reads (user_id, announcement_id, is_read)
    SELECT NEW.id, id, FALSE
    FROM system_announcements
    WHERE status = 'published'
    ON CONFLICT (user_id, announcement_id) DO NOTHING;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_default_kouden_roles()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.create_invitation(p_kouden_id uuid, p_email text, p_role_id uuid, p_created_by uuid, p_type invitation_type DEFAULT 'email'::invitation_type, p_max_uses integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.invitation_token IS NULL THEN
        NEW.invitation_token := encode(gen_random_bytes(32), 'hex');
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- 既存の設定がない場合のみ作成
    IF NOT EXISTS (SELECT 1 FROM public.user_settings WHERE id = NEW.id) THEN
        INSERT INTO public.user_settings (id)
        VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_invitation_used_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- 招待IDがある場合のみカウントを更新
    IF NEW.invitation_id IS NOT NULL THEN
        UPDATE kouden_invitations
        SET used_count = used_count + 1
        WHERE id = NEW.invitation_id;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_default_relationships()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_default_relationships(kouden_id uuid, owner_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(user_uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admin_users 
        WHERE user_id = user_uid
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_debug(p_action text, p_details jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO debug_logs (action, user_id, details)
    VALUES (p_action, auth.uid(), p_details)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_kouden_entry_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.manage_announcement_reads()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- 新規作成または更新で公開状態になった場合
    IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR
       (TG_OP = 'UPDATE' AND NEW.status = 'published' AND OLD.status != 'published') THEN
        -- 全ユーザーに対して未読状態を作成
        INSERT INTO user_announcement_reads (user_id, announcement_id, is_read)
        SELECT id, NEW.id, FALSE
        FROM auth.users
        ON CONFLICT (user_id, announcement_id) DO NOTHING;
    
    -- 更新で非公開状態になった場合
    ELSIF (TG_OP = 'UPDATE' AND NEW.status != 'published' AND OLD.status = 'published') OR
          (TG_OP = 'DELETE' AND OLD.status = 'published') THEN
        -- 既読状態を削除
        DELETE FROM user_announcement_reads
        WHERE announcement_id = COALESCE(NEW.id, OLD.id);
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.remove_member(p_kouden_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_invitation_token(token uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_admin_users_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_has_offering_flag()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- INSERTの場合は、関連する香典エントリーのhas_offeringをtrueに設定
    UPDATE kouden_entries
    SET has_offering = true
    WHERE id = NEW.kouden_entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- DELETEの場合は、他に関連するお供物がなければhas_offeringをfalseに設定
    UPDATE kouden_entries
    SET has_offering = EXISTS (
      SELECT 1
      FROM offering_entries
      WHERE kouden_entry_id = OLD.kouden_entry_id
      AND id != OLD.id
    )
    WHERE id = OLD.kouden_entry_id;
  END IF;
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_kouden_entry_locks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_kouden_entry_modified()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.last_modified_at = NOW();
    NEW.last_modified_by = auth.uid();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_member_role(p_kouden_id uuid, p_user_id uuid, p_role_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_support_ticket_comments_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_system_announcements_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."admin_audit_logs" to "anon";

grant insert on table "public"."admin_audit_logs" to "anon";

grant references on table "public"."admin_audit_logs" to "anon";

grant select on table "public"."admin_audit_logs" to "anon";

grant trigger on table "public"."admin_audit_logs" to "anon";

grant truncate on table "public"."admin_audit_logs" to "anon";

grant update on table "public"."admin_audit_logs" to "anon";

grant delete on table "public"."admin_audit_logs" to "authenticated";

grant insert on table "public"."admin_audit_logs" to "authenticated";

grant references on table "public"."admin_audit_logs" to "authenticated";

grant select on table "public"."admin_audit_logs" to "authenticated";

grant trigger on table "public"."admin_audit_logs" to "authenticated";

grant truncate on table "public"."admin_audit_logs" to "authenticated";

grant update on table "public"."admin_audit_logs" to "authenticated";

grant delete on table "public"."admin_audit_logs" to "service_role";

grant insert on table "public"."admin_audit_logs" to "service_role";

grant references on table "public"."admin_audit_logs" to "service_role";

grant select on table "public"."admin_audit_logs" to "service_role";

grant trigger on table "public"."admin_audit_logs" to "service_role";

grant truncate on table "public"."admin_audit_logs" to "service_role";

grant update on table "public"."admin_audit_logs" to "service_role";

grant delete on table "public"."admin_users" to "anon";

grant insert on table "public"."admin_users" to "anon";

grant references on table "public"."admin_users" to "anon";

grant select on table "public"."admin_users" to "anon";

grant trigger on table "public"."admin_users" to "anon";

grant truncate on table "public"."admin_users" to "anon";

grant update on table "public"."admin_users" to "anon";

grant delete on table "public"."admin_users" to "authenticated";

grant insert on table "public"."admin_users" to "authenticated";

grant references on table "public"."admin_users" to "authenticated";

grant select on table "public"."admin_users" to "authenticated";

grant trigger on table "public"."admin_users" to "authenticated";

grant truncate on table "public"."admin_users" to "authenticated";

grant update on table "public"."admin_users" to "authenticated";

grant delete on table "public"."admin_users" to "service_role";

grant insert on table "public"."admin_users" to "service_role";

grant references on table "public"."admin_users" to "service_role";

grant select on table "public"."admin_users" to "service_role";

grant trigger on table "public"."admin_users" to "service_role";

grant truncate on table "public"."admin_users" to "service_role";

grant update on table "public"."admin_users" to "service_role";

grant delete on table "public"."debug_logs" to "anon";

grant insert on table "public"."debug_logs" to "anon";

grant references on table "public"."debug_logs" to "anon";

grant select on table "public"."debug_logs" to "anon";

grant trigger on table "public"."debug_logs" to "anon";

grant truncate on table "public"."debug_logs" to "anon";

grant update on table "public"."debug_logs" to "anon";

grant delete on table "public"."debug_logs" to "authenticated";

grant insert on table "public"."debug_logs" to "authenticated";

grant references on table "public"."debug_logs" to "authenticated";

grant select on table "public"."debug_logs" to "authenticated";

grant trigger on table "public"."debug_logs" to "authenticated";

grant truncate on table "public"."debug_logs" to "authenticated";

grant update on table "public"."debug_logs" to "authenticated";

grant delete on table "public"."debug_logs" to "service_role";

grant insert on table "public"."debug_logs" to "service_role";

grant references on table "public"."debug_logs" to "service_role";

grant select on table "public"."debug_logs" to "service_role";

grant trigger on table "public"."debug_logs" to "service_role";

grant truncate on table "public"."debug_logs" to "service_role";

grant update on table "public"."debug_logs" to "service_role";

grant delete on table "public"."kouden_entries" to "anon";

grant insert on table "public"."kouden_entries" to "anon";

grant references on table "public"."kouden_entries" to "anon";

grant select on table "public"."kouden_entries" to "anon";

grant trigger on table "public"."kouden_entries" to "anon";

grant truncate on table "public"."kouden_entries" to "anon";

grant update on table "public"."kouden_entries" to "anon";

grant delete on table "public"."kouden_entries" to "authenticated";

grant insert on table "public"."kouden_entries" to "authenticated";

grant references on table "public"."kouden_entries" to "authenticated";

grant select on table "public"."kouden_entries" to "authenticated";

grant trigger on table "public"."kouden_entries" to "authenticated";

grant truncate on table "public"."kouden_entries" to "authenticated";

grant update on table "public"."kouden_entries" to "authenticated";

grant delete on table "public"."kouden_entries" to "service_role";

grant insert on table "public"."kouden_entries" to "service_role";

grant references on table "public"."kouden_entries" to "service_role";

grant select on table "public"."kouden_entries" to "service_role";

grant trigger on table "public"."kouden_entries" to "service_role";

grant truncate on table "public"."kouden_entries" to "service_role";

grant update on table "public"."kouden_entries" to "service_role";

grant delete on table "public"."kouden_entry_audit_logs" to "anon";

grant insert on table "public"."kouden_entry_audit_logs" to "anon";

grant references on table "public"."kouden_entry_audit_logs" to "anon";

grant select on table "public"."kouden_entry_audit_logs" to "anon";

grant trigger on table "public"."kouden_entry_audit_logs" to "anon";

grant truncate on table "public"."kouden_entry_audit_logs" to "anon";

grant update on table "public"."kouden_entry_audit_logs" to "anon";

grant delete on table "public"."kouden_entry_audit_logs" to "authenticated";

grant insert on table "public"."kouden_entry_audit_logs" to "authenticated";

grant references on table "public"."kouden_entry_audit_logs" to "authenticated";

grant select on table "public"."kouden_entry_audit_logs" to "authenticated";

grant trigger on table "public"."kouden_entry_audit_logs" to "authenticated";

grant truncate on table "public"."kouden_entry_audit_logs" to "authenticated";

grant update on table "public"."kouden_entry_audit_logs" to "authenticated";

grant delete on table "public"."kouden_entry_audit_logs" to "service_role";

grant insert on table "public"."kouden_entry_audit_logs" to "service_role";

grant references on table "public"."kouden_entry_audit_logs" to "service_role";

grant select on table "public"."kouden_entry_audit_logs" to "service_role";

grant trigger on table "public"."kouden_entry_audit_logs" to "service_role";

grant truncate on table "public"."kouden_entry_audit_logs" to "service_role";

grant update on table "public"."kouden_entry_audit_logs" to "service_role";

grant delete on table "public"."kouden_entry_locks" to "anon";

grant insert on table "public"."kouden_entry_locks" to "anon";

grant references on table "public"."kouden_entry_locks" to "anon";

grant select on table "public"."kouden_entry_locks" to "anon";

grant trigger on table "public"."kouden_entry_locks" to "anon";

grant truncate on table "public"."kouden_entry_locks" to "anon";

grant update on table "public"."kouden_entry_locks" to "anon";

grant delete on table "public"."kouden_entry_locks" to "authenticated";

grant insert on table "public"."kouden_entry_locks" to "authenticated";

grant references on table "public"."kouden_entry_locks" to "authenticated";

grant select on table "public"."kouden_entry_locks" to "authenticated";

grant trigger on table "public"."kouden_entry_locks" to "authenticated";

grant truncate on table "public"."kouden_entry_locks" to "authenticated";

grant update on table "public"."kouden_entry_locks" to "authenticated";

grant delete on table "public"."kouden_entry_locks" to "service_role";

grant insert on table "public"."kouden_entry_locks" to "service_role";

grant references on table "public"."kouden_entry_locks" to "service_role";

grant select on table "public"."kouden_entry_locks" to "service_role";

grant trigger on table "public"."kouden_entry_locks" to "service_role";

grant truncate on table "public"."kouden_entry_locks" to "service_role";

grant update on table "public"."kouden_entry_locks" to "service_role";

grant delete on table "public"."kouden_invitations" to "anon";

grant insert on table "public"."kouden_invitations" to "anon";

grant references on table "public"."kouden_invitations" to "anon";

grant select on table "public"."kouden_invitations" to "anon";

grant trigger on table "public"."kouden_invitations" to "anon";

grant truncate on table "public"."kouden_invitations" to "anon";

grant update on table "public"."kouden_invitations" to "anon";

grant delete on table "public"."kouden_invitations" to "authenticated";

grant insert on table "public"."kouden_invitations" to "authenticated";

grant references on table "public"."kouden_invitations" to "authenticated";

grant select on table "public"."kouden_invitations" to "authenticated";

grant trigger on table "public"."kouden_invitations" to "authenticated";

grant truncate on table "public"."kouden_invitations" to "authenticated";

grant update on table "public"."kouden_invitations" to "authenticated";

grant delete on table "public"."kouden_invitations" to "service_role";

grant insert on table "public"."kouden_invitations" to "service_role";

grant references on table "public"."kouden_invitations" to "service_role";

grant select on table "public"."kouden_invitations" to "service_role";

grant trigger on table "public"."kouden_invitations" to "service_role";

grant truncate on table "public"."kouden_invitations" to "service_role";

grant update on table "public"."kouden_invitations" to "service_role";

grant delete on table "public"."kouden_members" to "anon";

grant insert on table "public"."kouden_members" to "anon";

grant references on table "public"."kouden_members" to "anon";

grant select on table "public"."kouden_members" to "anon";

grant trigger on table "public"."kouden_members" to "anon";

grant truncate on table "public"."kouden_members" to "anon";

grant update on table "public"."kouden_members" to "anon";

grant delete on table "public"."kouden_members" to "authenticated";

grant insert on table "public"."kouden_members" to "authenticated";

grant references on table "public"."kouden_members" to "authenticated";

grant select on table "public"."kouden_members" to "authenticated";

grant trigger on table "public"."kouden_members" to "authenticated";

grant truncate on table "public"."kouden_members" to "authenticated";

grant update on table "public"."kouden_members" to "authenticated";

grant delete on table "public"."kouden_members" to "service_role";

grant insert on table "public"."kouden_members" to "service_role";

grant references on table "public"."kouden_members" to "service_role";

grant select on table "public"."kouden_members" to "service_role";

grant trigger on table "public"."kouden_members" to "service_role";

grant truncate on table "public"."kouden_members" to "service_role";

grant update on table "public"."kouden_members" to "service_role";

grant delete on table "public"."kouden_roles" to "anon";

grant insert on table "public"."kouden_roles" to "anon";

grant references on table "public"."kouden_roles" to "anon";

grant select on table "public"."kouden_roles" to "anon";

grant trigger on table "public"."kouden_roles" to "anon";

grant truncate on table "public"."kouden_roles" to "anon";

grant update on table "public"."kouden_roles" to "anon";

grant delete on table "public"."kouden_roles" to "authenticated";

grant insert on table "public"."kouden_roles" to "authenticated";

grant references on table "public"."kouden_roles" to "authenticated";

grant select on table "public"."kouden_roles" to "authenticated";

grant trigger on table "public"."kouden_roles" to "authenticated";

grant truncate on table "public"."kouden_roles" to "authenticated";

grant update on table "public"."kouden_roles" to "authenticated";

grant delete on table "public"."kouden_roles" to "service_role";

grant insert on table "public"."kouden_roles" to "service_role";

grant references on table "public"."kouden_roles" to "service_role";

grant select on table "public"."kouden_roles" to "service_role";

grant trigger on table "public"."kouden_roles" to "service_role";

grant truncate on table "public"."kouden_roles" to "service_role";

grant update on table "public"."kouden_roles" to "service_role";

grant select on table "public"."koudens" to "anon";

grant delete on table "public"."koudens" to "authenticated";

grant insert on table "public"."koudens" to "authenticated";

grant references on table "public"."koudens" to "authenticated";

grant select on table "public"."koudens" to "authenticated";

grant trigger on table "public"."koudens" to "authenticated";

grant truncate on table "public"."koudens" to "authenticated";

grant update on table "public"."koudens" to "authenticated";

grant delete on table "public"."koudens" to "service_role";

grant insert on table "public"."koudens" to "service_role";

grant references on table "public"."koudens" to "service_role";

grant select on table "public"."koudens" to "service_role";

grant trigger on table "public"."koudens" to "service_role";

grant truncate on table "public"."koudens" to "service_role";

grant update on table "public"."koudens" to "service_role";

grant delete on table "public"."offering_entries" to "anon";

grant insert on table "public"."offering_entries" to "anon";

grant references on table "public"."offering_entries" to "anon";

grant select on table "public"."offering_entries" to "anon";

grant trigger on table "public"."offering_entries" to "anon";

grant truncate on table "public"."offering_entries" to "anon";

grant update on table "public"."offering_entries" to "anon";

grant delete on table "public"."offering_entries" to "authenticated";

grant insert on table "public"."offering_entries" to "authenticated";

grant references on table "public"."offering_entries" to "authenticated";

grant select on table "public"."offering_entries" to "authenticated";

grant trigger on table "public"."offering_entries" to "authenticated";

grant truncate on table "public"."offering_entries" to "authenticated";

grant update on table "public"."offering_entries" to "authenticated";

grant delete on table "public"."offering_entries" to "service_role";

grant insert on table "public"."offering_entries" to "service_role";

grant references on table "public"."offering_entries" to "service_role";

grant select on table "public"."offering_entries" to "service_role";

grant trigger on table "public"."offering_entries" to "service_role";

grant truncate on table "public"."offering_entries" to "service_role";

grant update on table "public"."offering_entries" to "service_role";

grant delete on table "public"."offering_photos" to "anon";

grant insert on table "public"."offering_photos" to "anon";

grant references on table "public"."offering_photos" to "anon";

grant select on table "public"."offering_photos" to "anon";

grant trigger on table "public"."offering_photos" to "anon";

grant truncate on table "public"."offering_photos" to "anon";

grant update on table "public"."offering_photos" to "anon";

grant delete on table "public"."offering_photos" to "authenticated";

grant insert on table "public"."offering_photos" to "authenticated";

grant references on table "public"."offering_photos" to "authenticated";

grant select on table "public"."offering_photos" to "authenticated";

grant trigger on table "public"."offering_photos" to "authenticated";

grant truncate on table "public"."offering_photos" to "authenticated";

grant update on table "public"."offering_photos" to "authenticated";

grant delete on table "public"."offering_photos" to "service_role";

grant insert on table "public"."offering_photos" to "service_role";

grant references on table "public"."offering_photos" to "service_role";

grant select on table "public"."offering_photos" to "service_role";

grant trigger on table "public"."offering_photos" to "service_role";

grant truncate on table "public"."offering_photos" to "service_role";

grant update on table "public"."offering_photos" to "service_role";

grant delete on table "public"."offerings" to "anon";

grant insert on table "public"."offerings" to "anon";

grant references on table "public"."offerings" to "anon";

grant select on table "public"."offerings" to "anon";

grant trigger on table "public"."offerings" to "anon";

grant truncate on table "public"."offerings" to "anon";

grant update on table "public"."offerings" to "anon";

grant delete on table "public"."offerings" to "authenticated";

grant insert on table "public"."offerings" to "authenticated";

grant references on table "public"."offerings" to "authenticated";

grant select on table "public"."offerings" to "authenticated";

grant trigger on table "public"."offerings" to "authenticated";

grant truncate on table "public"."offerings" to "authenticated";

grant update on table "public"."offerings" to "authenticated";

grant delete on table "public"."offerings" to "service_role";

grant insert on table "public"."offerings" to "service_role";

grant references on table "public"."offerings" to "service_role";

grant select on table "public"."offerings" to "service_role";

grant trigger on table "public"."offerings" to "service_role";

grant truncate on table "public"."offerings" to "service_role";

grant update on table "public"."offerings" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."relationships" to "anon";

grant insert on table "public"."relationships" to "anon";

grant references on table "public"."relationships" to "anon";

grant select on table "public"."relationships" to "anon";

grant trigger on table "public"."relationships" to "anon";

grant truncate on table "public"."relationships" to "anon";

grant update on table "public"."relationships" to "anon";

grant delete on table "public"."relationships" to "authenticated";

grant insert on table "public"."relationships" to "authenticated";

grant references on table "public"."relationships" to "authenticated";

grant select on table "public"."relationships" to "authenticated";

grant trigger on table "public"."relationships" to "authenticated";

grant truncate on table "public"."relationships" to "authenticated";

grant update on table "public"."relationships" to "authenticated";

grant delete on table "public"."relationships" to "service_role";

grant insert on table "public"."relationships" to "service_role";

grant references on table "public"."relationships" to "service_role";

grant select on table "public"."relationships" to "service_role";

grant trigger on table "public"."relationships" to "service_role";

grant truncate on table "public"."relationships" to "service_role";

grant update on table "public"."relationships" to "service_role";

grant delete on table "public"."return_items" to "anon";

grant insert on table "public"."return_items" to "anon";

grant references on table "public"."return_items" to "anon";

grant select on table "public"."return_items" to "anon";

grant trigger on table "public"."return_items" to "anon";

grant truncate on table "public"."return_items" to "anon";

grant update on table "public"."return_items" to "anon";

grant delete on table "public"."return_items" to "authenticated";

grant insert on table "public"."return_items" to "authenticated";

grant references on table "public"."return_items" to "authenticated";

grant select on table "public"."return_items" to "authenticated";

grant trigger on table "public"."return_items" to "authenticated";

grant truncate on table "public"."return_items" to "authenticated";

grant update on table "public"."return_items" to "authenticated";

grant delete on table "public"."return_items" to "service_role";

grant insert on table "public"."return_items" to "service_role";

grant references on table "public"."return_items" to "service_role";

grant select on table "public"."return_items" to "service_role";

grant trigger on table "public"."return_items" to "service_role";

grant truncate on table "public"."return_items" to "service_role";

grant update on table "public"."return_items" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant references on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant trigger on table "public"."support_tickets" to "anon";

grant truncate on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant references on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant trigger on table "public"."support_tickets" to "authenticated";

grant truncate on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant references on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant trigger on table "public"."support_tickets" to "service_role";

grant truncate on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";

grant delete on table "public"."system_announcements" to "anon";

grant insert on table "public"."system_announcements" to "anon";

grant references on table "public"."system_announcements" to "anon";

grant select on table "public"."system_announcements" to "anon";

grant trigger on table "public"."system_announcements" to "anon";

grant truncate on table "public"."system_announcements" to "anon";

grant update on table "public"."system_announcements" to "anon";

grant delete on table "public"."system_announcements" to "authenticated";

grant insert on table "public"."system_announcements" to "authenticated";

grant references on table "public"."system_announcements" to "authenticated";

grant select on table "public"."system_announcements" to "authenticated";

grant trigger on table "public"."system_announcements" to "authenticated";

grant truncate on table "public"."system_announcements" to "authenticated";

grant update on table "public"."system_announcements" to "authenticated";

grant delete on table "public"."system_announcements" to "service_role";

grant insert on table "public"."system_announcements" to "service_role";

grant references on table "public"."system_announcements" to "service_role";

grant select on table "public"."system_announcements" to "service_role";

grant trigger on table "public"."system_announcements" to "service_role";

grant truncate on table "public"."system_announcements" to "service_role";

grant update on table "public"."system_announcements" to "service_role";

grant delete on table "public"."telegrams" to "anon";

grant insert on table "public"."telegrams" to "anon";

grant references on table "public"."telegrams" to "anon";

grant select on table "public"."telegrams" to "anon";

grant trigger on table "public"."telegrams" to "anon";

grant truncate on table "public"."telegrams" to "anon";

grant update on table "public"."telegrams" to "anon";

grant delete on table "public"."telegrams" to "authenticated";

grant insert on table "public"."telegrams" to "authenticated";

grant references on table "public"."telegrams" to "authenticated";

grant select on table "public"."telegrams" to "authenticated";

grant trigger on table "public"."telegrams" to "authenticated";

grant truncate on table "public"."telegrams" to "authenticated";

grant update on table "public"."telegrams" to "authenticated";

grant delete on table "public"."telegrams" to "service_role";

grant insert on table "public"."telegrams" to "service_role";

grant references on table "public"."telegrams" to "service_role";

grant select on table "public"."telegrams" to "service_role";

grant trigger on table "public"."telegrams" to "service_role";

grant truncate on table "public"."telegrams" to "service_role";

grant update on table "public"."telegrams" to "service_role";

grant delete on table "public"."ticket_messages" to "anon";

grant insert on table "public"."ticket_messages" to "anon";

grant references on table "public"."ticket_messages" to "anon";

grant select on table "public"."ticket_messages" to "anon";

grant trigger on table "public"."ticket_messages" to "anon";

grant truncate on table "public"."ticket_messages" to "anon";

grant update on table "public"."ticket_messages" to "anon";

grant delete on table "public"."ticket_messages" to "authenticated";

grant insert on table "public"."ticket_messages" to "authenticated";

grant references on table "public"."ticket_messages" to "authenticated";

grant select on table "public"."ticket_messages" to "authenticated";

grant trigger on table "public"."ticket_messages" to "authenticated";

grant truncate on table "public"."ticket_messages" to "authenticated";

grant update on table "public"."ticket_messages" to "authenticated";

grant delete on table "public"."ticket_messages" to "service_role";

grant insert on table "public"."ticket_messages" to "service_role";

grant references on table "public"."ticket_messages" to "service_role";

grant select on table "public"."ticket_messages" to "service_role";

grant trigger on table "public"."ticket_messages" to "service_role";

grant truncate on table "public"."ticket_messages" to "service_role";

grant update on table "public"."ticket_messages" to "service_role";

grant delete on table "public"."user_announcement_reads" to "anon";

grant insert on table "public"."user_announcement_reads" to "anon";

grant references on table "public"."user_announcement_reads" to "anon";

grant select on table "public"."user_announcement_reads" to "anon";

grant trigger on table "public"."user_announcement_reads" to "anon";

grant truncate on table "public"."user_announcement_reads" to "anon";

grant update on table "public"."user_announcement_reads" to "anon";

grant delete on table "public"."user_announcement_reads" to "authenticated";

grant insert on table "public"."user_announcement_reads" to "authenticated";

grant references on table "public"."user_announcement_reads" to "authenticated";

grant select on table "public"."user_announcement_reads" to "authenticated";

grant trigger on table "public"."user_announcement_reads" to "authenticated";

grant truncate on table "public"."user_announcement_reads" to "authenticated";

grant update on table "public"."user_announcement_reads" to "authenticated";

grant delete on table "public"."user_announcement_reads" to "service_role";

grant insert on table "public"."user_announcement_reads" to "service_role";

grant references on table "public"."user_announcement_reads" to "service_role";

grant select on table "public"."user_announcement_reads" to "service_role";

grant trigger on table "public"."user_announcement_reads" to "service_role";

grant truncate on table "public"."user_announcement_reads" to "service_role";

grant update on table "public"."user_announcement_reads" to "service_role";

grant delete on table "public"."user_settings" to "anon";

grant insert on table "public"."user_settings" to "anon";

grant references on table "public"."user_settings" to "anon";

grant select on table "public"."user_settings" to "anon";

grant trigger on table "public"."user_settings" to "anon";

grant truncate on table "public"."user_settings" to "anon";

grant update on table "public"."user_settings" to "anon";

grant delete on table "public"."user_settings" to "authenticated";

grant insert on table "public"."user_settings" to "authenticated";

grant references on table "public"."user_settings" to "authenticated";

grant select on table "public"."user_settings" to "authenticated";

grant trigger on table "public"."user_settings" to "authenticated";

grant truncate on table "public"."user_settings" to "authenticated";

grant update on table "public"."user_settings" to "authenticated";

grant delete on table "public"."user_settings" to "service_role";

grant insert on table "public"."user_settings" to "service_role";

grant references on table "public"."user_settings" to "service_role";

grant select on table "public"."user_settings" to "service_role";

grant trigger on table "public"."user_settings" to "service_role";

grant truncate on table "public"."user_settings" to "service_role";

grant update on table "public"."user_settings" to "service_role";

create policy "Admins can view audit logs"
on "public"."admin_audit_logs"
as permissive
for select
to authenticated
using (is_admin(auth.uid()));


create policy "System can insert audit logs"
on "public"."admin_audit_logs"
as permissive
for insert
to authenticated
with check (is_admin(auth.uid()));


create policy "Admins can view admin_users"
on "public"."admin_users"
as permissive
for select
to authenticated
using (is_admin(auth.uid()));


create policy "Super admins can delete admin_users"
on "public"."admin_users"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM admin_users admin_users_1
  WHERE ((admin_users_1.user_id = auth.uid()) AND ((admin_users_1.role)::text = 'super_admin'::text)))));


create policy "Super admins can insert admin_users"
on "public"."admin_users"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM admin_users admin_users_1
  WHERE ((admin_users_1.user_id = auth.uid()) AND ((admin_users_1.role)::text = 'super_admin'::text)))));


create policy "Super admins can update admin_users"
on "public"."admin_users"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM admin_users admin_users_1
  WHERE ((admin_users_1.user_id = auth.uid()) AND ((admin_users_1.role)::text = 'super_admin'::text)))));


create policy "Allow insert debug logs"
on "public"."debug_logs"
as permissive
for insert
to authenticated
with check (true);


create policy "Allow read own debug logs"
on "public"."debug_logs"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "editor_crud_access"
on "public"."kouden_entries"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM (kouden_members m
     JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((m.kouden_id = kouden_entries.kouden_id) AND (m.user_id = auth.uid()) AND ((r.name = 'editor'::text) OR ('entry.write'::text = ANY (r.permissions)))))))
with check ((EXISTS ( SELECT 1
   FROM (kouden_members m
     JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((m.kouden_id = kouden_entries.kouden_id) AND (m.user_id = auth.uid()) AND ((r.name = 'editor'::text) OR ('entry.write'::text = ANY (r.permissions)))))));


create policy "owner_crud_access"
on "public"."kouden_entries"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM koudens k
  WHERE ((k.id = kouden_entries.kouden_id) AND ((k.owner_id = auth.uid()) OR (k.created_by = auth.uid()))))))
with check ((EXISTS ( SELECT 1
   FROM koudens k
  WHERE ((k.id = kouden_entries.kouden_id) AND ((k.owner_id = auth.uid()) OR (k.created_by = auth.uid()))))));


create policy "viewer_read_access"
on "public"."kouden_entries"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (kouden_members m
     JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((m.kouden_id = kouden_entries.kouden_id) AND (m.user_id = auth.uid()) AND ((r.name = 'viewer'::text) OR ('entry.read'::text = ANY (r.permissions)))))));


create policy "システムは監査ログを作成できる"
on "public"."kouden_entry_audit_logs"
as permissive
for insert
to public
with check (true);


create policy "ユーザーは自分のロックを削除できる"
on "public"."kouden_entry_locks"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "invitation_link_access"
on "public"."kouden_invitations"
as permissive
for select
to public
using (((status = 'pending'::invitation_status) AND (expires_at > now()) AND ((max_uses IS NULL) OR (used_count < max_uses))));


create policy "owner_invitation_access"
on "public"."kouden_invitations"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM koudens k
  WHERE ((k.id = kouden_invitations.kouden_id) AND (k.owner_id = auth.uid())))));


create policy "members_basic_access"
on "public"."kouden_members"
as permissive
for select
to authenticated
using (true);


create policy "members_invitation_insert"
on "public"."kouden_members"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM kouden_invitations
  WHERE ((kouden_invitations.id = kouden_members.invitation_id) AND (kouden_invitations.invitation_token = (current_setting('app.current_invitation_token'::text, true))::uuid) AND (kouden_invitations.status = 'pending'::invitation_status) AND (kouden_invitations.expires_at > now()) AND ((kouden_invitations.max_uses IS NULL) OR (kouden_invitations.used_count < kouden_invitations.max_uses))))));


create policy "members_management"
on "public"."kouden_members"
as permissive
for all
to authenticated
using ((added_by = auth.uid()))
with check ((added_by = auth.uid()));


create policy "members_owner_delete"
on "public"."kouden_members"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM koudens
  WHERE ((koudens.id = kouden_members.kouden_id) AND (koudens.owner_id = auth.uid())))));


create policy "members_owner_update"
on "public"."kouden_members"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM koudens
  WHERE ((koudens.id = kouden_members.kouden_id) AND (koudens.owner_id = auth.uid())))));


create policy "kouden_roles_member_access"
on "public"."kouden_roles"
as permissive
for select
to authenticated
using ((id IN ( SELECT kouden_members.role_id
   FROM kouden_members
  WHERE (kouden_members.user_id = auth.uid()))));


create policy "kouden_roles_simple_access"
on "public"."kouden_roles"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM koudens
  WHERE ((koudens.id = kouden_roles.kouden_id) AND (koudens.owner_id = auth.uid())))));


create policy "basic_access"
on "public"."koudens"
as permissive
for all
to authenticated
using (((owner_id = auth.uid()) OR (created_by = auth.uid()) OR (id IN ( SELECT kouden_members.kouden_id
   FROM kouden_members
  WHERE (kouden_members.user_id = auth.uid())))));


create policy "koudens_insert_policy"
on "public"."koudens"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "owner_access"
on "public"."koudens"
as permissive
for all
to authenticated
using (((owner_id = auth.uid()) OR (created_by = auth.uid())));


create policy "Users can view offering entries"
on "public"."offering_entries"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (kouden_entries ke
     JOIN koudens k ON ((k.id = ke.kouden_id)))
  WHERE ((ke.id = offering_entries.kouden_entry_id) AND ((k.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM (kouden_members m
             JOIN kouden_roles r ON ((m.role_id = r.id)))
          WHERE ((m.kouden_id = k.id) AND (m.user_id = auth.uid()) AND (r.name = ANY (ARRAY['編集者'::text, '閲覧者'::text]))))))))));


create policy "editor_delete_access"
on "public"."offering_entries"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (((kouden_entries ke
     JOIN koudens k ON ((k.id = ke.kouden_id)))
     JOIN kouden_members m ON ((m.kouden_id = k.id)))
     JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((ke.id = offering_entries.kouden_entry_id) AND (m.user_id = auth.uid()) AND ((r.name = 'editor'::text) OR ('entry.write'::text = ANY (r.permissions)))))));


create policy "editor_insert_access"
on "public"."offering_entries"
as permissive
for insert
to authenticated
with check (((EXISTS ( SELECT 1
   FROM (((kouden_entries ke
     JOIN koudens k ON ((k.id = ke.kouden_id)))
     JOIN kouden_members m ON ((m.kouden_id = k.id)))
     JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((ke.id = offering_entries.kouden_entry_id) AND (m.user_id = auth.uid()) AND ((r.name = 'editor'::text) OR ('entry.write'::text = ANY (r.permissions)))))) AND (auth.uid() = created_by)));


create policy "editor_crud_access"
on "public"."offering_photos"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM (((offerings o
     JOIN koudens k ON ((o.kouden_id = k.id)))
     LEFT JOIN kouden_members m ON ((k.id = m.kouden_id)))
     LEFT JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((o.id = offering_photos.offering_id) AND ((k.owner_id = auth.uid()) OR (k.created_by = auth.uid()) OR (o.created_by = auth.uid()) OR ((m.user_id = auth.uid()) AND ((r.name = 'editor'::text) OR ('entry.write'::text = ANY (r.permissions)))))))))
with check ((EXISTS ( SELECT 1
   FROM (((offerings o
     JOIN koudens k ON ((o.kouden_id = k.id)))
     LEFT JOIN kouden_members m ON ((k.id = m.kouden_id)))
     LEFT JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((o.id = offering_photos.offering_id) AND ((k.owner_id = auth.uid()) OR (k.created_by = auth.uid()) OR ((m.user_id = auth.uid()) AND ((r.name = 'editor'::text) OR ('entry.write'::text = ANY (r.permissions)))))))));


create policy "viewer_read_access"
on "public"."offering_photos"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (((offerings o
     JOIN koudens k ON ((o.kouden_id = k.id)))
     LEFT JOIN kouden_members m ON ((k.id = m.kouden_id)))
     LEFT JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((o.id = offering_photos.offering_id) AND ((k.owner_id = auth.uid()) OR (k.created_by = auth.uid()) OR (o.created_by = auth.uid()) OR ((m.user_id = auth.uid()) AND ((r.name = 'viewer'::text) OR (r.name = 'editor'::text) OR ('entry.read'::text = ANY (r.permissions)))))))));


create policy "editor_crud_access"
on "public"."offerings"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((koudens k
     LEFT JOIN kouden_members m ON ((k.id = m.kouden_id)))
     LEFT JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((k.id = offerings.kouden_id) AND ((k.owner_id = auth.uid()) OR (k.created_by = auth.uid()) OR (offerings.created_by = auth.uid()) OR ((m.user_id = auth.uid()) AND ((r.name = 'editor'::text) OR ('entry.write'::text = ANY (r.permissions)))))))))
with check ((EXISTS ( SELECT 1
   FROM ((koudens k
     LEFT JOIN kouden_members m ON ((k.id = m.kouden_id)))
     LEFT JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((k.id = offerings.kouden_id) AND ((k.owner_id = auth.uid()) OR (k.created_by = auth.uid()) OR ((m.user_id = auth.uid()) AND ((r.name = 'editor'::text) OR ('entry.write'::text = ANY (r.permissions)))))))));


create policy "viewer_read_access"
on "public"."offerings"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((koudens k
     LEFT JOIN kouden_members m ON ((k.id = m.kouden_id)))
     LEFT JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((k.id = offerings.kouden_id) AND ((k.owner_id = auth.uid()) OR (k.created_by = auth.uid()) OR ((m.user_id = auth.uid()) AND ((r.name = 'viewer'::text) OR (r.name = 'editor'::text) OR ('entry.read'::text = ANY (r.permissions)))))))));


create policy "Public profiles are viewable by everyone"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "enable_delete_for_authorized_members"
on "public"."relationships"
as permissive
for delete
to public
using (((EXISTS ( SELECT 1
   FROM ((koudens k
     JOIN kouden_members km ON ((k.id = km.kouden_id)))
     JOIN kouden_roles kr ON ((km.role_id = kr.id)))
  WHERE ((k.id = relationships.kouden_id) AND (km.user_id = auth.uid()) AND ('edit'::text = ANY (kr.permissions))))) AND (NOT is_default)));


create policy "enable_insert_for_authorized_members"
on "public"."relationships"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM ((koudens k
     JOIN kouden_members km ON ((k.id = km.kouden_id)))
     JOIN kouden_roles kr ON ((km.role_id = kr.id)))
  WHERE ((k.id = relationships.kouden_id) AND (km.user_id = auth.uid()) AND ('edit'::text = ANY (kr.permissions))))));


create policy "enable_select_for_members"
on "public"."relationships"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((koudens k
     JOIN kouden_members km ON ((k.id = km.kouden_id)))
     JOIN kouden_roles kr ON ((km.role_id = kr.id)))
  WHERE ((k.id = relationships.kouden_id) AND (km.user_id = auth.uid()) AND ('view'::text = ANY (kr.permissions))))));


create policy "enable_update_for_authorized_members"
on "public"."relationships"
as permissive
for update
to public
using (((EXISTS ( SELECT 1
   FROM ((koudens k
     JOIN kouden_members km ON ((k.id = km.kouden_id)))
     JOIN kouden_roles kr ON ((km.role_id = kr.id)))
  WHERE ((k.id = relationships.kouden_id) AND (km.user_id = auth.uid()) AND ('edit'::text = ANY (kr.permissions))))) AND (NOT is_default)))
with check (((EXISTS ( SELECT 1
   FROM ((koudens k
     JOIN kouden_members km ON ((k.id = km.kouden_id)))
     JOIN kouden_roles kr ON ((km.role_id = kr.id)))
  WHERE ((k.id = relationships.kouden_id) AND (km.user_id = auth.uid()) AND ('edit'::text = ANY (kr.permissions))))) AND (NOT is_default)));


create policy "Users can delete return_items of their koudens"
on "public"."return_items"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM (kouden_entries
     JOIN koudens ON ((koudens.id = kouden_entries.kouden_id)))
  WHERE ((kouden_entries.id = return_items.kouden_entry_id) AND (koudens.owner_id = auth.uid())))));


create policy "Users can insert return_items to their koudens"
on "public"."return_items"
as permissive
for insert
to public
with check (((EXISTS ( SELECT 1
   FROM (kouden_entries
     JOIN koudens ON ((koudens.id = kouden_entries.kouden_id)))
  WHERE ((kouden_entries.id = return_items.kouden_entry_id) AND (koudens.owner_id = auth.uid())))) AND (auth.uid() = created_by)));


create policy "Users can update return_items of their koudens"
on "public"."return_items"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (kouden_entries
     JOIN koudens ON ((koudens.id = kouden_entries.kouden_id)))
  WHERE ((kouden_entries.id = return_items.kouden_entry_id) AND (koudens.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (kouden_entries
     JOIN koudens ON ((koudens.id = kouden_entries.kouden_id)))
  WHERE ((kouden_entries.id = return_items.kouden_entry_id) AND (koudens.owner_id = auth.uid())))));


create policy "Users can view return_items of their koudens"
on "public"."return_items"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (kouden_entries
     JOIN koudens ON ((koudens.id = kouden_entries.kouden_id)))
  WHERE ((kouden_entries.id = return_items.kouden_entry_id) AND (koudens.owner_id = auth.uid())))));


create policy "ユーザーは自分のチケットのみ閲覧可能"
on "public"."support_tickets"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "管理者は全ての操作が可能"
on "public"."support_tickets"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE (admin_users.user_id = auth.uid()))));


create policy "Admins can delete announcements"
on "public"."system_announcements"
as permissive
for delete
to authenticated
using (is_admin(auth.uid()));


create policy "Admins can insert announcements"
on "public"."system_announcements"
as permissive
for insert
to authenticated
with check (is_admin(auth.uid()));


create policy "Admins can update announcements"
on "public"."system_announcements"
as permissive
for update
to authenticated
using (is_admin(auth.uid()));


create policy "Admins can view all announcements"
on "public"."system_announcements"
as permissive
for select
to authenticated
using (is_admin(auth.uid()));


create policy "Users can view published announcements"
on "public"."system_announcements"
as permissive
for select
to authenticated
using ((((status)::text = 'published'::text) AND (published_at <= now()) AND ((expires_at IS NULL) OR (expires_at > now()))));


create policy "Users can delete telegrams if they have edit access"
on "public"."telegrams"
as permissive
for delete
to authenticated
using (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (kouden_members m
     JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((m.kouden_id = telegrams.kouden_id) AND (m.user_id = auth.uid()) AND (r.name = '編集者'::text)))) OR (EXISTS ( SELECT 1
   FROM koudens
  WHERE ((koudens.id = telegrams.kouden_id) AND ((koudens.owner_id = auth.uid()) OR (koudens.created_by = auth.uid())))))));


create policy "Users can insert telegrams if they have edit access"
on "public"."telegrams"
as permissive
for insert
to authenticated
with check (((EXISTS ( SELECT 1
   FROM (kouden_members m
     JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((m.kouden_id = telegrams.kouden_id) AND (m.user_id = auth.uid()) AND (r.name = '編集者'::text)))) OR (EXISTS ( SELECT 1
   FROM koudens
  WHERE ((koudens.id = telegrams.kouden_id) AND ((koudens.owner_id = auth.uid()) OR (koudens.created_by = auth.uid())))))));


create policy "Users can update telegrams if they have edit access"
on "public"."telegrams"
as permissive
for update
to authenticated
using (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (kouden_members m
     JOIN kouden_roles r ON ((m.role_id = r.id)))
  WHERE ((m.kouden_id = telegrams.kouden_id) AND (m.user_id = auth.uid()) AND (r.name = '編集者'::text)))) OR (EXISTS ( SELECT 1
   FROM koudens
  WHERE ((koudens.id = telegrams.kouden_id) AND ((koudens.owner_id = auth.uid()) OR (koudens.created_by = auth.uid())))))));


create policy "Users can view their own telegrams or telegrams they have acces"
on "public"."telegrams"
as permissive
for select
to authenticated
using (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM kouden_members
  WHERE ((kouden_members.kouden_id = telegrams.kouden_id) AND (kouden_members.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM koudens
  WHERE ((koudens.id = telegrams.kouden_id) AND ((koudens.owner_id = auth.uid()) OR (koudens.created_by = auth.uid())))))));


create policy "ユーザーは自分のチケットにのみメッセージを"
on "public"."ticket_messages"
as permissive
for insert
to authenticated
with check (((EXISTS ( SELECT 1
   FROM support_tickets
  WHERE ((support_tickets.id = ticket_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))) AND (NOT is_admin_reply)));


create policy "ユーザーは自分のチケットのメッセージのみ閲"
on "public"."ticket_messages"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM support_tickets
  WHERE ((support_tickets.id = ticket_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))));


create policy "管理者は全ての操作が可能"
on "public"."ticket_messages"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE (admin_users.user_id = auth.uid()))));


create policy "Allow trigger function to manage reads"
on "public"."user_announcement_reads"
as permissive
for all
to postgres
using (true)
with check (true);


create policy "Users can insert own reads"
on "public"."user_announcement_reads"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update own reads"
on "public"."user_announcement_reads"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own reads"
on "public"."user_announcement_reads"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own settings"
on "public"."user_settings"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can update their own settings"
on "public"."user_settings"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view their own settings"
on "public"."user_settings"
as permissive
for select
to public
using ((auth.uid() = id));


CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION update_admin_users_updated_at();

CREATE TRIGGER log_kouden_entry_changes AFTER INSERT OR UPDATE ON public.kouden_entries FOR EACH ROW EXECUTE FUNCTION log_kouden_entry_changes();

CREATE TRIGGER log_kouden_entry_delete BEFORE DELETE ON public.kouden_entries FOR EACH ROW EXECUTE FUNCTION log_kouden_entry_changes();

CREATE TRIGGER update_kouden_entries_updated_at BEFORE UPDATE ON public.kouden_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kouden_entry_modified BEFORE UPDATE ON public.kouden_entries FOR EACH ROW EXECUTE FUNCTION update_kouden_entry_modified();

CREATE TRIGGER update_kouden_entry_locks_updated_at BEFORE UPDATE ON public.kouden_entry_locks FOR EACH ROW EXECUTE FUNCTION update_kouden_entry_locks_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.kouden_invitations FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER increment_used_count AFTER INSERT ON public.kouden_members FOR EACH ROW EXECUTE FUNCTION increment_invitation_used_count();

CREATE TRIGGER update_kouden_members_updated_at BEFORE UPDATE ON public.kouden_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kouden_roles_updated_at BEFORE UPDATE ON public.kouden_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cleanup_kouden_related_data_trigger BEFORE DELETE ON public.koudens FOR EACH ROW EXECUTE FUNCTION cleanup_kouden_related_data();

CREATE TRIGGER create_default_kouden_roles_trigger AFTER INSERT ON public.koudens FOR EACH ROW EXECUTE FUNCTION create_default_kouden_roles();

CREATE CONSTRAINT TRIGGER trigger_add_kouden_owner AFTER INSERT ON public.koudens DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION add_kouden_owner();

CREATE TRIGGER trigger_initialize_default_relationships AFTER INSERT ON public.koudens FOR EACH ROW EXECUTE FUNCTION initialize_default_relationships();

CREATE TRIGGER update_koudens_updated_at BEFORE UPDATE ON public.koudens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_has_offering_flag_trigger AFTER INSERT OR DELETE ON public.offering_entries FOR EACH ROW EXECUTE FUNCTION update_has_offering_flag();

CREATE TRIGGER update_offering_photos_updated_at BEFORE UPDATE ON public.offering_photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offerings_updated_at BEFORE UPDATE ON public.offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.relationships FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_return_items_updated_at BEFORE UPDATE ON public.return_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER manage_announcement_reads_trigger AFTER INSERT OR DELETE OR UPDATE ON public.system_announcements FOR EACH ROW EXECUTE FUNCTION manage_announcement_reads();

CREATE TRIGGER update_system_announcements_updated_at BEFORE UPDATE ON public.system_announcements FOR EACH ROW EXECUTE FUNCTION update_system_announcements_updated_at();

CREATE TRIGGER update_telegrams_updated_at BEFORE UPDATE ON public.telegrams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


