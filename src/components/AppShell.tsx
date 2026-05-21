'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { Home, Calendar, RefreshCw, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/recurring', label: 'Recurring', icon: RefreshCw },
  { href: '/categories', label: 'Categories', icon: Tag },
]

const AUTH_PATHS = ['/login', '/register']

function BottomNav() {
  const pathname = usePathname()

  if (AUTH_PATHS.includes(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800">
      <div className="flex max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1 min-h-[56px] transition-colors',
                active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth = AUTH_PATHS.includes(pathname)

  if (isAuth) {
    return (
      <SessionProvider>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          {children}
        </div>
      </SessionProvider>
    )
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-900 pb-20">
        <main className="max-w-lg mx-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </SessionProvider>
  )
}
