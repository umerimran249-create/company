-- Astraea Labs: contact / meeting form submissions with an admin-only inbox.
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.

-- Tables -------------------------------------------------------------------

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  form_type text not null,
  full_name text,
  email text,
  phone text,
  meeting_date date,
  meeting_time text,
  message text,
  page text,
  status text not null default 'new'
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Constraints (dropped first so re-runs pick up changes) --------------------

alter table public.contact_submissions
  drop constraint if exists contact_submissions_form_type_check,
  drop constraint if exists contact_submissions_full_name_len,
  drop constraint if exists contact_submissions_email_len,
  drop constraint if exists contact_submissions_email_format,
  drop constraint if exists contact_submissions_phone_len,
  drop constraint if exists contact_submissions_meeting_time_len,
  drop constraint if exists contact_submissions_message_len,
  drop constraint if exists contact_submissions_page_len,
  drop constraint if exists contact_submissions_status_check;

alter table public.contact_submissions
  add constraint contact_submissions_form_type_check check (form_type in ('meeting', 'contact')),
  add constraint contact_submissions_full_name_len check (full_name is null or char_length(full_name) between 1 and 120),
  add constraint contact_submissions_email_len check (email is null or char_length(email) between 3 and 254),
  add constraint contact_submissions_email_format check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  add constraint contact_submissions_phone_len check (phone is null or char_length(phone) <= 40),
  add constraint contact_submissions_meeting_time_len check (meeting_time is null or char_length(meeting_time) <= 20),
  add constraint contact_submissions_message_len check (message is null or char_length(message) <= 5000),
  add constraint contact_submissions_page_len check (page is null or char_length(page) <= 200),
  add constraint contact_submissions_status_check check (status in ('new', 'contacted', 'done'));

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

-- Row level security ---------------------------------------------------------

alter table public.contact_submissions enable row level security;
alter table public.admin_users enable row level security;

-- Admin check. SECURITY DEFINER so policies can consult admin_users without
-- depending on its RLS; it only ever answers for the calling user.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Privileges -----------------------------------------------------------------
-- Visitors may insert form columns only (not id, created_at or status).
-- Admins (enforced by RLS below) may read rows and change status only.

revoke all on table public.contact_submissions from public, anon, authenticated;
grant insert (form_type, full_name, email, phone, meeting_date, meeting_time, message, page)
  on table public.contact_submissions to anon, authenticated;
grant select, update (status) on table public.contact_submissions to authenticated;

revoke all on table public.admin_users from public, anon, authenticated;
grant select on table public.admin_users to authenticated;

-- Policies -------------------------------------------------------------------

drop policy if exists "Public can submit contact forms" on public.contact_submissions;
create policy "Public can submit contact forms"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (
    status = 'new'
    and form_type in ('meeting', 'contact')
    and full_name is not null
    and email is not null
    and (meeting_date is null or meeting_date between current_date - 1 and current_date + 366)
  );

drop policy if exists "Admins can read submissions" on public.contact_submissions;
create policy "Admins can read submissions"
  on public.contact_submissions
  for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can update submission status" on public.contact_submissions;
create policy "Admins can update submission status"
  on public.contact_submissions
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Users can see their own admin row" on public.admin_users;
create policy "Users can see their own admin row"
  on public.admin_users
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No insert/update/delete policies exist on admin_users, so clients cannot
-- grant themselves admin. Add admins from the SQL Editor only.

-- Make yourself an admin (after creating the user in Authentication > Users):
-- insert into public.admin_users (user_id) select id from auth.users where email = 'YOUR_EMAIL';
