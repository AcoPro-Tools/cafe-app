'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Category, Product, CartItem, SelectedOptions, OrderStatus } from '@/types'
import { Header } from '@/components/Header'
import { CategoryTabs } from '@/components/CategoryTabs'
import { ProductCard } from '@/components/ProductCard'
import { ProductModal } from '@/components/ProductModal'
import { CartSheet } from '@/components/CartSheet'
import { MyOrdersModal, PlacedOrderSummary } from '@/components/MyOrdersModal'
import {
  Search,
  Sparkles,
  Coffee,
  UtensilsCrossed,
  Receipt,
  ArrowRight,
  Clock,
} from 'lucide-react'

interface MenuClientProps {
  initialCategories: Category[]
}

export function MenuClient({ initialCategories }: MenuClientProps) {
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
    initialCategories.length > 0 ? initialCategories[0].id : null
  )
  const [tableNumber, setTableNumber] = useState<number>(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [tempTableInput, setTempTableInput] = useState('1')

  // My Orders tracking state
  const [myOrders, setMyOrders] = useState<PlacedOrderSummary[]>([])
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false)

  // Read ?table=X from URL on load
  useEffect(() => {
    const tableParam = searchParams.get('table')
    if (tableParam) {
      const parsed = parseInt(tableParam, 10)
      if (!isNaN(parsed) && parsed > 0) {
        setTableNumber(parsed)
        setTempTableInput(String(parsed))
      }
    }
  }, [searchParams])

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cafe_cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch (e) {
      console.warn('Could not read cart from localStorage', e)
    }
  }, [])

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cafe_cart', JSON.stringify(cart))
    } catch (e) {
      console.warn('Could not save cart to localStorage', e)
    }
  }, [cart])

  // Load and sync placed orders from localStorage
  const loadPlacedOrders = () => {
    try {
      const saved = localStorage.getItem('cafe_placed_orders')
      if (saved) {
        setMyOrders(JSON.parse(saved))
      }
    } catch (e) {}
  }

  useEffect(() => {
    loadPlacedOrders()
    // Poll orders history status periodically
    const timer = setInterval(loadPlacedOrders, 3000)
    return () => clearInterval(timer)
  }, [])

  // Add to cart handler
  const handleAddToCart = (
    product: Product,
    selectedOptions: SelectedOptions,
    quantity: number,
    unitPrice: number
  ) => {
    const optionKey = `${product.id}_${selectedOptions.size || ''}_${
      selectedOptions.sugar || ''
    }_${selectedOptions.milk || ''}`

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === optionKey)
      if (existingIndex > -1) {
        const updated = [...prevCart]
        updated[existingIndex].quantity += quantity
        return updated
      } else {
        const newItem: CartItem = {
          id: optionKey,
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          basePrice: product.basePrice,
          unitPrice,
          quantity,
          selectedOptions,
        }
        return [...prevCart, newItem]
      }
    })

    setIsCartOpen(true)
  }

  // Update quantity in cart
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.id === id) {
            const newQty = it.quantity + delta
            return newQty > 0 ? { ...it, quantity: newQty } : null
          }
          return it
        })
        .filter(Boolean) as CartItem[]
    )
  }

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((it) => it.id !== id))
  }

  // Clear entire cart
  const handleClearCart = () => {
    setCart([])
    try {
      localStorage.removeItem('cafe_cart')
    } catch (e) {}
    loadPlacedOrders()
  }

  // Clear order history
  const handleClearHistory = () => {
    setMyOrders([])
    try {
      localStorage.removeItem('cafe_placed_orders')
    } catch (e) {}
  }

  // Change table modal confirm
  const handleSaveTable = () => {
    const val = parseInt(tempTableInput, 10)
    if (!isNaN(val) && val > 0) {
      setTableNumber(val)
      setIsTableModalOpen(false)
    }
  }

  // Filter products by category and search
  const currentCategory = categories.find((c) => c.id === activeCategoryId)
  let displayedProducts = currentCategory ? currentCategory.products : []

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    displayedProducts = categories
      .flatMap((c) => c.products)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Most recent order for quick active banner
  const latestOrder = myOrders.length > 0 ? myOrders[0] : null
  const isLatestOrderActive =
    latestOrder &&
    latestOrder.status !== 'COMPLETED' &&
    latestOrder.status !== 'CANCELLED'

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] relative pb-20">
      {/* Top Header */}
      <Header
        tableNumber={tableNumber}
        onChangeTable={() => setIsTableModalOpen(true)}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        myOrdersCount={myOrders.length}
        onOpenMyOrders={() => setIsMyOrdersOpen(true)}
      />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#FAF6F0] via-[#EFE8DE] to-[#FAF6F0] border-b border-[#E5D9C5]/50 py-8 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3C2A21] text-[#C89D7C] text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تجربة قهوة مختصة لا تُنسى</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#3C2A21] leading-tight">
            استمتع بألذ مشروبات القهوة والحلويات
          </h2>
          <p className="text-xs sm:text-sm text-[#7E6B5B] max-w-md mx-auto">
            اطلب مباشرة من طاولتك وسيصل طلبك طازجاً في دقائق معدودة
          </p>

          {/* Quick Search */}
          <div className="max-w-md mx-auto pt-2">
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن مشروبك أو حلاك المفضل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-[#E5D9C5] text-xs font-semibold text-[#3C2A21] placeholder-[#7E6B5B]/60 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#3C2A21]"
              />
              <Search className="w-4 h-4 text-[#7E6B5B] absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </section>

      {/* Floating Active Order Notification Bar */}
      {latestOrder && (
        <div className="max-w-5xl mx-auto px-4 w-full mt-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E5D9C5] shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3C2A21] text-[#C89D7C] flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-[#3C2A21]">
                    طلبك الحالي {latestOrder.orderNumber}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-[11px] text-[#7E6B5B]">
                  طاولة #{latestOrder.tableNumber} • يمكنك تتبع مسار التحضير بالضغط هنا
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/order/${latestOrder.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3C2A21] hover:bg-[#2B1E16] text-[#FAF6F0] text-xs font-bold transition shadow-xs"
              >
                <span>تتبع الطلب</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C89D7C]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs (hide if searching) */}
      {!searchQuery.trim() && (
        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={(id) => setActiveCategoryId(id)}
        />
      )}

      {/* Products Grid */}
      <main className="max-w-5xl mx-auto px-4 py-4 flex-1 w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-[#3C2A21] text-lg flex items-center gap-2">
            <span>
              {searchQuery.trim()
                ? `نتائج البحث عن "${searchQuery}"`
                : currentCategory?.name || 'القائمة'}
            </span>
            <span className="text-xs font-normal text-[#7E6B5B]">
              ({displayedProducts.length} أصناف)
            </span>
          </h3>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E5D9C5] text-[#7E6B5B] space-y-3">
            <Coffee className="w-12 h-12 mx-auto text-[#C89D7C] opacity-50" />
            <h4 className="font-bold text-[#3C2A21]">لم يتم العثور على أصناف</h4>
            <p className="text-xs">جرب البحث بكلمة أخرى أو تصفح الأقسام الأخرى</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Product Customization Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        tableNumber={tableNumber}
        onUpdateTableNumber={(num) => setTableNumber(num)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* My Orders Modal */}
      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
        orders={myOrders}
        onClearHistory={handleClearHistory}
      />

      {/* Table Change Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-[#E5D9C5] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFE8DE] flex items-center justify-center mx-auto text-[#3C2A21]">
              <UtensilsCrossed className="w-6 h-6 text-[#C89D7C]" />
            </div>
            <div className="text-center">
              <h4 className="font-extrabold text-[#3C2A21] text-base">
                تحديد رقم الطاولة
              </h4>
              <p className="text-xs text-[#7E6B5B] mt-1">
                أدخل رقم طاولتك الحالي لتسجيل الطلب
              </p>
            </div>
            <input
              type="number"
              min="1"
              max="99"
              value={tempTableInput}
              onChange={(e) => setTempTableInput(e.target.value)}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E5D9C5] text-center font-black text-xl text-[#3C2A21] focus:ring-2 focus:ring-[#3C2A21] focus:outline-hidden"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#EFE8DE] text-[#3C2A21] text-xs font-bold hover:bg-[#E5D9C5] transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveTable}
                className="flex-1 py-2.5 rounded-xl bg-[#3C2A21] text-[#FAF6F0] text-xs font-bold hover:bg-[#2B1E16] transition"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-[#E5D9C5] text-center text-xs text-[#7E6B5B] bg-[#FAF6F0]">
        <p>كافيه النخبة © {new Date().getFullYear()} — نظام الطلب الذكي عبر الـ QR</p>
      </footer>
    </div>
  )
}
