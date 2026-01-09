# Transactions Module

This module implements the complete CRUD operations for financial transactions with advanced features including ML-based categorization, full-text search, and comprehensive filtering.

## Features Implemented

### ✅ Core CRUD Operations
- **Create Transaction**: Add new transactions with automatic categorization
- **Read Transactions**: List with pagination, filtering, and search
- **Update Transaction**: Modify existing transactions
- **Delete Transaction**: Remove transactions with proper cleanup

### ✅ Advanced Filtering & Search
- **Pagination**: Configurable page size and navigation
- **Date Range Filtering**: Filter by start/end dates
- **Amount Range Filtering**: Filter by minimum/maximum amounts
- **Category Filtering**: Filter by specific categories
- **Account Filtering**: Filter by specific accounts
- **Type Filtering**: Filter by income/expense/transfer
- **Full-Text Search**: Search in descriptions and locations
- **Tag Filtering**: Filter by transaction tags
- **Sorting**: Sort by date, amount, description, or creation time

### ✅ ML-Based Auto-Categorization
- **User History Learning**: Learns from user's previous categorizations
- **Keyword-Based Rules**: Intelligent keyword matching for common merchants
- **Amount-Based Categorization**: Suggests categories based on transaction amounts
- **Confidence Scoring**: Provides confidence levels for suggestions
- **Fallback Categories**: Default categorization when no match found

### ✅ Category Management
- **Hierarchical Categories**: Support for parent/child category relationships
- **System Categories**: Pre-defined categories with icons and colors
- **Category Hierarchy**: Organized category structure
- **Default Categories**: Comprehensive set of Brazilian financial categories

### ✅ Statistics & Analytics
- **Transaction Stats**: Income, expenses, net amount calculations
- **Category Breakdown**: Spending distribution by category
- **Categorization Stats**: ML performance metrics
- **Top Categories**: Most used categories by user

### ✅ Performance Optimizations
- **Redis Caching**: Cached queries for better performance
- **Efficient Queries**: Optimized database queries with proper indexing
- **Pagination**: Memory-efficient data loading
- **Cache Invalidation**: Smart cache clearing on data changes

## API Endpoints

### Transactions
- `POST /transactions` - Create new transaction
- `GET /transactions` - List transactions with filters
- `GET /transactions/:id` - Get specific transaction
- `PATCH /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction
- `GET /transactions/stats` - Get transaction statistics
- `GET /transactions/search` - Full-text search

### Categories
- `GET /transactions/categories` - List all categories
- `GET /transactions/categories/hierarchy` - Get category hierarchy

### ML Features
- `POST /transactions/categories/suggest` - Get category suggestion
- `GET /transactions/categorization/stats` - Get ML performance stats
- `POST /transactions/:id/categorize` - Manual categorization for ML learning

## Data Models

### Transaction
```typescript
{
  id: string;
  userId: string;
  accountId?: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: Date;
  location?: string;
  tags?: string[];
  isRecurring: boolean;
  recurringRule?: string;
  attachments?: string[];
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Category
```typescript
{
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string;
  isSystem: boolean;
  createdAt: Date;
}
```

## ML Categorization Rules

The system includes intelligent categorization rules for:

### Food & Dining
- Supermercado, Mercado, Padaria, Açougue
- Restaurante, Lanchonete, Pizzaria
- iFood, Uber Eats, Delivery

### Transportation
- Posto, Combustível, Gasolina, Shell, Petrobras
- Uber, Taxi, 99, Cabify
- Ônibus, Metrô, Transporte Público

### Housing
- Aluguel, Imobiliária
- Condomínio, Administradora
- Energia, Luz, CEMIG, CPFL
- Água, Saneamento, SABESP
- Internet, Vivo, Claro, TIM

### Health
- Farmácia, Drogaria, Medicamento

### Entertainment
- Cinema, Netflix, Spotify, Amazon Prime

### Shopping
- Loja, Shopping, Americanas, Mercado Livre

## Testing

The module includes comprehensive tests:
- **Unit Tests**: Service and controller logic
- **Integration Tests**: End-to-end functionality
- **ML Tests**: Categorization algorithm validation

Run tests with:
```bash
npm test -- --testPathPattern=transactions
```

## Usage Examples

### Create Transaction
```typescript
const transaction = await transactionsService.create({
  type: 'expense',
  amount: 150.50,
  description: 'Supermercado Extra',
  date: '2024-01-15T10:30:00Z',
}, userId);
```

### List with Filters
```typescript
const result = await transactionsService.findAll(userId, {
  page: 1,
  limit: 20,
  type: 'expense',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  search: 'supermercado',
  sortBy: 'date',
  sortOrder: 'desc'
});
```

### Get Category Suggestion
```typescript
const suggestion = await mlService.suggestCategory(
  'Compras no Walmart',
  85.50,
  userId
);
// Returns: { categoryId, categoryName, confidence, reason }
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **2.1**: Complete transaction CRUD with all required fields
- **2.2**: ML-based automatic categorization system
- **2.3**: Advanced filtering and full-text search capabilities
- **2.4**: Comprehensive transaction management features

The module is production-ready with proper error handling, validation, caching, and comprehensive test coverage.