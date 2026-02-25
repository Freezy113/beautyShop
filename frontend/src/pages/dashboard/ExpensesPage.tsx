import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { Expense } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

interface ExpenseFormData extends Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> {}

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [newExpense, setNewExpense] = useState<ExpenseFormData>({
    description: '',
    amount: 0,
    category: 'materials',
    date: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    const sum = expenses.reduce((total, expense) => total + expense.amount, 0);
    setTotalAmount(sum);
  }, [expenses]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await masterApi.getExpenses();
      setExpenses(response.data);
    } catch (error) {
      console.error('Ошибка загрузки расходов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description.trim() || newExpense.amount <= 0) return;

    setIsLoading(true);
    try {
      await masterApi.createExpense(newExpense);
      await loadExpenses();
      setNewExpense({
        description: '',
        amount: 0,
        category: 'materials',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Ошибка создания расхода:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = [
    { value: 'materials', label: 'Материалы' },
    { value: 'equipment', label: 'Оборудование' },
    { value: 'rent', label: 'Аренда' },
    { value: 'marketing', label: 'Маркетинг' },
    { value: 'other', label: 'Другое' },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Расходы</h1>
          <p className="text-gray-600">Учет расходов и затрат</p>
        </div>

        {/* Статистика */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Общая сумма расходов</h2>
          <div className="text-3xl font-bold text-primary-600">
            {totalAmount.toLocaleString('ru-RU')} ₽
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Всего записей: {expenses.length}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Список расходов */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">История расходов</h2>
              {isLoading && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              )}
            </div>

            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Нет расходов</p>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{expense.description}</div>
                        <div className="text-sm text-gray-600">
                          {expense.category === 'materials' && 'Материалы'}
                          {expense.category === 'equipment' && 'Оборудование'}
                          {expense.category === 'rent' && 'Аренда'}
                          {expense.category === 'marketing' && 'Маркетинг'}
                          {expense.category === 'other' && 'Другое'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(expense.date)}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {expense.amount.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Добавление расхода */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Новый расход</h2>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <Input
                label="Описание"
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                required
              />
              <Input
                label="Сумма (₽)"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0
                }))}
                min="0"
                step="0.01"
                required
              />
              <Input
                label="Дата"
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                required
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!newExpense.description.trim() || newExpense.amount <= 0}
              >
                Добавить расход
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};