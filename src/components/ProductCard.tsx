'use client'

import React from 'react'
import { Product } from '@/types'
import { Plus, Ban, Sparkles } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onSelect: (product: Product) => void
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const isAvailable = product.isAvailable

  return (
    <div
      onClick={() => isAvailable && onSelect(product)}
      className={`group relative bg-[#FFFFFF] rounded-2xl border border-[#E5D9C5] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col ${
        isAvailable
          ? 'cursor-pointer hover:-translate-y-1 hover:border-[#C89D7C]'
          : 'opacity-70 cursor-not-allowed bg-[#F9F7F5]'
      }`}
    >
      {/* Product Image & Badges */}
      <div className="relative w-full h-44 bg-[#EFE8DE] overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isAvailable ? 'group-hover:scale-108' : 'grayscale'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#7E6B5B]">
            <Sparkles className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        {/* Availability Badge */}
        {!isAvailable && (
          <div className="absolute top-3 right-3 bg-red-600/95 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <Ban className="w-3.5 h-3.5" />
            <span>نفذت الكمية</span>
          </div>
        )}

        {/* Price tag over image */}
        <div className="absolute bottom-3 left-3 bg-[#3C2A21]/90 backdrop-blur-xs text-[#FAF6F0] px-3 py-1 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1">
          <span className="text-[#C89D7C] text-[10px]">تبدأ من</span>
          <span>{product.basePrice.toFixed(0)}</span>
          <span className="text-[10px] text-[#C89D7C]">ر.س</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-[#3C2A21] text-base mb-1.5 group-hover:text-[#C89D7C] transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-[#7E6B5B] line-clamp-2 leading-relaxed mb-3">
            {product.description || 'مشروب رائع ومميز محضر بعناية واحترافية.'}
          </p>
        </div>

        {/* Card Footer action button */}
        <div className="pt-2 border-t border-[#FAF6F0] flex items-center justify-between">
          <span className="text-xs text-[#7E6B5B] font-medium">
            {isAvailable ? 'خيارات وتخصيص' : 'غير متوفر'}
          </span>
          <button
            disabled={!isAvailable}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isAvailable
                ? 'bg-[#EFE8DE] text-[#3C2A21] group-hover:bg-[#3C2A21] group-hover:text-[#FAF6F0] group-hover:scale-110 shadow-xs'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="إضافة"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  )
}
