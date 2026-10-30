'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserSession } from '@/lib/auth'
import { Category, Product, Order, OrderStatus } from '@/types'
import {
  Coffee,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Shield,
  Layers,
  UtensilsCrossed,
  ToggleLeft,
  ToggleRight,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  RefreshCw,
  X,
  Loader2,
  Flame,
  Snowflake,
  Cake,
  ExternalLink,
} from 'lucide-react'

interface DashboardClientProps {
  user: UserSession
  initialCategories: Category[]
  initialOrders: Order[]
}

export function DashboardClient({
  user,
  initialCategories,
  initialOrders,
}: DashboardClientProps) {
  const router = useRouter()
  const isAdmin = user.role === 'ADMIN'

  // Tabs: 'orders' | 'stock' | 'admin-menu'
  const [activeTab, setActiveTab] = useState<'orders' | 'stock' | 'admin-menu'>('orders')

  // Orders State with 4-second Polling
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [orderFilter, setOrderFilter] = useState<string>('ACTIVE')
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<number | null>(null)

  // Products & Categories State
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [togglingProductId, setTogglingProductId] = useState<number | null>(null)

  // Stats State
  const [stats, setStats] = useState<{
    totalOrders: number
    pendingOrders: number
    totalProducts: number
    totalRevenue: number
  }>({
    totalOrders: initialOrders.length,
    pendingOrders: initialOrders.filter((o) => o.status === 'PENDING').length,
    totalProducts: initialCategories.reduce((acc, c) => acc + c.products.length, 0),
    totalRevenue: Math.round(
      initialOrders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.totalPrice, 0)
    ),
  })

  // Product Modal State (Add/Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    categoryId: initialCategories[0]?.id || 1,
    description: '',
    basePrice: 20,
    imageUrl: '',
    largeSizeDelta: 5,
  })
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false)
  const [productFormError, setProductFormError] = useState<string | null>(null)

  // 1. Live Polling for Orders every 4 seconds
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      if (res.ok && data.success) {
        setOrders(data.orders)
      }
    } catch (e) {
      console.warn('Failed to poll orders', e)
    }
  }

  // Refresh categories & products
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (res.ok && data.success) {
        setCategories(data.categories)
      }
    } catch (e) {
      console.warn('Failed to fetch categories', e)
    }
  }

  // Refresh Stats
  const fetchStats = async () => {
    if (!isAdmin) return
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (res.ok && data.success) {
        setStats(data.stats)
      }
    } catch (e) {
      console.warn('Failed to fetch stats', e)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders()
      if (isAdmin) fetchStats()
    }, 4000)

    return () => clearInterval(interval)
  }, [isAdmin])

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (e) {
      router.push('/login')
    }
  }

  // Transition Order Status
  const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    setIsUpdatingOrder(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
        )
      }
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setIsUpdatingOrder(null)
    }
  }

  // Quick Stock Toggle
  const handleToggleStock = async (productId: number) => {
    setTogglingProductId(productId)
    try {
      const res = await fetch(`/api/products/${productId}/toggle-stock`, {
        method: 'PATCH',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Update local state optimistically
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            products: cat.products.map((p) =>
              p.id === productId ? { ...p, isAvailable: data.product.isAvailable } : p
            ),
          }))
        )
      }
    } catch (err) {
      console.error('Failed to toggle stock', err)
    } finally {
      setTogglingProductId(null)
    }
  }

  // Open modal for new product
  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      categoryId: categories[0]?.id || 1,
      description: '',
      basePrice: 25,
      imageUrl: '',
      largeSizeDelta: 5,
    })
    setProductFormError(null)
    setIsProductModalOpen(true)
  }

  // Open modal for editing product
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product)
    let delta = 5
    try {
      const parsed = JSON.parse(product.optionsJson || '{}')
      if (parsed.sizes && parsed.sizes.length > 1) {
        delta = parsed.sizes[1].priceDelta || 5
      }
    } catch (e) {}

    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description || '',
      basePrice: product.basePrice,
      imageUrl: product.imageUrl || '',
      largeSizeDelta: delta,
    })
    setProductFormError(null)
    setIsProductModalOpen(true)
  }

  // Save product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductFormError(null)

    if (!formData.name.trim() || formData.basePrice <= 0) {
      setProductFormError('يرجى إدخال اسم الصنف وسعر أساسي صحيح')
      return
    }

    setIsSubmittingProduct(true)

    const optionsObj = {
      sizes: [
        { label: 'وسط', priceDelta: 0 },
        { label: 'كبير', priceDelta: Number(formData.largeSizeDelta) || 0 },
      ],
      sugarLevels: ['بدون سكر', 'سكر قليل', 'سكر عادي', 'سكر زيادة'],
      milkOptions: ['بدون حليب', 'حليب عادي', 'حليب نباتي'],
    }

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          optionsJson: JSON.stringify(optionsObj),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setProductFormError(data.error || 'فشل حفظ الصنف')
        setIsSubmittingProduct(false)
        return
      }

      setIsProductModalOpen(false)
      fetchCategories()
      fetchStats()
    } catch (err) {
      setProductFormError('حدث خطأ في الاتصال بالخادم')
    } finally {
      setIsSubmittingProduct(false)
    }
  }

  // Delete product
  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف/أرشفة الصنف "${productName}"؟`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        fetchCategories()
        fetchStats()
      } else {
        alert(data.error || 'فشل حذف الصنف')
      }
    } catch (e) {
      alert('خطأ في الاتصال')
    }
  }

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'ACTIVE') {
      return o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'READY'
    }
    if (orderFilter === 'PENDING') return o.status === 'PENDING'
    if (orderFilter === 'PREPARING') return o.status === 'PREPARING'
    if (orderFilter === 'READY') return o.status === 'READY'
    if (orderFilter === 'COMPLETED') return o.status === 'COMPLETED'
    if (orderFilter === 'CANCELLED') return o.status === 'CANCELLED'
    return true
  })

  // Flattened all products list for stock toggle and admin
  const allProducts = categories.flatMap((cat) =>
    cat.products.map((p) => ({ ...p, categoryName: cat.name }))
  )

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col text-[#2A1D15]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5D9C5] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3C2A21] flex items-center justify-center text-[#FAF6F0] shadow-sm">
              <Coffee className="w-5 h-5 text-[#C89D7C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-[#3C2A21] leading-tight">
                  لوحة تحكم الكافيه
                </h1>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-[#3C2A21] text-[#FAF6F0] border border-[#C89D7C]'
                      : 'bg-[#C89D7C] text-[#3C2A21]'
                  }`}
                >
                  {isAdmin ? 'مدير النظام (ADMIN)' : 'كاشير (CASHIER)'}
                </span>
              </div>
              <p className="text-[11px] text-[#7E6B5B]">
                أهلاً، <strong className="text-[#3C2A21]">{user.name}</strong>
              </p>
            </div>
          </div>

          {/* Actions: View Menu + Logout */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#EFE8DE] text-xs font-bold text-[#3C2A21] border border-[#E5D9C5] transition"
            >
              <span>عرض المنيو</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#C89D7C]" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition border border-red-200"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5D9C5] pb-3">
          <div className="flex items-center gap-2">
            {/* Tab 1: Orders Board */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-2xs ${
                activeTab === 'orders'
                  ? 'bg-[#3C2A21] text-[#FAF6F0] shadow-sm'
                  : 'bg-white text-[#7E6B5B] hover:text-[#3C2A21] hover:bg-[#EFE8DE] border border-[#E5D9C5]'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#C89D7C]" />
              <span>طلبات الكاشير الحية</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </button>

            {/* Tab 2: Quick Stock Toggle */}
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-2xs ${
                activeTab === 'stock'
                  ? 'bg-[#3C2A21] text-[#FAF6F0] shadow-sm'
                  : 'bg-white text-[#7E6B5B] hover:text-[#3C2A21] hover:bg-[#EFE8DE] border border-[#E5D9C5]'
              }`}
            >
              <ToggleRight className="w-4 h-4 text-[#C89D7C]" />
              <span>توافر الأصناف (المخزون)</span>
            </button>

            {/* Tab 3: Admin Management (ADMIN only) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin-menu')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-2xs ${
                  activeTab === 'admin-menu'
                    ? 'bg-[#3C2A21] text-[#FAF6F0] shadow-sm'
                    : 'bg-white text-[#7E6B5B] hover:text-[#3C2A21] hover:bg-[#EFE8DE] border border-[#E5D9C5]'
                }`}
              >
                <Layers className="w-4 h-4 text-[#C89D7C]" />
                <span>إدارة المنيو والأسعار (Admin)</span>
              </button>
            )}
          </div>

          {/* Quick Indicator */}
          <div className="text-[11px] text-[#7E6B5B] flex items-center gap-1.5 font-medium">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            <span>تحديث مباشر كل 4 ثوانٍ</span>
          </div>
        </div>

        {/* ─── TAB 1: LIVE ORDERS BOARD ────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ACTIVE', label: 'الطلبات النشطة' },
                { id: 'PENDING', label: 'في الانتظار (PENDING)' },
                { id: 'PREPARING', label: 'جاري التحضير (PREPARING)' },
                { id: 'READY', label: 'جاهزة للتقديم (READY)' },
                { id: 'COMPLETED', label: 'مكتملة (COMPLETED)' },
                { id: 'CANCELLED', label: 'ملغية (CANCELLED)' },
                { id: 'ALL', label: 'عرض الكل' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    orderFilter === f.id
                      ? 'bg-[#3C2A21] text-[#FAF6F0]'
                      : 'bg-white text-[#7E6B5B] border border-[#E5D9C5] hover:bg-[#EFE8DE]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E5D9C5] space-y-2">
                <Coffee className="w-12 h-12 mx-auto text-[#C89D7C] opacity-40" />
                <h4 className="font-bold text-sm text-[#3C2A21]">
                  لا توجد طلبات في هذا القسم حالياً
                </h4>
                <p className="text-xs text-[#7E6B5B]">
                  ستظهر الطلبات الجديدة تلقائياً بمجرد إرسالها من شاشة العميل
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((ord) => {
                  const isPending = ord.status === 'PENDING'
                  const isPreparing = ord.status === 'PREPARING'
                  const isReady = ord.status === 'READY'
                  const isCompleted = ord.status === 'COMPLETED'
                  const isCancelled = ord.status === 'CANCELLED'

                  return (
                    <div
                      key={ord.id}
                      className={`bg-white rounded-3xl p-5 border shadow-xs flex flex-col justify-between transition-all ${
                        isPending
                          ? 'border-amber-400 ring-2 ring-amber-100'
                          : isPreparing
                          ? 'border-blue-400 ring-2 ring-blue-50'
                          : isReady
                          ? 'border-emerald-500 ring-2 ring-emerald-50'
                          : 'border-[#E5D9C5] opacity-80'
                      }`}
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-[#FAF6F0] pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-[#3C2A21]">
                              {ord.orderNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#EFE8DE] text-[#3C2A21] text-xs font-black">
                              طاولة #{ord.tableNumber}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                              isPending
                                ? 'bg-amber-100 text-amber-800'
                                : isPreparing
                                ? 'bg-blue-100 text-blue-800'
                                : isReady
                                ? 'bg-emerald-100 text-emerald-800'
                                : isCompleted
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isPending && 'وصل للكاشير ⏱️'}
                            {isPreparing && 'يتحضر في البار ☕'}
                            {isReady && 'جاهز للتقديم ✨'}
                            {isCompleted && 'تم الاستلام ✅'}
                            {isCancelled && 'ملغي ❌'}
                          </span>
                        </div>

                        {/* Items list */}
                        <div className="space-y-2 mb-4">
                          {ord.items.map((item) => {
                            let opts: Record<string, string> = {}
                            try {
                              opts = JSON.parse(item.selectedOptions || '{}')
                            } catch (e) {}

                            const optsList = [
                              opts.size && `حجم: ${opts.size}`,
                              opts.sugar && `${opts.sugar}`,
                              opts.milk && `${opts.milk}`,
                            ]
                              .filter(Boolean)
                              .join(' • ')

                            return (
                              <div
                                key={item.id}
                                className="flex justify-between items-start text-xs bg-[#FAF6F0] p-2 rounded-xl"
                              >
                                <div>
                                  <span className="font-extrabold text-[#3C2A21]">
                                    {item.quantity} × {item.product.name}
                                  </span>
                                  {optsList && (
                                    <p className="text-[10px] text-[#7E6B5B] mt-0.5">
                                      {optsList}
                                    </p>
                                  )}
                                </div>
                                <span className="font-bold text-[#3C2A21]">
                                  {(item.unitPrice * item.quantity).toFixed(0)} ر.س
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Card Footer: Total Price + Action Buttons */}
                      <div className="pt-3 border-t border-[#E5D9C5] space-y-3">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="text-[#7E6B5B]">إجمالي الفاتورة:</span>
                          <span className="font-black text-sm text-[#3C2A21]">
                            {ord.totalPrice.toFixed(0)} ر.س
                          </span>
                        </div>

                        {/* Status Transition Action Buttons */}
                        <div className="flex gap-2">
                          {isPending && (
                            <>
                              <button
                                disabled={isUpdatingOrder === ord.id}
                                onClick={() =>
                                  handleUpdateOrderStatus(ord.id, 'PREPARING')
                                }
                                className="flex-1 py-2 px-3 rounded-xl bg-[#3C2A21] hover:bg-[#2B1E16] text-[#FAF6F0] text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                              >
                                <Coffee className="w-3.5 h-3.5 text-[#C89D7C]" />
                                <span>بدء التحضير</span>
                              </button>
                              <button
                                disabled={isUpdatingOrder === ord.id}
                                onClick={() =>
                                  handleUpdateOrderStatus(ord.id, 'CANCELLED')
                                }
                                className="py-2 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition border border-red-200"
                                title="إلغاء الطلب"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {isPreparing && (
                            <button
                              disabled={isUpdatingOrder === ord.id}
                              onClick={() => handleUpdateOrderStatus(ord.id, 'READY')}
                              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>جاهز للتقديم لطاولة #{ord.tableNumber}</span>
                            </button>
                          )}

                          {isReady && (
                            <button
                              disabled={isUpdatingOrder === ord.id}
                              onClick={() =>
                                handleUpdateOrderStatus(ord.id, 'COMPLETED')
                              }
                              className="w-full py-2 px-3 rounded-xl bg-[#EFE8DE] hover:bg-[#E5D9C5] text-[#3C2A21] text-xs font-black transition flex items-center justify-center gap-1.5 border border-[#E5D9C5]"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>تم التسليم للعميل (إنهاء)</span>
                            </button>
                          )}

                          {(isCompleted || isCancelled) && (
                            <div className="w-full py-1 text-center text-[11px] text-[#7E6B5B] font-medium">
                              {isCompleted ? 'مكتمل ومسجل' : 'ملغي'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: QUICK STOCK TOGGLE ────────────────────────────────────────── */}
        {activeTab === 'stock' && (
          <div className="bg-white rounded-3xl p-6 border border-[#E5D9C5] shadow-xs space-y-4">
            <div>
              <h3 className="font-black text-lg text-[#3C2A21]">
                لوحة التبديل السريع لتوافر الأصناف (المخزون)
              </h3>
              <p className="text-xs text-[#7E6B5B] mt-0.5">
                يمكن للباريستا أو الكاشير تبديل حالة أي صنف بلحظة واحدة إلى (نفذت الكمية) لمنع الزبائن من طلبه من طاولاتهم
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {allProducts.map((p) => {
                const isToggling = togglingProductId === p.id
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      p.isAvailable
                        ? 'bg-[#FAF6F0] border-[#E5D9C5]'
                        : 'bg-red-50/60 border-red-200 opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-[#EFE8DE] overflow-hidden shrink-0">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Coffee className="w-5 h-5 text-[#C89D7C]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-[#3C2A21] truncate">
                          {p.name}
                        </h4>
                        <span className="text-[11px] text-[#7E6B5B] block">
                          {p.categoryName} • {p.basePrice} ر.س
                        </span>
                      </div>
                    </div>

                    {/* Stock Switch Button */}
                    <button
                      disabled={isToggling}
                      onClick={() => handleToggleStock(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs shrink-0 ${
                        p.isAvailable
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : p.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>متاح للطلب</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>نفذت الكمية</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 3: ADMIN MENU MANAGEMENT (ADMIN ONLY) ────────────────────────── */}
        {isAdmin && activeTab === 'admin-menu' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-[#E5D9C5] shadow-2xs space-y-1">
                <span className="text-xs text-[#7E6B5B] font-medium">إجمالي الإيرادات</span>
                <div className="flex items-baseline gap-1 text-xl font-black text-[#3C2A21]">
                  <span>{stats.totalRevenue.toLocaleString()}</span>
                  <span className="text-xs text-[#C89D7C]">ر.س</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-[#E5D9C5] shadow-2xs space-y-1">
                <span className="text-xs text-[#7E6B5B] font-medium">إجمالي الطلبات</span>
                <span className="text-xl font-black text-[#3C2A21] block">
                  {stats.totalOrders}
                </span>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-[#E5D9C5] shadow-2xs space-y-1">
                <span className="text-xs text-[#7E6B5B] font-medium">طلبات معلقة</span>
                <span className="text-xl font-black text-amber-600 block">
                  {stats.pendingOrders}
                </span>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-[#E5D9C5] shadow-2xs space-y-1">
                <span className="text-xs text-[#7E6B5B] font-medium">الأصناف بالمنيو</span>
                <span className="text-xl font-black text-[#3C2A21] block">
                  {stats.totalProducts}
                </span>
              </div>
            </div>

            {/* Admin Management Header */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5D9C5] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FAF6F0] pb-4">
                <div>
                  <h3 className="font-black text-lg text-[#3C2A21]">
                    إدارة قائمة المشروبات والحلويات
                  </h3>
                  <p className="text-xs text-[#7E6B5B]">
                    إضافة أصناف جديدة، تعديل الأسعار، وإدارة محتوى المنيو
                  </p>
                </div>

                <button
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#3C2A21] hover:bg-[#2B1E16] text-[#FAF6F0] text-xs font-black shadow-md transition transform active:scale-98"
                >
                  <Plus className="w-4 h-4 text-[#C89D7C]" />
                  <span>إضافة صنف جديد</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-[#E5D9C5] text-[#7E6B5B]">
                      <th className="py-3 px-3">الصنف</th>
                      <th className="py-3 px-3">القسم</th>
                      <th className="py-3 px-3">السعر الأساسي</th>
                      <th className="py-3 px-3">الحالة</th>
                      <th className="py-3 px-3 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF6F0]">
                    {allProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-[#FAF6F0]/60 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#EFE8DE] overflow-hidden shrink-0">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Coffee className="w-4 h-4 text-[#C89D7C]" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-[#3C2A21] block">
                                {prod.name}
                              </span>
                              <span className="text-[10px] text-[#7E6B5B] line-clamp-1">
                                {prod.description || 'لا يوجد وصف'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#7E6B5B]">
                          {prod.categoryName}
                        </td>
                        <td className="py-3 px-3 font-black text-[#3C2A21]">
                          {prod.basePrice} ر.س
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              prod.isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {prod.isAvailable ? 'متاح' : 'نفذت الكمية'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(prod)}
                              className="p-2 rounded-xl text-[#7E6B5B] hover:text-[#3C2A21] hover:bg-[#EFE8DE] transition"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                              title="حذف/أرشفة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── ADD/EDIT PRODUCT MODAL ────────────────────────────────────────── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-[#E5D9C5] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#FAF6F0] pb-3">
              <h3 className="font-black text-base text-[#3C2A21]">
                {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمنيو'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-xl text-[#7E6B5B] hover:text-[#3C2A21] hover:bg-[#EFE8DE] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {productFormError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-[#7E6B5B]">اسم الصنف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فلات وايت، كوكيز شوكولاته"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl bg-[#FAF6F0] border border-[#E5D9C5] font-semibold text-[#3C2A21] focus:ring-2 focus:ring-[#3C2A21] focus:outline-hidden"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="font-bold text-[#7E6B5B]">القسم</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: Number(e.target.value) })
                  }
                  className="w-full p-3 rounded-2xl bg-[#FAF6F0] border border-[#E5D9C5] font-semibold text-[#3C2A21] focus:ring-2 focus:ring-[#3C2A21] focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base Price & Large Delta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#7E6B5B]">السعر الأساسي (ر.س)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: Number(e.target.value) })
                    }
                    className="w-full p-3 rounded-2xl bg-[#FAF6F0] border border-[#E5D9C5] font-semibold text-[#3C2A21] focus:ring-2 focus:ring-[#3C2A21] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#7E6B5B]">إضافة الحجم الكبير (+ر.س)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.largeSizeDelta}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        largeSizeDelta: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[#FAF6F0] border border-[#E5D9C5] font-semibold text-[#3C2A21] focus:ring-2 focus:ring-[#3C2A21] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-[#7E6B5B]">الوصف</label>
                <textarea
                  rows={2}
                  placeholder="وصف مكونات المشروب أو الحلى..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl bg-[#FAF6F0] border border-[#E5D9C5] font-semibold text-[#3C2A21] focus:ring-2 focus:ring-[#3C2A21] focus:outline-hidden"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="font-bold text-[#7E6B5B]">رابط الصورة (URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl bg-[#FAF6F0] border border-[#E5D9C5] font-semibold text-[#3C2A21] focus:ring-2 focus:ring-[#3C2A21] focus:outline-hidden"
                  dir="ltr"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-[#EFE8DE] text-[#3C2A21] font-bold hover:bg-[#E5D9C5] transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="flex-1 py-3 rounded-2xl bg-[#3C2A21] text-[#FAF6F0] font-black hover:bg-[#2B1E16] transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingProduct ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C89D7C]" />
                  ) : (
                    <span>{editingProduct ? 'حفظ التعديلات' : 'إضافة الصنف'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
