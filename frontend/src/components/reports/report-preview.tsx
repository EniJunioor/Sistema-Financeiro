'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  BarChart3, 
  Table, 
  TrendingUp, 
  Clock, 
  HardDrive,
  Eye,
  Download
} from 'lucide-react';
import { useReports } from '@/hooks/use-reports';
import type { ReportConfig, ReportSection } from '@/types/report';

interface ReportPreviewProps {
  config: ReportConfig;
}

export function ReportPreview({ config }: ReportPreviewProps) {
  const [preview, setPreview] = useState<any>(null);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { previewReport } = useReports();

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      try {
        const previewData = await previewReport(config);
        setPreview(previewData);
        setSections(previewData.sections);
      } catch (error) {
        console.error('Error loading preview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [config, previewReport]);

  const toggleSection = (sectionId: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, enabled: !section.enabled }
          : section
      )
    );
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'summary':
        return <FileText className="h-4 w-4" />;
      case 'chart':
        return <BarChart3 className="h-4 w-4" />;
      case 'table':
        return <Table className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSectionDescription = (section: ReportSection) => {
    switch (section.id) {
      case 'summary':
        return 'Resumo executivo com principais métricas financeiras';
      case 'charts':
        return 'Gráficos de tendências, distribuição por categoria e evolução temporal';
      case 'transactions':
        return 'Lista detalhada de todas as transações do período';
      case 'predictions':
        return 'Previsões e insights gerados por inteligência artificial';
      default:
        return 'Seção personalizada do relatório';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando Preview...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview do Relatório
          </CardTitle>
          <CardDescription>
            Visualize como seu relatório será estruturado antes de gerar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{preview?.estimatedPages || 0} páginas</div>
                <div className="text-sm text-muted-foreground">Estimativa</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{preview?.estimatedSize || '0 MB'}</div>
                <div className="text-sm text-muted-foreground">Tamanho estimado</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{preview?.generationTime || '0 segundos'}</div>
                <div className="text-sm text-muted-foreground">Tempo de geração</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Título:</span>
                <span className="font-medium">{config.title || 'Sem título'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="secondary">{config.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formato:</span>
                <Badge variant="outline">{config.format.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template:</span>
                <span>{config.template || 'Personalizado'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Período:</span>
                <span>
                  {config.startDate && config.endDate 
                    ? `${new Date(config.startDate).toLocaleDateString()} - ${new Date(config.endDate).toLocaleDateString()}`
                    : 'Todos os períodos'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categorias:</span>
                <span>{config.categories?.length || 0} selecionadas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contas:</span>
                <span>{config.accounts?.length || 0} selecionadas</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Seções do Relatório</CardTitle>
          <CardDescription>
            Personalize quais seções incluir no seu relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getSectionIcon(section.type)}
                      <span className="font-medium">{section.name}</span>
                    </div>
                    <Badge variant={section.enabled ? 'default' : 'secondary'}>
                      {section.enabled ? 'Incluída' : 'Excluída'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`section-${section.id}`} className="text-sm">
                      Incluir
                    </Label>
                    <Switch
                      id={`section-${section.id}`}
                      checked={section.enabled}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">
                  {getSectionDescription(section)}
                </p>
                
                {section.enabled && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-md">
                    <div className="text-sm">
                      {section.id === 'summary' && (
                        <div className="space-y-1">
                          <div>• Receitas e despesas totais</div>
                          <div>• Saldo líquido do período</div>
                          <div>• Principais categorias de gastos</div>
                          <div>• Comparação com período anterior</div>
                        </div>
                      )}
                      
                      {section.id === 'charts' && (
                        <div className="space-y-1">
                          <div>• Gráfico de evolução temporal</div>
                          <div>• Distribuição por categorias</div>
                          <div>• Comparação receitas vs despesas</div>
                          <div>• Tendências mensais</div>
                        </div>
                      )}
                      
                      {section.id === 'transactions' && (
                        <div className="space-y-1">
                          <div>• Lista completa de transações</div>
                          <div>• Detalhes por categoria</div>
                          <div>• Informações de conta e data</div>
                          <div>• Filtros aplicados</div>
                        </div>
                      )}
                      
                      {section.id === 'predictions' && (
                        <div className="space-y-1">
                          <div>• Previsões de gastos futuros</div>
                          <div>• Análise de padrões</div>
                          <div>• Recomendações personalizadas</div>
                          <div>• Alertas de anomalias</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {sections.filter(s => s.enabled).length} de {sections.length} seções incluídas
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Atualizar Preview
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Gerar com Esta Configuração
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}