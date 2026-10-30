'use client'

import React, { useState, useEffect } from 'react'
import { Product, ProductOptions, SelectedOptions } from '@/types'
import { X, Plus, Minus, ShoppingBag, Coffee, Sparkles } from 'lucide-react'

interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (
    product: Product,
    selectedOptions: SelectedOptions,
    quantity: number,
    unitPrice: number
  ) => void
}

export function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductModalProps) {
  const [options, setOptions] = useState<ProductOptions>({})
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedSugar, setSelectedSugar] = useState<string>('')
  const [selectedMilk, setSelectedMilk] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)

  // Reset & initialize when product changes
  useEffect(() => {
    if (product && product.optionsJson) {
      try {
        const parsed: ProductOptions = JSON.parse(product.optionsJson)
        setOptions(parsed)

        // Default size to first size if available
        if (parsed.sizes && parsed.sizes.length > 0) {
          setSelectedSize(parsed.sizes[0].label)
        } else {
          setSelectedSize('')
        }

        // Default sugar to standard/first if available
        if (parsed.sugarLevels && parsed.sugarLevels.length > 0) {
          const defaultSugar =
            parsed.sugarLevels.find((s) => s.includes('عادي')) || parsed.sugarLevels[0]
          setSelectedSugar(defaultSugar)
        } else {
          setSelectedSugar('')
        }

        // Default milk to standard/first if available
        if (parsed.milkOptions && parsed.milkOptions.length > 0) {
          setSelectedMilk(parsed.milkOptions[0])
        } else {
          setSelectedMilk('')
        }
      } catch (e) {
        console.error('Failed to parse optionsJson', e)
        setOptions({})
      }
      setQuantity(1)
    }
  }, [product])

  if (!isOpen || !product) return null

  // Calculate current unit price based on selected size
  let sizeDelta = 0
  if (options.sizes && selectedSize) {
    const matched = options.sizes.find((s) => s.label === selectedSize)
    if (matched) sizeDelta = matched.priceDelta || 0
  }
  const unitPrice = product.basePrice + sizeDelta
  const totalPrice = unitPrice * quantity

  const handleConfirm = () => {
    const selected: SelectedOptions = {}
    if (selectedSize) selected.size = selectedSize
    if (selectedSugar) selected.sugar = selectedSugar
    if (selectedMilk) selected.milk = selectedMilk

    onAddToCart(product, selected, quantity, unitPrice)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-[#FFFFFF] rounded-3xl overflow-hidden shadow-2xl border border-[#E5D9C5] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image & Close */}
        <div className="relative h-48 sm:h-56 bg-[#EFE8DE] overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Coffee className="w-12 h-12 text-[#C89D7C]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition backdrop-blur-xs"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Product Title in image banner */}
          <div className="absolute bottom-4 right-4 left-4 text-white">
            <h2 className="text-xl sm:text-2xl font-black drop-shadow-sm">
              {product.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#EFE8DE] opacity-90 line-clamp-1 mt-0.5">
              {product.description || 'تخصيص المشروب حسب رغبتك'}
            </p>
          </div>
        </div>

        {/* Options Content - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Sizes */}
          {options.sizes && options.sizes.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#7E6B5B] mb-2.5">
                اختر الحجم
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {options.sizes.map((size) => {
                  const isSelected = selectedSize === size.label
                  return (
                    <button
                      key={size.label}
                      type="button"
                      onClick={() => setSelectedSize(size.label)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-sm font-bold transition-all ${
                        isSelected
                          ? 'border-[#3C2A21] bg-[#3C2A21] text-[#FAF6F0] shadow-sm'
                          : 'border-[#E5D9C5] bg-[#FAF6F0] text-[#3C2A21] hover:border-[#C89D7C]'
                      }`}
                    >
                      <span>{size.label}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-[#C89D7C] text-[#3C2A21]'
                            : 'bg-[#EFE8DE] text-[#7E6B5B]'
                        }`}
                      >
                        {size.priceDelta > 0
                          ? `+${size.priceDelta} ر.س`
                          : 'السعر الأساسي'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sugar Levels */}
          {options.sugarLevels && options.sugarLevels.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#7E6B5B] mb-2.5">
                مستوى السكر
              </label>
              <div className="flex flex-wrap gap-2">
                {options.sugarLevels.map((sugar) => {
                  const isSelected = selectedSugar === sugar
                  return (
                    <button
                      key={sugar}
                      type="button"
                      onClick={() => setSelectedSugar(sugar)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#3C2A21] text-[#FAF6F0] shadow-xs'
                          : 'bg-[#EFE8DE] text-[#7E6B5B] hover:text-[#3C2A21]'
                      }`}
                    >
                      {sugar}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Milk Options */}
          {options.milkOptions && options.milkOptions.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#7E6B5B] mb-2.5">
                نوع الحليب
              </label>
              <div className="flex flex-wrap gap-2">
                {options.milkOptions.map((milk) => {
                  const isSelected = selectedMilk === milk
                  return (
                    <button
                      key={milk}
                      type="button"
                      onClick={() => setSelectedMilk(milk)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#3C2A21] text-[#FAF6F0] shadow-xs'
                          : 'bg-[#EFE8DE] text-[#7E6B5B] hover:text-[#3C2A21]'
                      }`}
                    >
                      {milk}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="pt-2 flex items-center justify-between border-t border-[#E5D9C5]/50">
            <span className="text-sm font-bold text-[#3C2A21]">الكمية</span>
            <div className="flex items-center gap-3 bg-[#EFE8DE] p-1.5 rounded-2xl border border-[#E5D9C5]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl bg-white text-[#3C2A21] hover:bg-[#3C2A21] hover:text-white flex items-center justify-center transition shadow-xs disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-black text-base w-6 text-center text-[#3C2A21]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-white text-[#3C2A21] hover:bg-[#3C2A21] hover:text-white flex items-center justify-center transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions with Total Price */}
        <div className="p-4 sm:p-5 bg-[#FAF6F0] border-t border-[#E5D9C5] flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-[#7E6B5B] font-semibold block">
              المجموع
            </span>
            <div className="flex items-baseline gap-1 text-[#3C2A21]">
              <span className="text-2xl font-black">{totalPrice.toFixed(0)}</span>
              <span className="text-xs font-bold text-[#C89D7C]">ر.س</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#3C2A21] hover:bg-[#2B1E16] text-[#FAF6F0] font-black text-sm shadow-md transition transform active:scale-98"
          >
            <ShoppingBag className="w-4 h-4 text-[#C89D7C]" />
            <span>إضافة إلى السلة ({totalPrice.toFixed(0)} ر.س)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
