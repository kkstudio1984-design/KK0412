-- ── Migration 018: 合約簽署完成通知 ──
-- 當 contracts.signing_status 從「待簽署」轉為「已簽署」或「已拒絕」時，
-- 自動寫入一筆通知到 notifications 表，廣播給所有 admin / operator
-- （沿用 008 的 RLS：user_id is null 全員可見）。
--
-- 因為簽署 API 由 anon 角色觸發更新（無法 INSERT notifications），
-- 此函式以 SECURITY DEFINER 跑在 owner 權限下，繞過 RLS。

create or replace function public.notify_contract_signing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_name text;
begin
  -- 僅在「待簽署 → 已簽署 / 已拒絕」時觸發
  if old.signing_status = '待簽署'
     and new.signing_status in ('已簽署', '已拒絕') then

    -- 抓對應公司名稱（避免訊息只看到 UUID）
    select o.name
      into v_org_name
      from public.space_clients sc
      join public.organizations o on o.id = sc.organization_id
     where sc.id = new.space_client_id;

    insert into public.notifications (user_id, title, message, type, link)
    values (
      null,
      case
        when new.signing_status = '已簽署' then '客戶已完成電子簽署'
        else '客戶已拒絕簽署'
      end,
      coalesce(v_org_name, '客戶') || ' · ' || coalesce(new.contract_type, '合約')
        || case
             when new.signing_status = '已簽署' and new.signer_name is not null
               then '（簽署人：' || new.signer_name || '）'
             else ''
           end,
      case when new.signing_status = '已簽署' then 'success' else 'warning' end,
      '/clients/' || new.space_client_id::text
    );
  end if;

  return new;
end;
$$;

comment on function public.notify_contract_signing() is
  '合約簽署狀態從「待簽署」轉為「已簽署」或「已拒絕」時，自動廣播通知給所有 admin/operator。';

drop trigger if exists trg_notify_contract_signing on public.contracts;

create trigger trg_notify_contract_signing
after update of signing_status on public.contracts
for each row
execute function public.notify_contract_signing();
