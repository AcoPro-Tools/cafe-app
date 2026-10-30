import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح به: صلاحية المدير مطلوبة' },
        { status: 403 }
      )
    }

    const [totalOrders, pendingOrders, totalProducts, allOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.product.count(),
        prisma.order.findMany({ select: { totalPrice: true, status: true } }),
      ])

    const totalRevenue = allOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalPrice, 0)

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        totalProducts,
        totalRevenue: Math.round(totalRevenue),
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    )
  }
}
