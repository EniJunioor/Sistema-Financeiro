/**
 * Serviço de captura e processamento de recibos com OCR
 */

import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { api } from './api';
import { API_ENDPOINTS, APP_CONFIG } from '@/constants/config';
import type { Receipt, OCRData } from '@/types';

class ReceiptService {
  async requestCameraPermission(): Promise<boolean> {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  async captureReceipt(): Promise<string | null> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      throw new Error('Permissão de câmera negada');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  }

  async pickReceiptFromGallery(): Promise<string | null> {
    const hasPermission = await this.requestMediaLibraryPermission();
    if (!hasPermission) {
      throw new Error('Permissão de galeria negada');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  }

  async processReceipt(imageUri: string): Promise<OCRData> {
    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);

      const response = await api.post(API_ENDPOINTS.TRANSACTIONS.UPLOAD_RECEIPT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.ocrData;
    } catch (error) {
      console.error('Error processing receipt:', error);
      throw error;
    }
  }

  async uploadReceipt(transactionId: string, imageUri: string): Promise<Receipt> {
    const formData = new FormData();
    formData.append('transactionId', transactionId);
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    } as any);

    const response = await api.post(API_ENDPOINTS.TRANSACTIONS.UPLOAD_RECEIPT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  validateReceiptSize(uri: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Em produção, você verificaria o tamanho real do arquivo
      // Por enquanto, assumimos que está OK
      resolve(true);
    });
  }
}

export const receiptService = new ReceiptService();
