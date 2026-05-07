-- ── Migration 021: 主動聯繫追蹤 ──
-- 紀錄上次主動聯繫客戶的時間與備註，
-- 讓 Dashboard 健康度名單能標示「已聯繫，暫時不重複打」、
-- 也讓客戶詳情頁能看到聯繫節奏。

alter table public.space_clients
  add column if not exists last_contacted_at  timestamptz,
  add column if not exists last_contacted_note text;

comment on column public.space_clients.last_contacted_at is
  'Timestamp of the most recent proactive outreach (used to suppress redundant alerts in the health dashboard).';
comment on column public.space_clients.last_contacted_note is
  'Free-text note about what was discussed on the most recent contact.';
