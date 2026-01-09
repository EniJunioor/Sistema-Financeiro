import { z } from "zod"

// Password validation schema - Requirements 1.1: 8+ chars, uppercase, lowercase, number, symbol
const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um símbolo")

// Login form validation
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email deve ter um formato válido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória"),
  rememberMe: z.boolean().optional(),
})

// Register form validation
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Email deve ter um formato válido"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, "Você deve aceitar os termos de uso"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

// Forgot password form validation
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email deve ter um formato válido"),
})

// Reset password form validation
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token é obrigatório"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

// 2FA setup form validation
export const twoFactorSetupSchema = z.object({
  method: z.enum(["totp", "sms", "email"], {
    required_error: "Selecione um método de autenticação",
  }),
  phoneNumber: z.string().optional(),
}).refine((data) => {
  if (data.method === "sms" && (!data.phoneNumber || data.phoneNumber.length < 10)) {
    return false
  }
  return true
}, {
  message: "Número de telefone é obrigatório para SMS",
  path: ["phoneNumber"],
})

// 2FA verification form validation
export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .min(6, "Código deve ter 6 dígitos")
    .max(6, "Código deve ter 6 dígitos")
    .regex(/^\d{6}$/, "Código deve conter apenas números"),
  backupCode: z.string().optional(),
})

// Change password form validation
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "A nova senha deve ser diferente da atual",
    path: ["newPassword"],
  })

// Type exports for form data
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type TwoFactorSetupFormData = z.infer<typeof twoFactorSetupSchema>
export type TwoFactorVerifyFormData = z.infer<typeof twoFactorVerifySchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>