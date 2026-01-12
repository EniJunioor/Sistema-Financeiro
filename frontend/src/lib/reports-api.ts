import { api } from './api';

// Report Types
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  supportedFormats: string[];
  defaultPeriod: string;
}

export interface GenerateReportRequest {
  type: 'financial_summary' | 'cash_flow' | 'income_statement' | 'balance_sheet' | 'tax_report' | 'investment_portfolio' | 'spending_analysis' | 'custom';
  format: 'pdf' | 'excel' | 'csv';
  template?: string;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  accounts?: string[];
  includeCharts?: boolean;
  includeTransactions?: boolean;
  includeAIPredictions?: boolean;
  customConfig?: Record<string, any>;
  title?: string;
  description?: string;
}

export interface ScheduleReportRequest extends GenerateReportRequest {
  cronExpression: string;
  emailRecipients: string[];
  scheduleName?: string;
  isActive?: boolean;
}

export interface ReportResponse {
  fileUrl?: string;
  fileData?: string;
  metadata: {
    reportId: string;
    type: string;
    format: string;
    generatedAt: string;
    fileSize: number;
    fileName: string;
  };
  summary: {
    totalTransactions: number;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    categoriesIncluded: number;
    accountsIncluded: number;
  };
}

export interface ScheduledReport {
  id: string;
  userId: string;
  reportConfig: GenerateReportRequest;
  cronExpression: string;
  emailRecipients: string[];
  scheduleName: string;
  isActive: boolean;
  nextExecution: string;
  lastExecution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareReportRequest {
  reportId: string;
  expiresIn?: number; // hours
  password?: string;
  allowDownload?: boolean;
}

export interface ShareReportResponse {
  shareUrl: string;
  expiresAt: string;
  shareId: string;
}

// API Functions
export const reportsApi = {
  // Report Templates
  async getTemplates(): Promise<{ templates: ReportTemplate[] }> {
    const response = await api.get<{ templates: ReportTemplate[] }>('/reports/templates');
    return response.data;
  },

  // Report Generation
  async generateReport(request: GenerateReportRequest): Promise<ReportResponse> {
    const response = await api.post<ReportResponse>('/reports/generate', request);
    return response.data;
  },

  async downloadReport(request: GenerateReportRequest): Promise<Blob> {
    const response = await api.post<Blob>('/reports/generate/download', request, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Report Scheduling
  async scheduleReport(request: ScheduleReportRequest): Promise<ScheduledReport> {
    const response = await api.post<ScheduledReport>('/reports/schedule', request);
    return response.data;
  },

  async getScheduledReports(): Promise<ScheduledReport[]> {
    const response = await api.get<ScheduledReport[]>('/reports/scheduled');
    return response.data;
  },

  async getScheduledReport(id: string): Promise<ScheduledReport> {
    const response = await api.get<ScheduledReport>(`/reports/scheduled/${id}`);
    return response.data;
  },

  async updateScheduledReport(id: string, updates: Partial<ScheduleReportRequest>): Promise<ScheduledReport> {
    const response = await api.put<ScheduledReport>(`/reports/scheduled/${id}`, updates);
    return response.data;
  },

  async toggleScheduledReport(id: string, isActive: boolean): Promise<ScheduledReport> {
    const response = await api.put<ScheduledReport>(`/reports/scheduled/${id}/toggle`, { isActive });
    return response.data;
  },

  async deleteScheduledReport(id: string): Promise<void> {
    await api.delete(`/reports/scheduled/${id}`);
  },

  // Report History (using existing analytics endpoints)
  async getReportHistory(): Promise<any[]> {
    // This would be implemented when backend supports report history
    // For now, return empty array
    return [];
  },

  // Report Sharing (would need backend implementation)
  async shareReport(request: ShareReportRequest): Promise<ShareReportResponse> {
    // This would be implemented when backend supports report sharing
    throw new Error('Report sharing not yet implemented');
  },

  async getSharedReport(shareId: string, password?: string): Promise<ReportResponse> {
    // This would be implemented when backend supports report sharing
    throw new Error('Report sharing not yet implemented');
  },
};

export default reportsApi;