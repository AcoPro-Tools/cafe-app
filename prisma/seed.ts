import { PrismaClient, Role, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // ─── Clean existing data ───────────────────────────────────────────────────
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // ─── Users ─────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10)
  const cashierHash = await bcrypt.hash('cashier123', 10)

  await prisma.user.createMany({
    data: [
      {
        name: 'Admin الكافيه',
        email: 'admin@cafe.com',
        passwordHash: adminHash,
        role: Role.ADMIN,
      },
      {
        name: 'كاشير الكافيه',
        email: 'cashier@cafe.com',
        passwordHash: cashierHash,
        role: Role.CASHIER,
      },
    ],
  })
  console.log('✅ Users created')

  // ─── Categories ────────────────────────────────────────────────────────────
  const hotCategory = await prisma.category.create({
    data: { name: 'مشروبات ساخنة', sortOrder: 1 },
  })
  const coldCategory = await prisma.category.create({
    data: { name: 'مشروبات باردة', sortOrder: 2 },
  })
  const dessertsCategory = await prisma.category.create({
    data: { name: 'حلويات', sortOrder: 3 },
  })
  console.log('✅ Categories created')

  // ─── Options helper ────────────────────────────────────────────────────────
  const drinkOptions = JSON.stringify({
    sizes: [
      { label: 'وسط', priceDelta: 0 },
      { label: 'كبير', priceDelta: 5 },
    ],
    sugarLevels: ['بدون سكر', 'سكر قليل', 'سكر عادي', 'سكر زيادة'],
    milkOptions: ['بدون حليب', 'حليب عادي', 'حليب نباتي'],
  })

  const coldDrinkOptions = JSON.stringify({
    sizes: [
      { label: 'وسط', priceDelta: 0 },
      { label: 'كبير', priceDelta: 7 },
    ],
    sugarLevels: ['بدون سكر', 'سكر قليل', 'سكر عادي'],
    milkOptions: ['بدون حليب', 'حليب عادي', 'حليب لوز'],
  })

  const dessertOptions = JSON.stringify({
    sizes: [
      { label: 'عادي', priceDelta: 0 },
    ],
    sugarLevels: [],
    milkOptions: [],
  })

  // ─── Products ──────────────────────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      // Hot drinks (3)
      {
        categoryId: hotCategory.id,
        name: 'إسبريسو',
        description: 'شات إسبريسو مركز من أجود أنواع البن الإثيوبي',
        basePrice: 18,
        imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400',
        isAvailable: true,
        optionsJson: drinkOptions,
      },
      {
        categoryId: hotCategory.id,
        name: 'لاتيه',
        description: 'إسبريسو ناعم ممزوج بالحليب المبخر والرغوة الكريمية',
        basePrice: 28,
        imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400',
        isAvailable: true,
        optionsJson: drinkOptions,
      },
      {
        categoryId: hotCategory.id,
        name: 'كابتشينو',
        description: 'إسبريسو مع حليب مبخر ورغوة كثيفة مرشوش عليها كاكاو',
        basePrice: 26,
        imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400',
        isAvailable: true,
        optionsJson: drinkOptions,
      },
      // Cold drinks (3)
      {
        categoryId: coldCategory.id,
        name: 'آيس لاتيه',
        description: 'لاتيه بارد منعش فوق ثلج ناعم — مثالي لفصل الصيف',
        basePrice: 32,
        imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
        isAvailable: true,
        optionsJson: coldDrinkOptions,
      },
      {
        categoryId: coldCategory.id,
        name: 'فرابيه كراميل',
        description: 'مشروب مجمد بنكهة الكراميل الغني مع كريمة مخفوقة',
        basePrice: 38,
        imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',
        isAvailable: true,
        optionsJson: coldDrinkOptions,
      },
      {
        categoryId: coldCategory.id,
        name: 'موهيتو نعناع',
        description: 'مشروب منعش بالنعناع الطازج والليمون والصودا',
        basePrice: 30,
        imageUrl: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400',
        isAvailable: true,
        optionsJson: coldDrinkOptions,
      },
      // Desserts (3)
      {
        categoryId: dessertsCategory.id,
        name: 'تشيز كيك',
        description: 'تشيز كيك كريمي بقاعدة البسكويت المقرمش وصوص التوت',
        basePrice: 42,
        imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400',
        isAvailable: true,
        optionsJson: dessertOptions,
      },
      {
        categoryId: dessertsCategory.id,
        name: 'براوني شوكولاته',
        description: 'براوني دافئ بالشوكولاته الداكنة مقدم مع آيس كريم الفانيليا',
        basePrice: 36,
        imageUrl: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400',
        isAvailable: true,
        optionsJson: dessertOptions,
      },
      {
        categoryId: dessertsCategory.id,
        name: 'كرواسون لوز',
        description: 'كرواسون طازج محشو بكريمة اللوز ومرشوش بالسكر البودرة',
        basePrice: 24,
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
        isAvailable: true,
        optionsJson: dessertOptions,
      },
    ],
  })
  console.log('✅ Products created (9 items)')

  // ─── Sample Order ───────────────────────────────────────────────────────────
  const espresso = await prisma.product.findFirst({ where: { name: 'إسبريسو' } })
  const cheesecake = await prisma.product.findFirst({ where: { name: 'تشيز كيك' } })

  if (espresso && cheesecake) {
    await prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        tableNumber: 5,
        status: OrderStatus.PENDING,
        totalPrice: 60,
        items: {
          create: [
            {
              productId: espresso.id,
              quantity: 1,
              selectedOptions: JSON.stringify({ size: 'وسط', sugar: 'سكر عادي', milk: 'بدون حليب' }),
              unitPrice: 18,
            },
            {
              productId: cheesecake.id,
              quantity: 1,
              selectedOptions: JSON.stringify({ size: 'عادي', sugar: '', milk: '' }),
              unitPrice: 42,
            },
          ],
        },
      },
    })
    console.log('✅ Sample order created')
  }

  console.log('🎉 Seed completed successfully!')
  console.log('─────────────────────────────────')
  console.log('👤 Admin:   admin@cafe.com   / admin123')
  console.log('👤 Cashier: cashier@cafe.com / cashier123')
  console.log('─────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
