import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { attendanceDate, checkInTime, checkOutTime, hoursWorked, activity, subsidyId, notes } = body
    if (!attendanceDate) return NextResponse.json({ error: '缺少出勤日期' }, { status: 400 })

    // Auto-calculate hours if both times provided and hoursWorked missing
    let hours = hoursWorked ? Number(hoursWorked) : null
    if (!hours && checkInTime && checkOutTime) {
      const [ih, im] = (checkInTime as string).split(':').map(Number)
      const [oh, om] = (checkOutTime as string).split(':').map(Number)
      const diff = (oh * 60 + om) - (ih * 60 + im)
      if (diff > 0) hours = Math.round((diff / 60) * 100) / 100
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        partner_id: id,
        subsidy_id: subsidyId || null,
        attendance_date: attendanceDate,
        check_in_time: checkInTime || null,
        check_out_time: checkOutTime || null,
        hours_worked: hours,
        activity: activity || null,
        notes: notes || null,
      })
      .select('*, subsidy:subsidy_tracking(subsidy_name)')
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }
}
