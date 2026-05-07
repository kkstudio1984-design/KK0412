-- ── Migration 019: 拒絕簽署原因 ──
-- 客戶拒絕電子簽署時，可在簽署頁面填一段原因，存進此欄位，
-- 內部後台列表 hover 即可看到原因，便於後續追蹤與重新議約。

alter table public.contracts
  add column reject_reason text;

comment on column public.contracts.reject_reason is
  'Reason given by the client when they reject the e-signature request.';
