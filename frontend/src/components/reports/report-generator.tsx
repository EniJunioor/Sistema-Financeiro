'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { X, Eye, Download, Calendar, Share2, FileText } from 'lucide-react';
import { useReports } from '@/hooks/use-reports';
import { useTransactions } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { ReportPreview } from './report-preview';
import { ReportScheduler } from './report-scheduler';
import { ReportSharing } from './report-sharing';
import { REPORT_TEMPLATES, type ReportConfig, type ReportFormat, type ReportType } from '@/types/report';
import { toast } from 'sonner';

const reportConfigSchema = z.object({
  type: z.enum(['financial_summary', 'cash_flow', 'income_statement', 'balance_sheet', 'tax_report', 'investment_portfolio', 'spending_analysis', 'custom']),
  format: z.enum(['pdf', 'excel', 'csv']),
  template: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categories: z.array(z.string()).optional(),
  accounts: z.array(z.string()).optional(),
  includeCharts: z.boolean().default(true),
  includeTransactions: z.boolean().default(false),
  includeAIPredictions: z.boolean().default(false),
});

type ReportConfigForm = z.infer<typeof reportConfigSchema>;

interface ReportGeneratorProps {
  onClose: () => void;
  initialTemplate?: string;
}

export function ReportGenerator({ onClose, initialTemplate }: ReportGeneratorProps) {
  const [activeTab, setActiveTab] = useState('config');
  const [showPreview, setShowPreview] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showSharing, setShowSharing] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const { 
    generateReport, 
    downloadReport, 
    previewReport,
    isGenerating 
  } = useReports();
  
  const { categories } = useTransactions();
  const { accounts } = useAccounts();

  const form = useForm<ReportConfigForm>({
    resolver: zodResolver(reportConfigSchema),
    defaultValues: {
      type: 'financial_summary',
      format: 'pdf',
      template: initialTemplate || 'dre',
      title: '',
      description: '',
      includeCharts: true,
      includeTransactions: false,
      includeAIPredictions: false,
      categories: [],
      accounts: [],
    },
  });

  const selectedTemplate = REPORT_TEMPLATES.find(t => t.id === form.watch('template'));
  const watchedType = form.watch('type');
  const watchedFormat = form.watch('format');

  // Update form when template changes
  useEffect(() => {
    if (selectedTemplate) {
      form.setValue('type', selectedTemplate.id as ReportType);
      form.setValue('title', selectedTemplate.name);
      form.setValue('description', selectedTemplate.description);
      
      // Set default format based on template
      if (selectedTemplate.supportedFormats.includes('pdf')) {
        form.setValue('format', 'pdf');
      } else {
        form.setValue('format', selectedTemplate.supportedFormats[0] as ReportFormat);
      }
    }
  }, [selectedTemplate, form]);

  const handlePreview = async () => {
    const config = form.getValues();
    try {
      const preview = await previewReport(config);
      setShowPreview(true);
    } catch (error) {
      toast.error('Erro ao gerar preview do relatório');
    }
  };

  const handleGenerate = async (data: ReportConfigForm) => {
    try {
      const report = await generateReport(data);
      setGeneratedReport(report);
      toast.success('Relatório gerado com sucesso!');
      setActiveTab('result');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    }
  };

  const handleDownload = async () => {
    const config = form.getValues();
    try {
      await downloadReport(config);
    } catch (error) {
      toast.error('Erro ao baixar relatório');
    }
  };

  const handleSchedule = () => {
    setShowScheduler(true);
  };

  const handleShare = () => {
    if (generatedReport) {
      setShowSharing(true);
    } else {
      toast.error('Gere um relatório primeiro para compartilhar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerador de Relatórios</h2>
          <p className="text-muted-foreground">
            Configure e gere relatórios financeiros personalizados
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="preview" disabled={!form.formState.isValid}>
            Preview
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!generatedReport}>
            Resultado
          </TabsTrigger>
          <TabsTrigger value="schedule">Agendar</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Basic Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configuração Básica</CardTitle>
                    <CardDescription>
                      Defina o tipo e formato do relatório
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {REPORT_TEMPLATES.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{template.icon}</span>
                                    <span>{template.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formato</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedTemplate?.supportedFormats.map((format) => (
                                <SelectItem key={format} value={format}>
                                  {format.toUpperCase()}
                                </SelectItem>
                              )) || (
                                <>
                                  <SelectItem value="pdf">PDF</SelectItem>
                                  <SelectItem value="excel">Excel</SelectItem>
                                  <SelectItem value="csv">CSV</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do relatório" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descrição opcional do relatório"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>
                      Defina o período e dados a incluir
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <FormLabel>Período</FormLabel>
                      <DateRangePicker
                        onUpdate={(values) => {
                          if (values?.range?.from) {
                            form.setValue('startDate', values.range.from.toISOString());
                          }
                          if (values?.range?.to) {
                            form.setValue('endDate', values.range.to.toISOString());
                          }
                        }}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categorias</FormLabel>
                          <FormDescription>
                            Deixe vazio para incluir todas
                          </FormDescription>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {categories?.map((category) => (
                              <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={category.id}
                                  checked={field.value?.includes(category.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, category.id]);
                                    } else {
                                      field.onChange(current.filter(id => id !== category.id));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={category.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {category.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accounts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contas</FormLabel>
                          <FormDescription>
                            Deixe vazio para incluir todas
                          </FormDescription>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {accounts?.map((account) => (
                              <div key={account.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={account.id}
                                  checked={field.value?.includes(account.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, account.id]);
                                    } else {
                                      field.onChange(current.filter(id => id !== account.id));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={account.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {account.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Opções do Relatório</CardTitle>
                  <CardDescription>
                    Personalize o conteúdo do relatório
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="includeCharts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Incluir Gráficos</FormLabel>
                            <FormDescription>
                              Adiciona gráficos e visualizações
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeTransactions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Incluir Transações</FormLabel>
                            <FormDescription>
                              Lista detalhada de transações
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeAIPredictions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Previsões IA</FormLabel>
                            <FormDescription>
                              Inclui análises e previsões
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={!form.formState.isValid}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownload}
                    disabled={isGenerating || !form.formState.isValid}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Gerando...' : 'Download Direto'}
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSchedule}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar
                  </Button>
                  <Button type="submit" disabled={isGenerating}>
                    <FileText className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview">
          <ReportPreview config={form.getValues()} />
        </TabsContent>

        <TabsContent value="result">
          {generatedReport && (
            <Card>
              <CardHeader>
                <CardTitle>Relatório Gerado</CardTitle>
                <CardDescription>
                  Seu relatório foi gerado com sucesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Informações do Relatório</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span>{generatedReport.metadata.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Formato:</span>
                        <span>{generatedReport.metadata.format.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tamanho:</span>
                        <span>{(generatedReport.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gerado em:</span>
                        <span>{new Date(generatedReport.metadata.generatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Resumo dos Dados</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transações:</span>
                        <span>{generatedReport.summary.totalTransactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Categorias:</span>
                        <span>{generatedReport.summary.categoriesIncluded}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contas:</span>
                        <span>{generatedReport.summary.accountsIncluded}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Período:</span>
                        <span>
                          {new Date(generatedReport.summary.dateRange.startDate).toLocaleDateString()} - {' '}
                          {new Date(generatedReport.summary.dateRange.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                  
                  <Button variant="outline" onClick={() => setActiveTab('config')}>
                    Gerar Novo Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <ReportScheduler 
            config={form.getValues()} 
            onScheduled={() => {
              toast.success('Relatório agendado com sucesso!');
              onClose();
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showScheduler && (
        <ReportScheduler
          config={form.getValues()}
          onScheduled={() => {
            setShowScheduler(false);
            toast.success('Relatório agendado com sucesso!');
          }}
          onClose={() => setShowScheduler(false)}
        />
      )}

      {showSharing && generatedReport && (
        <ReportSharing
          report={generatedReport}
          onClose={() => setShowSharing(false)}
        />
      )}
    </div>
  );
}