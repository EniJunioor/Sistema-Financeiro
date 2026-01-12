import { ApiProperty } from '@nestjs/swagger';

export class GoalProgressDto {
  @ApiProperty({ description: 'ID da meta' })
  id: string;

  @ApiProperty({ description: 'Nome da meta' })
  name: string;

  @ApiProperty({ description: 'Tipo da meta' })
  type: string;

  @ApiProperty({ description: 'Valor alvo' })
  targetAmount: number;

  @ApiProperty({ description: 'Valor atual' })
  currentAmount: number;

  @ApiProperty({ description: 'Percentual de progresso' })
  progressPercentage: number;

  @ApiProperty({ description: 'Valor mensal necessário', required: false })
  monthlyRequired?: number;

  @ApiProperty({ description: 'Dias restantes', required: false })
  daysRemaining?: number;

  @ApiProperty({ description: 'Projeção de atingimento', required: false })
  projectedCompletion?: string;

  @ApiProperty({ description: 'Status da meta' })
  status: 'on_track' | 'behind' | 'ahead' | 'completed' | 'overdue';

  @ApiProperty({ description: 'Badges conquistados' })
  badges: string[];

  @ApiProperty({ description: 'Streak atual' })
  currentStreak: number;
}