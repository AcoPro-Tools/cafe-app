import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح به: صلاحية المدير مطلوبة' },
        { status: 403 }
      )
    }

    const { id } = await params
    const productId = Number(id)
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'معرف الصنف غير صحيح' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const {
      categoryId,
      name,
      description,
      basePrice,
      imageUrl,
      isAvailable,
      optionsJson,
    } = body

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(name && { name: String(name).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl).trim() : null }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(optionsJson !== undefined && {
          optionsJson: typeof optionsJson === 'string' ? optionsJson : JSON.stringify(optionsJson),
        }),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات الصنف بنجاح',
      product: updated,
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تعديل الصنف' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح به: صلاحية المدير مطلوبة' },
        { status: 403 }
      )
    }

    const { id } = await params
    const productId = Number(id)
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'معرف الصنف غير صحيح' },
        { status: 400 }
      )
    }

    // First check if there are orderItems
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId },
    })

    if (orderItemsCount > 0) {
      // If product has historical orders, soft delete by marking isAvailable: false and appending (مؤرشف)
      await prisma.product.update({
        where: { id: productId },
        data: {
          isAvailable: false,
          name: `${(await prisma.product.findUnique({ where: { id: productId } }))?.name} (مؤرشف)`,
        },
      })
      return NextResponse.json({
        success: true,
        message: 'تمت أرشفة الصنف وتعطيله لحفظ سجل الطلبات السابقة',
      })
    }

    await prisma.product.delete({
      where: { id: productId },
    })

    return NextResponse.json({
      success: true,
      message: 'تم حذف الصنف بنجاح',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حذف الصنف' },
      { status: 500 }
    )
  }
}
