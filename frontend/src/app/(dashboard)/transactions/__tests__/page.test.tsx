import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TransactionsPage from '../page';

// Mock the hooks. A página monta filtros e formulários que consomem outros
// hooks do mesmo módulo, então todos precisam existir no mock.
jest.mock('@/hooks/use-transactions', () => ({
  useTransactions: () => ({
    transactions: [],
    pagination: null,
    isLoading: false,
    createTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  }),
  useCategories: () => ({ data: [] }),
  useAccounts: () => ({ data: [] }),
  useCategorySuggestion: () => ({
    suggestions: [],
    isLoading: false,
    getSuggestions: jest.fn(),
  }),
  useFileUpload: () => ({
    uploadAttachment: jest.fn(),
    processOCR: jest.fn(),
    isUploading: false,
    uploadProgress: 0,
  }),
  useRecurringTransactions: () => ({
    recurringTransactions: [],
    isLoading: false,
  }),
  useQueueStats: () => ({ data: null, isLoading: false }),
}));

// Mock the API
jest.mock('@/lib/transactions-api', () => ({
  TransactionsAPI: {
    bulkCategorize: jest.fn(),
    bulkDelete: jest.fn(),
    importFromCSV: jest.fn(),
  },
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

describe('TransactionsPage', () => {
  it('renders transactions page with main elements', () => {
    renderWithQueryClient(<TransactionsPage />);

    expect(screen.getByText('Transações')).toBeInTheDocument();
    expect(screen.getByText('Gerencie todas as suas movimentações financeiras')).toBeInTheDocument();
    expect(screen.getByText('Nova Transação')).toBeInTheDocument();
    expect(screen.getByText('Importar CSV')).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    renderWithQueryClient(<TransactionsPage />);

    expect(screen.getByText('Total de Transações')).toBeInTheDocument();
    // "Receitas" e "Despesas" aparecem no card de resumo e também na
    // navegação por tipo, então basta haver ao menos uma ocorrência.
    expect(screen.getAllByText('Receitas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Despesas').length).toBeGreaterThan(0);
  });

  it('renders filters and search section', () => {
    renderWithQueryClient(<TransactionsPage />);

    expect(screen.getByText('Filtros e Busca')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar transações por descrição, tags ou localização...')).toBeInTheDocument();
  });

  it('renders transactions list section', () => {
    renderWithQueryClient(<TransactionsPage />);

    expect(screen.getByText('Lista de Transações')).toBeInTheDocument();
  });
});