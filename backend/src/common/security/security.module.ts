import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { HSMService } from './hsm.service';
import { AuditService } from './audit.service';
import { TLSService } from './tls.service';
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
  ],
  exports: [
    EncryptionService,
    HSMService,
    AuditService,
    TLSService,
  ],
})
export class SecurityModule {}