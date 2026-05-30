'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wand2, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home,    label: 'Home',     href: '/dashboard' },
  { icon: Wand2,   label: 'Creation', href: '/dashboard/creation' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col bg-surface border-r border-border transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-3 flex-1 mt-2">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === href
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                isActive
                  ? 'text-accent bg-accent/10'
                  : 'text-muted hover:text-text hover:bg-surface2',
                collapsed && 'justify-center px-2'
              )}
            >
              {/* Active left border */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full" />
              )}
              <Icon size={18} className={isActive ? 'text-accent' : ''} />
              {!collapsed && <span>{label}</span>}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2 py-1 bg-surface2 border border-border text-text text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-muted hover:text-text hover:bg-surface2 text-sm transition-all',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
