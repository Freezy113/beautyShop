import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { StatsResponse } from '../../types';
import { Button } from '../../components/common/Button';

export const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await masterApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ru-RU');
  };

  const monthNames: Record<string, string> = {
    '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
    '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
    '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь',
  };

  const formatMonth = (monthStr: string) => {
    const parts = monthStr.split('-');
    return `${monthNames[parts[1]] || parts[1]} ${parts[0]}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Статистика</h1>
            <p className="text-sm text-gray-500 mt-1">Финансовая аналитика</p>
          </div>
          <Button onClick={loadStats} isLoading={isLoading} variant="secondary" size="sm">
            Обновить
          </Button>
        </div>

        {!stats ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600 mx-auto mb-4" />
            <p className="text-sm text-gray-400">Загрузка статистики...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">Всего записей</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">Выполнено</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completedAppointments}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">Доход</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)} <span className="text-sm text-gray-400">&#8381;</span></p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 mb-1">Прибыль</p>
                <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.netProfit)} <span className="text-sm text-gray-400">&#8381;</span>
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Расходы</h3>
                <p className="text-3xl font-bold text-red-600 mb-1">
                  {formatCurrency(stats.totalExpenses)} <span className="text-sm text-gray-400">&#8381;</span>
                </p>
                <p className="text-sm text-gray-400">Общие расходы за все время</p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">По месяцам</h3>
                {stats.monthlyStats.length === 0 ? (
                  <p className="text-sm text-gray-400">Нет данных</p>
                ) : (
                  <div className="space-y-3">
                    {stats.monthlyStats.map((month) => (
                      <div key={month.month} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{formatMonth(month.month)}</div>
                          <div className="text-xs text-gray-400">{month.appointments} записей</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(month.revenue)} &#8381;
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
