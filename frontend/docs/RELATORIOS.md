# 📊 Sistema de Relatórios

Documentação completa do sistema de relatórios financeiros da Plataforma Financeira.

## 📋 Visão Geral

O sistema de relatórios permite gerar, agendar e compartilhar relatórios financeiros personalizados em múltiplos formatos (PDF, Excel, CSV).

## 🎯 Funcionalidades

### Tipos de Relatórios

#### 1. Relatórios Mensais (`/reports/monthly`)
- Análise financeira mensal detalhada
- Seleção de mês e ano específicos
- Cards de resumo com receitas, despesas e saldo líquido
- Lista de relatórios gerados com download funcional
- Integração completa com backend

**Componente:** `MonthlyReportDialog`

**Funcionalidades:**
- Seleção de mês e ano
- Escolha de formato (PDF, Excel, CSV)
- Opções de inclusão:
  - Gráficos e visualizações
  - Lista de transações
  - Previsões de IA

#### 2. Relatórios Anuais (`/reports/annual`)
- Visão completa do ano com breakdown mensal
- Análise de tendências anuais
- Comparação ano a ano
- Cards de resumo com métricas anuais

**Componente:** `AnnualReportDialog`

**Funcionalidades:**
- Seleção de ano
- Escolha de formato (PDF, Excel, CSV)
- Opções de inclusão:
  - Gráficos e visualizações
  - Breakdown mensal
  - Lista de transações
  - Previsões de IA

#### 3. Relatórios Personalizados (`/reports/custom`)
- Período totalmente customizado
- Título personalizado
- Seleção de datas inicial e final
- Validação de período

**Componente:** `CustomReportDialog`

**Funcionalidades:**
- Título personalizado
- Seleção de período com calendário
- Validação (data final >= data inicial)
- Escolha de formato (PDF, Excel, CSV)
- Opções de inclusão:
  - Gráficos e visualizações
  - Lista de transações
  - Previsões de IA

## 🎨 Design e UX

### Cores e Ícones

- **Mensal:** Verde (emerald) com ícone Calendar
- **Anual:** Azul com ícone BarChart3
- **Personalizado:** Roxo com ícone FileText

### Cards de Estatísticas

- **Templates:** Verde com ícone FileText
- **Agendados:** Azul com ícone Calendar
- **Este Mês:** Roxo com ícone History
- **Compartilhados:** Laranja com ícone Share2

### Templates

Cada template possui cores específicas por categoria:
- **Financial:** Azul
- **Tax:** Laranja
- **Investment:** Verde
- **Custom:** Roxo

## 🔧 Integração com Backend

### API Endpoints

```typescript
// Gerar relatório
POST /api/v1/reports/generate
Body: {
  type: 'financial_summary',
  format: 'pdf',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  includeCharts: true,
  includeTransactions: false,
  includeAIPredictions: false
}

// Download relatório
POST /api/v1/reports/generate/download
Body: { ... }

// Histórico de relatórios
GET /api/v1/reports/history

// Relatórios agendados
GET /api/v1/reports/scheduled
POST /api/v1/reports/schedule
PUT /api/v1/reports/scheduled/:id
DELETE /api/v1/reports/scheduled/:id
```

### Hook useReports

```typescript
import { useReports } from '@/hooks/use-reports';

const {
  generateReport,
  downloadReport,
  reportHistory,
  scheduledReports,
  isGenerating,
  historyLoading,
} = useReports();

// Gerar relatório
await generateReport.mutateAsync({
  type: 'financial_summary',
  format: 'pdf',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  title: 'Relatório Mensal - Janeiro 2025',
});

// Download relatório
await downloadReport.mutateAsync({
  type: 'financial_summary',
  format: 'pdf',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  title: 'Relatório Mensal - Janeiro 2025',
});
```

## 📁 Estrutura de Arquivos

```
frontend/src/
├── app/(dashboard)/reports/
│   ├── page.tsx                  # Página principal de relatórios
│   ├── monthly/
│   │   └── page.tsx             # Página de relatórios mensais
│   ├── annual/
│   │   └── page.tsx             # Página de relatórios anuais
│   └── custom/
│       └── page.tsx             # Página de relatórios personalizados
│
├── components/reports/
│   ├── monthly-report-dialog.tsx # Modal de relatório mensal
│   ├── annual-report-dialog.tsx  # Modal de relatório anual
│   ├── custom-report-dialog.tsx  # Modal de relatório personalizado
│   ├── report-generator.tsx      # Gerador de relatórios
│   ├── report-history.tsx        # Histórico de relatórios
│   └── scheduled-reports-list.tsx # Lista de agendados
│
├── hooks/
│   └── use-reports.ts            # Hook de relatórios
│
└── lib/
    └── reports-api.ts            # API de relatórios
```

## 🚀 Uso

### Gerar Relatório Mensal

```typescript
import { MonthlyReportDialog } from '@/components/reports/monthly-report-dialog';

function ReportsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { generateReport, isGenerating } = useReports();

  const handleGenerate = async (config) => {
    await generateReport.mutateAsync(config);
    setIsDialogOpen(false);
  };

  return (
    <MonthlyReportDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      onGenerate={handleGenerate}
      isLoading={isGenerating}
    />
  );
}
```

### Filtrar Relatórios por Tipo

```typescript
const { reportHistory } = useReports();

// Filtrar mensais (período <= 35 dias)
const monthlyReports = reportHistory.filter(report => {
  const daysDiff = Math.ceil(
    (new Date(report.config.endDate) - new Date(report.config.startDate)) / 
    (1000 * 60 * 60 * 24)
  );
  return daysDiff <= 35;
});

// Filtrar anuais (período entre 360-370 dias)
const annualReports = reportHistory.filter(report => {
  const daysDiff = Math.ceil(
    (new Date(report.config.endDate) - new Date(report.config.startDate)) / 
    (1000 * 60 * 60 * 24)
  );
  return daysDiff >= 360 && daysDiff <= 370;
});
```

## 📊 Templates Disponíveis

1. **Demonstração do Resultado (DRE)**
   - Categoria: Financial
   - Formatos: PDF, Excel
   - Período padrão: Month

2. **Fluxo de Caixa**
   - Categoria: Financial
   - Formatos: PDF, Excel
   - Período padrão: Year

3. **Balanço Patrimonial**
   - Categoria: Financial
   - Formatos: PDF, Excel
   - Período padrão: Year

4. **Relatório Fiscal**
   - Categoria: Tax
   - Formatos: PDF, Excel
   - Período padrão: Year

5. **Resumo de Investimentos**
   - Categoria: Investment
   - Formatos: PDF, Excel
   - Período padrão: Quarter

6. **Análise de Gastos**
   - Categoria: Financial
   - Formatos: PDF, Excel, CSV
   - Período padrão: Month

## 🔄 Fluxo de Geração

1. Usuário seleciona tipo de relatório (Mensal, Anual, Personalizado)
2. Abre modal com opções de configuração
3. Usuário preenche formulário (período, formato, opções)
4. Validação do formulário (Zod)
5. Envio para backend via API
6. Backend gera relatório
7. Frontend recebe resposta e atualiza histórico
8. Usuário pode baixar o relatório

## 🎯 Melhores Práticas

1. **Cache:** Histórico de relatórios é cacheado por 5 minutos
2. **Loading States:** Sempre mostrar loading durante geração
3. **Error Handling:** Tratar erros e mostrar mensagens amigáveis
4. **Validação:** Validar períodos antes de enviar
5. **Feedback:** Mostrar toast de sucesso/erro após operações

## 📝 Notas Técnicas

- Relatórios são gerados no backend e retornados como Blob
- Download automático após geração
- Histórico sincronizado com backend
- Filtragem automática por tipo de relatório
- Fallback para dados mock quando backend não disponível

## 🔗 Links Relacionados

- [API de Relatórios](../lib/reports-api.ts)
- [Hook useReports](../hooks/use-reports.ts)
- [CHANGELOG](./CHANGELOG.md)
