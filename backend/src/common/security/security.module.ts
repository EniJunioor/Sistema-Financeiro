import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { HSMService } from './hsm.service';
import { AuditService } from './audit.service';
import { TLSService } from './tls.service';
import { SecurityGuard } from './security.guard';
import { SecurityMiddleware } from './security.middleware';
import securityConfig from '../../config/security.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(securityConfig),
  ],
  providers: [
    EncryptionService,
    HSMService,
    AuditService,
    TLSService,
    SecurityGuard,
    SecurityMiddleware,
  ],
  exports: [
    EncryptionService,
    HSMService,
    AuditService,
    TLSService,
    SecurityGuard,
    SecurityMiddleware,
  ],
})
export class SecurityModule {}