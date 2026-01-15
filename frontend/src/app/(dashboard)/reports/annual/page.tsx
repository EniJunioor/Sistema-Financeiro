'use client';

import { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, FileText, Download, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnnualReportDialog } from '@/components/reports/annual-report-dialog';
import { useReports } from '@/hooks/use-reports';
import { formatCurrency } from '@/lib/utils';

export default function AnnualReportsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { generateReport, downloadReport, isGenerating } = useReports();

  // Buscar histórico de relatórios do backend
  const { reportHistory, historyLoading } = useReports();
  
  // Filtrar apenas relatórios anuais
  const annualReports = (reportHistory || []).filter((report: any) => {
    if (!report.config?.startDate || !report.config?.endDate) return false;
    const startDate = new Date(report.config.startDate);
    const endDate = new Date(report.config.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 360 && daysDiff <= 370; // Aproximadamente um ano
  }).map((report: any) => {
    const startDate = new Date(report.config.startDate);
    const year = startDate.getFullYear();
    return {
      id: report.id || report.metadata?.reportId,
      year: String(year),
      totalIncome: report.summary?.totalIncome || 0,
      totalExpenses: report.summary?.totalExpenses || 0,
      netIncome: (report.summary?.totalIncome || 0) - (report.summary?.totalExpenses || 0),
      status: 'completed' as const,
      generatedAt: report.metadata?.generatedAt || report.config.startDate,
      fileName: report.metadata?.fileName || `relatorio_anual_${year}.pdf`,
    };
  });

  // Se não houver dados do backend, usar mock data
  const displayReports = annualReports.length > 0 ? annualReports : [
    {
      id: '1',
      year: '2024',
      totalIncome: 145000.00,
      totalExpenses: 102000.00,
      netIncome: 43000.00,
      status: 'completed' as const,
      generatedAt: '2025-01-15T10:30:00Z',
      fileName: 'relatorio_anual_2024.pdf',
    },
    {
      id: '2',
      year: '2023',
      totalIncome: 130000.00,
      totalExpenses: 95000.00,
      netIncome: 35000.00,
      status: 'completed' as const,
      generatedAt: '2024-01-15T10:30:00Z',
      fileName: 'relatorio_anual_2023.pdf',
    },
  ];

  const handleGenerateReport = async (config: any) => {
    try {
      const reportConfig = {
        ...config,
        type: 'financial_summary' as const,
        format: config.format || 'pdf' as const,
        startDate: config.startDate || new Date(parseInt(config.year), 0, 1).toISOString(),
        endDate: config.endDate || new Date(parseInt(config.year), 11, 31).toISOString(),
      };
      
      await generateReport.mutateAsync(reportConfig);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const handleDownload = async (report: typeof annualReports[0]) => {
    try {
      const config = {
        type: 'financial_summary' as const,
        format: 'pdf' as const,
        startDate: new Date(parseInt(report.year), 0, 1).toISOString(),
        endDate: new Date(parseInt(report.year), 11, 31).toISOString(),
        title: `Relatório Anual - ${report.year}`,
      };
      
      await downloadReport.mutateAsync(config);
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Relatórios Anuais</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Análise financeira anual completa
          </p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Calendar className="h-4 w-4" />
          Gerar Relatório Anual
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Ano Atual</CardTitle>
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">2025</div>
            <p className="text-xs text-gray-500 mt-1">
              Período de análise
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Receitas Anuais</CardTitle>
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(145000.00)}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              +11.5% vs ano anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Despesas Anuais</CardTitle>
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(102000.00)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              +7.4% vs ano anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados</CardTitle>
          <CardDescription>Histórico de relatórios anuais</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : displayReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum relatório anual gerado ainda</p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                Gerar Primeiro Relatório
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayReports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Ano {report.year}</h3>
                        <p className="text-sm text-gray-500">
                          Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 ml-13">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Receitas:</span>
                        <span className="text-sm font-medium text-emerald-600">
                          {formatCurrency(report.totalIncome)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Despesas:</span>
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(report.totalExpenses)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Saldo:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(report.netIncome)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={report.status === 'completed' ? 'default' : 'secondary'}
                      className={report.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : ''}
                    >
                      {report.status === 'completed' ? 'Concluído' : 'Pendente'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Baixar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AnnualReportDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onGenerate={handleGenerateReport}
        isLoading={isGenerating}
      />
    </div>
  );
}
