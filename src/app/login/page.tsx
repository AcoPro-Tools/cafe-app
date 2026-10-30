'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Coffee,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e?: React.FormEvent, customCreds?: { email: string; pass: string }) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    const targetEmail = customCreds ? customCreds.email : email
    const targetPassword = customCreds ? customCreds.pass : password

    if (!targetEmail.trim() || !targetPassword.trim()) {
      setErrorMessage('يرجى ملء البريد الإلكتروني وكلمة المرور')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'فشل تسجيل الدخول')
        setIsLoading(false)
        return
      }

      // Successful login -> Navigate to dashboard
      router.push(redirectPath)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setErrorMessage('تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى')
      setIsLoading(false)
    }
  }

  // Quick Demo Login helper for reviewers
  const handleQuickLogin = (role: 'admin' | 'cashier') => {
    if (role === 'admin') {
      setEmail('admin@cafe.com')
      setPassword('admin123')
      handleSubmit(undefined, { email: 'admin@cafe.com', pass: 'admin123' })
    } else {
      setEmail('cashier@cafe.com')
      setPassword('cashier123')
      handleSubmit(undefined, { email: 'cashier@cafe.com', pass: 'cashier123' })
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#E5D9C5] shadow-xl space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#3C2A21] flex items-center justify-center mx-auto text-[#FAF6F0] shadow-md">
          <Coffee className="w-7 h-7 text-[#C89D7C]" />
        </div>
        <h1 className="text-2xl font-black text-[#3C2A21]">دخول طاقم العمل</h1>
        <p className="text-xs text-[#7E6B5B]">
          لوحة إدارة الطلبات للكاشير والتحكم الكامل للإدارة
        </p>
      </div>

      {/* Portfolio Quick Demo Buttons */}
      <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E5D9C5] space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-[#3C2A21]">
          <Sparkles className="w-4 h-4 text-[#C89D7C]" />
          <span>تجربة سريعة للمراجعين (Quick Demo Login):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickLogin('admin')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#3C2A21] hover:bg-[#2B1E16] text-[#FAF6F0] text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-[#C89D7C]" />
            <span>دخول كـ Admin</span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickLogin('cashier')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#EFE8DE] hover:bg-[#E5D9C5] text-[#3C2A21] text-xs font-bold transition border border-[#E5D9C5] disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 text-[#C89D7C]" />
            <span>دخول كـ Cashier</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#7E6B5B]">
            البريد الإلكتروني
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cafe.com"
              dir="ltr"
              className="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#FAF6F0] border border-[#E5D9C5] text-xs font-semibold text-[#3C2A21] focus:ring-2 focus:ring-[#3C2A21] focus:outline-hidden"
            />
            <Mail className="w-4 h-4 text-[#7E6B5B] absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#7E6B5B]">
            كلمة المرور
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FAF6F0] border border-[#E5D9C5] text-xs font-semibold text-[#3C2A21] focus:ring-2 focus:ring-[#3C2A21] focus:outline-hidden"
            />
            <Lock className="w-4 h-4 text-[#7E6B5B] absolute right-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E6B5B] hover:text-[#3C2A21] transition"
              aria-label="إظهار كلمة المرور"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#3C2A21] hover:bg-[#2B1E16] text-[#FAF6F0] font-black text-sm shadow-md transition flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#C89D7C]" />
              <span>جاري التحقق والدخول...</span>
            </>
          ) : (
            <span>تسجيل الدخول</span>
          )}
        </button>
      </form>

      {/* Return to Menu */}
      <div className="text-center pt-2 border-t border-[#E5D9C5]/60">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7E6B5B] hover:text-[#3C2A21] transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة منيو العملاء</span>
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#E5D9C5] shadow-xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#C89D7C]" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}
