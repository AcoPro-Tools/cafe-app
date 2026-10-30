import React, { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { MenuClient } from '@/components/MenuClient'
import { Loader2 } from 'lucide-react'

// Force dynamic rendering so latest menu updates and stock changes appear immediately
export const dynamic = 'force-dynamic'

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      products: {
        orderBy: { id: 'asc' },
      },
    },
  })
}

export default async function HomePage() {
  const categories = await getCategories()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6F0] text-[#3C2A21] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C89D7C]" />
          <p className="text-sm font-bold">جاري تحميل قائمة المنيو...</p>
        </div>
      }
    >
      <MenuClient initialCategories={categories} />
    </Suspense>
  )
}
