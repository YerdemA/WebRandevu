// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // Veriler yüklenirken boş bir ekran veya bir yüklenme animasyonu gösterilebilir
    return <div>Yükleniyor...</div>;
  }

  if (!currentUser) {
    // Kullanıcı giriş yapmamışsa, giriş sayfasına yönlendir
    return <Navigate to="/login" />;
  }

  // Kullanıcı giriş yapmışsa, istenen sayfayı göster
  return children;
};

export default ProtectedRoute;
