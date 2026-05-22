// 光合創學公司登記資料 — 對外文件單一來源
// 資料來源：g0v 商工登記公開資料 API 統編 60350883（2026-05-21 確認）
// 對應 vault: 40 課程/00 戰略/光合創學登記資料.md
//
// 改公司資料只動本檔 — 8 個列印 / email / 簽署頁面 import 這些常數。

export const COMPANY_NAME = '光合創學股份有限公司' as const
export const COMPANY_TAX_ID = '60350883' as const
export const COMPANY_ADDRESS = '臺北市大安區和平東路三段 280 號 2 樓之一' as const
export const COMPANY_REP_NAME = '楊宜霖' as const
export const COMPANY_BRAND = '光合創學' as const

// 預組常用字串

export const COMPANY_FOOTER_ONE_LINE = `${COMPANY_NAME} · 統編 ${COMPANY_TAX_ID} · ${COMPANY_ADDRESS}` as const

export const COMPANY_CONSENT_HEADER = `蒐集機構：${COMPANY_NAME}｜統一編號 ${COMPANY_TAX_ID}｜${COMPANY_ADDRESS}｜代表人 ${COMPANY_REP_NAME}` as const

export const COMPANY_RECEIPT_SUBTITLE = `統一編號：${COMPANY_TAX_ID}｜${COMPANY_ADDRESS}` as const
