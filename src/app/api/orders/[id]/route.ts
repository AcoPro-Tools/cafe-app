import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { OrderStatus } from '@prisma/client'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = Number(id)

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: 'رقم الطلب غير صالح' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'الطلب غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error fetching order by id:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب تفاصيل الطلب' },
      { status: 500 }
    )
  }
}

// Update order status (CASHIER or ADMIN)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح به: يرجى تسجيل الدخول' },
        { status: 401 }
      )
    }

    const { id } = await params
    const orderId = Number(id)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: 'معرف الطلب غير صحيح' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { status } = body as { status?: OrderStatus }

    const validStatuses: OrderStatus[] = [
      'PENDING',
      'PREPARING',
      'READY',
      'COMPLETED',
      'CANCELLED',
    ]

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'حالة الطلب غير صالحة' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحديث حالة الطلب' },
      { status: 500 }
    )
  }
}
