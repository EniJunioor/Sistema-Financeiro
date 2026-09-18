import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Prepara o banco usado pelos testes de integração.
 *
 * Roda uma vez antes da suíte inteira: descarta o SQLite anterior e reaplica
 * todas as migrations, garantindo que o schema do teste seja exatamente o que
 * está versionado — sem depender do banco de desenvolvimento da máquina.
 */
export default function globalSetup() {
  const backendRoot = join(__dirname, '..');

  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./test.db';

  // DATABASE_URL é relativa a prisma/, que é onde o arquivo acaba sendo criado.
  const dbFile = process.env.DATABASE_URL.replace(/^file:/, '');
  const dbPath = join(backendRoot, 'prisma', dbFile);

  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }

  execSync('npx prisma migrate deploy', {
    cwd: backendRoot,
    stdio: 'inherit',
    env: { ...process.env },
  });
}
