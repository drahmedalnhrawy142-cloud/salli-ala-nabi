-- ختمة جماعية متزامنة — شغّل هذا الملف مرة واحدة في Supabase: SQL Editor ← New query ← الصق ← Run
-- التصميم: الجدول مقفول بالكامل (RLS بلا سياسات)، والتطبيق لا يصل إليه إلا عبر ٣ دوال، وكل ختمة لها رمز عشوائي من ٨ خانات
-- لا يدخلها إلا من عنده الرمز. لا تُخزَّن أي بيانات شخصية غير الأسماء التي يكتبها منشئ الختمة.

create table if not exists public.group_khatmas (
  code       text primary key,
  title      text not null check (char_length(title) between 1 and 60),
  names      text[] not null check (array_length(names, 1) between 1 and 30),
  done       int[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.group_khatmas enable row level security;
revoke all on public.group_khatmas from anon, authenticated;

create or replace function public.gk_create(p_title text, p_names text[])
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  c text;
  i int;
  tries int := 0;
begin
  if p_names is null or array_length(p_names, 1) is null or array_length(p_names, 1) > 30 then
    raise exception 'bad names';
  end if;
  if exists (select 1 from unnest(p_names) n where char_length(n) > 40) then
    raise exception 'name too long';
  end if;
  loop
    c := '';
    for i in 1..8 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      insert into public.group_khatmas(code, title, names)
      values (c, left(coalesce(nullif(trim(p_title), ''), 'ختمة جماعية'), 60), p_names);
      return c;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 5 then raise; end if;
    end;
  end loop;
end $$;

create or replace function public.gk_get(p_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('title', title, 'names', to_jsonb(names), 'done', to_jsonb(done))
  from public.group_khatmas where code = lower(trim(p_code));
$$;

create or replace function public.gk_set(p_code text, p_juz int, p_done boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r jsonb;
begin
  if p_juz < 1 or p_juz > 30 then raise exception 'bad juz'; end if;
  update public.group_khatmas
     set done = case
       when p_done then (select coalesce(array_agg(distinct x order by x), '{}') from unnest(done || p_juz) x)
       else array_remove(done, p_juz)
     end
   where code = lower(trim(p_code));
  select public.gk_get(p_code) into r;
  return r;
end $$;

grant execute on function public.gk_create(text, text[]) to anon, authenticated;
grant execute on function public.gk_get(text) to anon, authenticated;
grant execute on function public.gk_set(text, int, boolean) to anon, authenticated;
