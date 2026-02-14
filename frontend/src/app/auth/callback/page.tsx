'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setErrorMsg(errorDescription || error);
      return;
    }

    // Backend OAuth flow: redirects with token & refresh in query params
    if (token && refresh) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refresh);
      setStatus('success');
      const redirectTo = (typeof window !== 'undefined' && sessionStorage.getItem('oauth_redirect_url')) || '/dashboard';
      if (typeof window !== 'undefined') sessionStorage.removeItem('oauth_redirect_url');
      setTimeout(() => router.push(redirectTo), 1500);
      return;
    }

    // Fallback: OAuth code flow (popup) - send to opener if exists
    const authCode = searchParams.get('code');
    const state = searchParams.get('state');
    if (authCode && window.opener) {
      window.opener.postMessage({ type: 'OAUTH_SUCCESS', authCode, state }, window.location.origin);
      window.close();
    } else if (error && window.opener) {
      window.opener.postMessage({ type: 'OAUTH_ERROR', error: errorDescription || error }, window.location.origin);
      window.close();
    } else if (!token && !authCode) {
      setStatus('error');
      setErrorMsg('Nenhum token recebido. Tente fazer login novamente.');
    }
  }, [searchParams, router]);

  const error = searchParams.get('error') || errorMsg;
  const hasSuccess = status === 'success' || (searchParams.get('token') && searchParams.get('refresh'));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {error ? (
              <>
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <div>
                  <h2 className="text-lg font-semibold">Erro na Autenticação</h2>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <a href="/login" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
                    Voltar ao login
                  </a>
                </div>
              </>
            ) : hasSuccess ? (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <h2 className="text-lg font-semibold">Autenticação Concluída</h2>
                  <p className="text-sm text-muted-foreground">Redirecionando para o dashboard...</p>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <div>
                  <h2 className="text-lg font-semibold">Processando</h2>
                  <p className="text-sm text-muted-foreground">
                    Aguarde enquanto processamos a autenticação...
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}