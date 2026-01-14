// Hook para buscar dados de marca via Brandfetch API
import { useQuery } from '@tanstack/react-query';
import { fetchBankBrandData, fetchBankLogo, fetchBankColors } from '@/lib/brandfetch-api';

/**
 * Hook para buscar dados completos de marca de um banco
 */
export function useBankBrand(bankName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['brandfetch', 'brand', bankName],
    queryFn: () => fetchBankBrandData(bankName),
    enabled: enabled && !!bankName,
    staleTime: 1000 * 60 * 60 * 24, // Cache por 24 horas
    retry: 1,
  });
}

/**
 * Hook para buscar apenas o logo de um banco
 */
export function useBankLogo(bankName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['brandfetch', 'logo', bankName],
    queryFn: () => fetchBankLogo(bankName),
    enabled: enabled && !!bankName,
    staleTime: 1000 * 60 * 60 * 24, // Cache por 24 horas
    retry: 1,
  });
}

/**
 * Hook para buscar apenas as cores de um banco
 */
export function useBankColors(bankName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['brandfetch', 'colors', bankName],
    queryFn: () => fetchBankColors(bankName),
    enabled: enabled && !!bankName,
    staleTime: 1000 * 60 * 60 * 24, // Cache por 24 horas
    retry: 1,
  });
}
