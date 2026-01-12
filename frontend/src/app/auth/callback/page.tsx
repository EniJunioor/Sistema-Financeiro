'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const authCode = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      // Send error to parent window
      window.opener?.postMessage({
        type: 'OAUTH_ERROR',
        error: errorDescription || error
      }, window.location.origin);
    } else if (authCode) {
      // Send success to parent window
      window.opener?.postMessage({
        type: 'OAUTH_SUCCESS',
        authCode,
        state
      }, window.location.origin);
    }

    // Close the popup window
    window.close();
  }, [searchParams]);

  const error = searchParams.get('error');
  const authCode = searchParams.get('code');

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
                  <p className="text-sm text-muted-foreground">
                    {searchParams.get('error_description') || error}
                  </p>
                </div>
              </>
            ) : authCode ? (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <h2 className="text-lg font-semibold">Autenticação Concluída</h2>
                  <p className="text-sm text-muted-foreground">
                    Redirecionando...
                  </p>
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