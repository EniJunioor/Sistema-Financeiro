import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function InvestmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Investimentos</h1>
        <p className="text-gray-600 mt-2">
          Acompanhe sua carteira de investimentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carteira de Investimentos</CardTitle>
          <CardDescription>
            Visão geral dos seus investimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Esta página será implementada nas próximas tarefas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}