import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  // Fetch initial data
  const [categories, orders] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          orderBy: { id: 'asc' },
        },
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
  ])

  // Convert dates and serialize
  const serializedOrders = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }))

  return (
    <DashboardClient
      user={user}
      initialCategories={categories}
      initialOrders={serializedOrders}
    />
  )
}
