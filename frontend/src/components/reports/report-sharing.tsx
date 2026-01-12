'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Copy,
  Share2,
  Lock,
  Clock,
  Eye,
  Download,
  Link,
  Mail,
  Shield,
  CheckCircle
} from 'lucide-react';
import type { GeneratedReport, ShareConfig } from '@/types/report';
import { toast } from 'sonner';

const shareSchema = z.object({
  expiresIn: z.number().min(1).max(168), // 1 hour to 1 week
  password: z.string().optional(),
  allowDownload: z.boolean().default(true),
  allowPreview: z.boolean().default(true),
});

type ShareForm = z.infer<typeof shareSchema>;

interface ReportSharingProps {
  report: GeneratedReport;
  onClose: () => void;
}

export function ReportSharing({ report, onClose }: ReportSharingProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const form = useForm<ShareForm>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      expiresIn: 24, // 24 hours
      password: '',
      allowDownload: true,
      allowPreview: true,
    },
  });

  const watchedExpiresIn = form.watch('expiresIn');
  const watchedPassword = form.watch('password');

  const getExpirationText = (hours: number) => {
    if (hours < 24) return `${hours} hora(s)`;
    const days = Math.floor(hours / 24);
    return `${days} dia(s)`;
  };

  const generateShareUrl = async (data: ShareForm) => {
    setIsSharing(true);
    
    try {
      // In a real app, this would call the API
      // const response = await reportsApi.shareReport({
      //   reportId: report.id,
      //   expiresIn: data.expiresIn,
      //   password: data.password,
      //   allowDownload: data.allowDownload,
      // });
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockShareId = Math.random().toString(36).substring(7);
      const mockUrl = `${window.location.origin}/shared/reports/${mockShareId}`;
      
      setShareUrl(mockUrl);
      setIsShared(true);
      toast.success('Link de compartilhamento gerado!');
    } catch (error) {
      toast.error('Erro ao gerar link de compartilhamento');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Relatório: ${report.config.title}`);
    const body = encodeURIComponent(
      `Olá,\n\nCompartilho com você o relatório "${report.config.title}".\n\nAcesse através do link: ${shareUrl}\n\n${watchedPassword ? `Senha: ${watchedPassword}\n\n` : ''}Este link expira em ${getExpirationText(watchedExpiresIn)}.\n\nAtenciosamente`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Relatório
          </DialogTitle>
          <DialogDescription>
            Gere um link seguro para compartilhar este relatório
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{report.config.title}</CardTitle>
              <CardDescription>
                {report.metadata.type} • {report.metadata.format.toUpperCase()} • {' '}
                {(report.metadata.fileSize / 1024 / 1024).toFixed(1)} MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span>
                    {new Date(report.summary.dateRange.startDate).toLocaleDateString()} - {' '}
                    {new Date(report.summary.dateRange.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transações:</span>
                  <span>{report.summary.totalTransactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gerado em:</span>
                  <span>{new Date(report.metadata.generatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categorias:</span>
                  <span>{report.summary.categoriesIncluded}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isShared ? (
            /* Share Configuration */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(generateShareUrl)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Configurações de Segurança
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="expiresIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiração do Link</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 hora</SelectItem>
                              <SelectItem value="6">6 horas</SelectItem>
                              <SelectItem value="24">1 dia</SelectItem>
                              <SelectItem value="72">3 dias</SelectItem>
                              <SelectItem value="168">1 semana</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            O link será válido por {getExpirationText(watchedExpiresIn)}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha (Opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Deixe vazio para não usar senha"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Adicione uma senha para maior segurança
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Permissões</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="allowPreview"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Permitir Visualização
                            </FormLabel>
                            <FormDescription>
                              Usuários podem visualizar o relatório online
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allowDownload"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              Permitir Download
                            </FormLabel>
                            <FormDescription>
                              Usuários podem baixar o arquivo do relatório
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSharing}>
                    {isSharing ? 'Gerando Link...' : 'Gerar Link de Compartilhamento'}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            /* Share Result */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Link Gerado com Sucesso!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={shareUrl} 
                      readOnly 
                      className="border-0 bg-transparent"
                    />
                    <Button size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Expira em {getExpirationText(watchedExpiresIn)}</span>
                    </div>
                    {watchedPassword && (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span>Protegido por senha</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>Visualização {form.getValues('allowPreview') ? 'permitida' : 'bloqueada'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span>Download {form.getValues('allowDownload') ? 'permitido' : 'bloqueado'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compartilhar</CardTitle>
                  <CardDescription>
                    Escolha como compartilhar o link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button onClick={shareViaEmail} variant="outline" className="flex-1">
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar por Email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setIsShared(false)}>
                  Gerar Novo Link
                </Button>
                <Button onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}