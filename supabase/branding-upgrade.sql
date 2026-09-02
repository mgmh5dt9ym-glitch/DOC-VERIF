-- ================================================================
-- Upgrade : identité visuelle de la page publique de vérification
-- À exécuter UNE FOIS dans Supabase > SQL Editor > New query > Run
-- ================================================================

create table if not exists public.site_branding (
  id          smallint primary key,
  header_path text,
  logo_path   text,
  status_text text not null default 'FIRMADO - VIGENTE',
  updated_at  timestamptz not null default now(),
  constraint site_branding_singleton check (id = 1)
);

alter table public.site_branding enable row level security;
revoke all on table public.site_branding from anon, authenticated;

insert into public.site_branding (id, status_text)
values (1, 'FIRMADO - VIGENTE')
on conflict (id) do nothing;

-- Les images header/logo sont stockées dans le bucket privé "documents"
-- sous branding/header-... et branding/logo-...
-- Aucun changement de policy Storage n'est nécessaire : le serveur utilise
-- la clé service-role et génère des URL signées.
