import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../page';

// Estado padrão do dashboard nos testes. Cada caso pode sobrescrevê-lo antes
// de renderizar, já que o mock lê esta variável a cada chamada.
let dashboardState: any = {
  dashboardData: null,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
  query: { period: '30d' },
  setPeriod: jest.fn(),
  setCustomDateRange: jest.fn(),
};

jest.mock('@/hooks/use-dashboard', () => ({
  useDashboard: () => dashboardState,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/hooks/use-subscriptions', () => ({
  useUpcomingSubscriptions: () => ({ data: [], isLoading: false }),
}));

// Recharts depende de medição de layout, indisponível no jsdom.
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>{component}</QueryClientProvider>,
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    dashboardState = {
      dashboardData: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      query: { period: '30d' },
      setPeriod: jest.fn(),
      setCustomDateRange: jest.fn(),
    };
  });

  it('renderiza as seções principais do dashboard', () => {
    renderWithQueryClient(<DashboardPage />);

    expect(screen.getByText('Contas')).toBeInTheDocument();
    expect(screen.getByText('Fluxo de Caixa')).toBeInTheDocument();
    expect(screen.getByText('Assinaturas')).toBeInTheDocument();
  });

  it('mostra as ações de conta no cabeçalho', () => {
    renderWithQueryClient(<DashboardPage />);

    expect(screen.getByText('Gerenciar Saldo')).toBeInTheDocument();
    expect(screen.getByText('Novo Pagamento')).toBeInTheDocument();
  });

  it('avisa quando não há dados de fluxo de caixa no período', () => {
    renderWithQueryClient(<DashboardPage />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
  });

  it('exibe erro com opção de recarregar quando a API falha', () => {
    dashboardState = {
      ...dashboardState,
      error: new Error('Falha de conexão'),
    };

    renderWithQueryClient(<DashboardPage />);

    expect(screen.getByText('Não foi possível carregar o dashboard')).toBeInTheDocument();
    expect(screen.getByText('Falha de conexão')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('não exibe dados de demonstração quando a API não responde', () => {
    renderWithQueryClient(<DashboardPage />);

    // O dashboard exibia mocks com fallback silencioso; agora um período sem
    // dados precisa aparecer como vazio, nunca como número inventado.
    expect(screen.queryByText(/R\$\s*45\.231,89/)).not.toBeInTheDocument();
  });
});
