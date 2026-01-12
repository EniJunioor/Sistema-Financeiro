'use client';

import { useState } from 'react';
import { Save, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUpdateAccount, useDisconnectAccount, useSyncAccount } from '@/hooks/use-accounts';
import type { Account } from '@/types/transaction';

interface AccountSettingsProps {
  account: Account;
}

export function AccountSettings({ account }: AccountSettingsProps) {
  const [accountName, setAccountName] = useState(account.name);
  const [isActive, setIsActive] = useState(account.isActive);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const updateMutation = useUpdateAccount();
  const disconnectMutation = useDisconnectAccount();
  const syncMutation = useSyncAccount();

  const hasChanges = accountName !== account.name || isActive !== account.isActive;

  const handleSave = () => {
    updateMutation.mutate({
      accountId: account.id,
      data: {
        name: accountName,
        isActive: isActive,
      }
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(account.id);
    setShowDisconnectDialog(false);
  };

  const handleForceSync = () => {
    syncMutation.mutate({
      accountId: account.id,
      data: {
        forceFullSync: true,
      }
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Básicas</CardTitle>
          <CardDescription>
            Personalize as configurações da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Nome da Conta</Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Digite um nome personalizado"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronização Automática</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que a conta seja sincronizada automaticamente
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {hasChanges && (
            <div className="flex items-center justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setAccountName(account.name);
                  setIsActive(account.isActive);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>
            Detalhes técnicos e status da conexão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Provedor</Label>
              <p className="text-sm text-muted-foreground">{account.provider}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Tipo</Label>
              <p className="text-sm text-muted-foreground">{account.type}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Moeda</Label>
              <p className="text-sm text-muted-foreground">{account.currency || 'BRL'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant={account.isActive ? 'default' : 'secondary'}>
                {account.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Última Sincronização</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(account.lastSyncAt)}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Conta Criada</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(account.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sincronização</CardTitle>
          <CardDescription>
            Gerencie a sincronização de transações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sincronização Completa</p>
              <p className="text-sm text-muted-foreground">
                Força uma nova sincronização de todas as transações
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleForceSync}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar Agora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam permanentemente esta conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Desconectar Conta</p>
              <p className="text-sm text-muted-foreground">
                Remove a conexão com o banco. As transações já importadas serão mantidas.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDisconnectDialog(true)}
              disabled={disconnectMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              Desconectar Conta
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desconectar a conta "{account.name}"?
              <br /><br />
              <strong>Esta ação irá:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Interromper a sincronização automática</li>
                <li>Revogar o acesso aos dados bancários</li>
                <li>Manter as transações já importadas</li>
              </ul>
              <br />
              Você pode reconectar a conta a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desconectar Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}