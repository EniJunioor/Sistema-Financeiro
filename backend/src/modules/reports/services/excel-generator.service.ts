import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PDFReportData, ReportSectionData } from './pdf-generator.service';

@Injectable()
export class ExcelGeneratorService {
  async generateExcelReport(data: PDFReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = data.user.name;
    workbook.lastModifiedBy = data.user.name;
    workbook.created = data.metadata.generatedAt;
    workbook.modified = data.metadata.generatedAt;
    workbook.lastPrinted = data.metadata.generatedAt;

    // Create main worksheet
    const worksheet = workbook.addWorksheet('Relatório Financeiro');
    
    // Set column widths
    worksheet.columns = [
      { width: 25 }, // A
      { width: 15 }, // B
      { width: 15 }, // C
      { width: 15 }, // D
      { width: 15 }, // E
      { width: 15 }, // F
      { width: 20 }, // G
      { width: 15 }, // H
    ];

    let currentRow = 1;

    // Add title section
    currentRow = this.addTitleSection(worksheet, data, currentRow);
    currentRow += 2; // Add spacing

    // Add sections
    for (const section of data.sections) {
      currentRow = this.addSection(worksheet, section, currentRow);
      currentRow += 2; // Add spacing between sections
    }

    // Add footer information
    this.addFooterInfo(worksheet, data, currentRow);

    // Apply styling
    this.applyWorksheetStyling(worksheet);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private addTitleSection(worksheet: ExcelJS.Worksheet, data: PDFReportData, startRow: number): number {
    let currentRow = startRow;

    // Main title
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = data.title;
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF1F2937' } };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    currentRow++;

    // Subtitle
    if (data.subtitle) {
      const subtitleCell = worksheet.getCell(`A${currentRow}`);
      subtitleCell.value = data.subtitle;
      subtitleCell.font = { size: 14, color: { argb: 'FF6B7280' } };
      subtitleCell.alignment = { horizontal: 'center' };
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      currentRow++;
    }

    // Period
    const periodCell = worksheet.getCell(`A${currentRow}`);
    periodCell.value = `Período: ${this.formatPeriod(data.period.startDate, data.period.endDate)}`;
    periodCell.font = { size: 12, bold: true };
    periodCell.alignment = { horizontal: 'center' };
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    currentRow++;

    // Add border under title section
    const borderRow = worksheet.getRow(currentRow);
    borderRow.border = {
      bottom: { style: 'thick', color: { argb: 'FF10B981' } }
    };

    return currentRow;
  }

  private addSection(worksheet: ExcelJS.Worksheet, section: ReportSectionData, startRow: number): number {
    let currentRow = startRow;

    // Section title
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = section.title;
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' }
    };
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    currentRow++;

    // Section content based on type
    switch (section.type) {
      case 'summary':
        currentRow = this.addSummaryContent(worksheet, section, currentRow);
        break;
      case 'table':
        currentRow = this.addTableContent(worksheet, section, currentRow);
        break;
      case 'transactions':
        currentRow = this.addTransactionsContent(worksheet, section, currentRow);
        break;
      case 'text':
        currentRow = this.addTextContent(worksheet, section, currentRow);
        break;
      case 'chart':
        currentRow = this.addChartPlaceholder(worksheet, section, currentRow);
        break;
    }

    return currentRow;
  }

  private addSummaryContent(worksheet: ExcelJS.Worksheet, section: ReportSectionData, startRow: number): number {
    const summaryData = section.content as Array<{
      title: string;
      value: number | string;
      change?: number;
      format?: 'currency' | 'percentage' | 'number';
    }>;

    let currentRow = startRow;

    // Headers
    worksheet.getCell(`A${currentRow}`).value = 'Métrica';
    worksheet.getCell(`B${currentRow}`).value = 'Valor';
    worksheet.getCell(`C${currentRow}`).value = 'Variação (%)';

    // Style headers
    ['A', 'B', 'C'].forEach(col => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }
      };
    });
    currentRow++;

    // Data rows
    summaryData.forEach(item => {
      worksheet.getCell(`A${currentRow}`).value = item.title;
      
      const valueCell = worksheet.getCell(`B${currentRow}`);
      if (typeof item.value === 'number') {
        valueCell.value = item.value;
        if (item.format === 'currency') {
          valueCell.numFmt = 'R$ #,##0.00';
        } else if (item.format === 'percentage') {
          valueCell.numFmt = '0.00%';
        }
      } else {
        valueCell.value = item.value;
      }

      if (item.change !== undefined) {
        const changeCell = worksheet.getCell(`C${currentRow}`);
        changeCell.value = item.change / 100; // Convert to decimal for percentage format
        changeCell.numFmt = '0.00%';
        
        // Color based on change
        if (item.change > 0) {
          changeCell.font = { color: { argb: 'FF10B981' } };
        } else if (item.change < 0) {
          changeCell.font = { color: { argb: 'FFEF4444' } };
        }
      }

      currentRow++;
    });

    return currentRow;
  }

  private addTableContent(worksheet: ExcelJS.Worksheet, section: ReportSectionData, startRow: number): number {
    const tableData = section.content as {
      headers: string[];
      rows: Array<Array<string | number>>;
      totals?: Array<string | number>;
    };

    let currentRow = startRow;

    // Headers
    tableData.headers.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index)}${currentRow}`);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }
      };
    });
    currentRow++;

    // Data rows
    tableData.rows.forEach(row => {
      row.forEach((cellValue, index) => {
        const cell = worksheet.getCell(`${this.getColumnLetter(index)}${currentRow}`);
        
        if (typeof cellValue === 'number') {
          cell.value = cellValue;
          // Apply currency format for amount columns (assuming index > 0 are amounts)
          if (index > 0) {
            cell.numFmt = 'R$ #,##0.00';
          }
        } else {
          cell.value = cellValue;
        }
      });
      currentRow++;
    });

    // Totals row
    if (tableData.totals) {
      tableData.totals.forEach((cellValue, index) => {
        const cell = worksheet.getCell(`${this.getColumnLetter(index)}${currentRow}`);
        
        if (typeof cellValue === 'number') {
          cell.value = cellValue;
          if (index > 0) {
            cell.numFmt = 'R$ #,##0.00';
          }
        } else {
          cell.value = cellValue;
        }
        
        cell.font = { bold: true };
        cell.border = {
          top: { style: 'thick', color: { argb: 'FF374151' } }
        };
      });
      currentRow++;
    }

    return currentRow;
  }

  private addTransactionsContent(worksheet: ExcelJS.Worksheet, section: ReportSectionData, startRow: number): number {
    const transactions = section.content as Array<{
      id: string;
      description: string;
      amount: number;
      type: 'income' | 'expense' | 'transfer';
      date: Date;
      categoryName?: string;
    }>;

    let currentRow = startRow;

    // Headers
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(`${this.getColumnLetter(index)}${currentRow}`);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }
      };
    });
    currentRow++;

    // Transaction rows
    transactions.forEach(transaction => {
      worksheet.getCell(`A${currentRow}`).value = transaction.date;
      worksheet.getCell(`A${currentRow}`).numFmt = 'dd/mm/yyyy';
      
      worksheet.getCell(`B${currentRow}`).value = transaction.description;
      worksheet.getCell(`C${currentRow}`).value = transaction.categoryName || 'Sem categoria';
      worksheet.getCell(`D${currentRow}`).value = this.getTransactionTypeLabel(transaction.type);
      
      const amountCell = worksheet.getCell(`E${currentRow}`);
      amountCell.value = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
      amountCell.numFmt = 'R$ #,##0.00';
      
      // Color based on transaction type
      if (transaction.type === 'income') {
        amountCell.font = { color: { argb: 'FF10B981' } };
      } else if (transaction.type === 'expense') {
        amountCell.font = { color: { argb: 'FFEF4444' } };
      } else {
        amountCell.font = { color: { argb: 'FF3B82F6' } };
      }

      currentRow++;
    });

    return currentRow;
  }

  private addTextContent(worksheet: ExcelJS.Worksheet, section: ReportSectionData, startRow: number): number {
    const cell = worksheet.getCell(`A${startRow}`);
    cell.value = section.content;
    cell.alignment = { wrapText: true, vertical: 'top' };
    worksheet.mergeCells(`A${startRow}:H${startRow}`);
    
    return startRow + 1;
  }

  private addChartPlaceholder(worksheet: ExcelJS.Worksheet, section: ReportSectionData, startRow: number): number {
    const cell = worksheet.getCell(`A${startRow}`);
    cell.value = `[Gráfico: ${section.title}]`;
    cell.font = { italic: true, color: { argb: 'FF6B7280' } };
    cell.alignment = { horizontal: 'center' };
    worksheet.mergeCells(`A${startRow}:H${startRow}`);
    
    return startRow + 1;
  }

  private addFooterInfo(worksheet: ExcelJS.Worksheet, data: PDFReportData, startRow: number): void {
    const footerRow = startRow + 2;
    
    const footerCell = worksheet.getCell(`A${footerRow}`);
    footerCell.value = [
      'Relatório gerado automaticamente pela Plataforma Financeira',
      `Data de geração: ${this.formatDateTime(data.metadata.generatedAt)}`,
      `Usuário: ${data.user.name} (${data.user.email})`,
      data.metadata.template ? `Template: ${data.metadata.template}` : ''
    ].filter(Boolean).join(' | ');
    
    footerCell.font = { size: 10, color: { argb: 'FF6B7280' } };
    footerCell.alignment = { horizontal: 'center' };
    worksheet.mergeCells(`A${footerRow}:H${footerRow}`);
  }

  private applyWorksheetStyling(worksheet: ExcelJS.Worksheet): void {
    // Apply borders to all used cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (cell.value) {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        }
      });
    });

    // Freeze the first row if it contains headers
    worksheet.views = [
      { state: 'frozen', ySplit: 1 }
    ];
  }

  private getColumnLetter(index: number): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (index < 26) {
      return letters[index];
    }
    
    const firstLetter = Math.floor(index / 26) - 1;
    const secondLetter = index % 26;
    return letters[firstLetter] + letters[secondLetter];
  }

  private getTransactionTypeLabel(type: string): string {
    switch (type) {
      case 'income':
        return 'Receita';
      case 'expense':
        return 'Despesa';
      case 'transfer':
        return 'Transferência';
      default:
        return type;
    }
  }

  private formatPeriod(startDate: Date, endDate: Date): string {
    return `${this.formatDate(startDate)} a ${this.formatDate(endDate)}`;
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
}