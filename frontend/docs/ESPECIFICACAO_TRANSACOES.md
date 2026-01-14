# Especificação Completa - Aba de Transações

## Visão Geral
A aba de Transações é dividida em 4 subseções principais que permitem ao usuário gerenciar e visualizar todas as suas movimentações financeiras de forma organizada e específica.

---

## 📊 **1. Dashboard de Transações** (`/transactions/dashboard`)

### Propósito
Página de visão geral com estatísticas, gráficos e análises rápidas sobre todas as transações.

### Elementos Principais:

#### 1.1. Cabeçalho
- **Título:** "Dashboard de Transações"
- **Subtítulo:** "Visão geral das suas movimentações financeiras"
- **Botão "Nova Transação"** (canto superior direito)
- **Botão "Exportar"** (PDF/CSV)

#### 1.2. Cards de Resumo (Topo da página)
**4 Cards principais:**

1. **Total de Transações**
   - Número total de transações
   - Comparação com período anterior (±%)
   - Ícone: List

2. **Saldo Geral**
   - Receitas totais - Despesas totais
   - Comparação com período anterior
   - Ícone: DollarSign
   - Cor: Verde (positivo) / Vermelho (negativo)

3. **Receitas Totais**
   - Soma de todas as receitas no período
   - Comparação com período anterior
   - Ícone: TrendingUp
   - Cor: Verde

4. **Despesas Totais**
   - Soma de todas as despesas no período
   - Comparação com período anterior
   - Ícone: TrendingDown
   - Cor: Vermelho

#### 1.3. Seletor de Período
- Dropdown com opções:
  - Hoje
  - Últimos 7 dias
  - Últimos 30 dias
  - Últimos 90 dias
  - Mês atual
  - Ano atual
  - Período personalizado

#### 1.4. Gráficos e Visualizações

**a) Gráfico de Linha - Evolução Temporal**
- Linha de Receitas (verde)
- Linha de Despesas (vermelho)
- Linha de Saldo Líquido (azul)
- Eixo X: Períodos (dias/semanas/meses)
- Eixo Y: Valores em R$
- Tooltip com valores detalhados

**b) Gráfico de Pizza - Distribuição por Categoria**
- Fatiamento por categorias de despesas
- Mostra top 8 categorias
- Percentuais e valores
- Legenda com cores

**c) Gráfico de Barras - Comparação Mensal**
- Receitas vs Despesas por mês
- Barras lado a lado para comparação
- Diferença destacada

**d) Gráfico de Barras - Top 10 Contas**
- Movimentação por conta bancária
- Ordenado por volume total

#### 1.5. Lista de Transações Recentes
- Últimas 10 transações
- Formato resumido (semelhante ao dashboard principal)
- Link "Ver todas" para página completa
- Filtro rápido por tipo (Todas/Receitas/Despesas/Transferências)

#### 1.6. Métricas de Tendências
**Cards secundários:**
- **Média Diária:** Receitas e despesas médias por dia
- **Maior Receita:** Valor e data da maior receita
- **Maior Despesa:** Valor e data da maior despesa
- **Transações Pendentes:** Contador de transações não confirmadas

#### 1.7. Filtros Rápidos
- Por tipo (Receita/Despesa/Transferência)
- Por categoria (dropdown)
- Por conta (dropdown)
- Por status (Todas/Confirmadas/Pendentes)
- Por valor (faixa mínima/máxima)

---

## 💰 **2. Receitas** (`/transactions/income`)

### Propósito
Página focada exclusivamente em transações de receita (entrada de dinheiro).

### Elementos Principais:

#### 2.1. Cabeçalho
- **Título:** "Receitas"
- **Subtítulo:** "Gestão de todas as suas entradas financeiras"
- **Botão "Nova Receita"** (destacado, cor verde)

#### 2.2. Cards de Resumo
**3 Cards principais:**

1. **Total de Receitas (Período)**
   - Soma total formatada em R$
   - Comparação com período anterior
   - Percentual de crescimento

2. **Média Mensal**
   - Média de receitas por mês
   - Comparação com média histórica

3. **Quantidade de Transações**
   - Número de receitas no período
   - Comparação com período anterior

#### 2.3. Seletor de Período
- Mesmas opções do Dashboard
- Padrão: Mês atual

#### 2.4. Filtros Específicos
- **Por fonte de receita:**
  - Salário
  - Freelance
  - Investimentos
  - Aluguéis
  - Outros
- **Por conta:** Dropdown de contas
- **Por categoria:** Apenas categorias de receita
- **Por valor:** Faixa mínima/máxima
- **Por data:** Período específico
- **Busca por descrição**

#### 2.5. Lista de Receitas
**Tabela com colunas:**
- ✅ **Checkbox** (para ações em massa)
- 📅 **Data** (formatada: dd/mm/yyyy)
- 📝 **Descrição**
- 🏷️ **Categoria** (badge colorido)
- 💳 **Conta** (nome da conta)
- 💰 **Valor** (verde, formato: +R$ X.XXX,XX)
- 📊 **Status** (Confirmada/Pendente/Recorrente)
- ⚙️ **Ações** (Editar/Excluir/Ver detalhes)

**Características:**
- Ordenação por colunas (clique no cabeçalho)
- Paginação (20/50/100 por página)
- Highlight em linhas pendentes
- Badge para receitas recorrentes

#### 2.6. Ações em Massa
Quando selecionadas múltiplas receitas:
- **Categorizar:** Atribuir categoria a várias
- **Exportar:** Baixar selecionadas em CSV
- **Marcar como:** Confirmadas/Pendentes
- **Excluir:** Remover múltiplas

#### 2.7. Estatísticas Laterais (Sidebar ou Seção)
**Painel de Insights:**
- **Maior receita do mês:** Valor e data
- **Fonte mais frequente:** Gráfico de pizza
- **Receitas recorrentes:** Lista e próximas datas
- **Previsão do mês:** Baseado em histórico
- **Média diária:** Receitas/dia útil

#### 2.8. Gráficos Específicos
**a) Gráfico de Linha - Evolução de Receitas**
- Tendência ao longo do tempo
- Comparação com meses anteriores

**b) Gráfico de Pizza - Receitas por Categoria**
- Distribuição percentual
- Top categorias

**c) Gráfico de Barras - Receitas por Conta**
- Qual conta recebe mais
- Comparação entre contas

#### 2.9. Receitas Recorrentes
**Seção especial:**
- Lista de receitas configuradas como recorrentes
- Próxima data prevista
- Valor esperado
- Ações: Editar/Desativar/Pular próxima

---

## 💸 **3. Despesas** (`/transactions/expenses`)

### Propósito
Página focada exclusivamente em transações de despesa (saída de dinheiro).

### Elementos Principais:

#### 3.1. Cabeçalho
- **Título:** "Despesas"
- **Subtítulo:** "Controle total dos seus gastos"
- **Botão "Nova Despesa"** (destacado, cor vermelha)

#### 3.2. Cards de Resumo
**3 Cards principais:**

1. **Total de Despesas (Período)**
   - Soma total formatada em R$
   - Comparação com período anterior
   - Percentual de aumento/redução

2. **Média Diária**
   - Gasto médio por dia
   - Comparação com média histórica
   - Projeção mensal

3. **Quantidade de Transações**
   - Número de despesas no período
   - Comparação com período anterior

#### 3.3. Alertas e Limites
**Cards de alerta (se configurado):**
- **Orçamento Mensal:** Progresso (X% utilizado)
- **Limite Diário:** Se ultrapassado, alerta vermelho
- **Categoria com Maior Gasto:** Nome e valor
- **Alerta de Padrão:** Se há gastos acima do normal

#### 3.4. Seletor de Período
- Mesmas opções do Dashboard
- Padrão: Mês atual

#### 3.5. Filtros Específicos
- **Por categoria:** Todas as categorias de despesa
- **Por conta:** Dropdown de contas
- **Por valor:** Faixa mínima/máxima
- **Por data:** Período específico
- **Por status:** Todas/Pendentes/Confirmadas
- **Por tag:** Se houver sistema de tags
- **Busca por descrição ou estabelecimento**

#### 3.6. Lista de Despesas
**Tabela com colunas:**
- ✅ **Checkbox** (para ações em massa)
- 📅 **Data** (formatada: dd/mm/yyyy)
- 📝 **Descrição/Estabelecimento**
- 🏷️ **Categoria** (badge colorido)
- 💳 **Conta** (nome da conta)
- 💰 **Valor** (vermelho, formato: -R$ X.XXX,XX)
- 📍 **Localização** (se disponível, ícone de mapa)
- 📊 **Status** (Confirmada/Pendente/Recorrente)
- ⚙️ **Ações** (Editar/Excluir/Ver detalhes)

**Características:**
- Ordenação por colunas
- Paginação
- Destaque para despesas acima da média
- Badge para despesas recorrentes
- Ícone especial para despesas duplicadas (se houver detecção)

#### 3.7. Ações em Massa
- **Categorizar:** Atribuir categoria a várias
- **Exportar:** Baixar selecionadas em CSV
- **Marcar como:** Confirmadas/Pendentes
- **Marcar como Duplicatas:** Identificar duplicações
- **Excluir:** Remover múltiplas

#### 3.8. Estatísticas Laterais (Sidebar ou Seção)
**Painel de Insights:**
- **Maior despesa do mês:** Valor e descrição
- **Categoria com maior gasto:** Nome, valor e %
- **Dia da semana com mais gastos:** Gráfico de barras
- **Despesas recorrentes:** Lista e próximas datas
- **Economia potencial:** Baseado em padrões

#### 3.9. Gráficos Específicos
**a) Gráfico de Linha - Evolução de Despesas**
- Tendência ao longo do tempo
- Comparação com meses anteriores
- Linha de média histórica

**b) Gráfico de Pizza - Despesas por Categoria**
- Distribuição percentual
- Top categorias com maiores valores
- Cores diferenciadas

**c) Gráfico de Barras - Despesas por Dia da Semana**
- Identificar padrões de consumo
- Dias com mais/menos gastos

**d) Gráfico de Heatmap - Calendário de Gastos**
- Visualização mensal
- Intensidade de cor = valor gasto
- Clicável para ver detalhes do dia

#### 3.10. Despesas Recorrentes
**Seção especial:**
- Lista de despesas configuradas como recorrentes
- Próxima data prevista
- Valor esperado
- Ações: Editar/Desativar/Pular próxima

#### 3.11. Alertas de Orçamento
**Seções de alerta:**
- Categorias próximas do limite
- Categorias que ultrapassaram o orçamento
- Sugestões de economia baseadas em padrões

---

## 🔄 **4. Transferências** (`/transactions/transfers`)

### Propósito
Página focada exclusivamente em transferências entre contas (não são receitas nem despesas, apenas movimentação de saldo).

### Elementos Principais:

#### 4.1. Cabeçalho
- **Título:** "Transferências"
- **Subtítulo:** "Movimentações entre suas contas"
- **Botão "Nova Transferência"** (destacado, cor azul)

#### 4.2. Cards de Resumo
**3 Cards principais:**

1. **Total Transferido (Período)**
   - Soma total de transferências
   - Comparação com período anterior

2. **Saldo entre Contas**
   - Mostra se há mais entradas ou saídas
   - Indicador de fluxo líquido

3. **Quantidade de Transferências**
   - Número de transferências no período
   - Comparação com período anterior

#### 4.3. Seletor de Período
- Mesmas opções do Dashboard
- Padrão: Mês atual

#### 4.4. Filtros Específicos
- **Por conta de origem:** Dropdown
- **Por conta de destino:** Dropdown
- **Por valor:** Faixa mínima/máxima
- **Por data:** Período específico
- **Por status:** Todas/Pendentes/Confirmadas/Falhadas
- **Busca por descrição ou referência**

#### 4.5. Lista de Transferências
**Tabela com colunas:**
- ✅ **Checkbox** (para ações em massa)
- 📅 **Data** (formatada: dd/mm/yyyy)
- 📝 **Descrição/Referência**
- 🔄 **Origem → Destino** (mostra ambas as contas)
  - Ex: "Conta Corrente → Poupança"
- 💰 **Valor** (azul, formato: R$ X.XXX,XX)
- ⏱️ **Taxa** (se houver, destacada)
- 📊 **Status** (Confirmada/Pendente/Falhada/Processando)
- ⚙️ **Ações** (Editar/Excluir/Ver detalhes/Reprocessar)

**Características:**
- Cores diferentes por status:
  - Verde: Confirmada
  - Amarelo: Pendente
  - Vermelho: Falhada
  - Azul: Processando
- Ordenação por colunas
- Paginação
- Destaque para transferências falhadas

#### 4.6. Ações em Massa
- **Exportar:** Baixar selecionadas em CSV
- **Marcar como:** Confirmadas/Pendentes
- **Reprocessar:** Tentar novamente transferências falhadas
- **Excluir:** Remover múltiplas

#### 4.7. Visualização de Fluxo
**Diagrama de Fluxo (se houver muitas contas):**
- Mostra visualmente o fluxo entre contas
- Setas indicando direção
- Espessura da seta = volume
- Clicável para filtrar por conta

#### 4.8. Estatísticas Laterais (Sidebar ou Seção)
**Painel de Insights:**
- **Conta que mais recebe:** Nome e valor
- **Conta que mais envia:** Nome e valor
- **Transferências recorrentes:** Lista e próximas datas
- **Taxas totais:** Soma de taxas pagas no período
- **Taxa média:** Taxa média por transferência

#### 4.9. Gráficos Específicos
**a) Gráfico de Sankey - Fluxo entre Contas**
- Visualização de fluxo
- Mostra origem → destino
- Espessura = valor

**b) Gráfico de Barras - Transferências por Conta**
- Mostra volume de entrada/saída por conta
- Barras agrupadas (entrada vs saída)

**c) Gráfico de Linha - Evolução Temporal**
- Tendência ao longo do tempo
- Volume de transferências

#### 4.10. Transferências Recorrentes
**Seção especial:**
- Lista de transferências configuradas como recorrentes
- Próxima data prevista
- Valor esperado
- Contas envolvidas
- Ações: Editar/Desativar/Pular próxima

#### 4.11. Transferências Falhadas
**Seção de alerta:**
- Lista de transferências que falharam
- Motivo da falha (se disponível)
- Botão "Tentar novamente"
- Opção de cancelar

---

## 🔧 **Funcionalidades Comuns em Todas as Páginas**

### 1. Formulário de Nova Transação
**Modal/Dialog com campos:**
- **Tipo:** Receita/Despesa/Transferência (se aplicável)
- **Valor:** Campo numérico formatado
- **Descrição:** Campo de texto
- **Categoria:** Dropdown com busca
- **Conta(s):** 
  - 1 conta para receita/despesa
  - 2 contas (origem/destino) para transferência
- **Data:** Date picker
- **Tags:** Multi-select ou campo de texto
- **Localização:** Campo opcional
- **Anexos:** Upload de arquivos (notas fiscais, etc)
- **Status:** Confirmada/Pendente
- **Recorrente:** Checkbox com configurações (frequência, data final)

### 2. Visualização de Detalhes
**Modal/Dialog com:**
- Todas as informações da transação
- Histórico de edições (se houver auditoria)
- Anexos (se houver)
- Mapa (se houver localização)
- Opções de editar/excluir

### 3. Exportação
- **CSV:** Todos os dados visíveis
- **PDF:** Relatório formatado
- **Excel:** Formato .xlsx

### 4. Importação
- **CSV:** Upload de arquivo
- **OFX/QIF:** Formatos bancários
- **Reconciliação:** Comparar importados com existentes

### 5. Busca e Filtros Avançados
- Campo de busca global
- Filtros múltiplos combinados
- Salvar filtros como favoritos
- Filtros rápidos pré-definidos

### 6. Paginação e Ordenação
- Opções de itens por página (10, 20, 50, 100)
- Navegação: Primeira, Anterior, Próxima, Última
- Ordenação por qualquer coluna
- Indicador de página atual e total

### 7. Ações em Massa
- Seleção múltipla (checkbox)
- Ações disponíveis dependem do contexto
- Confirmação para ações destrutivas

### 8. Estados da Interface
- **Carregando:** Skeletons ou spinners
- **Vazio:** Mensagem + botão de ação
- **Erro:** Mensagem de erro + botão de retry
- **Sem resultados:** Mensagem + sugestões de filtros

---

## 📱 **Responsividade**

### Desktop (> 1024px)
- Layout em grid com múltiplas colunas
- Sidebar com estatísticas visível
- Tabelas completas com todas as colunas
- Gráficos em tamanho grande

### Tablet (768px - 1024px)
- Layout adaptado (2 colunas principais)
- Tabelas com scroll horizontal
- Sidebar colapsável
- Gráficos redimensionados

### Mobile (< 768px)
- Layout em coluna única
- Cards empilhados
- Tabelas convertidas para cards
- Sidebar como drawer/bottom sheet
- Gráficos em versão mobile-optimized

---

## 🎨 **Design e UX**

### Cores e Ícones
- **Receitas:** Verde (#10b981)
- **Despesas:** Vermelho (#ef4444)
- **Transferências:** Azul (#3b82f6)
- **Pendentes:** Amarelo (#f59e0b)
- **Confirmadas:** Verde claro (#86efac)

### Feedback Visual
- Hover effects em linhas e botões
- Transições suaves
- Loading states visíveis
- Mensagens de sucesso/erro claras
- Confirmações para ações destrutivas

### Acessibilidade
- Navegação por teclado
- Labels descritivos
- Contraste adequado
- Suporte a leitores de tela

---

## 🔄 **Integração com Outras Seções**

### Links e Navegação
- **Dashboard principal:** Link para gráficos detalhados
- **Contas:** Link para transações de uma conta específica
- **Categorias:** Link para transações de uma categoria
- **Relatórios:** Link para relatórios pré-filtrados
- **Metas:** Link para transações relacionadas a metas

### Contexto Compartilhado
- Filtros podem ser salvos e aplicados entre páginas
- Estado de período selecionado compartilhado
- Preferências de visualização salvas no perfil

---

## 📊 **Performance e Otimização**

### Carregamento
- Lazy loading de gráficos
- Paginação server-side
- Cache de filtros e estatísticas
- Debounce em buscas

### Dados
- Requisições otimizadas (apenas dados necessários)
- Agregações no backend
- Compressão de respostas
- Cache inteligente

---

## 🧪 **Testes e Validação**

### Validações
- Valores monetários sempre positivos
- Datas não futuras (configurável)
- Contas válidas e ativas
- Categorias apropriadas ao tipo

### Tratamento de Erros
- Mensagens claras e acionáveis
- Retry automático em falhas de rede
- Fallback para dados offline (se aplicável)
- Logs de erros para debugging

---

Esta especificação serve como guia completo para implementação de todas as páginas da seção de Transações, garantindo consistência, usabilidade e funcionalidade completa.