"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  User, 
  LayoutDashboard, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Target, 
  FileText, 
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  children?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    id: 'transactions',
    label: 'Transações',
    icon: CreditCard,
    children: [
      { id: 'income', label: 'Receitas', icon: TrendingUp, href: '/transactions/income' },
      { id: 'expenses', label: 'Despesas', icon: TrendingUp, href: '/transactions/expenses' },
      { id: 'transfers', label: 'Transferências', icon: TrendingUp, href: '/transactions/transfers' }
    ]
  },
  {
    id: 'accounts',
    label: 'Contas',
    icon: Wallet,
    href: '/accounts'
  },
  {
    id: 'investments',
    label: 'Investimentos',
    icon: TrendingUp,
    children: [
      { id: 'portfolio', label: 'Carteira', icon: TrendingUp, href: '/investments/portfolio' },
      { id: 'stocks', label: 'Ações', icon: TrendingUp, href: '/investments/stocks' },
      { id: 'funds', label: 'Fundos', icon: TrendingUp, href: '/investments/funds' }
    ]
  },
  {
    id: 'goals',
    label: 'Metas',
    icon: Target,
    href: '/goals'
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: FileText,
    children: [
      { id: 'monthly', label: 'Mensal', icon: FileText, href: '/reports/monthly' },
      { id: 'annual', label: 'Anual', icon: FileText, href: '/reports/annual' },
      { id: 'custom', label: 'Personalizado', icon: FileText, href: '/reports/custom' }
    ]
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    children: [
      { id: 'profile', label: 'Perfil', icon: User, href: '/settings/profile' },
      { id: 'security', label: 'Segurança', icon: Settings, href: '/settings/security' },
      { id: 'notifications', label: 'Notificações', icon: Settings, href: '/settings/notifications' }
    ]
  }
]

interface SidebarItemComponentProps {
  item: SidebarItem
  isActive: boolean
  isExpanded: boolean
  onToggle: () => void
  level?: number
}

function SidebarItemComponent({ 
  item, 
  isActive, 
  isExpanded, 
  onToggle, 
  level = 0 
}: SidebarItemComponentProps) {
  const pathname = usePathname()
  const hasChildren = item.children && item.children.length > 0

  const itemContent = (
    <div
      className={cn(
        "flex items-center justify-between w-full px-4 py-3 text-left transition-colors",
        level === 0 ? "text-gray-700" : "text-gray-600 text-sm pl-8",
        isActive && "bg-green-200 text-green-800 border-l-4 border-green-600",
        !isActive && "hover:bg-green-100"
      )}
    >
      <div className="flex items-center">
        <item.icon className="w-5 h-5 mr-3 text-gray-500" />
        <span>{item.label}</span>
      </div>
      {hasChildren && (
        <button onClick={onToggle} className="p-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  )

  return (
    <div>
      {item.href ? (
        <Link href={item.href}>
          {itemContent}
        </Link>
      ) : (
        itemContent
      )}
      
      {hasChildren && isExpanded && (
        <div>
          {item.children?.map((child) => (
            <Link key={child.id} href={child.href || '#'}>
              <div
                className={cn(
                  "flex items-center px-4 py-2 text-sm text-gray-600 transition-colors pl-8",
                  pathname === child.href && "bg-green-100 text-green-700",
                  pathname !== child.href && "hover:bg-green-50"
                )}
              >
                <child.icon className="w-4 h-4 mr-3 text-gray-400" />
                <span>{child.label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function UserProfile() {
  return (
    <div className="flex items-center p-4 border-b border-green-200">
      <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
        <User className="w-6 h-6 text-green-700" />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">Enivander Junior</p>
        <p className="text-xs text-gray-500">enivander@example.com</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['investments'])
  const pathname = usePathname()

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  return (
    <aside className="w-64 bg-green-50 border-r border-green-200 overflow-y-auto">
      <UserProfile />
      <nav className="mt-4">
        {sidebarItems.map(item => (
          <SidebarItemComponent 
            key={item.id}
            item={item}
            isActive={pathname === item.href}
            isExpanded={expandedItems.includes(item.id)}
            onToggle={() => toggleExpanded(item.id)}
          />
        ))}
      </nav>
    </aside>
  )
}