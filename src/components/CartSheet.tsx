'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CartItem } from '@/types'
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertCircle,
  UtensilsCrossed,
  CheckCircle2,
} from 'lucide-react'

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  tableNumber: number | null
  onUpdateTableNumber: (num: number) => void
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveItem: (id: string) => void
  onClearCart: () => void
}

export function CartSheet({
  isOpen,
  onClose,
  items,
  tableNumber,
  onUpdateTableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartSheetProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [localTable, setLocalTable] = useState<string>(
    tableNumber ? String(tableNumber) : '1'
  )

  if (!isOpen) return null

  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  const handleSubmitOrder = async () => {
    setErrorMessage(null)

    const parsedTable = Number(localTable)
    if (!parsedTable || isNaN(parsedTable) || parsedTable <= 0) {
      setErrorMessage('يرجى كتابة رقم طاولة صحيح للطلب')
      return
    }

    if (items.length === 0) {
      setErrorMessage('السلة فارغة، أضف بعض المشروبات أو الحلويات أولاً')
      return
    }

    onUpdateTableNumber(parsedTable)
    setIsSubmitting(true)

    try {
      const payload = {
        tableNumber: parsedTable,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          selectedOptions: it.selectedOptions,
        })),
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى')
        setIsSubmitting(false)
        return
      }

      // Success! Save to placed orders history for customer tracking
      try {
        const existing = JSON.parse(localStorage.getItem('cafe_placed_orders') || '[]')
        const newRecord = {
          id: data.order.id,
          orderNumber: data.order.orderNumber,
          tableNumber: data.order.tableNumber,
          totalPrice: data.order.totalPrice,
          createdAt: data.order.createdAt || new Date().toISOString(),
          status: data.order.status || 'PENDING',
        }
        const updated = [newRecord, ...existing.filter((o: any) => o.id !== data.order.id)]
        localStorage.setItem('cafe_placed_orders', JSON.stringify(updated))
      } catch (e) {
        console.warn('Could not save order to history', e)
      }

      // Clear cart & navigate to live tracking
      onClearCart()
      onClose()
      router.push(`/order/${data.order.id}`)
    } catch (err) {
      console.error('Order submission error:', err)
      setErrorMessage('حدث خطأ في الاتصال بالخادم، تأكد من اتصالك بالإنترنت')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div
        className="w-full max-w-md bg-[#FAF6F0] h-full shadow-2xl flex flex-col border-r border-[#E5D9C5] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FFFFFF] border-b border-[#E5D9C5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3C2A21] flex items-center justify-center text-[#FAF6F0]">
              <ShoppingBag className="w-5 h-5 text-[#C89D7C]" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#3C2A21] text-base">
                سلة طلباتك
              </h2>
              <p className="text-xs text-[#7E6B5B]">
                {items.length > 0 ? `${items.length} أصناف في السلة` : 'السلة فارغة'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-[#7E6B5B] hover:text-[#3C2A21] hover:bg-[#EFE8DE] flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Number Selector Banner */}
        <div className="p-4 bg-[#EFE8DE]/60 border-b border-[#E5D9C5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3C2A21]">
            <UtensilsCrossed className="w-4 h-4 text-[#C89D7C]" />
            <span>رقم الطاولة:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7E6B5B]">طاولة رقم</span>
            <input
              type="number"
              min="1"
              max="99"
              value={localTable}
              onChange={(e) => setLocalTable(e.target.value)}
              className="w-16 px-2 py-1 rounded-xl bg-white border border-[#E5D9C5] text-center font-black text-sm text-[#3C2A21] focus:outline-hidden focus:ring-2 focus:ring-[#3C2A21]"
            />
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="m-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Items List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7E6B5B]">
              <div className="w-16 h-16 rounded-full bg-[#EFE8DE] flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 text-[#C89D7C]" />
              </div>
              <h3 className="font-bold text-sm text-[#3C2A21] mb-1">
                سلتك فارغة حالياً
              </h3>
              <p className="text-xs text-[#7E6B5B] max-w-xs">
                تصفح قائمة المشروبات والحلويات واختر ما يناسب ذوقك اليوم
              </p>
            </div>
          ) : (
            items.map((item) => {
              const optionsSummary = [
                item.selectedOptions.size && `الحجم: ${item.selectedOptions.size}`,
                item.selectedOptions.sugar && `${item.selectedOptions.sugar}`,
                item.selectedOptions.milk && `${item.selectedOptions.milk}`,
              ]
                .filter(Boolean)
                .join(' • ')

              return (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-[#E5D9C5] shadow-2xs flex gap-3 items-center"
                >
                  {/* Item Image */}
                  <div className="w-14 h-14 rounded-xl bg-[#EFE8DE] overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#7E6B5B]">
                        <ShoppingBag className="w-5 h-5 text-[#C89D7C]" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#3C2A21] truncate">
                      {item.name}
                    </h4>
                    {optionsSummary && (
                      <p className="text-[11px] text-[#7E6B5B] truncate mt-0.5">
                        {optionsSummary}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1 mt-1 text-[#3C2A21] font-black text-xs">
                      <span>{(item.unitPrice * item.quantity).toFixed(0)}</span>
                      <span className="text-[10px] text-[#C89D7C]">ر.س</span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-[#7E6B5B] font-normal mr-1">
                          ({item.unitPrice} × {item.quantity})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controls: +/- and Delete */}
                  <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1 rounded-xl border border-[#E5D9C5] shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-[#3C2A21] hover:text-white text-[#3C2A21] flex items-center justify-center transition shadow-2xs text-xs font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black w-5 text-center text-[#3C2A21]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-[#3C2A21] hover:text-white text-[#3C2A21] flex items-center justify-center transition shadow-2xs text-xs font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="w-6 h-6 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center transition mr-1"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Summary & Order Button */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-[#E5D9C5] space-y-3">
            <div className="space-y-1.5 text-xs text-[#7E6B5B]">
              <div className="flex justify-between">
                <span>المجموع الفرعي</span>
                <span className="font-bold text-[#3C2A21]">
                  {totalAmount.toFixed(0)} ر.س
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>الضريبة (15% شاملة)</span>
                <span>متضمنة في الأسعار</span>
              </div>
              <div className="pt-2 border-t border-[#FAF6F0] flex justify-between items-baseline text-sm text-[#3C2A21] font-black">
                <span>إجمالي الطلب</span>
                <div className="flex items-baseline gap-1 text-lg">
                  <span>{totalAmount.toFixed(0)}</span>
                  <span className="text-xs text-[#C89D7C]">ر.س</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#3C2A21] hover:bg-[#2B1E16] disabled:opacity-60 text-[#FAF6F0] font-black text-sm shadow-md transition flex items-center justify-center gap-2 transform active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C89D7C]" />
                  <span>جاري إرسال الطلب للكاشير...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#C89D7C]" />
                  <span>تأكيد وإرسال الطلب ({totalAmount.toFixed(0)} ر.س)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
