import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح به' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب بيانات المستخدم' },
      { status: 500 }
    )
  }
}
