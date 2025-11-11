// src/components/Header.jsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNotification } from '../context/NotificationContext';
import WebRandevuIcon from '/src/assets/WebRandevuMaviIcon.png'; 

const Header = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification('Başarıyla çıkış yaptınız.', 'success');
      navigate('/login');
    } catch (error) {
      showNotification('Çıkış yaparken bir hata oluştu.', 'error');
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-sm shadow-md z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to={currentUser ? "/dashboard" : "/login"} className="flex items-center gap-4">
            <img src={WebRandevuIcon} alt="WebRandevu Logo" className="w-10 h-10" />
            <span className="text-2xl font-bold text-gray-800 tracking-wider font-poppins">
              WebRandevu
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {currentUser ? (
                  <>
                    {userProfile?.role === 'Admin' && (
                       <Link to="/admin" className="text-gray-600 hover:text-sky-500 font-medium transition">
                         Admin Paneli
                       </Link>
                    )}
                    {/* Yeni Randevularım linki */}
                    <Link to="/randevularim" className="text-gray-600 hover:text-sky-500 font-medium transition">
                      Randevularım
                    </Link>
                    <Link to="/profilim" className="text-gray-600 hover:text-sky-500 font-medium transition">
                      Profilim
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-gray-600 hover:text-sky-500 font-medium transition">
                      Giriş Yap
                    </Link>
                    <Link to="/kayit-ol" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition">
                      Kayıt Ol
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
