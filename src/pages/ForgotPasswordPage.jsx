// src/pages/ForgotPasswordPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useNotification } from '../context/NotificationContext';

// Firebase importu
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      showNotification('Şifre sıfırlama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.', 'success');
    } catch (err) {
      let errorMessage = 'Bir hata oluştu, lütfen tekrar deneyin.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.';
      }
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const mainBlue = "sky-500";
  const hoverBlue = "sky-600";

  return (
    <AuthLayout title="Şifremi Unuttum">
      <div className="space-y-6">
        <p className="text-center text-gray-600">
          Endişelenmeyin! Kayıtlı e-posta adresinizi girin, size şifrenizi sıfırlamanız için bir link göndereceğiz.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="kayitli-epostaniz@mail.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${mainBlue} hover:bg-${hoverBlue} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${mainBlue} transition duration-150 ease-in-out disabled:bg-sky-300`}
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-center text-sm text-gray-600">
          Şifreni hatırladın mı?{' '}
          <Link to="/login" className={`font-medium text-${mainBlue} hover:text-${hoverBlue}`}>
            Giriş Yap
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
