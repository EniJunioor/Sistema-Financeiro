'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText,
  Download,
  Share2,
  MoreHorizontal,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ReportSharing } from './report-sharing';
import type { GeneratedReport, ReportFilter } from '@/types/report';

// Mock data - in a real app, this would come from the API
const mockReports: GeneratedReport[] = [
  {
    id: '1',
    config: {
      type: 'financial_summary',
      format: 'pdf',
      title: 'Relatório Financeiro Dezembro 2024',
      template: 'dre',
      includeCharts: true,
      includeTransactions: false,
      includeAIPredictions: true,
    },
    metadata: {
      reportId: '1',
      type: 'financial_summary',
      format: 'pdf',
      generatedAt: '2024-01-10T10:30:00Z',
      fileSize: 2048576,
      fileName: 'relatorio_financeiro_dezembro_2024.pdf',
    },
    summary: {
      totalTransactions: 156,
      dateRange: {
        startDate: '2024-12-01',
        endDate: '2024-12-31',
      },
      categoriesIncluded: 8,
      accountsIncluded: 3,
    },
  },
  {
    id: '2',
    config: {
      type: 'cash_flow',
      format: 'excel',
      title: 'Fluxo de Caixa Q4 2024',
      template: 'cash_flow',
      includeCharts: true,
      includeTransactions: true,
      includeAIPredictions: false,
    },
    metadata: {
      reportId: '2',
      type: 'cash_flow',
      format: 'excel',
      generatedAt: '2024-01-08T14:15:00Z',
      fileSize: 1536000,
      fileName: 'fluxo_caixa_q4_2024.xlsx',
    },
    summary: {
      totalTransactions: 423,
      dateRange: {
        startDate: '2024-10-01',
        endDate: '2024-12-31',
      },
      categoriesIncluded: 12,
      accountsIncluded: 5,
    },
  },
  {
    id: '3',
    config: {
      type: 'investment_portfolio',
      format: 'pdf',
      title: 'Carteira de Investimentos 2024',
      template: 'investment_summary',
      includeCharts: true,
      includeTransactions: false,
      includeAIPredictions: true,
    },
    metadata: {
      reportId: '3',
      type: 'investment_portfolio',
      format: 'pdf',
      generatedAt: '2024-01-05T09:00:00Z',
      fileSize: 3072000,
      fileName: 'carteira_investimentos_2024.pdf',
    },
    summary: {
      totalTransactions: 89,
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
      categoriesIncluded: 4,
      accountsIncluded: 2,
    },
  },
];

export function ReportHistory() {
  const [reports] = useState<GeneratedReport[]>(mockReports);
  const [filteredReports, setFilteredReports] = useState<GeneratedReport[]>(mockReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [sharingReport, setSharingReport] = useState<GeneratedReport | null>(null);

  // Filter reports based on search and filters
  const applyFilters = () => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.config.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.metadata.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.config.type === typeFilter);
    }

    if (formatFilter !== 'all') {
      filtered = filtered.filter(report => report.config.format === formatFilter);
    }

    setFilteredReports(filtered);
  };

  // Apply filters when search term or filters change
  useState(() => {
    applyFilters();
  });

  const handleDownload = (report: GeneratedReport) => {
    // In a real app, this would download the file
    console.log('Downloading report:', report.metadata.fileName);
  };

  const handleShare = (report: GeneratedReport) => {
    setSharingReport(report);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      financial_summary: 'Resumo Financeiro',
      cash_flow: 'Fluxo de Caixa',
      income_statement: 'DRE',
      balance_sheet: 'Balanço',
      tax_report: 'Fiscal',
      investment_portfolio: 'Investimentos',
      spending_analysis: 'Análise de Gastos',
      custom: 'Personalizado',
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusIcon = (report: GeneratedReport) => {
    // In a real app, reports could have different statuses
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar relatórios..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  applyFilters();
                }}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={(value) => {
              setTypeFilter(value);
              applyFilters();
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="financial_summary">Resumo Financeiro</SelectItem>
                <SelectItem value="cash_flow">Fluxo de Caixa</SelectItem>
                <SelectItem value="investment_portfolio">Investimentos</SelectItem>
                <SelectItem value="tax_report">Fiscal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={formatFilter} onValueChange={(value) => {
              setFormatFilter(value);
              applyFilters();
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os formatos</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>

            <DateRangePicker
              onSelect={(range) => {
                // In a real app, filter by date range
                console.log('Date range filter:', range);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Relatórios</CardTitle>
          <CardDescription>
            {filteredReports.length} de {reports.length} relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou gere um novo relatório
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Relatório</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      {getStatusIcon(report)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.config.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.metadata.fileName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getTypeLabel(report.config.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {report.config.format.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(report.summary.dateRange.startDate).toLocaleDateString()} -{' '}
                        {new Date(report.summary.dateRange.endDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatFileSize(report.metadata.fileSize)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(report.metadata.generatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(report.metadata.generatedAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(report)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(report)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartilhar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sharing Modal */}
      {sharingReport && (
        <ReportSharing
          report={sharingReport}
          onClose={() => setSharingReport(null)}
        />
      )}
    </div>
  );
}