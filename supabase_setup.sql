-- =============================================
-- lokali – Supabase Datenbank Setup
-- Diesen kompletten Code in den SQL Editor einfügen und auf "Run" klicken
-- =============================================

-- PostGIS für Geo-Queries aktivieren
create extension if not exists postgis;

-- =============================================
-- TABELLEN
-- =============================================

-- Profile (wird automatisch bei Registrierung angelegt)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar text default '🐨',
  age text,
  gender text,
  created_at timestamptz default now()
);

-- Posts
create table if not exists posts (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null check (char_length(text) <= 500),
  lat double precision,
  lng double precision,
  location geography(Point, 4326),
  created_at timestamptz default now()
);

-- Kommentare
create table if not exists comments (
  id bigserial primary key,
  post_id bigint references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null check (char_length(text) <= 300),
  created_at timestamptz default now()
);

-- Private Nachrichten
create table if not exists messages (
  id bigserial primary key,
  sender_id uuid references profiles(id) on delete cascade not null,
  recipient_id uuid references profiles(id) on delete cascade not null,
  text text not null check (char_length(text) <= 1000),
  created_at timestamptz default now()
);

-- Meldungen
create table if not exists reports (
  id bigserial primary key,
  post_id bigint references posts(id) on delete cascade,
  reporter_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- =============================================
-- TRIGGER: location-Feld automatisch aus lat/lng befüllen
-- =============================================
create or replace function set_post_location()
returns trigger as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location = ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists post_location_trigger on posts;
create trigger post_location_trigger
  before insert or update on posts
  for each row execute function set_post_location();

-- =============================================
-- FUNKTION: Posts im Radius suchen
-- =============================================
create or replace function posts_within_radius(user_lat double precision, user_lng double precision, radius_km double precision)
returns table (
  id bigint,
  user_id uuid,
  text text,
  lat double precision,
  lng double precision,
  created_at timestamptz,
  distance_m double precision,
  comment_count bigint,
  profiles json
) as $$
begin
  return query
  select
    p.id,
    p.user_id,
    p.text,
    p.lat,
    p.lng,
    p.created_at,
    ST_Distance(p.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) as distance_m,
    (select count(*) from comments c where c.post_id = p.id) as comment_count,
    json_build_object('username', pr.username, 'avatar', pr.avatar) as profiles
  from posts p
  join profiles pr on pr.id = p.user_id
  where p.location is not null
    and ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  order by p.created_at desc
  limit 100;
end;
$$ language plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (Datenschutz)
-- =============================================
alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table messages enable row level security;
alter table reports enable row level security;

-- Profile: jeder kann lesen, nur du kannst dein eigenes bearbeiten
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Posts: jeder kann lesen, nur eingeloggte können posten
create policy "posts_select" on posts for select using (true);
create policy "posts_insert" on posts for insert with check (auth.uid() = user_id);
create policy "posts_delete" on posts for delete using (auth.uid() = user_id);

-- Kommentare: jeder kann lesen, nur eingeloggte können kommentieren
create policy "comments_select" on comments for select using (true);
create policy "comments_insert" on comments for insert with check (auth.uid() = user_id);

-- Nachrichten: nur Sender und Empfänger können lesen/schreiben
create policy "messages_select" on messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "messages_insert" on messages for insert with check (auth.uid() = sender_id);

-- Meldungen: nur eingeloggte können melden
create policy "reports_insert" on reports for insert with check (auth.uid() = reporter_id);
