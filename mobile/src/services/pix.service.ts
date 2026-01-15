/**
 * Serviço de pagamentos PIX
 */

import { api } from './api';
import { API_ENDPOINTS } from '@/constants/config';
import type { PIXPayment } from '@/types';

export interface GenerateQRCodeData {
  amount: number;
  description?: string;
  recipientKey?: string;
}

export interface PayPIXData {
  qrCode: string;
  amount?: number;
  description?: string;
}

class PIXService {
  async generateQRCode(data: GenerateQRCodeData): Promise<string> {
    try {
      const response = await api.post(API_ENDPOINTS.PIX.GENERATE_QR, data);
      return response.data.qrCode;
    } catch (error) {
      console.error('Error generating PIX QR code:', error);
      throw error;
    }
  }

  async pay(data: PayPIXData): Promise<PIXPayment> {
    try {
      const response = await api.post(API_ENDPOINTS.PIX.PAY, data);
      return response.data;
    } catch (error) {
      console.error('Error processing PIX payment:', error);
      throw error;
    }
  }

  async getPaymentHistory(limit = 50, offset = 0): Promise<PIXPayment[]> {
    try {
      const response = await api.get(API_ENDPOINTS.PIX.HISTORY, {
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching PIX history:', error);
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<PIXPayment> {
    try {
      const response = await api.get(`${API_ENDPOINTS.PIX.HISTORY}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching PIX payment:', error);
      throw error;
    }
  }
}

export const pixService = new PIXService();
