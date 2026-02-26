import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './hooks/useProtectedRoute';
import { Navigation } from './components/Navigation';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { BookingPage } from './pages/public/BookingPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { ClientsPage } from './pages/dashboard/ClientsPage';
import { ExpensesPage } from './pages/dashboard/ExpensesPage';
import { StatsPage } from './pages/dashboard/StatsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={
              <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex flex-col">
                <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    </div>
                    <span className="text-lg font-bold text-gray-900">BeautyShop</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">
                      Войти
                    </Link>
                    <Link to="/register" className="btn-primary text-sm">
                      Начать бесплатно
                    </Link>
                  </div>
                </header>

                <main className="flex-1 flex items-center justify-center px-6">
                  <div className="max-w-2xl text-center">
                    <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-primary-100">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                      </svg>
                      Для мастеров красоты
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                      Управляйте записями<br />
                      <span className="text-gradient">легко и удобно</span>
                    </h1>
                    <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
                      Онлайн-запись клиентов, управление услугами, финансовая аналитика — всё в одном месте
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <Link to="/register" className="btn-primary text-base px-8 py-3">
                        Зарегистрироваться
                      </Link>
                      <Link to="/login" className="btn-secondary text-base px-8 py-3">
                        Войти
                      </Link>
                    </div>
                    <div className="mt-12 grid grid-cols-3 gap-8 max-w-md mx-auto">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">24/7</div>
                        <div className="text-xs text-gray-400 mt-1">Онлайн-запись</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">0 &#8381;</div>
                        <div className="text-xs text-gray-400 mt-1">Бесплатно</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">5 мин</div>
                        <div className="text-xs text-gray-400 mt-1">Быстрый старт</div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            } />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/book/:slug" element={<BookingPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><Navigation /><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Navigation /><SettingsPage /></ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute><Navigation /><ClientsPage /></ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute><Navigation /><ExpensesPage /></ProtectedRoute>
            } />
            <Route path="/stats" element={
              <ProtectedRoute><Navigation /><StatsPage /></ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
