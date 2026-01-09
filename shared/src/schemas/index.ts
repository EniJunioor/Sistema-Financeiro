import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter ao menos: 1 minúscula, 1 maiúscula, 1 número e 1 símbolo'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
});

// Transaction schemas
export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  date: z.string().datetime(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

// Investment schemas
export const createInvestmentSchema = z.object({
  symbol: z.string().min(1, 'Símbolo é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['stock', 'fund', 'etf', 'crypto', 'bond']),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  averagePrice: z.number().positive('Preço médio deve ser positivo'),
  broker: z.string().optional(),
  sector: z.string().optional(),
});

// Goal schemas
export const createGoalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['savings', 'spending_limit', 'investment']),
  targetAmount: z.number().positive('Valor alvo deve ser positivo'),
  targetDate: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;