'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  Eye,
  FileJson,
  Loader2,
  Lock,
  Share2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  useCancelDeletion,
  useDownloadDataExport,
  usePrivacySummary,
  useRecordConsent,
  useRequestDataExport,
  useRequestDeletion,
} from '@/hooks/use-privacy';
import type { ConsentType } from '@/lib/privacy-api';

const CONSENT_LABELS: Record<ConsentType, string> = {
  terms: 'Termos de uso',
  privacy_policy: 'Política de privacidade',
  marketing: 'Comunicações de marketing',
  data_sharing: 'Compartilhamento com parceiros (Open Banking)',
  analytics: 'Análise de uso e detecção de fraude',
};

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PrivacySettingsPage() {
  const { data: summary, isLoading } = usePrivacySummary();

  const recordConsent = useRecordConsent();
  const requestExport = useRequestDataExport();
  const downloadExport = useDownloadDataExport();
  const requestDeletion = useRequestDeletion();
  const cancelDeletion = useCancelDeletion();

  const [showDeletionForm, setShowDeletionForm] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  const handleDeletionRequest = async () => {
    await requestDeletion.mutateAsync(deletionReason.trim() || undefined);
    setShowDeletionForm(false);
    setDeletionReason('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Carregando configurações de privacidade...</span>
      </div>
    );
  }

  const consents = summary?.consents ?? [];
  const exports = summary?.exports ?? [];
  const pendingDeletion = summary?.pendingDeletion ?? null;
  const latestCompletedExport = exports.find((item) => item.status === 'completed');

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Privacidade' },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Lock className="h-8 w-8 mr-3 text-blue-600" />
          Privacidade e Dados
        </h1>
        <p className="text-gray-600 mt-2">
          Seus direitos como titular de dados, conforme a LGPD (Lei 13.709/2018)
        </p>
      </div>

      {/* Exclusão pendente: precisa aparecer antes de tudo */}
      {pendingDeletion && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Exclusão de conta agendada</p>
                <p className="text-sm text-red-700 mt-1">
                  Seus dados serão eliminados em {formatDate(pendingDeletion.scheduledFor)}. Essa
                  ação é irreversível, mas você pode cancelar até lá.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="flex-shrink-0 border-red-300 text-red-700 hover:bg-red-100"
              disabled={cancelDeletion.isPending}
              onClick={() => cancelDeletion.mutate()}
            >
              Cancelar exclusão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Consentimentos */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Consentimentos</CardTitle>
          </div>
          <CardDescription>
            Cada decisão é registrada com data e versão do documento. Consentimentos opcionais
            podem ser revogados a qualquer momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consents.map((consent) => (
            <div
              key={consent.type}
              className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium text-gray-900">{CONSENT_LABELS[consent.type]}</h3>
                  {!consent.revocable && (
                    <Badge variant="outline" className="text-xs bg-gray-100">
                      Obrigatório
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{consent.purpose}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {consent.updatedAt
                    ? `Atualizado em ${formatDate(consent.updatedAt)}${
                        consent.version ? ` • versão ${consent.version}` : ''
                      }`
                    : 'Nunca respondido'}
                </p>
              </div>
              <Switch
                checked={consent.granted}
                disabled={!consent.revocable || recordConsent.isPending}
                onCheckedChange={(granted) =>
                  recordConsent.mutate({ type: consent.type, granted })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Exportação de dados */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileJson className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              Acesso e Portabilidade
            </CardTitle>
          </div>
          <CardDescription>
            Baixe tudo o que a plataforma armazena sobre você em formato legível por máquina
            (LGPD, art. 18, II e V).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              disabled={requestExport.isPending}
              onClick={() => requestExport.mutate()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {requestExport.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileJson className="h-4 w-4 mr-2" />
                  Gerar nova exportação
                </>
              )}
            </Button>

            {latestCompletedExport && (
              <Button
                variant="outline"
                disabled={downloadExport.isPending}
                onClick={() => downloadExport.mutate(latestCompletedExport.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar a mais recente
              </Button>
            )}
          </div>

          {exports.length > 0 && (
            <div className="space-y-2">
              {exports.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Solicitada em {formatDate(item.requestedAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(item.sizeBytes)}
                      {item.expiresAt && item.status === 'completed'
                        ? ` • disponível até ${formatDate(item.expiresAt)}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={
                        item.status === 'completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : item.status === 'failed'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-50 text-gray-700'
                      }
                    >
                      {item.status}
                    </Badge>
                    {item.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Baixar exportação"
                        disabled={downloadExport.isPending}
                        onClick={() => downloadExport.mutate(item.id)}
                      >
                        <Download className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eliminação */}
      {!pendingDeletion && (
        <Card className="border border-red-200">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg font-semibold text-gray-900">
                Eliminar minha conta
              </CardTitle>
            </div>
            <CardDescription>
              Remove permanentemente seus dados pessoais e financeiros (LGPD, art. 18, VI). A
              exclusão só é executada após um período de carência, e pode ser cancelada até lá.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showDeletionForm ? (
              <>
                <Textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Motivo (opcional)"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    disabled={requestDeletion.isPending}
                    onClick={handleDeletionRequest}
                  >
                    {requestDeletion.isPending ? 'Agendando...' : 'Confirmar exclusão'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeletionForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setShowDeletionForm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Solicitar exclusão da conta
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Direitos do titular */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              Seus direitos como titular
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
            <li>Confirmação da existência de tratamento e acesso aos dados (art. 18, I e II)</li>
            <li>Correção de dados incompletos ou desatualizados (art. 18, III)</li>
            <li>Portabilidade em formato legível por máquina (art. 18, V)</li>
            <li>Eliminação dos dados tratados com base no consentimento (art. 18, VI)</li>
            <li>Revogação do consentimento a qualquer momento (art. 8º, §5º)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
