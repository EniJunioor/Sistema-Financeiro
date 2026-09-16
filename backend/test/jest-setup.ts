import { config } from 'dotenv';
import { join } from 'path';

// Carrega .env.test antes de qualquer módulo da aplicação ser instanciado,
// para que os testes nunca leiam o .env de desenvolvimento da máquina.
config({ path: join(__dirname, '..', '.env.test') });
