import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './common/Button';

interface NavItem {
  path: string;
  label: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Календарь', icon: '📅' },
  { path: '/settings', label: 'Настройки', icon: '⚙️' },
  { path: '/clients', label: 'Клиенты', icon: '👥' },
  { path: '/expenses', label: 'Расходы', icon: '💸' },
  { path: '/stats', label: 'Статистика', icon: '📊' },
];

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">💅</span>
              <span className="text-xl font-bold text-gray-900">BeautyShop</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.email}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
              >
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};