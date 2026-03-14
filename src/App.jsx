import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import MarketPage from './pages/Market.jsx';
import TradePage from './pages/Trade.jsx';
import PortfolioPage from './pages/Portfolio.jsx';
import CalendarPage from './pages/Calendar.jsx';
import AdminPanelPage from './pages/AdminPanel.jsx';

const AppShell = () => {
  const location = useLocation();
  const authPages = ['/login', '/register'];
  const showSidebar = !authPages.includes(location.pathname);

  return (
    <div className="min-h-screen text-text-primary flex bg-gradient-to-br from-[#0a0f1e] to-[#0f172a]">
      {showSidebar && <Sidebar />}
      <main className={`flex-1 overflow-x-hidden ${showSidebar ? 'ml-[240px]' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/market" element={<ProtectedRoute><MarketPage /></ProtectedRoute>} />
          <Route path="/trade" element={<ProtectedRoute><TradePage /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanelPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => <AppShell />;
export default App;
