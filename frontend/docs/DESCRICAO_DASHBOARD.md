# Descrição Completa da Tela de Dashboard

## Visão Geral
A tela de Dashboard é a página principal do sistema financeiro, apresentando uma visão consolidada e abrangente das finanças do usuário. A interface é organizada em seções modulares que permitem uma análise rápida e detalhada da situação financeira.

---

## 1. Cabeçalho (Header)

**Localização:** Topo da página

**Elementos:**
- **Título:** "Dashboard" (texto em destaque, tamanho grande)
- **Subtítulo:** "Visão geral das suas finanças"
- **Status de Conexão em Tempo Real (RealtimeStatus):**
  - Indicador visual de conexão (ícone Wi-Fi)
  - Badge mostrando status:
    - "Modo Demo" (quando usando dados de demonstração)
    - "Conectado" (quando há conexão ativa)
    - "Desconectado" (quando não há conexão)
  - Timestamp da última atualização (quando em modo de conexão real)
- **Botão de Atualizar:**
  - Ícone de refresh (RefreshCw)
  - Texto "Atualizar"
  - Animação de spin durante carregamento
  - Permite atualizar manualmente os dados do dashboard

---

## 2. Aviso de Dados de Demonstração

**Localização:** Abaixo do cabeçalho (exibido apenas quando usando dados mock)

**Elementos:**
- Card informativo com fundo azul claro
- Ícone informativo
- Título: "Dados de Demonstração"
- Mensagem explicando que são dados de exemplo e instruções para ver dados reais

---

## 3. Seletor de Período (PeriodSelector)

**Localização:** Primeira linha, lado esquerdo

**Funcionalidades:**
- Seletor dropdown com opções:
  - Últimos 7 dias
  - Últimos 30 dias
  - Últimos 90 dias
  - Último ano
  - Mês atual
  - Ano atual
  - Período personalizado
- Quando "Período personalizado" é selecionado:
  - Campos de data inicial e data final
  - Botão para aplicar o período personalizado
- Botões rápidos para os 4 períodos mais comuns (7d, 30d, 90d, 1y)
- Card com ícone de calendário

---

## 4. Cards de Resumo Financeiro (FinancialSummaryCards)

**Localização:** Primeira linha, lado direito (ao lado do seletor de período)

**4 Cards principais:**

### 4.1. Saldo Total
- **Valor:** Saldo atual em todas as contas
- **Variação:** Percentual de mudança em relação ao período anterior
- **Ícone:** Cifrão (DollarSign)
- **Descrição:** "Saldo atual em todas as contas"

### 4.2. Receitas
- **Valor:** Total de receitas no período selecionado
- **Variação:** Percentual de mudança (positivo = verde, negativo = vermelho)
- **Ícone:** TrendingUp
- **Descrição:** "Total de receitas no período"

### 4.3. Despesas
- **Valor:** Total de despesas no período selecionado
- **Variação:** Percentual de mudança (invertido - negativo é bom)
- **Ícone:** CreditCard
- **Descrição:** "Total de despesas no período"

### 4.4. Saldo Líquido
- **Valor:** Receitas menos despesas
- **Variação:** Percentual de mudança
- **Ícone:** PiggyBank
- **Descrição:** "Receitas menos despesas"

**Formatação dos cards:**
- Valores em moeda brasileira (BRL)
- Cores para indicar variações (verde para positivo, vermelho para negativo)
- Ícones de tendência (seta para cima/baixo)
- Texto explicando a variação em relação ao período anterior

---

## 5. Gráfico de Visão Geral Financeira (FinancialOverviewChart)

**Localização:** Segunda linha, lado esquerdo

**Tipo:** Gráfico de linha (Line Chart)

**Dados exibidos:**
- **Linha de Receitas:** Valores de receita ao longo do tempo (cor verde)
- **Linha de Despesas:** Valores de despesas ao longo do tempo (cor vermelha)
- **Linha de Saldo Líquido:** Diferença entre receitas e despesas (cor azul)

**Características:**
- Eixo X: Períodos (meses) formatados em português
- Eixo Y: Valores em moeda (BRL)
- Tooltip ao passar o mouse mostrando valores detalhados
- Legenda explicando cada linha
- Título: "Visão Geral Financeira"
- Descrição: "Receitas e despesas ao longo do tempo"

---

## 6. Gráfico de Tendência de Gastos (ExpenseTrendChart)

**Localização:** Segunda linha, lado direito

**Tipo:** Gráfico de barras (Bar Chart)

**Dados exibidos:**
- **Barras de Receitas:** Valores mensais de receita (cor verde)
- **Barras de Despesas:** Valores mensais de despesas (cor vermelha)

**Características:**
- Comparação visual entre receitas e despesas
- Eixo X: Períodos mensais
- Eixo Y: Valores em moeda (BRL)
- Tooltip com valores detalhados
- Legenda
- Título: "Tendência de Gastos"
- Descrição: "Comparação mensal de receitas e despesas"

---

## 7. Gráfico de Gastos por Categoria (CategoryBreakdownChart)

**Localização:** Terceira linha, lado esquerdo

**Tipo:** Gráfico de pizza (Pie Chart)

**Dados exibidos:**
- Distribuição dos gastos por categoria
- Cada fatia representa uma categoria com:
  - Nome da categoria
  - Valor gasto
  - Percentual do total
  - Quantidade de transações
  - Cor identificadora

**Características:**
- Labels com percentuais nas fatias (apenas para fatias > 5%)
- Tooltip detalhado mostrando:
  - Nome da categoria
  - Valor total
  - Percentual
  - Número de transações
- Legenda com cores das categorias
- Lista abaixo do gráfico com as top 5 categorias:
  - Indicador de cor
  - Nome da categoria
  - Valor total
  - Percentual
- Mensagem informando quantas outras categorias existem (se houver mais de 5)
- Título: "Gastos por Categoria"
- Descrição: "Distribuição dos seus gastos por categoria"

---

## 8. Transações Recentes (RecentTransactions)

**Localização:** Terceira linha, meio

**Dados exibidos:**
- Lista das últimas 8 transações

**Para cada transação:**
- **Ícone de tipo:**
  - Receita: Seta para cima/direita (verde)
  - Despesa: Seta para baixo/direita (vermelho)
  - Transferência: Setas duplas (azul)
- **Descrição:** Nome/descrição da transação
- **Data:** Formatada de forma relativa:
  - "Agora mesmo" (menos de 1 hora)
  - "Xh atrás" (menos de 24 horas)
  - "Ontem" (entre 24-48 horas)
  - Data completa formatada (mais de 48 horas)
- **Categoria:** Badge com nome e cor da categoria
- **Conta:** Nome da conta bancária
- **Valor:** 
  - Prefixo "+" para receitas (verde)
  - Prefixo "-" para despesas (vermelho)
  - Sem prefixo para transferências (azul)
  - Formatado em moeda brasileira (BRL)

**Características:**
- Card com título "Transações Recentes"
- Descrição: "Suas últimas movimentações financeiras"
- Botão "Ver todas" no cabeçalho
- Efeito hover nas transações
- Botão "Ver mais X transações" se houver mais de 8
- Estado vazio com mensagem quando não há transações

---

## 9. Progresso de Metas (GoalsProgress)

**Localização:** Terceira linha, lado direito

**Dados exibidos:**
- Lista das 4 metas ativas mais relevantes

**Para cada meta:**
- **Nome da meta:** Título da meta
- **Tipo:** Badge colorido indicando:
  - Economia (verde)
  - Limite de Gastos (vermelho)
  - Investimento (azul)
  - Quitação de Dívida (laranja)
- **Descrição:** Texto explicativo da meta (quando disponível)
- **Progresso percentual:** Valor numérico e barra de progresso
  - Cores da barra variam conforme progresso e tipo:
    - Para limites de gastos: vermelho (≥90%), amarelo (≥75%), verde (<75%)
    - Para economia/investimento: verde (≥75%), azul (≥50%), cinza (<50%)
- **Valores:**
  - Valor atual formatado em moeda
  - Valor alvo formatado em moeda
  - Valor restante formatado em moeda
- **Prazo:**
  - Ícone de calendário
  - Tempo restante formatado:
    - "Vencida"
    - "Hoje"
    - "X dias"
    - "X meses"
- **Mensagens motivacionais baseadas no progresso:**
  - Meta atingida (100%): "Meta atingida! Parabéns!"
  - Quase lá (≥75%): "Quase lá! Você está indo muito bem."
  - Meio do caminho (≥50%): "No meio do caminho. Continue assim!"
  - Início (<50%): "Começando a jornada. Você consegue!"
- **Elementos de gamificação:**
  - Número de badges conquistados
  - Sequência atual (streak) em dias

**Características:**
- Card com título "Metas Financeiras"
- Descrição: "Progresso das suas metas"
- Botão "Nova Meta" no cabeçalho
- Estado vazio com:
  - Ícone de alvo
  - Mensagem "Nenhuma meta ativa"
  - Botão "Criar primeira meta"
- Botão "Ver todas as X metas" se houver mais de 4

---

## 10. Previsões com Inteligência Artificial (AIForecastDashboard)

**Localização:** Quarta seção (parte inferior)

**Dados exibidos:**

### 10.1. Cabeçalho da Seção
- **Título:** "Previsões com Inteligência Artificial"
- **Subtítulo:** "Análises preditivas baseadas em seus padrões financeiros"
- **Ícone:** Cérebro (Brain) em roxo
- **Badge de Confiança:** Percentual de confiança do modelo
- **Botão Atualizar:** Para gerar novas previsões

### 10.2. Controles de Configuração
- **Período de Análise:** Seleção de período histórico (3M, 6M, 1A, 2A)
- **Período de Previsão:** Seleção de meses para previsão (3M, 6M, 9M, 12M)

### 10.3. Gráfico Principal de Previsões (AIForecastChart)
- Visualização combinando:
  - Dados históricos reais
  - Previsões futuras
  - Intervalos de confiança (faixas superior e inferior)
  - Linhas de tendência

### 10.4. Gráficos Secundários
- **Gráfico de Previsões por Categoria (CategoryForecastChart):**
  - Previsões de gastos por categoria
  - Comparação com média histórica
  - Indicadores de tendência (crescendo/decrescendo/estável)
  - Orçamentos recomendados

- **Gráfico de Detecção de Anomalias (AnomalyDetectionChart):**
  - Identificação de padrões incomuns
  - Picos e quedas inesperadas
  - Níveis de severidade (baixa/média/alta)
  - Explicações sobre as anomalias detectadas

### 10.5. Insights da IA
- Card com lista de insights gerados pela IA
- Cada insight é um alerta informativo explicando:
  - Padrões identificados
  - Recomendações financeiras
  - Alertas sobre tendências

### 10.6. Padrões Sazonais
- Card mostrando ajustes sazonais por mês
- Para cada mês:
  - Nome do mês
  - Percentual de ajuste em relação à média
  - Badge indicando nível (Alto/Normal/Baixo)
- Explicação sobre padrões sazonais

### 10.7. Informações do Modelo
- Card no rodapé com:
  - Precisão do modelo (percentual)
  - Confiança geral (percentual)
  - Período de previsão (meses)
  - Data/hora da última atualização

**Estados:**
- Estado de carregamento com skeletons
- Estado de erro com mensagem explicativa
- Requisito mínimo de 6 meses de dados históricos

---

## Responsividade

A interface é totalmente responsiva, adaptando-se a diferentes tamanhos de tela:

- **Desktop (lg):** Layout em grid com múltiplas colunas
- **Tablet (md):** Layout ajustado com 2 colunas
- **Mobile:** Layout em coluna única, todos os elementos empilhados

---

## Estados da Interface

### Carregamento (Loading)
- Skeletons animados nos cards
- Indicadores de progresso
- Mensagens "Carregando..."

### Vazio (Empty)
- Mensagens informativas
- Ícones ilustrativos
- Botões de ação (ex: "Criar primeira meta")

### Erro (Error)
- Cards de alerta com mensagens de erro
- Instruções para resolver problemas
- Avisos sobre API não disponível

### Dados de Demonstração
- Badge "Modo Demo"
- Aviso informativo no topo
- Dados mock para visualização

---

## Interatividade

- **Atualização manual:** Botão de refresh no cabeçalho
- **Filtragem por período:** Seletor de período atualiza todos os dados
- **Navegação:** Links para páginas detalhadas (ex: "Ver todas as transações")
- **Hover effects:** Feedback visual ao passar o mouse
- **Tooltips:** Informações adicionais nos gráficos
- **Expansão:** Alguns componentes permitem ver mais itens

---

## Resumo das Informações Exibidas

1. **Indicadores Financeiros Principais:**
   - Saldo total
   - Total de receitas
   - Total de despesas
   - Saldo líquido
   - Variações percentuais comparativas

2. **Análises Temporais:**
   - Tendências mensais de receitas e despesas
   - Evolução do saldo líquido
   - Comparações período a período

3. **Análises Categoriais:**
   - Distribuição de gastos por categoria
   - Percentuais e valores por categoria
   - Quantidade de transações por categoria

4. **Atividades Recentes:**
   - Últimas transações realizadas
   - Detalhes completos de cada transação
   - Histórico de movimentações

5. **Metas e Objetivos:**
   - Progresso de metas financeiras
   - Valores atuais vs. alvos
   - Prazos e indicadores de progresso
   - Elementos de gamificação

6. **Previsões e Análises Avançadas:**
   - Previsões de receitas e despesas
   - Detecção de anomalias
   - Padrões sazonais
   - Insights gerados por IA
   - Recomendações personalizadas

---

## Observações Técnicas

- Todos os valores monetários são formatados em Real Brasileiro (BRL)
- Datas são formatadas conforme padrão brasileiro (dd/mm/yyyy)
- Percentuais são exibidos com 1 casa decimal
- A interface suporta atualizações em tempo real (quando conectada)
- Os dados podem vir de API real ou dados de demonstração (mock)
- A interface utiliza componentes do sistema de design (shadcn/ui)
- Gráficos são implementados com Recharts
- A interface é totalmente em português brasileiro
