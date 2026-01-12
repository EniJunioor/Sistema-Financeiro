import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionForm } from '../transaction-form';

// Mock the hooks
jest.mock('@/hooks/use-transactions', () => ({
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

describe('TransactionForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders transaction form with required fields', () => {
    renderWithQueryClient(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Nova Transação')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de Transação')).toBeInTheDocument();
    expect(screen.getByLabelText('Valor')).toBeInTheDocument();
    expect(screen.getByLabelText('Data')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
  });

  it('shows edit mode when initialData is provided', () => {
    const initialData = {
      id: '1',
      type: 'expense' as const,
      amount: 100,
      description: 'Test transaction',
      date: '2024-01-01',
      tags: [],
      attachments: [],
      userId: 'user1',
      isRecurring: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    renderWithQueryClient(
      <TransactionForm
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Editar Transação')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test transaction')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithQueryClient(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('validates required fields', async () => {
    renderWithQueryClient(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Criar Transação'));

    await waitFor(() => {
      expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});