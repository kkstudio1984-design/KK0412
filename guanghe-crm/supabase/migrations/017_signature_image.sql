-- ── Migration 017: 手寫簽名圖片 ──
-- 儲存客戶簽名為 base64 PNG data URL，在 PDF 上顯示，亦作法律證據。

alter table public.contracts
  add column signature_image_data text;

comment on column public.contracts.signature_image_data is
  'Base64-encoded PNG data URL of the client''s handwritten signature captured via HTML5 canvas.';
