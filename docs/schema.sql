-- Supabase/Postgres schema (not applied anywhere yet). RLS: every user table restricted to auth.uid().
create table profiles (id uuid primary key references auth.users on delete cascade, role text, goal text, created_at timestamptz default now());
create table preferences (user_id uuid primary key references profiles on delete cascade, interests text[] default '{}', mode text default '60', briefing_time time, tz text default 'Asia/Kolkata', quiet_start time, quiet_end time);
create table sources (id serial primary key, name text unique not null, tier smallint not null, rights jsonb not null default '{}');
create table stories (id text primary key, day date not null, primary_topic text not null, tags text[] default '{}', lead_title text not null, first_seen timestamptz, scope text, rank real);
create table story_sources (story_id text references stories on delete cascade, source_id int references sources, url text not null, title text, published_at timestamptz, primary key (story_id, url));
create table story_revisions (id bigserial primary key, story_id text references stories on delete cascade, changed_at timestamptz default now(), editor uuid, change jsonb not null);
create table official_documents (id bigserial primary key, authority text not null, ref text, doc_type text, issued date, effective date, url text not null unique, applicability text[]);
create table saved_stories (user_id uuid references profiles on delete cascade, story_id text, title text, url text, saved_at timestamptz default now(), primary key (user_id, url));
create table follows (user_id uuid references profiles on delete cascade, kind text, value text, primary key (user_id, kind, value));
create table deadlines (id serial primary key, authority text, obligation text, entity_type text, due date, ref_url text, verified_at date);
create table tombstones (user_id uuid references profiles on delete cascade, key text, deleted_at timestamptz default now(), primary key (user_id, key));
create table subscriptions (user_id uuid primary key references profiles on delete cascade, plan text, status text, provider text, provider_ref text unique, renews_at timestamptz);
create table payment_events (provider_event_id text primary key, received_at timestamptz default now(), payload jsonb);  -- idempotency key
create table ai_usage (user_id uuid references profiles, day date, tokens int default 0, cost_paise int default 0, primary key (user_id, day));
create table corrections (id bigserial primary key, story_id text, reported_at timestamptz default now(), status text default 'open', note text);
create table audit_logs (id bigserial primary key, actor uuid, action text, target text, at timestamptz default now());
create index on stories (day, rank desc); create index on story_sources (story_id);
