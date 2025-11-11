// src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import BecomeProviderPage from './pages/BecomeProviderPage';
import AdminPanelPage from './pages/AdminPanelPage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage'; // Yeni sayfayı import et
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main>
        <Routes>
          {/* Public Rotalar */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/kayit-ol" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/sifremi-unuttum" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          
          {/* Private Rotalar */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profilim" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/hizmet-veren-ol" element={<ProtectedRoute><BecomeProviderPage /></ProtectedRoute>} />
          <Route path="/isletme/:providerId" element={<ProtectedRoute><BusinessDetailPage /></ProtectedRoute>} />
          <Route path="/randevularim" element={<ProtectedRoute><MyAppointmentsPage /></ProtectedRoute>} /> {/* Yeni rotayı ekle */}

          {/* Admin Rotası */}
          <Route path="/admin" element={<AdminRoute><AdminPanelPage /></AdminRoute>} />

          {/* Varsayılan Rota */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
