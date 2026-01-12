import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { ChartGeneratorService } from './chart-generator.service';
import { ReportTemplateConfig, ReportSection } from './report-templates.service';

export interface PDFReportData {
  title: string;
  subtitle?: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  user: {
    name: string;
    email: string;
  };
  sections: ReportSectionData[];
  charts?: Array<{
    id: string;
    title: string;
    base64Image: string;
  }>;
  metadata: {
    generatedAt: Date;
    reportType: string;
    template?: string;
  };
}

export interface ReportSectionData {
  id: string;
  title: string;
  type: 'summary' | 'table' | 'chart' | 'text' | 'transactions';
  content: any;
  config?: Record<string, any>;
}

@Injectable()
export class PDFGeneratorService {
  constructor(private readonly chartGenerator: ChartGeneratorService) {}

  async generatePDFReport(data: PDFReportData): Promise<Buffer> {
    const html = this.generateHTML(data);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: this.generateHeaderTemplate(data),
        footerTemplate: this.generateFooterTemplate(data),
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private generateHTML(data: PDFReportData): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
          ${this.getCSS()}
        </style>
      </head>
      <body>
        <div class="report-container">
          ${this.generateTitleSection(data)}
          ${this.generateSections(data)}
          ${this.generateFooterInfo(data)}
        </div>
      </body>
      </html>
    `;
  }

  private getCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #333;
        background: white;
      }

      .report-container {
        max-width: 100%;
        margin: 0 auto;
        padding: 20px;
      }

      .title-section {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 2px solid #10B981;
      }

      .report-title {
        font-size: 24px;
        font-weight: bold;
        color: #1F2937;
        margin-bottom: 10px;
      }

      .report-subtitle {
        font-size: 16px;
        color: #6B7280;
        margin-bottom: 15px;
      }

      .report-period {
        font-size: 14px;
        color: #374151;
        font-weight: 500;
      }

      .section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }

      .section-title {
        font-size: 18px;
        font-weight: bold;
        color: #1F2937;
        margin-bottom: 15px;
        padding-bottom: 5px;
        border-bottom: 1px solid #E5E7EB;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .summary-card {
        background: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
      }

      .summary-card-title {
        font-size: 12px;
        color: #6B7280;
        margin-bottom: 5px;
        text-transform: uppercase;
        font-weight: 500;
      }

      .summary-card-value {
        font-size: 20px;
        font-weight: bold;
        color: #1F2937;
      }

      .summary-card-change {
        font-size: 11px;
        margin-top: 5px;
      }

      .positive { color: #10B981; }
      .negative { color: #EF4444; }
      .neutral { color: #6B7280; }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        font-size: 11px;
      }

      .data-table th,
      .data-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #E5E7EB;
      }

      .data-table th {
        background: #F9FAFB;
        font-weight: 600;
        color: #374151;
        text-transform: uppercase;
        font-size: 10px;
      }

      .data-table tr:hover {
        background: #F9FAFB;
      }

      .amount {
        text-align: right;
        font-weight: 500;
      }

      .chart-container {
        text-align: center;
        margin: 20px 0;
        page-break-inside: avoid;
      }

      .chart-image {
        max-width: 100%;
        height: auto;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
      }

      .chart-title {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 10px;
      }

      .transactions-list {
        font-size: 11px;
      }

      .transaction-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #F3F4F6;
      }

      .transaction-info {
        flex: 1;
      }

      .transaction-description {
        font-weight: 500;
        color: #1F2937;
      }

      .transaction-category {
        font-size: 10px;
        color: #6B7280;
      }

      .transaction-amount {
        font-weight: 600;
        text-align: right;
      }

      .income { color: #10B981; }
      .expense { color: #EF4444; }
      .transfer { color: #3B82F6; }

      .footer-info {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #E5E7EB;
        font-size: 10px;
        color: #6B7280;
        text-align: center;
      }

      .page-break {
        page-break-before: always;
      }

      @media print {
        .report-container {
          padding: 0;
        }
        
        .section {
          page-break-inside: avoid;
        }
      }
    `;
  }

  private generateTitleSection(data: PDFReportData): string {
    const periodText = this.formatPeriod(data.period.startDate, data.period.endDate);
    
    return `
      <div class="title-section">
        <h1 class="report-title">${data.title}</h1>
        ${data.subtitle ? `<h2 class="report-subtitle">${data.subtitle}</h2>` : ''}
        <div class="report-period">Período: ${periodText}</div>
      </div>
    `;
  }

  private generateSections(data: PDFReportData): string {
    return data.sections.map(section => {
      switch (section.type) {
        case 'summary':
          return this.generateSummarySection(section);
        case 'table':
          return this.generateTableSection(section);
        case 'chart':
          return this.generateChartSection(section, data.charts);
        case 'transactions':
          return this.generateTransactionsSection(section);
        case 'text':
          return this.generateTextSection(section);
        default:
          return '';
      }
    }).join('');
  }

  private generateSummarySection(section: ReportSectionData): string {
    const summaryData = section.content as Array<{
      title: string;
      value: number | string;
      change?: number;
      format?: 'currency' | 'percentage' | 'number';
    }>;

    const cards = summaryData.map(item => {
      const formattedValue = this.formatValue(item.value, item.format);
      const changeClass = item.change ? (item.change > 0 ? 'positive' : item.change < 0 ? 'negative' : 'neutral') : '';
      const changeText = item.change ? `${item.change > 0 ? '+' : ''}${item.change.toFixed(1)}%` : '';

      return `
        <div class="summary-card">
          <div class="summary-card-title">${item.title}</div>
          <div class="summary-card-value">${formattedValue}</div>
          ${changeText ? `<div class="summary-card-change ${changeClass}">${changeText}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="summary-grid">
          ${cards}
        </div>
      </div>
    `;
  }

  private generateTableSection(section: ReportSectionData): string {
    const tableData = section.content as {
      headers: string[];
      rows: Array<Array<string | number>>;
      totals?: Array<string | number>;
    };

    const headerRow = `
      <tr>
        ${tableData.headers.map(header => `<th>${header}</th>`).join('')}
      </tr>
    `;

    const dataRows = tableData.rows.map(row => `
      <tr>
        ${row.map((cell, index) => {
          const isAmount = typeof cell === 'number' && index > 0;
          const formattedCell = isAmount ? this.formatCurrency(cell as number) : cell;
          return `<td class="${isAmount ? 'amount' : ''}">${formattedCell}</td>`;
        }).join('')}
      </tr>
    `).join('');

    const totalsRow = tableData.totals ? `
      <tr style="font-weight: bold; border-top: 2px solid #374151;">
        ${tableData.totals.map((cell, index) => {
          const isAmount = typeof cell === 'number' && index > 0;
          const formattedCell = isAmount ? this.formatCurrency(cell as number) : cell;
          return `<td class="${isAmount ? 'amount' : ''}">${formattedCell}</td>`;
        }).join('')}
      </tr>
    ` : '';

    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <table class="data-table">
          <thead>${headerRow}</thead>
          <tbody>
            ${dataRows}
            ${totalsRow}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateChartSection(section: ReportSectionData, charts?: Array<{ id: string; title: string; base64Image: string }>): string {
    const chart = charts?.find(c => c.id === section.id);
    
    if (!chart) {
      return `
        <div class="section">
          <h2 class="section-title">${section.title}</h2>
          <p>Gráfico não disponível</p>
        </div>
      `;
    }

    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="chart-container">
          <img src="${chart.base64Image}" alt="${chart.title}" class="chart-image" />
        </div>
      </div>
    `;
  }

  private generateTransactionsSection(section: ReportSectionData): string {
    const transactions = section.content as Array<{
      id: string;
      description: string;
      amount: number;
      type: 'income' | 'expense' | 'transfer';
      date: Date;
      categoryName?: string;
    }>;

    const transactionItems = transactions.map(transaction => `
      <div class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-description">${transaction.description}</div>
          <div class="transaction-category">
            ${transaction.categoryName || 'Sem categoria'} • ${this.formatDate(transaction.date)}
          </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
          ${transaction.type === 'expense' ? '-' : ''}${this.formatCurrency(transaction.amount)}
        </div>
      </div>
    `).join('');

    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="transactions-list">
          ${transactionItems}
        </div>
      </div>
    `;
  }

  private generateTextSection(section: ReportSectionData): string {
    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div>${section.content}</div>
      </div>
    `;
  }

  private generateHeaderTemplate(data: PDFReportData): string {
    return `
      <div style="font-size: 10px; color: #6B7280; text-align: center; width: 100%; padding: 10px 0;">
        ${data.title} - ${data.user.name}
      </div>
    `;
  }

  private generateFooterTemplate(data: PDFReportData): string {
    return `
      <div style="font-size: 10px; color: #6B7280; text-align: center; width: 100%; padding: 10px 0;">
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        <span style="margin-left: 20px;">Gerado em ${this.formatDateTime(data.metadata.generatedAt)}</span>
      </div>
    `;
  }

  private generateFooterInfo(data: PDFReportData): string {
    return `
      <div class="footer-info">
        <p>Relatório gerado automaticamente pela Plataforma Financeira</p>
        <p>Data de geração: ${this.formatDateTime(data.metadata.generatedAt)}</p>
        <p>Usuário: ${data.user.name} (${data.user.email})</p>
        ${data.metadata.template ? `<p>Template: ${data.metadata.template}</p>` : ''}
      </div>
    `;
  }

  private formatValue(value: number | string, format?: 'currency' | 'percentage' | 'number'): string {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return this.formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return value.toLocaleString('pt-BR');
      default:
        return value.toString();
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatPeriod(startDate: Date, endDate: Date): string {
    return `${this.formatDate(startDate)} a ${this.formatDate(endDate)}`;
  }
}