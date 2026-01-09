import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Metas Financeiras</h1>
        <p className="text-gray-600 mt-2">
          Defina e acompanhe suas metas financeiras
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas Metas</CardTitle>
          <CardDescription>
            Progresso das suas metas financeiras
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