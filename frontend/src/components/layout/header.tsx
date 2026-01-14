"use client"

import React, { useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Search, 
  Menu, 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  Target, 
  FileText, 
  PieChart,
  Home,
  BarChart,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  Briefcase,
  Building2,
  LineChart,
  Calendar,
  Settings,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  onMenuClick?: () => void
}

interface PageConfig {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}

// Mapeamento completo de todas as páginas
const pageConfigs: Record<string, PageConfig> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Visão geral das suas finanças',
    icon: Home
  },
  '/transactions': {
    title: 'Transações',
    subtitle: 'Gestão de todas as suas movimentações',
    icon: CreditCard
  },
  '/transactions/dashboard': {
    title: 'Dashboard de Transações',
    subtitle: 'Visão geral das suas movimentações financeiras',
    icon: BarChart
  },
  '/transactions/income': {
    title: 'Receitas',
    subtitle: 'Gestão de todas as suas entradas financeiras',
    icon: ArrowUpCircle
  },
  '/transactions/expenses': {
    title: 'Despesas',
    subtitle: 'Controle total dos seus gastos',
    icon: ArrowDownCircle
  },
  '/transactions/transfers': {
    title: 'Transferências',
    subtitle: 'Movimentações entre suas contas',
    icon: ArrowLeftRight
  },
  '/accounts': {
    title: 'Contas',
    subtitle: 'Gerencie todas as suas contas bancárias',
    icon: Wallet
  },
  '/investments': {
    title: 'Investimentos',
    subtitle: 'Acompanhe e gerencie sua carteira de investimentos',
    icon: PieChart
  },
  '/investments/portfolio': {
    title: 'Carteira',
    subtitle: 'Visão completa da sua carteira de investimentos',
    icon: Briefcase
  },
  '/investments/funds': {
    title: 'Fundos',
    subtitle: 'Gestão dos seus fundos de investimento',
    icon: Building2
  },
  '/investments/stocks': {
    title: 'Ações',
    subtitle: 'Acompanhe suas ações e ações em carteira',
    icon: LineChart
  },
  '/goals': {
    title: 'Metas',
    subtitle: 'Defina e acompanhe suas metas financeiras',
    icon: Target
  },
  '/reports': {
    title: 'Relatórios',
    subtitle: 'Gere, agende e compartilhe relatórios financeiros',
    icon: FileText
  },
  '/reports/monthly': {
    title: 'Relatório Mensal',
    subtitle: 'Análise detalhada do mês',
    icon: Calendar
  },
  '/reports/annual': {
    title: 'Relatório Anual',
    subtitle: 'Análise detalhada do ano',
    icon: Calendar
  },
  '/reports/custom': {
    title: 'Relatório Personalizado',
    subtitle: 'Crie relatórios sob medida',
    icon: Settings
  },
  '/settings/notifications': {
    title: 'Notificações',
    subtitle: 'Configure suas preferências de notificação',
    icon: Bell
  }
}

function IconWrapper({ Icon, className }: { Icon: React.ComponentType<{ className?: string }>, className?: string }) {
  return (
    <div className={cn(
      "w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-md flex items-center justify-center flex-shrink-0",
      className
    )}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  )
}

export function Header({ title, subtitle, icon, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Auto-detectar página baseada no pathname
  const pageConfig = useMemo(() => {
    // Tenta encontrar correspondência exata primeiro
    if (pageConfigs[pathname]) {
      return pageConfigs[pathname]
    }
    
    // Se não encontrar, tenta encontrar correspondência parcial
    // (para rotas dinâmicas como /accounts/[id])
    const matchedPath = Object.keys(pageConfigs).find(path => {
      if (pathname.startsWith(path + '/')) {
        return true
      }
      return false
    })
    
    if (matchedPath) {
      return pageConfigs[matchedPath]
    }
    
    return null
  }, [pathname])

  // Determinar o que exibir (props têm prioridade sobre auto-detecção)
  const displayTitle = title || pageConfig?.title || ''
  const displaySubtitle = subtitle || pageConfig?.subtitle || ''
  const displayIcon = icon || (pageConfig?.icon ? <IconWrapper Icon={pageConfig.icon} /> : null)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Lado esquerdo: Menu mobile e Título */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden flex-shrink-0" 
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {(displayTitle || displayIcon) && (
              <div className="flex items-center gap-3 min-w-0">
                {displayIcon && (
                  <div className="flex-shrink-0">
                    {displayIcon}
                  </div>
                )}
                <div className="min-w-0">
                  {displayTitle && (
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 truncate">
                      {displayTitle}
                    </h1>
                  )}
                  {displaySubtitle && (
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5 truncate hidden sm:block">
                      {displaySubtitle}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Lado direito: Busca, Notificações e Avatar */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Busca - ocultar em mobile muito pequeno */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm w-48 md:w-64 transition-all duration-200"
              />
            </div>
            
            {/* Notificações */}
            <NotificationCenter />
            
            {/* Avatar */}
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
              <span className="text-xs md:text-sm font-medium text-white">EJ</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
