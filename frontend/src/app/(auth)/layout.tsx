import { Suspense } from 'react'

function AuthLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0f172a]">
      {/* Premium gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }} 
        />
      </div>
      
      <div className="max-w-md w-full relative z-10 px-4 sm:px-6 py-12">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 mb-5">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            Plataforma Financeira
          </h1>
          <p className="text-sm text-slate-400">
            Gerencie suas finanças com inteligência e segurança
          </p>
        </div>
        <div className="animate-fade-in-up">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    }>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </Suspense>
  )
}