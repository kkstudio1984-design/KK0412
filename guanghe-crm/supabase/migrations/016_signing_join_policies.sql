-- ── Migration 016: 簽署頁需要讀取關聯資料的 RLS ──
-- Anon 用戶拿著 signing_token 時，需要連帶讀 space_clients 和 organizations
-- 以顯示承租方名稱、負責人等資訊於簽署頁面。

create policy "Public can read space_clients via signing token"
  on public.space_clients for select to anon
  using (
    exists (
      select 1 from public.contracts c
      where c.space_client_id = space_clients.id
        and c.signing_token is not null
    )
  );

create policy "Public can read organizations via signing token"
  on public.organizations for select to anon
  using (
    exists (
      select 1
      from public.space_clients sc
      join public.contracts c on c.space_client_id = sc.id
      where sc.org_id = organizations.id
        and c.signing_token is not null
    )
  );
