'use client'

import React from 'react'
import { Category } from '@/types'
import { Flame, Snowflake, Cake, Sparkles } from 'lucide-react'

interface CategoryTabsProps {
  categories: Category[]
  activeCategoryId: number | null
  onSelectCategory: (id: number) => void
}

export function CategoryTabs({
  categories,
  activeCategoryId,
  onSelectCategory,
}: CategoryTabsProps) {
  const getCategoryIcon = (name: string) => {
    if (name.includes('ساخن')) return <Flame className="w-4 h-4 text-amber-600" />
    if (name.includes('بارد')) return <Snowflake className="w-4 h-4 text-sky-500" />
    if (name.includes('حلو')) return <Cake className="w-4 h-4 text-rose-500" />
    return <Sparkles className="w-4 h-4 text-[#C89D7C]" />
  }

  return (
    <div className="sticky top-16 z-20 bg-[#FAF6F0]/90 backdrop-blur-md py-3 border-b border-[#E5D9C5]/60 mb-6">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const isActive = activeCategoryId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-xs ${
                  isActive
                    ? 'bg-[#3C2A21] text-[#FAF6F0] shadow-md ring-2 ring-[#C89D7C]/50 scale-102'
                    : 'bg-[#FFFFFF] text-[#7E6B5B] hover:text-[#3C2A21] hover:bg-[#EFE8DE] border border-[#E5D9C5]'
                }`}
              >
                <span>{getCategoryIcon(cat.name)}</span>
                <span>{cat.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#C89D7C] text-[#3C2A21]'
                      : 'bg-[#FAF6F0] text-[#7E6B5B]'
                  }`}
                >
                  {cat.products.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
