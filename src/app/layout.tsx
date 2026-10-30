import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'كافيه النخبة | قائمة المشروبات والطلبات',
  description: 'اطلب مشروبك المفضل بسهولة من طاولتك عبر قائمة الكافيه الإلكترونية الذكية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#2A1D15] antialiased selection:bg-[#C89D7C] selection:text-white">
        {children}
      </body>
    </html>
  )
}
