import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ReportGeneratorService } from './report-generator.service';
import { ScheduleReportDto, ScheduledReportDto } from '../dto/generate-report.dto';
import * as nodemailer from 'nodemailer';
import * as cron from 'node-cron';

interface ScheduledReport {
  id: string;
  userId: string;
  reportConfig: any;
  cronExpression: string;
  emailRecipients: string[];
  scheduleName: string;
  isActive: boolean;
  nextExecution: Date;
  lastExecution?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);
  private scheduledJobs = new Map<string, any>();
  private emailTransporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportGenerator: ReportGeneratorService,
  ) {
    this.initializeEmailTransporter();
    this.loadScheduledReports();
  }

  private initializeEmailTransporter(): void {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async scheduleReport(userId: string, scheduleDto: ScheduleReportDto): Promise<ScheduledReportDto> {
    // Validate cron expression
    if (!cron.validate(scheduleDto.cronExpression)) {
      throw new Error('Invalid cron expression');
    }

    // Calculate next execution
    const nextExecution = this.getNextExecution(scheduleDto.cronExpression);

    // Save to database
    const scheduledReport = await this.prisma.$queryRaw`
      INSERT INTO scheduled_reports (
        id, userId, reportConfig, cronExpression, emailRecipients, 
        scheduleName, isActive, nextExecution, createdAt, updatedAt
      ) VALUES (
        ${this.generateId()}, ${userId}, ${JSON.stringify(scheduleDto)}, 
        ${scheduleDto.cronExpression}, ${JSON.stringify(scheduleDto.emailRecipients)},
        ${scheduleDto.scheduleName || 'Relatório Agendado'}, ${scheduleDto.isActive !== false},
        ${nextExecution.toISOString()}, ${new Date().toISOString()}, ${new Date().toISOString()}
      ) RETURNING *
    ` as any[];

    const saved = scheduledReport[0] as ScheduledReport;

    // Schedule the job
    if (saved.isActive) {
      this.createScheduledJob(saved);
    }

    return this.mapToDto(saved);
  }

  async updateScheduledReport(
    userId: string, 
    reportId: string, 
    updateDto: Partial<ScheduleReportDto>
  ): Promise<ScheduledReportDto> {
    // Get existing report
    const existing = await this.getScheduledReport(userId, reportId);
    if (!existing) {
      throw new Error('Scheduled report not found');
    }

    // Validate cron expression if provided
    if (updateDto.cronExpression && !cron.validate(updateDto.cronExpression)) {
      throw new Error('Invalid cron expression');
    }

    // Calculate next execution if cron changed
    const nextExecution = updateDto.cronExpression 
      ? this.getNextExecution(updateDto.cronExpression)
      : existing.nextExecution;

    // Update in database
    const updated = await this.prisma.$queryRaw`
      UPDATE scheduled_reports 
      SET 
        reportConfig = COALESCE(${updateDto ? JSON.stringify(updateDto) : null}, reportConfig),
        cronExpression = COALESCE(${updateDto.cronExpression}, cronExpression),
        emailRecipients = COALESCE(${updateDto.emailRecipients ? JSON.stringify(updateDto.emailRecipients) : null}, emailRecipients),
        scheduleName = COALESCE(${updateDto.scheduleName}, scheduleName),
        isActive = COALESCE(${updateDto.isActive}, isActive),
        nextExecution = ${nextExecution.toISOString()},
        updatedAt = ${new Date().toISOString()}
      WHERE id = ${reportId} AND userId = ${userId}
      RETURNING *
    ` as any[];

    const savedReport = updated[0] as ScheduledReport;

    // Update scheduled job
    this.removeScheduledJob(reportId);
    if (savedReport.isActive) {
      this.createScheduledJob(savedReport);
    }

    return this.mapToDto(savedReport);
  }

  async deleteScheduledReport(userId: string, reportId: string): Promise<void> {
    // Remove from database
    await this.prisma.$queryRaw`
      DELETE FROM scheduled_reports 
      WHERE id = ${reportId} AND userId = ${userId}
    `;

    // Remove scheduled job
    this.removeScheduledJob(reportId);
  }

  async getScheduledReports(userId: string): Promise<ScheduledReportDto[]> {
    const reports = await this.prisma.$queryRaw`
      SELECT * FROM scheduled_reports 
      WHERE userId = ${userId}
      ORDER BY createdAt DESC
    ` as ScheduledReport[];

    return reports.map(report => this.mapToDto(report));
  }

  async getScheduledReport(userId: string, reportId: string): Promise<ScheduledReportDto | null> {
    const reports = await this.prisma.$queryRaw`
      SELECT * FROM scheduled_reports 
      WHERE id = ${reportId} AND userId = ${userId}
    ` as ScheduledReport[];

    return reports.length > 0 ? this.mapToDto(reports[0]) : null;
  }

  async toggleScheduledReport(userId: string, reportId: string, isActive: boolean): Promise<ScheduledReportDto> {
    const updated = await this.prisma.$queryRaw`
      UPDATE scheduled_reports 
      SET isActive = ${isActive}, updatedAt = ${new Date().toISOString()}
      WHERE id = ${reportId} AND userId = ${userId}
      RETURNING *
    ` as any[];

    const savedReport = updated[0] as ScheduledReport;

    // Update scheduled job
    this.removeScheduledJob(reportId);
    if (savedReport.isActive) {
      this.createScheduledJob(savedReport);
    }

    return this.mapToDto(savedReport);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkScheduledReports(): Promise<void> {
    this.logger.log('Checking for scheduled reports to execute...');
    
    const now = new Date();
    const dueReports = await this.prisma.$queryRaw`
      SELECT * FROM scheduled_reports 
      WHERE isActive = true 
      AND nextExecution <= ${now.toISOString()}
    ` as ScheduledReport[];

    for (const report of dueReports) {
      try {
        await this.executeScheduledReport(report);
      } catch (error) {
        this.logger.error(`Failed to execute scheduled report ${report.id}:`, error);
      }
    }
  }

  private async loadScheduledReports(): Promise<void> {
    try {
      // Create table if it doesn't exist
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS scheduled_reports (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          reportConfig TEXT NOT NULL,
          cronExpression TEXT NOT NULL,
          emailRecipients TEXT NOT NULL,
          scheduleName TEXT NOT NULL,
          isActive BOOLEAN NOT NULL DEFAULT true,
          nextExecution DATETIME NOT NULL,
          lastExecution DATETIME,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const activeReports = await this.prisma.$queryRaw`
        SELECT * FROM scheduled_reports WHERE isActive = true
      ` as ScheduledReport[];

      for (const report of activeReports) {
        this.createScheduledJob(report);
      }

      this.logger.log(`Loaded ${activeReports.length} scheduled reports`);
    } catch (error) {
      this.logger.error('Failed to load scheduled reports:', error);
    }
  }

  private createScheduledJob(report: ScheduledReport): void {
    try {
      const task = cron.schedule(report.cronExpression, async () => {
        await this.executeScheduledReport(report);
      }, {
        timezone: 'America/Sao_Paulo',
      });

      this.scheduledJobs.set(report.id, task);
      this.logger.log(`Scheduled job created for report ${report.id} with cron: ${report.cronExpression}`);
    } catch (error) {
      this.logger.error(`Failed to create scheduled job for report ${report.id}:`, error);
    }
  }

  private removeScheduledJob(reportId: string): void {
    const job = this.scheduledJobs.get(reportId);
    if (job) {
      job.stop();
      job.destroy();
      this.scheduledJobs.delete(reportId);
      this.logger.log(`Removed scheduled job for report ${reportId}`);
    }
  }

  private async executeScheduledReport(report: ScheduledReport): Promise<void> {
    this.logger.log(`Executing scheduled report ${report.id} for user ${report.userId}`);

    try {
      // Generate the report
      const reportConfig = JSON.parse(report.reportConfig);
      const reportResult = await this.reportGenerator.generateReport(report.userId, reportConfig);

      // Send email with report
      await this.sendReportByEmail(report, reportResult.fileData, reportResult.metadata.fileName);

      // Update last execution and next execution
      const nextExecution = this.getNextExecution(report.cronExpression);
      await this.prisma.$queryRaw`
        UPDATE scheduled_reports 
        SET lastExecution = ${new Date().toISOString()}, 
            nextExecution = ${nextExecution.toISOString()},
            updatedAt = ${new Date().toISOString()}
        WHERE id = ${report.id}
      `;

      this.logger.log(`Successfully executed scheduled report ${report.id}`);
    } catch (error) {
      this.logger.error(`Failed to execute scheduled report ${report.id}:`, error);
      
      // Optionally, send error notification email
      await this.sendErrorNotification(report, error.message);
    }
  }

  private async sendReportByEmail(
    report: ScheduledReport, 
    fileData: string, 
    fileName: string
  ): Promise<void> {
    const reportConfig = JSON.parse(report.reportConfig);
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@plataforma-financeira.com',
      to: report.emailRecipients.join(', '),
      subject: `Relatório Agendado: ${report.scheduleName}`,
      html: `
        <h2>Relatório Financeiro Agendado</h2>
        <p>Olá,</p>
        <p>Segue em anexo o relatório <strong>${report.scheduleName}</strong> gerado automaticamente.</p>
        <p><strong>Detalhes do Relatório:</strong></p>
        <ul>
          <li>Tipo: ${reportConfig.type}</li>
          <li>Formato: ${reportConfig.format}</li>
          <li>Gerado em: ${new Date().toLocaleString('pt-BR')}</li>
        </ul>
        <p>Este é um email automático da Plataforma Financeira.</p>
        <hr>
        <p><small>Para cancelar este agendamento, acesse sua conta na plataforma.</small></p>
      `,
      attachments: [
        {
          filename: fileName,
          content: fileBuffer,
          contentType: reportConfig.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  private async sendErrorNotification(report: ScheduledReport, errorMessage: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@plataforma-financeira.com',
        to: report.emailRecipients.join(', '),
        subject: `Erro na Geração de Relatório: ${report.scheduleName}`,
        html: `
          <h2>Erro na Geração de Relatório</h2>
          <p>Olá,</p>
          <p>Houve um erro ao gerar o relatório agendado <strong>${report.scheduleName}</strong>.</p>
          <p><strong>Detalhes do Erro:</strong></p>
          <p><code>${errorMessage}</code></p>
          <p>Por favor, verifique as configurações do relatório em sua conta.</p>
          <p>Este é um email automático da Plataforma Financeira.</p>
        `,
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (emailError) {
      this.logger.error('Failed to send error notification email:', emailError);
    }
  }

  private getNextExecution(cronExpression: string): Date {
    // Simple implementation - in production, use a proper cron parser
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour as fallback
    return nextHour;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private mapToDto(report: ScheduledReport): ScheduledReportDto {
    return {
      id: report.id,
      userId: report.userId,
      reportConfig: JSON.parse(report.reportConfig),
      cronExpression: report.cronExpression,
      emailRecipients: typeof report.emailRecipients === 'string' 
        ? JSON.parse(report.emailRecipients) 
        : report.emailRecipients,
      scheduleName: report.scheduleName,
      isActive: report.isActive,
      nextExecution: new Date(report.nextExecution),
      lastExecution: report.lastExecution ? new Date(report.lastExecution) : undefined,
      createdAt: new Date(report.createdAt),
      updatedAt: new Date(report.updatedAt),
    };
  }
}