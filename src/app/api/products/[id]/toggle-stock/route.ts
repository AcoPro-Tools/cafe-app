import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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
    const productId = Number(id)
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'معرف المنتج غير صحيح' },
        { status: 400 }
      )
    }

    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!currentProduct) {
      return NextResponse.json(
        { success: false, error: 'المنتج غير موجود' },
        { status: 404 }
      )
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isAvailable: !currentProduct.isAvailable },
    })

    return NextResponse.json({
      success: true,
      message: updated.isAvailable ? 'تم تفعيل توفر الصنف' : 'تم تعيين الصنف كـ نفذت الكمية',
      product: updated,
    })
  } catch (error) {
    console.error('Error toggling product stock:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تعديل توفر الصنف' },
      { status: 500 }
    )
  }
}
