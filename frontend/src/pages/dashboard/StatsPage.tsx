import React, { useState, useEffect } from 'react';
import { masterApi } from '../../services/api';
import { StatsResponse } from '../../types';
import { Button } from '../../components/common/Button';

export const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await masterApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Stats loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistics</h1>
          <p className="text-gray-600">Financial analytics</p>
        </div>

        <div className="flex justify-end mb-8">
          <Button onClick={loadStats} isLoading={isLoading} variant="secondary">
            Refresh
          </Button>
        </div>

        {!stats ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading stats...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {stats.totalAppointments}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Averages</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Per Month</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(stats.totalAppointments / 12)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue Per Month</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(Math.round(stats.totalRevenue / 12))}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Services</h3>
              <div className="space-y-3">
                {stats.topServices.slice(0, 3).map((service, index) => (
                  <div key={service.serviceId} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {index + 1}. {service.serviceName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.count} bookings • {formatCurrency(service.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
