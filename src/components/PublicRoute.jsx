// src/components/PublicRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  // Eğer kullanıcı giriş yapmışsa, onu ana sayfaya yönlendir.
  // Bu, giriş yapmış bir kullanıcının /login sayfasına gitmesini engeller.
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  // Kullanıcı giriş yapmamışsa, istenen sayfayı (Giriş, Kayıt vb.) göster.
  return children;
};

export default PublicRoute;
