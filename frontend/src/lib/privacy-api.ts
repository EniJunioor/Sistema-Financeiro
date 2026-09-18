import { apiClient } from './api';

export type ConsentType =
  | 'terms'
  | 'privacy_policy'
  | 'marketing'
  | 'data_sharing'
  | 'analytics';

export interface ConsentState {
  type: ConsentType;
  granted: boolean;
  version: string | null;
  purpose: string;
  /** Consentimentos obrigatórios não podem ser revogados isoladamente. */
  revocable: boolean;
  updatedAt: string | null;
}

export interface ConsentRecord {
  id: string;
  type: ConsentType;
  granted: boolean;
  version: string;
  purpose?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface DataExportRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  format: string;
  sizeBytes?: number | null;
  error?: string | null;
  requestedAt: string;
  completedAt?: string | null;
  expiresAt?: string | null;
}

export interface DataDeletionRequest {
  id: string;
  status: 'pending' | 'cancelled' | 'completed' | 'failed';
  reason?: string | null;
  requestedAt: string;
  scheduledFor: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

export interface PrivacySummary {
  consents: ConsentState[];
  exports: DataExportRequest[];
  pendingDeletion: DataDeletionRequest | null;
  rights: Record<string, string>;
}

export class PrivacyAPI {
  static async getSummary(): Promise<PrivacySummary> {
    const response = await apiClient.get<PrivacySummary>('/privacy/me');
    return response.data;
  }

  static async getConsents(): Promise<ConsentState[]> {
    const response = await apiClient.get<ConsentState[]>('/privacy/consents');
    return response.data;
  }

  static async getConsentHistory(type?: ConsentType): Promise<ConsentRecord[]> {
    const query = type ? `?type=${type}` : '';
    const response = await apiClient.get<ConsentRecord[]>(`/privacy/consents/history${query}`);
    return response.data;
  }

  static async recordConsent(type: ConsentType, granted: boolean): Promise<ConsentRecord> {
    const response = await apiClient.post<ConsentRecord>('/privacy/consents', { type, granted });
    return response.data;
  }

  static async requestExport(): Promise<DataExportRequest> {
    const response = await apiClient.post<DataExportRequest>('/privacy/export', {});
    return response.data;
  }

  static async listExports(): Promise<DataExportRequest[]> {
    const response = await apiClient.get<DataExportRequest[]>('/privacy/export');
    return response.data;
  }

  static async downloadExport(requestId: string): Promise<unknown> {
    const response = await apiClient.get(`/privacy/export/${requestId}/download`);
    return response.data;
  }

  static async requestDeletion(reason?: string): Promise<DataDeletionRequest> {
    const response = await apiClient.post<DataDeletionRequest>('/privacy/deletion', { reason });
    return response.data;
  }

  static async listDeletions(): Promise<DataDeletionRequest[]> {
    const response = await apiClient.get<DataDeletionRequest[]>('/privacy/deletion');
    return response.data;
  }

  static async cancelDeletion(): Promise<DataDeletionRequest> {
    const response = await apiClient.delete<DataDeletionRequest>('/privacy/deletion');
    return response.data;
  }
}

export default PrivacyAPI;
