import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../page';

// Mock the hooks
jest.mock('@/hooks/use-dashboard', () => ({
  useDashboard: () => ({
    dashboardData: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    query: { period: '30d' },
    setPeriod: jest.fn(),
    setCustomDateRange: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-dashboard', () => ({
  ...jest.requireActual('@/hooks/use-dashboard'),
  useRealtimeUpdates: () => ({
    isConnected: true,
    lastMessage: { timestamp: new Date().toISOString() },
  }),
}));

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Dashboard Page', () => {
  it('renders dashboard title and description', () => {
    renderWithQueryClient(<DashboardPage />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Visão geral das suas finanças')).toBeInTheDocument();
  });

  it('renders financial summary cards', () => {
    renderWithQueryClient(<DashboardPage />);
    
    expect(screen.getByText('Saldo Total')).toBeInTheDocument();
    expect(screen.getByText('Receitas')).toBeInTheDocument();
    expect(screen.getByText('Despesas')).toBeInTheDocument();
    expect(screen.getByText('Saldo Líquido')).toBeInTheDocument();
  });

  it('renders chart components', () => {
    renderWithQueryClient(<DashboardPage />);
    
    expect(screen.getByText('Visão Geral Financeira')).toBeInTheDocument();
    expect(screen.getByText('Tendência de Gastos')).toBeInTheDocument();
    expect(screen.getByText('Gastos por Categoria')).toBeInTheDocument();
  });

  it('renders recent transactions section', () => {
    renderWithQueryClient(<DashboardPage />);
    
    expect(screen.getByText('Transações Recentes')).toBeInTheDocument();
    expect(screen.getByText('Suas últimas movimentações financeiras')).toBeInTheDocument();
  });

  it('renders goals progress section', () => {
    renderWithQueryClient(<DashboardPage />);
    
    expect(screen.getByText('Metas Financeiras')).toBeInTheDocument();
    expect(screen.getByText('Progresso das suas metas')).toBeInTheDocument();
  });

  it('renders period selector', () => {
    renderWithQueryClient(<DashboardPage />);
    
    expect(screen.getByText('Período de análise')).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    renderWithQueryClient(<DashboardPage />);
    
    expect(screen.getByText('Atualizar')).toBeInTheDocument();
  });
});