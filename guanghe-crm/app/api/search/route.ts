import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    if (!q || q.length < 1) {
      return NextResponse.json({ clients: [], leads: [], projects: [] })
    }

    const supabase = await createClient()
    const pattern = `%${q}%`

    // Clients (via organizations)
    const { data: clientsData } = await supabase
      .from('space_clients')
      .select(`
        id, service_type, stage,
        organization:organizations!inner(name, contact_name, tax_id)
      `)
      .or(`name.ilike.${pattern},contact_name.ilike.${pattern},tax_id.ilike.${pattern}`, {
        referencedTable: 'organizations',
      })
      .limit(8)

    const clients = (clientsData || []).map((c) => {
      const orgRaw = (c as unknown as { organization: { name: string; contact_name: string; tax_id: string | null } | { name: string; contact_name: string; tax_id: string | null }[] | null }).organization
      const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw
      return {
        id: (c as { id: string }).id,
        name: org?.name || '',
        subtitle: `${org?.contact_name || ''} · ${(c as { service_type: string }).service_type} · ${(c as { stage: string }).stage}`,
        href: `/clients/${(c as { id: string }).id}`,
      }
    })

    // Leads
    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, contact_name, contact_info, channel, stage, interest')
      .or(`contact_name.ilike.${pattern},contact_info.ilike.${pattern}`)
      .limit(8)

    const leads = (leadsData || []).map((l) => ({
      id: (l as { id: string }).id,
      name: (l as { contact_name: string }).contact_name,
      subtitle: `${(l as { channel: string }).channel} · ${(l as { interest: string }).interest} · ${(l as { stage: string }).stage}`,
      href: `/sales/leads/${(l as { id: string }).id}`,
    }))

    // Projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name, project_type, status')
      .ilike('name', pattern)
      .limit(5)

    const projects = (projectsData || []).map((p) => ({
      id: (p as { id: string }).id,
      name: (p as { name: string }).name,
      subtitle: `${(p as { project_type: string }).project_type} · ${(p as { status: string }).status}`,
      href: `/projects/${(p as { id: string }).id}`,
    }))

    return NextResponse.json({ clients, leads, projects })
  } catch (error) {
    console.error('[GET /api/search]', error)
    return NextResponse.json({ error: '搜尋失敗', clients: [], leads: [], projects: [] }, { status: 500 })
  }
}
