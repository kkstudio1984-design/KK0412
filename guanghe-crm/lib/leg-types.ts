// 五腳營運模型分類常數
// 對應藍圖 §2.3 + migration 022 (client_type) + migration 024 (leg_type)

// ──────────────────────────────────────────────
// client_type — 屬性 of organizations
// ──────────────────────────────────────────────

export const CLIENT_TYPES = [
  'borrow_address',
  'coworking',
  'esg_dei',
  'gov_tender',
  'inclusion_bpo',
  'academy',
  'personal_ip',
  'other',
] as const

export type ClientType = (typeof CLIENT_TYPES)[number]

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  borrow_address: '借址登記（舊）',
  coworking: '工位／共享空間',
  esg_dei: 'ESG／DEI 訓練包',
  gov_tender: '政府身障標案',
  inclusion_bpo: 'Inclusion BPO',
  academy: 'AI×共融學院',
  personal_ip: '個人 IP／內訓',
  other: '其他／未分類',
}

export const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  borrow_address: 'bg-stone-100 text-stone-600 border-stone-200',
  coworking: 'bg-gray-100 text-gray-700 border-gray-200',
  esg_dei: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  gov_tender: 'bg-blue-100 text-blue-700 border-blue-200',
  inclusion_bpo: 'bg-pink-100 text-pink-700 border-pink-200',
  academy: 'bg-amber-100 text-amber-700 border-amber-200',
  personal_ip: 'bg-purple-100 text-purple-700 border-purple-200',
  other: 'bg-gray-50 text-gray-500 border-gray-200',
}

// ──────────────────────────────────────────────
// leg_type — 屬性 of 交易層（leads / contracts / payments / etc.）
// ──────────────────────────────────────────────

export const LEG_TYPES = [
  'esg_dei',
  'gov_tender',
  'inclusion_bpo',
  'academy',
  'personal_ip',
  'mixed',
  'other',
] as const

export type LegType = (typeof LEG_TYPES)[number]

export const LEG_TYPE_LABELS: Record<LegType, string> = {
  esg_dei: '第一腳 ESG／DEI',
  gov_tender: '第二腳 政府標案',
  inclusion_bpo: '第三腳 BPO 月費',
  academy: '第四腳 AI×共融學院',
  personal_ip: '第五腳 個人 IP',
  mixed: '跨腳混合',
  other: '未分類',
}

export const LEG_TYPE_COLORS: Record<LegType, string> = {
  esg_dei: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  gov_tender: 'bg-blue-100 text-blue-700 border-blue-200',
  inclusion_bpo: 'bg-pink-100 text-pink-700 border-pink-200',
  academy: 'bg-amber-100 text-amber-700 border-amber-200',
  personal_ip: 'bg-purple-100 text-purple-700 border-purple-200',
  mixed: 'bg-slate-100 text-slate-700 border-slate-200',
  other: 'bg-gray-50 text-gray-500 border-gray-200',
}
