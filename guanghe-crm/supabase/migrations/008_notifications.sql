create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  type text not null default 'info' check (type in ('info', 'warning', 'urgent', 'success')),
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_read on public.notifications(read);

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid() or user_id is null);

create policy "Admin/operator can insert notifications"
  on public.notifications for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid() or user_id is null);
