-- =====================================================================
--  Vérification de documents par QR code — schéma Supabase
--  À coller tel quel dans : Supabase > SQL Editor > New query > Run
-- =====================================================================

-- 1. Table -----------------------------------------------------------
create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  verification_code text not null,
  image_path        text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint documents_verification_code_unique unique (verification_code),
  -- Code : lettres majuscules / chiffres, 6 à 32 caractères
  constraint documents_verification_code_format
    check (verification_code ~ '^[A-Z0-9]{6,32}$'),
  -- Chemin : <uuid>/<fichier>.(jpg|png|webp)
  constraint documents_image_path_format
    check (image_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$')
);

-- 2. Index -----------------------------------------------------------
create index if not exists documents_verification_code_idx
  on public.documents (verification_code);

create index if not exists documents_created_at_idx
  on public.documents (created_at desc);

-- 3. updated_at automatique -----------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- 4. Row Level Security ---------------------------------------------
-- RLS activée. AUCUNE politique pour anon / authenticated :
--  → la clé anon (exposée au navigateur) ne peut ni lire ni lister la table.
--  → seul le serveur, avec SUPABASE_SERVICE_ROLE_KEY (qui contourne RLS),
--    lit un document par son verification_code et gère les écritures.
alter table public.documents enable row level security;

revoke all on table public.documents from anon, authenticated;

-- Note : Supabase Auth n'est pas utilisé. L'administration est protégée
-- par ADMIN_PASSWORD / ADMIN_SESSION_SECRET côté serveur (voir README).

-- 5. Storage : bucket privé "documents" -----------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,                                   -- privé : accès par URL signée uniquement
  15728640,                                -- 15 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Aucune politique storage.objects pour anon / authenticated :
-- les fichiers ne sont accessibles que via les URL signées générées
-- côté serveur (service role). Rien à ajouter.
