'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, History, Share2, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { ReportGenerator } from '@/components/reports/report-generator';
import { ScheduledReportsList } from '@/components/reports/scheduled-reports-list';
import { ReportHistory } from '@/components/reports/report-history';
import { useReports } from '@/hooks/use-reports';
import { REPORT_TEMPLATES } from '@/types/report';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('generate');
  const [showGenerator, setShowGenerator] = useState(false);
  const { templates, scheduledReports, templatesLoading } = useReports();

  const handleCreateReport = () => {
    setShowGenerator(true);
    setActiveTab('generate');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Gere, agende e compartilhe relatórios financeiros personalizados
          </p>
        </div>
        <Button onClick={handleCreateReport} className="gap-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Link href="/reports/monthly">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500 hover:border-l-emerald-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">Mensal</Badge>
              </div>
              <CardTitle className="text-lg mt-4">Relatório Mensal</CardTitle>
              <CardDescription>
                Análise financeira mensal detalhada com receitas, despesas e saldo líquido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Gerar Relatório Mensal
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/annual">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-blue-100 text-blue-800">Anual</Badge>
              </div>
              <CardTitle className="text-lg mt-4">Relatório Anual</CardTitle>
              <CardDescription>
                Visão completa do ano com breakdown mensal e análise de tendências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Gerar Relatório Anual
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/custom">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 hover:border-l-purple-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-purple-100 text-purple-800">Personalizado</Badge>
              </div>
              <CardTitle className="text-lg mt-4">Relatório Personalizado</CardTitle>
              <CardDescription>
                Crie relatórios com período e filtros personalizados conforme sua necessidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Criar Relatório Personalizado
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Templates</CardTitle>
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{REPORT_TEMPLATES.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Modelos disponíveis
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Agendados</CardTitle>
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {scheduledReports?.filter(r => r.isActive).length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Relatórios ativos
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Este Mês</CardTitle>
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <History className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-gray-500 mt-1">
              Relatórios gerados
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Compartilhados</CardTitle>
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Share2 className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <p className="text-xs text-gray-500 mt-1">
              Links ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Gerar Relatório</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {showGenerator ? (
            <ReportGenerator onClose={() => setShowGenerator(false)} />
          ) : (
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {REPORT_TEMPLATES.map((template) => {
                const categoryColors = {
                  financial: 'from-blue-500 to-blue-600',
                  tax: 'from-orange-500 to-orange-600',
                  investment: 'from-emerald-500 to-emerald-600',
                  custom: 'from-purple-500 to-purple-600',
                };
                const categoryBg = {
                  financial: 'bg-blue-100 text-blue-800',
                  tax: 'bg-orange-100 text-orange-800',
                  investment: 'bg-emerald-100 text-emerald-800',
                  custom: 'bg-purple-100 text-purple-800',
                };
                
                return (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-200 hover:border-l-emerald-500"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`h-12 w-12 bg-gradient-to-br ${categoryColors[template.category]} rounded-lg flex items-center justify-center`}>
                          <span className="text-2xl">{template.icon}</span>
                        </div>
                        <Badge className={categoryBg[template.category]}>{template.category}</Badge>
                      </div>
                      <CardTitle className="text-lg mt-4">{template.name}</CardTitle>
                      <CardDescription className="text-sm">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          {template.supportedFormats.map((format) => (
                            <Badge key={format} variant="outline" className="text-xs">
                              {format.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setShowGenerator(true);
                          }}
                        >
                          Usar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <ScheduledReportsList />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ReportHistory />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REPORT_TEMPLATES.map((template) => {
              const categoryColors = {
                financial: 'from-blue-500 to-blue-600',
                tax: 'from-orange-500 to-orange-600',
                investment: 'from-emerald-500 to-emerald-600',
                custom: 'from-purple-500 to-purple-600',
              };
              const categoryBg = {
                financial: 'bg-blue-100 text-blue-800',
                tax: 'bg-orange-100 text-orange-800',
                investment: 'bg-emerald-100 text-emerald-800',
                custom: 'bg-purple-100 text-purple-800',
              };
              
              return (
                <Card 
                  key={template.id}
                  className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-200 hover:border-l-emerald-500"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 bg-gradient-to-br ${categoryColors[template.category]} rounded-lg flex items-center justify-center`}>
                        <span className="text-2xl">{template.icon}</span>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-sm">{template.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Formatos:</span>
                        <div className="flex gap-1">
                          {template.supportedFormats.map((format) => (
                            <Badge key={format} variant="outline" className="text-xs">
                              {format.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Período padrão:</span>
                        <span className="capitalize font-medium">{template.defaultPeriod}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Categoria:</span>
                        <Badge className={categoryBg[template.category]}>{template.category}</Badge>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setShowGenerator(true);
                        }}
                      >
                        Usar Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}