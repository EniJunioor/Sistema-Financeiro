# Sistema de Notificações Frontend

Este documento descreve a implementação do sistema de notificações frontend da Plataforma Financeira.

## Visão Geral

O sistema de notificações fornece uma solução completa para gerenciar notificações em tempo real, incluindo:

- **Notificações Toast**: Notificações temporárias que aparecem na tela
- **Centro de Notificações**: Painel centralizado para visualizar todas as notificações
- **Configurações de Preferências**: Interface para personalizar como receber notificações
- **Notificações Push**: Suporte a notificações do navegador e push notifications
- **Atualizações em Tempo Real**: Integração com WebSocket para notificações instantâneas

## Componentes Principais

### 1. NotificationProvider (`notification-provider.tsx`)

Provedor de contexto React que gerencia todo o estado das notificações:

```typescript
import { NotificationProvider } from '@/components/providers/notification-provider';

function App() {
  return (
    <NotificationProvider>
      {/* Sua aplicação */}
    </NotificationProvider>
  );
}
```

**Funcionalidades:**
- Gerenciamento de estado das notificações
- Integração com WebSocket para atualizações em tempo real
- Cache e sincronização com a API
- Gerenciamento de toast notifications
- Configurações de exibição

### 2. NotificationCenter (`notification-center.tsx`)

Componente de centro de notificações que aparece como um popover:

```typescript
import { NotificationCenter } from '@/components/notifications/notification-center';

function Header() {
  return (
    <div>
      <NotificationCenter />
    </div>
  );
}
```

**Funcionalidades:**
- Lista paginada de notificações
- Filtros por tipo e status
- Ações de marcar como lida/excluir
- Estatísticas de notificações
- Interface responsiva

### 3. Toast Notifications (`toast.tsx`)

Sistema de notificações temporárias:

```typescript
import { ToastContainer } from '@/components/ui/toast';

function Layout() {
  const { toasts, dismissToast, settings } = useNotifications();
  
  return (
    <div>
      {/* Conteúdo */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        position={settings.position}
      />
    </div>
  );
}
```

**Tipos de Toast:**
- `success`: Notificações de sucesso (verde)
- `error`: Notificações de erro (vermelho)
- `warning`: Notificações de aviso (amarelo)
- `info`: Notificações informativas (azul)

### 4. NotificationPreferences (`notification-preferences.tsx`)

Interface completa para configurar preferências de notificação:

```typescript
import { NotificationPreferencesComponent } from '@/components/notifications/notification-preferences';

function SettingsPage() {
  return (
    <div>
      <NotificationPreferencesComponent />
    </div>
  );
}
```

**Configurações Disponíveis:**
- Canais de notificação (email, push, browser, SMS)
- Categorias de notificação
- Horário silencioso
- Configurações de exibição
- Testes de notificação

## Hooks

### useNotifications

Hook principal para interagir com o sistema de notificações:

```typescript
import { useNotifications } from '@/hooks/use-notifications';

function MyComponent() {
  const {
    // Métodos de conveniência
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showWithActions,
    showConfirmation,
    
    // Dados
    notifications,
    unreadCount,
    stats,
    
    // Ações
    markAsRead,
    deleteNotification,
    
    // Push notifications
    requestPermission,
    subscribeToPush,
  } = useNotifications();
  
  const handleSuccess = () => {
    showSuccess('Sucesso!', 'Operação realizada com sucesso.');
  };
  
  const handleConfirmation = () => {
    showConfirmation(
      'Confirmar Ação',
      'Tem certeza que deseja continuar?',
      () => console.log('Confirmado'),
      () => console.log('Cancelado')
    );
  };
  
  return (
    <div>
      <button onClick={handleSuccess}>Mostrar Sucesso</button>
      <button onClick={handleConfirmation}>Mostrar Confirmação</button>
    </div>
  );
}
```

### useBrowserNotifications

Hook específico para notificações do navegador:

```typescript
import { useBrowserNotifications } from '@/hooks/use-notifications';

function NotificationSettings() {
  const {
    checkPermission,
    isSupported,
    requestPermission,
    showBrowserNotification,
  } = useBrowserNotifications();
  
  const handleRequestPermission = async () => {
    if (isSupported()) {
      const granted = await requestPermission();
      if (granted) {
        showBrowserNotification('Permissão Concedida!', {
          body: 'Você receberá notificações do navegador.',
          icon: '/icons/notification-icon.png',
        });
      }
    }
  };
  
  return (
    <button onClick={handleRequestPermission}>
      Ativar Notificações
    </button>
  );
}
```

## API Integration

### NotificationsApi (`notifications-api.ts`)

Cliente para interagir com a API de notificações:

```typescript
import { notificationsApi } from '@/lib/notifications-api';

// Buscar notificações
const notifications = await notificationsApi.getNotifications(1, 20);

// Marcar como lida
await notificationsApi.markAsRead(notificationId);

// Atualizar preferências
await notificationsApi.updatePreferences({
  emailNotifications: true,
  pushNotifications: false,
});

// Subscrever push notifications
await notificationsApi.subscribeToPush(subscription);
```

## WebSocket Integration

O sistema se conecta automaticamente ao WebSocket para receber notificações em tempo real:

```typescript
// Tipos de mensagem WebSocket suportados
interface NotificationWebSocketMessage {
  type: 'notification_created' | 'notification_updated' | 'notification_deleted' | 'notification_read';
  data: Notification;
  timestamp: string;
}
```

**Eventos Suportados:**
- `notification_created`: Nova notificação criada
- `notification_read`: Notificação marcada como lida
- `notification_deleted`: Notificação excluída

## Push Notifications

### Service Worker

O sistema inclui um service worker (`/public/sw.js`) para gerenciar push notifications:

**Funcionalidades:**
- Recebimento de push notifications
- Exibição de notificações nativas
- Handling de cliques em notificações
- Cache offline
- Background sync

### Configuração

Para ativar push notifications:

1. Configure as variáveis de ambiente:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

2. Registre o service worker:
```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## Tipos TypeScript

### Notification

```typescript
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
```

### NotificationPreferences

```typescript
interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  browserNotifications: boolean;
  smsNotifications: boolean;
  categories: {
    transactions: boolean;
    goals: boolean;
    investments: boolean;
    security: boolean;
    marketing: boolean;
    system: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}
```

### ToastNotification

```typescript
interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  duration?: number;
  actionUrl?: string;
  actions?: NotificationAction[];
  persistent?: boolean;
  showProgress?: boolean;
}
```

## Exemplos de Uso

### Notificação Simples

```typescript
const { showSuccess } = useNotifications();

showSuccess(
  'Transação Adicionada',
  'Sua transação foi salva com sucesso.'
);
```

### Notificação com Ações

```typescript
const { showWithActions } = useNotifications();

showWithActions(
  'Duplicata Detectada',
  'Encontramos uma transação similar.',
  [
    {
      label: 'Manter Ambas',
      action: () => handleKeepBoth(),
      variant: 'default',
    },
    {
      label: 'Remover Duplicata',
      action: () => handleRemoveDuplicate(),
      variant: 'destructive',
    },
  ]
);
```

### Notificação de Confirmação

```typescript
const { showConfirmation } = useNotifications();

showConfirmation(
  'Excluir Transação',
  'Esta ação não pode ser desfeita.',
  () => {
    // Confirmar
    deleteTransaction();
    showSuccess('Excluída', 'Transação removida.');
  },
  () => {
    // Cancelar
    showInfo('Cancelado', 'Transação mantida.');
  }
);
```

## Personalização

### Posições de Toast

```typescript
type Position = 
  | 'top-right' 
  | 'top-left' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'top-center' 
  | 'bottom-center';
```

### Configurações de Exibição

```typescript
interface NotificationSettings {
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
  autoHide: boolean;
  autoHideDuration: number;
  position: Position;
  maxVisible: number;
}
```

## Testes

Para testar o sistema de notificações, acesse:
- `/notifications-test` - Página de demonstração
- `/settings/notifications` - Configurações completas

## Requisitos Atendidos

✅ **7.1** - Sistema inteligente de notificações e alertas
- Detecção de anomalias via ML
- Alertas de metas em risco
- Notificações personalizadas

✅ **7.2** - Configurações de preferências
- Controle granular de tipos de notificação
- Múltiplos canais (email, push, browser, SMS)
- Horário silencioso
- Configurações de exibição

✅ **Notificações em tempo real**
- WebSocket integration
- Toast notifications
- Centro de notificações

✅ **Push notifications do navegador**
- Service worker
- Permissões nativas
- Notificações offline

## Próximos Passos

1. **Integração com Backend**: Conectar com a API real de notificações
2. **Testes Automatizados**: Implementar testes unitários e de integração
3. **Analytics**: Adicionar tracking de engajamento com notificações
4. **Otimizações**: Implementar lazy loading e virtual scrolling para listas grandes
5. **Acessibilidade**: Melhorar suporte a screen readers e navegação por teclado