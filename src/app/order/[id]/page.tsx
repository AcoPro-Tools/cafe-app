'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Order, OrderStatus } from '@/types'
import {
  Clock,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Receipt,
  UtensilsCrossed,
  RefreshCw,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

const statusSteps: Array<{
  key: OrderStatus
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    key: 'PENDING',
    label: 'وصل للكاشير',
    desc: 'تم تسجيل طلبك وبانتظار التأكيد',
    icon: Clock,
  },
  {
    key: 'PREPARING',
    label: 'يتحضر في البار',
    desc: 'الباريستا يقوم بتحضير طلبك بعناية',
    icon: Coffee,
  },
  {
    key: 'READY',
    label: 'جاهز للتقديم',
    desc: 'طلبك جاهز ولذيذ، في طريقه لطاولتك',
    icon: CheckCircle2,
  },
]

export default function OrderTrackingPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.id

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchOrder = async (isFirst = false) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setOrder(data.order)
        setLastUpdated(new Date())
        setError(null)

        // Save or update in localStorage history so user can track it anytime
        try {
          const existing = JSON.parse(localStorage.getItem('cafe_placed_orders') || '[]')
          const record = {
            id: data.order.id,
            orderNumber: data.order.orderNumber,
            tableNumber: data.order.tableNumber,
            totalPrice: data.order.totalPrice,
            createdAt: data.order.createdAt,
            status: data.order.status,
          }
          const updated = [record, ...existing.filter((o: any) => o.id !== data.order.id)]
          localStorage.setItem('cafe_placed_orders', JSON.stringify(updated))
        } catch (e) {}
      } else {
        if (isFirst) setError(data.error || 'تعذر العثور على الطلب')
      }
    } catch (err) {
      if (isFirst) setError('فشل الاتصال بالخادم')
    } finally {
      if (isFirst) setLoading(false)
    }
  }

  // Initial fetch + 4-second polling
  useEffect(() => {
    fetchOrder(true)
    const interval = setInterval(() => {
      fetchOrder(false)
    }, 4000)

    return () => clearInterval(interval)
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6F0] p-4 text-[#3C2A21] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#C89D7C]" />
        <p className="text-sm font-bold">جاري تحميل تفاصيل طلبك...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6F0] p-4">
        <div className="bg-white p-8 rounded-3xl border border-[#E5D9C5] max-w-md w-full text-center space-y-4 shadow-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-black text-[#3C2A21]">عذراً، حدث خطأ</h2>
          <p className="text-xs text-[#7E6B5B]">{error || 'الطلب غير موجود'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#3C2A21] text-white text-xs font-bold hover:bg-[#2B1E16] transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لقائمة المنيو</span>
          </Link>
        </div>
      </div>
    )
  }

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 0
      case 'PREPARING':
        return 1
      case 'READY':
        return 2
      case 'COMPLETED':
        return 3
      default:
        return 0
    }
  }

  const currentStep = getStepIndex(order.status)
  const isCancelled = order.status === 'CANCELLED'
  const isCompleted = order.status === 'COMPLETED'

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-12">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E5D9C5] shadow-2xs">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-[#7E6B5B] hover:text-[#3C2A21] transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>قائمة المنيو</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-[#7E6B5B]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-emerald-700">تحديث مباشر</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Status Stepper Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5D9C5] shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="inline-block px-3 py-1 rounded-full bg-[#EFE8DE] text-[#3C2A21] font-black text-xs">
              طلب رقم {order.orderNumber}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#3C2A21]">
              {isCancelled
                ? 'تم إلغاء الطلب ❌'
                : isCompleted
                ? 'تم تسليم الطلب بنجاح! 🎉'
                : order.status === 'READY'
                ? 'طلبك جاهز للتقديم! ☕'
                : order.status === 'PREPARING'
                ? 'جاري تحضير طلبك في البار...'
                : 'تم استلام طلبك بالكاشير'}
            </h2>
            <p className="text-xs text-[#7E6B5B]">
              طاولة رقم <strong className="text-[#3C2A21]">#{order.tableNumber}</strong> • تتحدث الصفحة تلقائياً كل 4 ثوانٍ
            </p>
          </div>

          {/* Stepper Progress Bar (if not cancelled) */}
          {!isCancelled && (
            <div className="pt-4 pb-2">
              <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-6 right-6 h-1 bg-[#EFE8DE] -translate-y-1/2 -z-0">
                  <div
                    className="h-full bg-[#3C2A21] transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (currentStep / 2) * 100)}%`,
                    }}
                  />
                </div>

                {statusSteps.map((step, idx) => {
                  const Icon = step.icon
                  const isDone = currentStep >= idx
                  const isCurrent = currentStep === idx

                  return (
                    <div
                      key={step.key}
                      className="relative z-10 flex flex-col items-center group"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xs ${
                          isDone
                            ? 'bg-[#3C2A21] text-[#FAF6F0] ring-4 ring-[#EFE8DE]'
                            : 'bg-white border-2 border-[#E5D9C5] text-[#7E6B5B]'
                        } ${isCurrent ? 'scale-110 animate-pulse-glow ring-[#C89D7C]' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs font-bold mt-2.5 whitespace-nowrap ${
                          isDone ? 'text-[#3C2A21]' : 'text-[#7E6B5B]'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-bold">
              نعتذر منك، تم إلغاء هذا الطلب من قبل الكاشير. يمكنك مراجعة الموظف أو طلب صنف آخر.
            </div>
          )}
        </div>

        {/* Digital Electronic Receipt Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5D9C5] shadow-xs relative overflow-hidden">
          {/* Receipt Top decoration */}
          <div className="flex items-center justify-between border-b border-dashed border-[#E5D9C5] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#C89D7C]" />
              <h3 className="font-extrabold text-sm text-[#3C2A21]">
                فاتورة إلكترونية (Digital Receipt)
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#7E6B5B] block font-medium">
                {new Date(order.createdAt).toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Receipt Meta info */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF6F0] p-3.5 rounded-2xl border border-[#E5D9C5] mb-5">
            <div>
              <span className="text-[#7E6B5B] block text-[11px]">رقم الطلب</span>
              <strong className="text-[#3C2A21] font-black">{order.orderNumber}</strong>
            </div>
            <div>
              <span className="text-[#7E6B5B] block text-[11px]">رقم الطاولة</span>
              <strong className="text-[#3C2A21] font-black">طاولة #{order.tableNumber}</strong>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-3 mb-6">
            <span className="text-xs font-bold text-[#7E6B5B] block">
              الأصناف المطلوبة
            </span>
            {order.items.map((item) => {
              let parsedOptions: Record<string, string> = {}
              try {
                parsedOptions = JSON.parse(item.selectedOptions || '{}')
              } catch (e) {}

              const optionsStr = [
                parsedOptions.size && `حجم: ${parsedOptions.size}`,
                parsedOptions.sugar && `${parsedOptions.sugar}`,
                parsedOptions.milk && `${parsedOptions.milk}`,
              ]
                .filter(Boolean)
                .join(' • ')

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between py-2 border-b border-[#FAF6F0] text-xs"
                >
                  <div className="flex-1 pr-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#3C2A21]">
                        {item.product.name}
                      </span>
                      <span className="text-[11px] font-bold text-[#7E6B5B]">
                        × {item.quantity}
                      </span>
                    </div>
                    {optionsStr && (
                      <p className="text-[11px] text-[#7E6B5B] mt-0.5">
                        {optionsStr}
                      </p>
                    )}
                  </div>
                  <div className="text-left font-black text-[#3C2A21]">
                    {(item.unitPrice * item.quantity).toFixed(0)} ر.س
                  </div>
                </div>
              )
            })}
          </div>

          {/* Financial Totals */}
          <div className="space-y-2 pt-2 border-t border-[#E5D9C5] text-xs">
            <div className="flex justify-between text-[#7E6B5B]">
              <span>المجموع الفرعي</span>
              <span>{order.totalPrice.toFixed(0)} ر.س</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#7E6B5B]">
              <span>ضريبة القيمة المضافة (15% شاملة)</span>
              <span>متضمنة</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-[#E5D9C5] font-black text-base text-[#3C2A21]">
              <span>الإجمالي الكلي المدفوع</span>
              <div className="flex items-baseline gap-1 text-xl text-[#3C2A21]">
                <span>{order.totalPrice.toFixed(0)}</span>
                <span className="text-xs text-[#C89D7C]">ر.س</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Order more */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#3C2A21] text-white font-black text-sm shadow-md hover:bg-[#2B1E16] transition"
          >
            <ShoppingBag className="w-4 h-4 text-[#C89D7C]" />
            <span>طلب صنف آخر من القائمة</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
