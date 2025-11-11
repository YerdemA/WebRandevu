// src/components/AdminRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const AdminRoute = ({ children }) => {
  const { userProfile, loading, currentUser } = useAuth();
  const { showNotification } = useNotification();

  // Yüklenme durumunu hala kontrol ediyoruz. Bu, ilk açılış için önemli.
  if (loading) {
    return <div className="text-center mt-40">Yetki kontrol ediliyor...</div>;
  }

  // DÜZELTME: Yüklenme bittikten sonra, userProfile'ın varlığını ve rolünü kontrol ediyoruz.
  // Eğer profil henüz gelmediyse veya rol 'Admin' değilse yönlendir.
  if (!userProfile || userProfile.role !== 'Admin') {
    // Bu bildirim, gereksiz tekrarları önlemek için sadece bir kez, 
    // gerçekten giriş yapmış ama yetkisi olmayan bir kullanıcı için gösterilecek.
    if(currentUser) { 
        showNotification('Bu alana erişim yetkiniz yok.', 'error');
    }
    return <Navigate to="/dashboard" />;
  }

  // Eğer tüm kontrollerden geçtiyse, kullanıcı admin'dir ve sayfayı görebilir.
  return children;
};

export default AdminRoute;
