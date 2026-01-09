import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Plataforma Financeira
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Gestão financeira pessoal e de pequenos negócios
        </p>
        
        <div className="flex justify-center space-x-4 mb-8">
          <Link href="/dashboard">
            <Button size="lg">
              Acessar Dashboard
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Fazer Login
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Backend API</h2>
            <p className="text-gray-600">
              NestJS + TypeScript + Prisma + PostgreSQL
            </p>
            <a 
              href="http://localhost:3001/api/docs" 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Ver documentação da API
            </a>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Frontend Web</h2>
            <p className="text-gray-600">
              Next.js + TypeScript + TailwindCSS
            </p>
            <p className="text-green-600 mt-2">
              ✅ Aplicação funcionando
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}