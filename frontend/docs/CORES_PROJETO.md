# 🎨 Guia de Cores - Plataforma Financeira

Este documento define a paleta de cores recomendada para o projeto, baseada em princípios de design financeiro que transmitem confiança, profissionalismo e prosperidade.

## 📋 Cores Principais

### 🔵 Azul (Profissionalismo e Segurança)

**Aplicações:**
- Botões principais de ação
- Links e elementos interativos
- Elementos de destaque
- Gradientes para títulos

**Códigos de Cor:**
- **Azul Principal**: `blue-600` / `#2563eb`
- **Azul Escuro**: `blue-700` / `#1d4ed8`
- **Azul Claro**: `blue-50` / `#eff6ff`
- **Azul Médio**: `blue-500` / `#3b82f6`

**Classes Tailwind:**
```css
bg-blue-600, bg-blue-700
text-blue-600, text-blue-700
border-blue-600
from-blue-600 to-blue-700 (gradientes)
hover:bg-blue-700, hover:text-blue-700
```

**Uso:**
- Botão de login/entrar
- Links importantes
- Elementos de confiança e segurança
- Gradientes em títulos

---

### 🟢 Verde/Emerald (Crescimento e Dinheiro)

**Aplicações:**
- Elementos relacionados a dinheiro
- Indicadores de crescimento
- Links de registro/cadastro
- Elementos de sucesso positivo

**Códigos de Cor:**
- **Verde Principal**: `emerald-600` / `#059669`
- **Verde Escuro**: `emerald-700` / `#047857`
- **Verde Claro**: `emerald-50` / `#ecfdf5`

**Classes Tailwind:**
```css
bg-emerald-600, bg-emerald-700
text-emerald-600, text-emerald-700
border-emerald-600
from-emerald-600 (gradientes)
hover:bg-emerald-700, hover:text-emerald-700
```

**Uso:**
- Links de cadastro/registro
- Indicadores financeiros positivos
- Elementos de crescimento
- Mensagens de sucesso

---

### 🟡 Dourado/Amarelo (Riqueza e Prosperidade)

**Aplicações:**
- Elementos de destaque premium
- Animações e elementos decorativos
- Indicadores de valor alto
- Acentos especiais

**Códigos de Cor:**
- **Amarelo**: `yellow-200` / `#fef08a`
- **Amarelo Médio**: `yellow-400` / `#facc15`
- **Amarelo Escuro**: `yellow-600` / `#ca8a04`

**Classes Tailwind:**
```css
bg-yellow-200, bg-yellow-400
text-yellow-600
border-yellow-400
hover:bg-yellow-300
```

**Uso:**
- Elementos de fundo animados
- Acentos decorativos
- Destaques premium
- Elementos de valor

---

### ⚪ Cinza/Branco (Sofisticação e Clareza)

**Aplicações:**
- Fundos principais
- Cards e containers
- Textos secundários
- Bordas e divisores

**Códigos de Cor:**
- **Branco**: `white` / `#ffffff`
- **Cinza Claro**: `gray-50` / `#f9fafb`
- **Cinza Médio**: `gray-200` / `#e5e7eb`
- **Cinza Escuro**: `gray-600` / `#4b5563`
- **Cinza Muito Escuro**: `gray-800` / `#1f2937`

**Classes Tailwind:**
```css
bg-white, bg-gray-50
text-gray-600, text-gray-800
border-gray-200, border-gray-300
bg-white/95 (transparência)
```

**Uso:**
- Fundos de páginas
- Cards e containers
- Textos descritivos
- Bordas sutis
- Elementos de separação

---

## 🎭 Combinações de Cores

### Gradientes Recomendados

1. **Títulos Principais:**
   ```css
   bg-gradient-to-r from-blue-700 via-emerald-600 to-blue-700
   bg-gradient-to-r from-blue-700 to-emerald-600
   ```

2. **Botões de Ação:**
   ```css
   bg-gradient-to-r from-blue-600 to-blue-700
   ```

3. **Fundo de Página:**
   ```css
   bg-gradient-to-br from-blue-50 via-gray-50 to-emerald-50
   ```

---

## 📐 Aplicações por Componente

### Botões

- **Primário (Ação Principal)**: 
  - Gradiente azul (`from-blue-600 to-blue-700`)
  - Texto branco
  - Hover: `from-blue-700 to-blue-800`
  
- **Secundário (Links)**:
  - Texto azul (`text-blue-600`)
  - Hover: `text-blue-700`

- **Sucesso/Registro**:
  - Texto verde (`text-emerald-600`)
  - Hover: `text-emerald-700`

### Cards

- Fundo: `bg-white` ou `bg-white/95` (translúcido)
- Sombra: `shadow-2xl` ou `shadow-lg`
- Borda: `border-gray-200` ou sem borda
- Backdrop blur: `backdrop-blur-sm`

### Textos

- **Títulos Principais**: Gradiente (azul → verde)
- **Subtítulos**: `text-gray-600`
- **Texto Principal**: `text-gray-900`
- **Texto Secundário**: `text-gray-600`

### Links

- **Links Importantes**: `text-blue-600 hover:text-blue-700`
- **Links de Cadastro**: `text-emerald-600 hover:text-emerald-700`
- Transição: `transition-colors`

---

## 🎨 Exemplos de Uso no Código

### Botão Principal
```tsx
<button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
  Entrar
</button>
```

### Card com Transparência
```tsx
<Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
  {/* conteúdo */}
</Card>
```

### Título com Gradiente
```tsx
<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-emerald-600 to-blue-700 bg-clip-text text-transparent">
  Plataforma Financeira
</h1>
```

### Link de Ação
```tsx
<Link href="/register" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors font-medium">
  Não tem uma conta? Cadastre-se
</Link>
```

### Fundo com Gradiente
```tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-emerald-50">
  {/* conteúdo */}
</div>
```

---

## 🎯 Princípios de Design

1. **Consistência**: Use as mesmas cores para elementos semelhantes em todo o projeto
2. **Contraste**: Garanta contraste adequado para acessibilidade (texto legível sobre fundos)
3. **Hierarquia**: Use cores mais vibrantes para elementos importantes
4. **Moderação**: Não exagere no uso de cores - o branco e cinza são seus aliados
5. **Transparência**: Use transparência (`/95`, `/90`) para efeitos modernos e elegantes

---

## 📱 Estados de Interação

### Hover
- Botões: Escurecer gradiente em 1 tom
- Links: Escurecer cor em 1 tom
- Cards: Aumentar sombra (`shadow-lg` → `shadow-xl`)
- Elementos: Aumentar escala (`scale-105` ou `scale-110`)

### Active/Pressed
- Botões: `scale-95` (reduzir ligeiramente)
- Manter cores, apenas ajustar escala

### Disabled
- Opacidade reduzida: `opacity-50`
- Cursor: `cursor-not-allowed`
- Cores mantidas, apenas mais suaves

---

## 🔄 Animações e Transições

### Transições Recomendadas
```css
transition-all duration-200
transition-colors duration-200
```

### Animações de Entrada
- Fade in: `animate-fade-in`
- Fade in up: `animate-fade-in-up`
- Blob (decorativo): `animate-blob`

---

## 📝 Checklist de Uso

Ao criar novos componentes, verifique:

- [ ] Usei as cores da paleta definida?
- [ ] O contraste está adequado para acessibilidade?
- [ ] Há consistência com outros componentes?
- [ ] Os estados de hover/active estão definidos?
- [ ] As transições estão aplicadas?
- [ ] O gradiente está sendo usado corretamente?

---

## 🚀 Referências

- **Azul**: Transmite confiança, segurança e profissionalismo (PayPal, IBM)
- **Verde**: Símbolo de crescimento, dinheiro e prosperidade
- **Dourado/Amarelo**: Associado à riqueza, abundância e sabedoria
- **Cinza/Branco**: Adiciona sofisticação, clareza e modernidade

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0
