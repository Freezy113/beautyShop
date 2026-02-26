import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { Expense } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadExpenses(); }, []);

  useEffect(() => {
    setTotalAmount(expenses.reduce((sum, e) => sum + e.amount, 0));
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
      await masterApi.createExpense(newExpense as any);
      await loadExpenses();
      setNewExpense({ description: '', amount: 0 });
    } catch (error) {
      console.error('Ошибка создания расхода:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Расходы</h1>
          <p className="text-sm text-gray-500 mt-1">Учёт расходов и затрат</p>
        </div>

        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Общая сумма расходов</p>
              <p className="text-3xl font-bold text-gray-900">
                {totalAmount.toLocaleString('ru-RU')} <span className="text-lg text-gray-400">&#8381;</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Всего записей</p>
              <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">История расходов</h2>
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-600" />
              )}
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
                <p className="text-sm text-gray-400">Пока нет расходов</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{expense.description}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(expense.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-3">
                      -{expense.amount.toLocaleString('ru-RU')} &#8381;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Новый расход</h2>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <Input
                label="Описание"
                type="text"
                placeholder="На что потрачено"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                required
              />
              <Input
                label="Сумма (руб)"
                type="number"
                placeholder="0"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                min="1"
                required
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!newExpense.description.trim() || newExpense.amount <= 0}
                className="w-full"
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
