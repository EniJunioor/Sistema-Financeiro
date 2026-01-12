import { IsEnum, IsOptional, IsString, IsArray, IsDateString, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  FINANCIAL_SUMMARY = 'financial_summary',
  CASH_FLOW = 'cash_flow',
  INCOME_STATEMENT = 'income_statement',
  BALANCE_SHEET = 'balance_sheet',
  TAX_REPORT = 'tax_report',
  INVESTMENT_PORTFOLIO = 'investment_portfolio',
  SPENDING_ANALYSIS = 'spending_analysis',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv'
}

export enum ReportTemplate {
  DRE = 'dre',
  CASH_FLOW = 'cash_flow',
  TAX_REPORT = 'tax_report',
  BALANCE_SHEET = 'balance_sheet',
  INVESTMENT_SUMMARY = 'investment_summary',
  SPENDING_BREAKDOWN = 'spending_breakdown',
  CUSTOM = 'custom'
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Type of report to generate' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ enum: ReportFormat, description: 'Output format for the report' })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ enum: ReportTemplate, description: 'Pre-defined template to use' })
  @IsOptional()
  @IsEnum(ReportTemplate)
  template?: ReportTemplate;

  @ApiPropertyOptional({ description: 'Start date for the report period' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for the report period' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Categories to include in the report', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Accounts to include in the report', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accounts?: string[];

  @ApiPropertyOptional({ description: 'Include charts in the report' })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional({ description: 'Include detailed transactions' })
  @IsOptional()
  @IsBoolean()
  includeTransactions?: boolean;

  @ApiPropertyOptional({ description: 'Include AI predictions and insights' })
  @IsOptional()
  @IsBoolean()
  includeAIPredictions?: boolean;

  @ApiPropertyOptional({ description: 'Custom report configuration', type: Object })
  @IsOptional()
  @IsObject()
  customConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Report title override' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Report description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ScheduleReportDto extends GenerateReportDto {
  @ApiProperty({ description: 'Cron expression for scheduling (e.g., "0 9 1 * *" for monthly on 1st at 9am)' })
  @IsString()
  cronExpression: string;

  @ApiProperty({ description: 'Email addresses to send the report to', type: [String] })
  @IsArray()
  @IsString({ each: true })
  emailRecipients: string[];

  @ApiPropertyOptional({ description: 'Name for the scheduled report' })
  @IsOptional()
  @IsString()
  scheduleName?: string;

  @ApiPropertyOptional({ description: 'Enable/disable the scheduled report' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReportResponseDto {
  @ApiProperty({ description: 'Generated report file URL or base64 data' })
  fileUrl?: string;

  @ApiProperty({ description: 'Base64 encoded file data (for immediate download)' })
  fileData?: string;

  @ApiProperty({ description: 'Report metadata' })
  metadata: {
    reportId: string;
    type: ReportType;
    format: ReportFormat;
    generatedAt: Date;
    fileSize: number;
    fileName: string;
  };

  @ApiProperty({ description: 'Report generation summary' })
  summary: {
    totalTransactions: number;
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    categoriesIncluded: number;
    accountsIncluded: number;
  };
}

export class ScheduledReportDto {
  @ApiProperty({ description: 'Scheduled report ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Report configuration' })
  reportConfig: GenerateReportDto;

  @ApiProperty({ description: 'Cron expression' })
  cronExpression: string;

  @ApiProperty({ description: 'Email recipients' })
  emailRecipients: string[];

  @ApiProperty({ description: 'Schedule name' })
  scheduleName: string;

  @ApiProperty({ description: 'Whether the schedule is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Next execution date' })
  nextExecution: Date;

  @ApiProperty({ description: 'Last execution date' })
  lastExecution?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}