import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './hooks/useProtectedRoute';
import { Navigation } from './components/Navigation';

// Pages
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
            {/* Публичные маршруты */}
            <Route path="/" element={<div className="text-center py-20">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">BeautyShop</h1>
              <p className="text-xl text-gray-600 mb-8">Система записи для мастеров красоты</p>
              <div className="space-x-4">
                <a href="/register" className="btn-primary">Зарегистрироваться</a>
                <a href="/login" className="btn-secondary">Войти</a>
              </div>
            </div>} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/book/:slug" element={<BookingPage />} />

            {/* Защищенные маршруты кабинета */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navigation />
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Navigation />
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <Navigation />
                <ClientsPage />
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <Navigation />
                <ExpensesPage />
              </ProtectedRoute>
            } />
            <Route path="/stats" element={
              <ProtectedRoute>
                <Navigation />
                <StatsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
