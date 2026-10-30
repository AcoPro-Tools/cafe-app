import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح به: صلاحية المدير مطلوبة' },
        { status: 403 }
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

    if (!name || !categoryId || basePrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'يرجى إكمال الحقول الأساسية: الاسم، القسم، السعر' },
        { status: 400 }
      )
    }

    const newProduct = await prisma.product.create({
      data: {
        categoryId: Number(categoryId),
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        basePrice: Number(basePrice),
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        optionsJson: typeof optionsJson === 'string' ? optionsJson : JSON.stringify(optionsJson || {}),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'تم إضافة الصنف بنجاح',
      product: newProduct,
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم أثناء إضافة الصنف' },
      { status: 500 }
    )
  }
}
