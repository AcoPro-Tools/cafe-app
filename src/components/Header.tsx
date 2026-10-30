'use client'

import React from 'react'
import { Coffee, ShoppingBag, UtensilsCrossed, Shield, Clock, Receipt } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  tableNumber: number | null
  onChangeTable: () => void
  cartCount: number
  onOpenCart: () => void
  myOrdersCount?: number
  onOpenMyOrders?: () => void
}

export function Header({
  tableNumber,
  onChangeTable,
  cartCount,
  onOpenCart,
  myOrdersCount = 0,
  onOpenMyOrders,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E5D9C5] shadow-xs">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#3C2A21] flex items-center justify-center text-[#FAF6F0] shadow-md group-hover:scale-105 transition-transform">
            <Coffee className="w-5 h-5 text-[#C89D7C]" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-[#3C2A21] leading-tight">
              كافيه النخبة
            </h1>
            <p className="text-[11px] text-[#7E6B5B] font-medium tracking-wide">
              Specialty Coffee & Sweets
            </p>
          </div>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Table Badge */}
          <button
            onClick={onChangeTable}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFE8DE] hover:bg-[#E5D9C5] text-[#3C2A21] text-xs font-semibold transition border border-[#E5D9C5]"
            title="تغيير رقم الطاولة"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#C89D7C]" />
            <span>
              {tableNumber ? `طاولة #${tableNumber}` : 'اختر الطاولة'}
            </span>
          </button>

          {/* My Orders Button */}
          {onOpenMyOrders && (
            <button
              onClick={onOpenMyOrders}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#EFE8DE] text-[#3C2A21] border border-[#E5D9C5] text-xs font-bold transition shadow-2xs"
              title="متابعة طلباتي الحالية"
            >
              <Receipt className="w-4 h-4 text-[#C89D7C]" />
              <span className="hidden sm:inline">طلباتي</span>
              {myOrdersCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3C2A21] text-[#FAF6F0] text-[10px] font-black">
                  {myOrdersCount}
                </span>
              )}
            </button>
          )}

          {/* Staff Login Link */}
          <Link
            href="/login"
            className="p-2 rounded-xl text-[#7E6B5B] hover:text-[#3C2A21] hover:bg-[#EFE8DE] transition"
            title="دخول الموظفين"
          >
            <Shield className="w-4 h-4" />
          </Link>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#3C2A21] hover:bg-[#2B1E16] text-[#FAF6F0] font-bold text-sm shadow-md transition transform active:scale-95"
            aria-label="سلة الطلبات"
          >
            <ShoppingBag className="w-4 h-4 text-[#C89D7C]" />
            <span className="hidden sm:inline text-xs">السلة</span>
            {cartCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#C89D7C] text-[#3C2A21] text-xs font-black shadow-xs animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
