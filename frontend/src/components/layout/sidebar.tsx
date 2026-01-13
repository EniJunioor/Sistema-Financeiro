"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  User, 
  LayoutDashboard, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Target, 
  FileText, 
  ChevronDown,
  ChevronUp,
  LogOut,
  MoreVertical,
  Home,
  PieChart,
  Building2,
  LineChart,
  Briefcase,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  BarChart,
  Calendar,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/auth-api'

interface SidebarChildItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
}

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  children?: SidebarChildItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard'
  },
  {
    id: 'transactions',
    label: 'Transações',
    icon: CreditCard,
    children: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart, href: '/transactions/dashboard' },
      { id: 'income', label: 'Receitas', icon: ArrowUpCircle, href: '/transactions/income' },
      { id: 'expenses', label: 'Despesas', icon: ArrowDownCircle, href: '/transactions/expenses' },
      { id: 'transfers', label: 'Transferências', icon: ArrowLeftRight, href: '/transactions/transfers' }
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
    icon: PieChart,
    children: [
      { id: 'portfolio', label: 'Carteira', icon: Briefcase, href: '/investments/portfolio' },
      { id: 'funds', label: 'Fundos', icon: Building2, href: '/investments/funds' },
      { id: 'stocks', label: 'Ações', icon: LineChart, href: '/investments/stocks' }
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
      { id: 'monthly', label: 'Mensal', icon: Calendar, href: '/reports/monthly' },
      { id: 'annual', label: 'Anual', icon: Calendar, href: '/reports/annual' },
      { id: 'custom', label: 'Personalizado', icon: Settings, href: '/reports/custom' }
    ]
  }
]

interface SidebarItemComponentProps {
  item: SidebarItem
  isExpanded: boolean
  onToggle: () => void
}

function SidebarItemComponent({ 
  item, 
  isExpanded, 
  onToggle
}: SidebarItemComponentProps) {
  const pathname = usePathname()
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.href
  const hasActiveChild = item.children?.some(child => pathname === child.href)

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault()
      e.stopPropagation()
      onToggle()
    }
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle()
  }

  return (
    <div>
      {item.href && !hasChildren ? (
        <Link href={item.href}>
          <div
            className={cn(
              "flex items-center w-full px-4 py-3 text-left transition-all duration-300 cursor-pointer rounded-r-lg relative group",
              isActive && "bg-emerald-50 border-l-4 border-emerald-600 text-emerald-700",
              !isActive && "hover:bg-emerald-100 text-gray-700 hover:text-emerald-700"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-r-full" />
            )}
            <item.icon className={cn(
              "w-5 h-5 mr-3 flex-shrink-0 transition-colors duration-300",
              isActive ? "text-emerald-600" : "text-gray-600 group-hover:text-emerald-600"
            )} />
            <span className={cn(
              "font-medium transition-colors duration-300",
              isActive && "font-semibold"
            )}>
              {item.label}
            </span>
          </div>
        </Link>
      ) : (
        <>
          <div
            onClick={handleClick}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 text-left transition-all duration-300 cursor-pointer rounded-r-lg relative group",
              hasActiveChild && "bg-emerald-50 border-l-4 border-emerald-600 text-emerald-700",
              !hasActiveChild && "hover:bg-emerald-100 text-gray-700 hover:text-emerald-700"
            )}
          >
            {hasActiveChild && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-r-full" />
            )}
            <div className="flex items-center flex-1">
              <item.icon className={cn(
                "w-5 h-5 mr-3 flex-shrink-0 transition-colors duration-300",
                hasActiveChild ? "text-emerald-600" : "text-gray-600 group-hover:text-emerald-600"
              )} />
              <span className={cn(
                "font-medium transition-colors duration-300",
                hasActiveChild && "font-semibold"
              )}>
                {item.label}
              </span>
            </div>
            {hasChildren && (
              <button 
                onClick={handleButtonClick} 
                className="p-1 hover:bg-emerald-200 rounded transition-all duration-300 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronUp className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    hasActiveChild ? "text-emerald-600" : "text-gray-600"
                  )} />
                ) : (
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    hasActiveChild ? "text-emerald-600" : "text-gray-600"
                  )} />
                )}
              </button>
            )}
          </div>
          
          {hasChildren && (
            <div 
              className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="bg-white py-1 relative">
                {/* Linha vertical conectando os sub-itens */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-emerald-200" />
                {item.children?.map((child, index) => {
                  const isChildActive = pathname === child.href
                  const isLast = index === (item.children?.length || 0) - 1
                  const ChildIcon = child.icon
                  
                  return (
                    <Link key={child.id} href={child.href || '#'}>
                      <div
                        className={cn(
                          "relative flex items-center px-4 py-2.5 text-sm transition-all duration-300 rounded-r-lg group ml-4",
                          isChildActive && "bg-emerald-50 border-l-2 border-emerald-600 text-emerald-700 font-medium",
                          !isChildActive && "border-l-2 border-transparent text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300"
                        )}
                      >
                        {isChildActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-r-full" />
                        )}
                        <ChildIcon className={cn(
                          "w-4 h-4 mr-2 flex-shrink-0 transition-colors duration-300",
                          isChildActive ? "text-emerald-600" : "text-gray-600 group-hover:text-emerald-600"
                        )} />
                        <span className="transition-colors duration-300">{child.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SidebarLogo() {
  return (
    <div className="flex items-center px-4 py-4 border-b border-gray-200 bg-white">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-md flex items-center justify-center flex-shrink-0">
        <TrendingUp className="w-6 h-6 text-white" />
      </div>
      <span className="ml-3 font-semibold text-lg bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent">
        FinanceApp
      </span>
    </div>
  )
}

function UserProfile({ onLogout }: { onLogout: () => void }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="p-4 border-t border-gray-200 bg-white relative">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">Enivander Junior</p>
          <p className="text-xs text-gray-500 truncate">enivander@example.com</p>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors duration-200 flex-shrink-0"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      {showMenu && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-fade-in z-10">
          <button
            onClick={() => {
              onLogout()
              setShowMenu(false)
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const router = useRouter()

  // Auto-expand items with active children
  useEffect(() => {
    const activeItems: string[] = []
    sidebarItems.forEach(item => {
      if (item.children?.some(child => pathname === child.href)) {
        activeItems.push(item.id)
      }
    })
    setExpandedItems(prev => {
      const combined = prev.concat(activeItems)
      const merged = Array.from(new Set(combined))
      return merged
    })
  }, [pathname])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
      router.push('/login')
    }
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col h-screen">
      <SidebarLogo />
      
      <nav className="flex-1 mt-2 px-2">
        {sidebarItems.map(item => (
          <SidebarItemComponent 
            key={item.id}
            item={item}
            isExpanded={expandedItems.includes(item.id)}
            onToggle={() => toggleExpanded(item.id)}
          />
        ))}
      </nav>
      
      <UserProfile onLogout={handleLogout} />
    </aside>
  )
}
