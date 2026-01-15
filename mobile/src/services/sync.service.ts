/**
 * Serviço de sincronização offline/online
 */

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { STORAGE_KEYS, APP_CONFIG } from '@/constants/config';
import type { OfflineAction, Transaction } from '@/types';

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  async startAutoSync(onSyncComplete?: () => void) {
    // Sincronizar imediatamente
    await this.syncOfflineQueue();

    // Configurar sincronização periódica
    this.syncInterval = setInterval(async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await this.syncOfflineQueue();
        onSyncComplete?.();
      }
    }, APP_CONFIG.SYNC_INTERVAL);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) {
    try {
      const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      const queue: OfflineAction[] = queueJson ? JSON.parse(queueJson) : [];

      const newAction: OfflineAction = {
        ...action,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        retries: 0,
      };

      queue.push(newAction);

      // Limitar tamanho da fila
      if (queue.length > APP_CONFIG.OFFLINE_QUEUE_LIMIT) {
        queue.shift();
      }

      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }

  async syncOfflineQueue(): Promise<void> {
    if (this.isSyncing) return;

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return;
    }

    this.isSyncing = true;

    try {
      const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (!queueJson) {
        this.isSyncing = false;
        return;
      }

      const queue: OfflineAction[] = JSON.parse(queueJson);
      const failedActions: OfflineAction[] = [];

      for (const action of queue) {
        try {
          await this.executeAction(action);
        } catch (error) {
          console.error(`Error executing action ${action.id}:`, error);
          action.retries++;
          if (action.retries < 3) {
            failedActions.push(action);
          }
        }
      }

      // Salvar apenas ações que falharam (com menos de 3 tentativas)
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(failedActions)
      );
    } catch (error) {
      console.error('Error syncing offline queue:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'create_transaction':
        await api.post('/transactions', action.data);
        break;
      case 'update_transaction':
        await api.patch(`/transactions/${action.data.id}`, action.data);
        break;
      case 'delete_transaction':
        await api.delete(`/transactions/${action.data.id}`);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  }
}

export const syncService = new SyncService();
