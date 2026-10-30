export interface ProductOptionSize {
  label: string
  priceDelta: number
}

export interface ProductOptions {
  sizes?: ProductOptionSize[]
  sugarLevels?: string[]
  milkOptions?: string[]
}

export interface Product {
  id: number
  categoryId: number
  name: string
  description: string | null
  basePrice: number
  imageUrl: string | null
  isAvailable: boolean
  optionsJson: string
}

export interface Category {
  id: number
  name: string
  sortOrder: number
  products: Product[]
}

export interface SelectedOptions {
  size?: string
  sugar?: string
  milk?: string
  [key: string]: string | undefined
}

export interface CartItem {
  id: string // unique item key in cart (e.g. productId + size + sugar + milk)
  productId: number
  name: string
  imageUrl: string | null
  basePrice: number
  unitPrice: number
  quantity: number
  selectedOptions: SelectedOptions
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

export interface OrderItem {
  id: number
  orderId: number
  productId: number
  quantity: number
  selectedOptions: string
  unitPrice: number
  product: Product
}

export interface Order {
  id: number
  orderNumber: string
  tableNumber: number
  status: OrderStatus
  totalPrice: number
  createdAt: string
  items: OrderItem[]
}
