'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  X,
  Receipt,
  Clock,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  ShoppingBag,
} from 'lucide-react'
import { OrderStatus } from '@/types'

export interface PlacedOrderSummary {
  id: number
  orderNumber: string
  tableNumber: number
  totalPrice?: number
  createdAt: string
  status?: OrderStatus
}

interface MyOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  orders: PlacedOrderSummary[]
  onClearHistory: () => void
}

export function MyOrdersModal({
  isOpen,
  onClose,
  orders,
  onClearHistory,
}: MyOrdersModalProps) {
  const [liveOrders, setLiveOrders] = useState<PlacedOrderSummary[]>(orders)

  // Fetch updated status for saved orders
  useEffect(() => {
    if (!isOpen || orders.length === 0) return

    let isMounted = true

    const fetchStatuses = async () => {
      try {
        const updated = await Promise.all(
          orders.map(async (ord) => {
            try {
              const res = await fetch(`/api/orders/${ord.id}`)
              const data = await res.json()
              if (res.ok && data.success) {
                return {
                  ...ord,
                  status: data.order.status as OrderStatus,
                  totalPrice: data.order.totalPrice,
                }
              }
            } catch (e) {}
            return ord
          })
        )
        if (isMounted) setLiveOrders(updated)
      } catch (e) {}
    }

    fetchStatuses()
    const timer = setInterval(fetchStatuses, 4000)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [isOpen, orders])

  if (!isOpen) return null

  const getStatusBadge = (status?: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black">
            <Clock className="w-3 h-3" />
            <span>وصل للكاشير</span>
          </span>
        )
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black">
            <Coffee className="w-3 h-3" />
            <span>يتحضر في البار</span>
          </span>
        )
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black animate-pulse">
            <CheckCircle2 className="w-3 h-3" />
            <span>جاهز للتقديم!</span>
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>تم الاستلام</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
            <AlertCircle className="w-3 h-3" />
            <span>ملغي</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFE8DE] text-[#3C2A21] text-[11px] font-bold">
            <span>قيد المتابعة</span>
          </span>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#E5D9C5] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF6F0] border-b border-[#E5D9C5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3C2A21] flex items-center justify-center text-[#FAF6F0]">
              <Receipt className="w-5 h-5 text-[#C89D7C]" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#3C2A21] text-base">
                طلباتي وتتبع الحالة
              </h2>
              <p className="text-[11px] text-[#7E6B5B]">
                يمكنك متابعة حالة طلباتك الحالية في أي وقت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-[#7E6B5B] hover:text-[#3C2A21] hover:bg-[#EFE8DE] flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {liveOrders.length === 0 ? (
            <div className="py-12 text-center text-[#7E6B5B] space-y-2">
              <ShoppingBag className="w-12 h-12 mx-auto text-[#C89D7C] opacity-40" />
              <h3 className="font-bold text-sm text-[#3C2A21]">
                لم تقم بطلب أي شيء بعد
              </h3>
              <p className="text-xs">
                عند تأكيد أي طلب سيظهر هنا تلقائياً لمتابعة حالته
              </p>
            </div>
          ) : (
            liveOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#E5D9C5] shadow-2xs space-y-3 hover:border-[#C89D7C] transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-sm text-[#3C2A21] block">
                      طلب {ord.orderNumber}
                    </span>
                    <span className="text-[11px] text-[#7E6B5B]">
                      طاولة #{ord.tableNumber} •{' '}
                      {new Date(ord.createdAt).toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div>{getStatusBadge(ord.status)}</div>
                </div>

                <div className="pt-2 border-t border-[#E5D9C5]/50 flex items-center justify-between">
                  {ord.totalPrice !== undefined && (
                    <span className="text-xs font-black text-[#3C2A21]">
                      {ord.totalPrice.toFixed(0)} ر.س
                    </span>
                  )}
                  <Link
                    href={`/order/${ord.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3C2A21] hover:bg-[#2B1E16] text-[#FAF6F0] text-xs font-bold transition shadow-2xs mr-auto"
                  >
                    <span>عرض شاشة التتبع والفاتورة</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#C89D7C]" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {liveOrders.length > 0 && (
          <div className="p-3 bg-[#FAF6F0] border-t border-[#E5D9C5] flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#7E6B5B]">
              إجمالي الطلبات المسجلة: {liveOrders.length}
            </span>
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
