// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNotification } from '../context/NotificationContext'; // Yeni hook'umuzu import ediyoruz

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { showNotification } = useNotification(); // Bildirim fonksiyonunu alıyoruz
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Başarılı bildirim göster
      showNotification('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
      
      // Bildirimin görünmesi için küçük bir gecikme sonrası yönlendir
      setTimeout(() => {
        navigate('/dashboard'); 
      }, 1500);

    } catch (err) {
      let errorMessage = 'Giriş yaparken bir hata oluştu.';
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
           errorMessage = 'E-posta veya şifre hatalı. Lütfen kontrol edin.';
           break;
        default:
          console.error("Firebase Login Error: ", err);
      }
      // Hata bildirimi göster
      showNotification(errorMessage, 'error');
      setLoading(false);
    }
  };


  const mainBlue = "sky-500";
  const hoverBlue = "sky-600";

  return (
    <AuthLayout title="Giriş Yap">
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-${mainBlue} focus:border-${mainBlue} sm:text-sm`}
              placeholder="derin@gmail.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Şifre</label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-${mainBlue} focus:border-${mainBlue} sm:text-sm`}
              placeholder="••••••••"
            />
            <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> )}
            </button>
          </div>
        </div>
        
        {/* Eski hata mesajı alanını buradan kaldırdık */}

        <div className="flex items-center justify-end">
          <Link to="/sifremi-unuttum" className={`text-sm text-${mainBlue} hover:text-${hoverBlue} underline`}>
            Şifremi Unuttum
          </Link>
        </div>

        <div>
          <button type="submit" disabled={loading} className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${mainBlue} hover:bg-${hoverBlue} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${mainBlue} transition duration-150 ease-in-out disabled:bg-sky-300 disabled:cursor-not-allowed`}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>
      </form>
      <p className="mt-8 text-center text-sm text-gray-600">
        Hesabın yok mu?{' '}
        <Link to="/kayit-ol" className={`font-medium text-${mainBlue} hover:text-${hoverBlue}`}>
          Hemen Kayıt Ol
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
