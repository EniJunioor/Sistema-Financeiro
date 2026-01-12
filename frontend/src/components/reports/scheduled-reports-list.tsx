'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Calendar,
  Clock,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  FileText,
  Users
} from 'lucide-react';
import { useReports } from '@/hooks/use-reports';
import { ReportScheduler } from './report-scheduler';
import type { ScheduledReport } from '@/types/report';
import { toast } from 'sonner';

export function ScheduledReportsList() {
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [deletingReport, setDeletingReport] = useState<ScheduledReport | null>(null);
  
  const {
    scheduledReports,
    scheduledLoading,
    toggleScheduledReport,
    deleteScheduledReport,
    isUpdating,
    isDeleting
  } = useReports();

  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      await toggleScheduledReport(report.id, !report.isActive);
    } catch (error) {
      toast.error('Erro ao alterar status do relatório');
    }
  };

  const handleDelete = async () => {
    if (!deletingReport) return;
    
    try {
      await deleteScheduledReport(deletingReport.id);
      setDeletingReport(null);
    } catch (error) {
      toast.error('Erro ao excluir relatório agendado');
    }
  };

  const getNextExecutionText = (nextExecution: string) => {
    const date = new Date(nextExecution);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays < 7) return `Em ${diffDays} dias`;
    
    return date.toLocaleDateString();
  };

  const getCronDescription = (cronExpression: string) => {
    // Simple cron description - in a real app, use a cron parser library
    const descriptions: Record<string, string> = {
      '0 9 * * *': 'Diário às 9h',
      '0 9 * * 1': 'Semanal (Segunda às 9h)',
      '0 9 1 * *': 'Mensal (Dia 1 às 9h)',
      '0 9 1 1,4,7,10 *': 'Trimestral',
      '0 9 1 1 *': 'Anual (1º de Janeiro)',
    };
    
    return descriptions[cronExpression] || 'Personalizado';
  };

  if (scheduledLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Agendados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scheduledReports?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Agendados</CardTitle>
          <CardDescription>
            Você ainda não tem relatórios agendados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum relatório agendado</h3>
            <p className="text-muted-foreground mb-4">
              Agende relatórios para receber automaticamente por email
            </p>
            <Button onClick={() => setEditingReport({} as ScheduledReport)}>
              Agendar Primeiro Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {scheduledReports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">{report.scheduleName}</CardTitle>
                  <CardDescription>
                    {report.reportConfig.type} • {report.reportConfig.format.toUpperCase()}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={report.isActive}
                  onCheckedChange={() => handleToggleActive(report)}
                  disabled={isUpdating}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingReport(report)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeletingReport(report)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Frequência</div>
                  <div className="text-sm text-muted-foreground">
                    {getCronDescription(report.cronExpression)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Próxima Execução</div>
                  <div className="text-sm text-muted-foreground">
                    {getNextExecutionText(report.nextExecution)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Destinatários</div>
                  <div className="text-sm text-muted-foreground">
                    {report.emailRecipients.length} email(s)
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {report.isActive ? (
                    <Play className="h-4 w-4 text-green-500" />
                  ) : (
                    <Pause className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">Status</div>
                  <Badge variant={report.isActive ? 'default' : 'secondary'}>
                    {report.isActive ? 'Ativo' : 'Pausado'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {report.reportConfig.description && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  {report.reportConfig.description}
                </p>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Criado em {new Date(report.createdAt).toLocaleDateString()}
              </div>
              {report.lastExecution && (
                <div>
                  Última execução: {new Date(report.lastExecution).toLocaleDateString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Modal */}
      {editingReport && (
        <ReportScheduler
          config={editingReport.reportConfig}
          existingSchedule={editingReport}
          onScheduled={() => {
            setEditingReport(null);
            toast.success('Relatório agendado atualizado!');
          }}
          onClose={() => setEditingReport(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingReport} onOpenChange={() => setDeletingReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatório Agendado</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o relatório "{deletingReport?.scheduleName}"?
              Esta ação não pode ser desfeita e o relatório não será mais gerado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}