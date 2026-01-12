import { API_ENDPOINTS } from './constants';
import { apiClient } from './api';

export interface Goal {
  id: string;
  name: string;
  description?: string;
  type: 'savings' | 'spending_limit' | 'investment' | 'debt_payoff';
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  categoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalData {
  name: string;
  description?: string;
  type: 'savings' | 'spending_limit' | 'investment' | 'debt_payoff';
  targetAmount: number;
  targetDate?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface UpdateGoalData extends Partial<CreateGoalData> {}

export interface GoalProgress {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  monthlyRequired?: number;
  daysRemaining?: number;
  projectedCompletion?: string;
  status: 'on_track' | 'behind' | 'ahead' | 'completed' | 'overdue';
  badges: string[];
  currentStreak: number;
}

export interface GoalFilters {
  type?: 'savings' | 'spending_limit' | 'investment' | 'debt_payoff';
  isActive?: boolean;
  categoryId?: string;
  search?: string;
}

export interface GamificationData {
  userId: string;
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalSaved: number;
  badges: UserBadge[];
  streaks: StreakData[];
  level: number;
  experience: number;
  nextLevelExperience: number;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string;
  goalId?: string;
}

export interface StreakData {
  goalId: string;
  goalName: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

export interface GoalInsights {
  totalGoals: number;
  completedGoals: number;
  averageCompletionTime: number;
  successRate: number;
  totalSaved: number;
  monthlyProgress: Array<{
    month: string;
    goalsCompleted: number;
    totalSaved: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    totalAmount: number;
    completionRate: number;
  }>;
  recommendations: string[];
}

export const goalsApi = {
  // Get all goals
  getGoals: async (filters?: GoalFilters): Promise<Goal[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.GOALS.LIST}?${queryString}` : API_ENDPOINTS.GOALS.LIST;
    
    const response = await apiClient.get<Goal[]>(url);
    return response.data;
  },

  // Get active goals
  getActiveGoals: async (): Promise<Goal[]> => {
    const response = await apiClient.get<Goal[]>(`${API_ENDPOINTS.GOALS.LIST}/active`);
    return response.data;
  },

  // Get completed goals
  getCompletedGoals: async (): Promise<Goal[]> => {
    const response = await apiClient.get<Goal[]>(`${API_ENDPOINTS.GOALS.LIST}/completed`);
    return response.data;
  },

  // Get goal by ID
  getGoal: async (id: string): Promise<Goal> => {
    const response = await apiClient.get<Goal>(API_ENDPOINTS.GOALS.UPDATE(id));
    return response.data;
  },

  // Create new goal
  createGoal: async (data: CreateGoalData): Promise<Goal> => {
    const response = await apiClient.post<Goal>(API_ENDPOINTS.GOALS.CREATE, data);
    return response.data;
  },

  // Update goal
  updateGoal: async (id: string, data: UpdateGoalData): Promise<Goal> => {
    const response = await apiClient.patch<Goal>(API_ENDPOINTS.GOALS.UPDATE(id), data);
    return response.data;
  },

  // Delete goal
  deleteGoal: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.GOALS.DELETE(id));
  },

  // Get goal progress
  getGoalProgress: async (id: string): Promise<GoalProgress> => {
    const response = await apiClient.get<GoalProgress>(`${API_ENDPOINTS.GOALS.UPDATE(id)}/progress`);
    return response.data;
  },

  // Get all goals progress
  getAllGoalsProgress: async (): Promise<GoalProgress[]> => {
    const response = await apiClient.get<GoalProgress[]>(`${API_ENDPOINTS.GOALS.LIST}/progress`);
    return response.data;
  },

  // Update goal progress manually
  updateGoalProgress: async (id: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.GOALS.UPDATE(id)}/update-progress`);
  },

  // Get goal suggestions
  getGoalSuggestions: async (id: string): Promise<any> => {
    const response = await apiClient.get(`${API_ENDPOINTS.GOALS.UPDATE(id)}/suggestions`);
    return response.data;
  },

  // Get goal insights
  getGoalInsights: async (): Promise<GoalInsights> => {
    const response = await apiClient.get<GoalInsights>(`${API_ENDPOINTS.GOALS.LIST}/insights`);
    return response.data;
  },

  // Get gamification data
  getGamificationData: async (): Promise<GamificationData> => {
    const response = await apiClient.get<GamificationData>(`${API_ENDPOINTS.GOALS.LIST}/gamification`);
    return response.data;
  },
};