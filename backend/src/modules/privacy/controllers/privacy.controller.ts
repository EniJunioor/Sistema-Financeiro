import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ConsentService } from '../services/consent.service';
import { DataExportService } from '../services/data-export.service';
import { DataDeletionService } from '../services/data-deletion.service';
import { ConsentType, RecordConsentDto, RequestDeletionDto } from '../dto';

/**
 * Endpoints que materializam os direitos do titular previstos no art. 18 da
 * LGPD: confirmação do tratamento, acesso, portabilidade, revogação de
 * consentimento e eliminação.
 */
@ApiTags('privacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('privacy')
export class PrivacyController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly dataExportService: DataExportService,
    private readonly dataDeletionService: DataDeletionService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Resumo do tratamento de dados do titular (LGPD art. 18, I e II)',
  })
  @ApiResponse({ status: 200, description: 'Resumo retornado com sucesso' })
  async getPrivacySummary(@CurrentUser('id') userId: string) {
    const [consents, exports, pendingDeletion] = await Promise.all([
      this.consentService.getCurrentState(userId),
      this.dataExportService.listRequests(userId),
      this.dataDeletionService.getPendingRequest(userId),
    ]);

    return {
      consents,
      exports,
      pendingDeletion,
      rights: {
        access: 'GET /privacy/export',
        portability: 'POST /privacy/export',
        consentWithdrawal: 'POST /privacy/consents',
        deletion: 'POST /privacy/deletion',
      },
    };
  }

  // ----------------------------------------------------------------
  // Consentimento
  // ----------------------------------------------------------------

  @Get('consents')
  @ApiOperation({ summary: 'Estado atual de cada consentimento' })
  async getConsents(@CurrentUser('id') userId: string) {
    return this.consentService.getCurrentState(userId);
  }

  @Get('consents/history')
  @ApiOperation({ summary: 'Histórico auditável de consentimentos' })
  @ApiQuery({ name: 'type', enum: ConsentType, required: false })
  async getConsentHistory(
    @CurrentUser('id') userId: string,
    @Query('type') type?: ConsentType,
  ) {
    return this.consentService.getHistory(userId, type);
  }

  @Post('consents')
  @ApiOperation({ summary: 'Concede ou revoga um consentimento' })
  @ApiResponse({ status: 201, description: 'Consentimento registrado' })
  @ApiResponse({
    status: 400,
    description: 'Tentativa de revogar consentimento não revogável',
  })
  async recordConsent(
    @CurrentUser('id') userId: string,
    @Body() dto: RecordConsentDto,
    @Req() request: Request,
  ) {
    return this.consentService.record(userId, dto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  // ----------------------------------------------------------------
  // Acesso e portabilidade
  // ----------------------------------------------------------------

  @Post('export')
  @ApiOperation({ summary: 'Solicita a exportação dos dados pessoais' })
  @ApiResponse({ status: 201, description: 'Exportação gerada' })
  async requestExport(@CurrentUser('id') userId: string) {
    const { payload, ...request } = await this.dataExportService.requestExport(userId);
    return request;
  }

  @Get('export')
  @ApiOperation({ summary: 'Lista as exportações solicitadas' })
  async listExports(@CurrentUser('id') userId: string) {
    return this.dataExportService.listRequests(userId);
  }

  @Get('export/:id/download')
  @ApiOperation({ summary: 'Baixa o conteúdo de uma exportação concluída' })
  @ApiResponse({ status: 200, description: 'Dados do titular em JSON' })
  @ApiResponse({ status: 403, description: 'Exportação pertence a outro titular' })
  @ApiResponse({ status: 404, description: 'Exportação inexistente ou expirada' })
  async downloadExport(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
  ) {
    return this.dataExportService.download(userId, requestId);
  }

  // ----------------------------------------------------------------
  // Eliminação
  // ----------------------------------------------------------------

  @Post('deletion')
  @ApiOperation({
    summary: 'Solicita a exclusão da conta e dos dados pessoais',
    description:
      'A exclusão é agendada após um período de carência e pode ser cancelada até lá.',
  })
  @ApiResponse({ status: 201, description: 'Exclusão agendada' })
  @ApiResponse({ status: 400, description: 'Já existe solicitação pendente' })
  async requestDeletion(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestDeletionDto,
  ) {
    return this.dataDeletionService.requestDeletion(userId, dto);
  }

  @Get('deletion')
  @ApiOperation({ summary: 'Histórico de solicitações de exclusão' })
  async listDeletions(@CurrentUser('id') userId: string) {
    return this.dataDeletionService.listRequests(userId);
  }

  @Delete('deletion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela a exclusão pendente' })
  @ApiResponse({ status: 200, description: 'Exclusão cancelada' })
  @ApiResponse({ status: 404, description: 'Nenhuma exclusão pendente' })
  async cancelDeletion(@CurrentUser('id') userId: string) {
    return this.dataDeletionService.cancelDeletion(userId);
  }
}
