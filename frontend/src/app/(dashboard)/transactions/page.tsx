import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
        <p className="text-gray-600 mt-2">
          Gerencie todas as suas movimentações financeiras
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>
            Suas transações mais recentes
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