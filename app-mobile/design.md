# Design do App Financeiro Mobile

## Visão Geral
App de gestão financeira pessoal em React Native/Expo, inspirado no Sistema Financeiro existente. O app opera com dados locais (AsyncStorage) e oferece uma experiência nativa iOS/Android seguindo as Apple Human Interface Guidelines.

---

## Paleta de Cores

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| primary | #1B6B4A (verde financeiro) | #34D399 | Ações principais, destaques |
| background | #F8FAFC | #0F172A | Fundo das telas |
| surface | #FFFFFF | #1E293B | Cards e superfícies elevadas |
| foreground | #0F172A | #F1F5F9 | Texto principal |
| muted | #64748B | #94A3B8 | Texto secundário |
| border | #E2E8F0 | #334155 | Bordas e divisores |
| success | #22C55E | #4ADE80 | Receitas, positivo |
| warning | #F59E0B | #FBBF24 | Alertas |
| error | #EF4444 | #F87171 | Despesas, negativo |
| income | #22C55E | #4ADE80 | Receitas |
| expense | #EF4444 | #F87171 | Despesas |

---

## Telas do App

### 1. Dashboard (Tab Home)
- **Saudação** com nome do usuário e data atual
- **Card de Saldo Total** com valor em destaque (toggle visibilidade)
- **Cards de Resumo**: Receitas do mês (verde), Despesas do mês (vermelho), Saldo líquido
- **Gráfico de Barras** simples: receitas vs despesas dos últimos 6 meses
- **Lista de Transações Recentes** (últimas 5)
- **Card de Metas** com barra de progresso

### 2. Transações (Tab)
- **Header** com filtros: Todas, Receitas, Despesas
- **Barra de busca**
- **Lista de transações** agrupadas por data (FlatList)
- Cada item mostra: ícone da categoria, descrição, valor (verde/vermelho), data
- **FAB (Floating Action Button)** para adicionar nova transação
- **Modal de criação/edição** com campos: tipo, valor, descrição, categoria, data, conta

### 3. Contas (Tab)
- **Card de saldo total** consolidado
- **Lista de contas** com cards: nome, tipo (ícone), saldo, última atualização
- Tipos: Conta Corrente, Poupança, Cartão de Crédito, Investimento
- **Botão para adicionar conta**
- **Modal de criação** com campos: nome, tipo, saldo inicial, moeda

### 4. Investimentos (Tab)
- **Card de patrimônio total** investido
- **Card de rentabilidade** (ganho/perda)
- **Lista de investimentos** com: símbolo, nome, tipo, quantidade, preço médio, valor atual, variação %
- **Botão para adicionar investimento**
- **Modal de criação** com campos: símbolo, nome, tipo, quantidade, preço médio

### 5. Perfil (Tab)
- **Avatar e nome do usuário**
- **Seção Metas Financeiras**: lista de metas com barra de progresso circular
- **Botão para criar meta**
- **Configurações**: tema (claro/escuro), moeda padrão
- **Sobre o app**

---

## Fluxos Principais

### Adicionar Transação
1. Usuário toca no FAB na tela de Transações
2. Modal abre com formulário
3. Seleciona tipo (Receita/Despesa/Transferência)
4. Preenche valor, descrição, categoria, data
5. Toca em "Salvar"
6. Transação aparece na lista e dashboard atualiza

### Adicionar Conta
1. Toca em "+" na tela de Contas
2. Modal com formulário de conta
3. Preenche nome, tipo, saldo inicial
4. Salva e card aparece na lista

### Criar Meta
1. Toca em "Nova Meta" no Perfil
2. Modal com: nome, valor alvo, valor atual, data alvo
3. Salva e meta aparece com barra de progresso

### Adicionar Investimento
1. Toca em "+" na tela de Investimentos
2. Modal com: símbolo, nome, tipo, quantidade, preço médio
3. Salva e investimento aparece na lista

---

## Navegação
- **Tab Bar** com 5 abas: Dashboard, Transações, Contas, Investimentos, Perfil
- Ícones Material: home, swap-horiz, account-balance-wallet, trending-up, person
- Modais para criação/edição (apresentados como bottom sheets)

---

## Armazenamento
- **AsyncStorage** para persistência local de todos os dados
- Estrutura de chaves: `@financeiro:transactions`, `@financeiro:accounts`, `@financeiro:investments`, `@financeiro:goals`, `@financeiro:settings`
- Dados iniciais de exemplo para demonstração
