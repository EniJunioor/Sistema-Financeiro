# Mobile App - Plataforma Financeira

## ✅ Status: Implementado

Aplicativo mobile React Native com Expo implementado com todas as funcionalidades principais.

## 🚀 Funcionalidades Implementadas

### ✅ Configuração Base
- ✅ Projeto React Native com Expo configurado
- ✅ TypeScript configurado
- ✅ Navegação com React Navigation
- ✅ Estado global com Zustand
- ✅ React Query para gerenciamento de dados

### ✅ Autenticação
- ✅ Login e registro
- ✅ Autenticação biométrica (Face ID / Touch ID / Fingerprint)
- ✅ 2FA (autenticação de dois fatores)
- ✅ Refresh token automático
- ✅ Armazenamento seguro de tokens

### ✅ Sincronização
- ✅ Sincronização automática com backend
- ✅ Modo offline com fila de ações
- ✅ Detecção de conectividade
- ✅ Retry automático de ações falhas

### ✅ Funcionalidades Mobile Específicas
- ✅ **Captura de Recibos com OCR**: Captura de fotos e processamento OCR
- ✅ **Pagamentos PIX**: Geração de QR Code e pagamentos
- ✅ **Geolocalização**: Localização automática para transações
- ✅ **Widgets Nativos**: Preparado para widgets (requer configuração adicional)

## 📱 Estrutura do Projeto

```
mobile/
├── src/
│   ├── constants/       # Configurações e constantes
│   ├── services/        # Serviços (API, Auth, Sync, etc.)
│   ├── store/          # Zustand stores
│   ├── navigation/     # Configuração de navegação
│   ├── screens/        # Telas da aplicação
│   ├── types/          # Definições TypeScript
│   └── utils/          # Utilitários
├── app.json            # Configuração Expo
├── package.json        # Dependências
└── tsconfig.json       # Configuração TypeScript
```

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm start

# Executar no Android
npm run android

# Executar no iOS
npm run ios
```

## 📋 Serviços Implementados

### AuthService
- Login/Registro
- Autenticação biométrica
- 2FA
- Gerenciamento de tokens

### ReceiptService
- Captura de recibos via câmera
- Seleção de galeria
- Processamento OCR
- Upload de recibos

### PIXService
- Geração de QR Code PIX
- Processamento de pagamentos
- Histórico de pagamentos

### LocationService
- Obtenção de localização atual
- Reverse geocoding (endereço)
- Watch de localização

### SyncService
- Sincronização automática
- Fila offline
- Retry de ações falhas

## 🔐 Segurança

- Tokens armazenados com `expo-secure-store`
- Comunicação HTTPS obrigatória
- Refresh token automático
- Autenticação biométrica

## 📱 Permissões

O app requer as seguintes permissões:
- **Câmera**: Para captura de recibos
- **Localização**: Para geolocalização de transações
- **Biometria**: Para autenticação segura
- **Armazenamento**: Para cache local

## 🚀 Build e Deploy

```bash
# Build Android
npm run build:android

# Build iOS
npm run build:ios
```

## 📝 Notas

- Widgets nativos requerem configuração adicional específica da plataforma
- OCR utiliza endpoint do backend para processamento
- PIX requer integração com provedor de pagamento
- Geolocalização funciona apenas quando permissão é concedida

## 🔄 Próximos Passos

- [ ] Implementar telas completas com dados reais
- [ ] Adicionar gráficos e visualizações
- [ ] Implementar notificações push
- [ ] Adicionar testes automatizados
- [ ] Configurar widgets nativos (iOS/Android)
