'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Filter, X, Calendar, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { transactionFiltersSchema, type TransactionFiltersData } from '@/lib/validations';
import { useCategories, useAccounts } from '@/hooks/use-transactions';
import type { TransactionFilters } from '@/types/transaction';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onSearch: (query: string) => void;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  onSearch,
}: TransactionFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const form = useForm<TransactionFiltersData>({
    resolver: zodResolver(transactionFiltersSchema),
    defaultValues: {
      type: filters.type,
      categoryId: filters.categoryId,
      accountId: filters.accountId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      amountMin: filters.amountMin,
      amountMax: filters.amountMax,
      tags: filters.tags || [],
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFiltersSubmit = (data: TransactionFiltersData) => {
    const newFilters: TransactionFilters = {
      ...filters,
      ...data,
      search: searchQuery,
    };
    
    // Remove empty values
    Object.keys(newFilters).forEach(key => {
      const value = newFilters[key as keyof TransactionFilters];
      if (value === '' || value === undefined || value === null) {
        delete newFilters[key as keyof TransactionFilters];
      }
    });

    onFiltersChange(newFilters);
    setIsFilterDialogOpen(false);
  };

  const clearFilters = () => {
    form.reset({
      type: undefined,
      categoryId: undefined,
      accountId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      amountMin: undefined,
      amountMax: undefined,
      tags: [],
    });
    setSearchQuery('');
    onFiltersChange({});
    onSearch('');
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue('tags', [...currentTags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type) count++;
    if (filters.categoryId) count++;
    if (filters.accountId) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.amountMin !== undefined || filters.amountMax !== undefined) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar transações por descrição, tags ou localização..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filtros Avançados</DialogTitle>
                <DialogDescription>
                  Configure filtros para refinar sua busca de transações
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFiltersSubmit)} className="space-y-4">
                  {/* Transaction Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Transação</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Todos os tipos" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Todos os tipos</SelectItem>
                            <SelectItem value="income">Receitas</SelectItem>
                            <SelectItem value="expense">Despesas</SelectItem>
                            <SelectItem value="transfer">Transferências</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Todas as contas" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Todas as contas</SelectItem>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Todas as categorias" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Todas as categorias</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center">
                                    {category.icon && (
                                      <span className="mr-2">{category.icon}</span>
                                    )}
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Período
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Inicial</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Final</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Faixa de Valor
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amountMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Mínimo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                  R$
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="pl-10"
                                  placeholder="0,00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="amountMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Máximo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                  R$
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="pl-10"
                                  placeholder="0,00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Adicionar tag para filtro..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        Adicionar
                      </Button>
                    </div>
                    {(form.watch('tags') || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(form.watch('tags') || []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={clearFilters}>
                      Limpar Filtros
                    </Button>
                    <Button type="submit">Aplicar Filtros</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Limpar ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2">
          <Button
            variant={filters.type === 'income' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, type: filters.type === 'income' ? undefined : 'income' })}
          >
            Receitas
          </Button>
          <Button
            variant={filters.type === 'expense' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, type: filters.type === 'expense' ? undefined : 'expense' })}
          >
            Despesas
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.type && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tipo: {filters.type === 'income' ? 'Receita' : filters.type === 'expense' ? 'Despesa' : 'Transferência'}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, type: undefined })}
              />
            </Badge>
          )}
          {filters.categoryId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Categoria: {categories.find(c => c.id === filters.categoryId)?.name}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, categoryId: undefined })}
              />
            </Badge>
          )}
          {filters.accountId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Conta: {accounts.find(a => a.id === filters.accountId)?.name}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, accountId: undefined })}
              />
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Período: {filters.dateFrom || '...'} - {filters.dateTo || '...'}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })}
              />
            </Badge>
          )}
          {(filters.amountMin !== undefined || filters.amountMax !== undefined) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Valor: R$ {filters.amountMin || 0} - R$ {filters.amountMax || '∞'}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, amountMin: undefined, amountMax: undefined })}
              />
            </Badge>
          )}
          {filters.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              Tag: {tag}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  tags: filters.tags?.filter(t => t !== tag) 
                })}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}