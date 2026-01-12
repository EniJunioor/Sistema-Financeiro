"use client"

import React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { NotificationProvider } from '@/components/providers/notification-provider'
import { ToastContainer } from '@/components/ui/toast'
import { useNotifications } from '@/hooks/use-notifications'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

function DashboardLayoutContent({ children, title, subtitle }: DashboardLayoutProps) {
  const { toasts, dismissToast, settings } = useNotifications();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        position={settings.position}
      />
    </div>
  )
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <NotificationProvider>
      <DashboardLayoutContent title={title} subtitle={subtitle}>
        {children}
      </DashboardLayoutContent>
    </NotificationProvider>
  )
}