-- إحصائية استخدام مجهولة الهوية — شغّل الملف مرة واحدة: Supabase ← SQL Editor ← New query ← الصق ← Run
-- يُخزَّن معرّف عشوائي لكل جهاز + نوع المنصة + تاريخ أول وآخر ظهور فقط. لا اسم ولا موقع ولا أي بيانات شخصية.
-- الجدول مقفول (RLS بلا سياسات)؛ التطبيق يكتب عبر دالة واحدة ويقرأ أرقامًا مجمّعة فقط.

create table if not exists public.device_pings (
  id         uuid primary key,
  platform   text not null check (platform in ('android', 'pwa', 'web')),
  first_seen date not null default current_date,
  last_seen  date not null default current_date,
  days       int  not null default 1
);
alter table public.device_pings enable row level security;
revoke all on public.device_pings from anon, authenticated;

create or replace function public.app_ping(p_id uuid, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_platform not in ('android', 'pwa', 'web') then raise exception 'bad platform'; end if;
  insert into public.device_pings(id, platform) values (p_id, p_platform)
  on conflict (id) do update
    set days = public.device_pings.days + (case when public.device_pings.last_seen < current_date then 1 else 0 end),
        last_seen = current_date,
        platform = excluded.platform;
end $$;

create or replace function public.app_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total', count(*),
    'today', count(*) filter (where last_seen = current_date),
    'd7',    count(*) filter (where last_seen >= current_date - 6),
    'd30',   count(*) filter (where last_seen >= current_date - 29),
    'android', count(*) filter (where platform = 'android'),
    'pwa',     count(*) filter (where platform = 'pwa'),
    'web',     count(*) filter (where platform = 'web')
  ) from public.device_pings;
$$;

grant execute on function public.app_ping(uuid, text) to anon, authenticated;
grant execute on function public.app_stats() to anon, authenticated;
