/**
 * Tipos de consentimento tratados pela plataforma (LGPD, art. 8º).
 *
 * TERMS e PRIVACY_POLICY são obrigatórios para uso do serviço — a base legal
 * é a execução de contrato (art. 7º, V), mas o aceite é registrado mesmo assim
 * para fins de prova. Os demais são consentimentos opcionais e revogáveis a
 * qualquer momento (art. 8º, §5º).
 */
export enum ConsentType {
  TERMS = 'terms',
  PRIVACY_POLICY = 'privacy_policy',
  MARKETING = 'marketing',
  DATA_SHARING = 'data_sharing',
  ANALYTICS = 'analytics',
}

/** Consentimentos que podem ser revogados sem encerrar a conta. */
export const REVOCABLE_CONSENTS: ConsentType[] = [
  ConsentType.MARKETING,
  ConsentType.DATA_SHARING,
  ConsentType.ANALYTICS,
];

/** Finalidade declarada de cada tratamento, exibida ao titular. */
export const CONSENT_PURPOSES: Record<ConsentType, string> = {
  [ConsentType.TERMS]: 'Execução do contrato de prestação do serviço',
  [ConsentType.PRIVACY_POLICY]: 'Ciência das práticas de tratamento de dados pessoais',
  [ConsentType.MARKETING]: 'Envio de comunicações promocionais e novidades do produto',
  [ConsentType.DATA_SHARING]:
    'Compartilhamento de dados financeiros com instituições parceiras de Open Banking',
  [ConsentType.ANALYTICS]:
    'Análise de uso do produto para melhoria de funcionalidades e detecção de fraude',
};
