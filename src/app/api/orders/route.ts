import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CartItemInput {
  productId: number
  quantity: number
  selectedOptions: {
    size?: string
    sugar?: string
    milk?: string
    [key: string]: string | undefined
  }
}

interface ParsedOptions {
  sizes?: Array<{ label: string; priceDelta: number }>
  sugarLevels?: string[]
  milkOptions?: string[]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tableNumber, items } = body as {
      tableNumber: number | string
      items: CartItemInput[]
    }

    const parsedTable = Number(tableNumber)
    if (!parsedTable || isNaN(parsedTable) || parsedTable <= 0) {
      return NextResponse.json(
        { success: false, error: 'يرجى تحديد رقم طاولة صحيح' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'السلة فارغة، يرجى إضافة عناصر للطلب' },
        { status: 400 }
      )
    }

    // Server-side recalculation and stock validation
    let calculatedTotalPrice = 0
    const verifiedOrderItems: Array<{
      productId: number
      quantity: number
      selectedOptions: string
      unitPrice: number
    }> = []

    for (const item of items) {
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
      
      const product = await prisma.product.findUnique({
        where: { id: Number(item.productId) },
      })

      if (!product) {
        return NextResponse.json(
          { success: false, error: `المنتج رقم ${item.productId} غير موجود في النظام` },
          { status: 404 }
        )
      }

      // Check stock availability
      if (!product.isAvailable) {
        return NextResponse.json(
          {
            success: false,
            error: `عذراً، الصنف "${product.name}" غير متوفر حالياً (نفذت الكمية)`,
          },
          { status: 400 }
        )
      }

      // Calculate unit price from base price + size price delta from optionsJson
      let sizePriceDelta = 0
      try {
        if (product.optionsJson) {
          const parsedOptions: ParsedOptions = JSON.parse(product.optionsJson)
          if (parsedOptions.sizes && item.selectedOptions?.size) {
            const matchedSize = parsedOptions.sizes.find(
              (s) => s.label === item.selectedOptions.size
            )
            if (matchedSize) {
              sizePriceDelta = Number(matchedSize.priceDelta) || 0
            }
          }
        }
      } catch (err) {
        console.warn('Failed to parse optionsJson for product:', product.id, err)
      }

      const verifiedUnitPrice = product.basePrice + sizePriceDelta
      calculatedTotalPrice += verifiedUnitPrice * quantity

      verifiedOrderItems.push({
        productId: product.id,
        quantity,
        selectedOptions: JSON.stringify(item.selectedOptions || {}),
        unitPrice: verifiedUnitPrice,
      })
    }

    // Generate unique order number (e.g. ORD-1042)
    let orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
    let collisionCheck = await prisma.order.findUnique({ where: { orderNumber } })
    while (collisionCheck) {
      orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
      collisionCheck = await prisma.order.findUnique({ where: { orderNumber } })
    }

    // Save order and items in a database transaction
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        tableNumber: parsedTable,
        status: 'PENDING',
        totalPrice: Number(calculatedTotalPrice.toFixed(2)),
        items: {
          create: verifiedOrderItems,
        },
      },
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
      message: 'تم استلام طلبك بنجاح',
      order: newOrder,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب في السيرفر' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })
    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب الطلبات' },
      { status: 500 }
    )
  }
}
