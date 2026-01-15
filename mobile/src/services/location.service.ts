/**
 * Serviço de geolocalização para transações
 */

import * as Location from 'expo-location';
import { APP_CONFIG } from '@/constants/config';
import type { Location as TransactionLocation } from '@/types';

class LocationService {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentLocation(): Promise<TransactionLocation | null> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Permissão de localização negada');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Tentar obter endereço reverso
      let address: string | undefined;
      try {
        const [reverseGeocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode) {
          address = [
            reverseGeocode.street,
            reverseGeocode.streetNumber,
            reverseGeocode.district,
            reverseGeocode.city,
            reverseGeocode.region,
          ]
            .filter(Boolean)
            .join(', ');
        }
      } catch (error) {
        console.warn('Error getting reverse geocode:', error);
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  async watchLocation(
    callback: (location: TransactionLocation) => void
  ): Promise<Location.LocationSubscription> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Permissão de localização negada');
    }

    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: Date.now(),
        });
      }
    );
  }
}

export const locationService = new LocationService();
