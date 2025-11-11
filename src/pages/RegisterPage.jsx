// src/pages/RegisterPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useNotification } from '../context/NotificationContext';

// Firebase importları
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

// EmailJS importu
import emailjs from '@emailjs/browser';

const RegisterPage = () => {
  // Form adımlarını yönetmek için state: 'details' veya 'verify'
  const [step, setStep] = useState('details');

  // Kullanıcı bilgileri için state'ler
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Doğrulama kodu için state'ler
  const [verificationCode, setVerificationCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [timer, setTimer] = useState(120);

  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Zamanlayıcı için useEffect
  useEffect(() => {
    let interval;
    if (step === 'verify' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && step === 'verify') {
        showNotification('Doğrulama süresi doldu. Lütfen yeni kod isteyin.', 'error');
    }
    return () => clearInterval(interval);
  }, [step, timer]);


  // Formdaki değişiklikleri state'e yansıtan fonksiyon
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 1. Adım: Doğrulama Kodu Gönderme
  const handleSendCode = (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      showNotification('Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }
    setLoading(true);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    
    const templateParams = {
      to_name: `${formData.firstName} ${formData.lastName}`,
      to_email: formData.email,
      message: code,
    };

    emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    ).then((response) => {
      console.log('SUCCESS!', response.status, response.text);
      showNotification('Doğrulama kodu e-postanıza gönderildi.', 'success');
      setStep('verify'); // Adımı doğrulamaya geçir
      setTimer(120); // Zamanlayıcıyı başlat
      setLoading(false);
    }).catch((err) => {
      console.error('FAILED...', err);
      showNotification('Kod gönderilirken bir hata oluştu.', 'error');
      setLoading(false);
    });
  };

  // 2. Adım: Kodu Doğrulama ve Kaydı Tamamlama
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    
    if (userCode !== verificationCode) {
        showNotification('Doğrulama kodu yanlış.', 'error');
        return;
    }
    if (timer === 0) {
        showNotification('Doğrulama süresi doldu. Lütfen yeni kod isteyin.', 'error');
        return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: 'Hizmet Alan',
        createdAt: serverTimestamp(),
      });
      
      showNotification('Kayıt başarıyla tamamlandı!', 'success');
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      let errorMessage = 'Kayıt sırasında bir hata oluştu.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanılıyor.';
      }
      showNotification(errorMessage, 'error');
      setLoading(false);
    }
  };

  const mainBlue = "sky-500";
  const hoverBlue = "sky-600";

  // Detay Formu (Adım 1)
  const renderDetailsForm = () => (
    <form onSubmit={handleSendCode} className="space-y-6">
      <div className="flex gap-4">
        <div className="w-1/2">
          <label htmlFor="firstName">Ad</label>
          <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${mainBlue} focus:border-${mainBlue}`} placeholder="Yusuf" />
        </div>
        <div className="w-1/2">
          <label htmlFor="lastName">Soyad</label>
          <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${mainBlue} focus:border-${mainBlue}`} placeholder="Erdem" />
        </div>
      </div>
      <div>
        <label htmlFor="email">E-posta</label>
        <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${mainBlue} focus:border-${mainBlue}`} placeholder="derin@gmail.com" />
      </div>
      <div>
        <label htmlFor="password">Şifre</label>
        <div className="mt-1 relative">
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${mainBlue} focus:border-${mainBlue}`} placeholder="••••••••" />
          <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowPassword(!showPassword)}>
             {showPassword ? ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> )}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className={`w-full py-3 text-white bg-${mainBlue} hover:bg-${hoverBlue} rounded-md shadow-sm disabled:bg-sky-300`}>
        {loading ? 'Kod Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
      </button>
    </form>
  );

  // Kod Doğrulama Formu (Adım 2)
  const renderVerificationForm = () => (
    <form onSubmit={handleVerifyAndRegister} className="space-y-6">
        <div className='text-center text-gray-600'>
            <p><span className='font-bold'>{formData.email}</span> adresine gönderilen kodu girin.</p>
        </div>
        <div>
            <label htmlFor="userCode">Doğrulama Kodu</label>
            <input id="userCode" name="userCode" type="text" required value={userCode} onChange={(e) => setUserCode(e.target.value)} maxLength="6" className={`mt-1 text-center text-2xl tracking-[.5em] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${mainBlue} focus:border-${mainBlue}`} />
        </div>
        <div className="text-center text-sm">
            Kalan süre: <span className='font-bold'>{timer} saniye</span>
        </div>
        <button type="submit" disabled={loading} className={`w-full py-3 text-white bg-${mainBlue} hover:bg-${hoverBlue} rounded-md shadow-sm disabled:bg-sky-300`}>
            {loading ? 'Kayıt Tamamlanıyor...' : 'Kaydı Tamamla'}
        </button>
        <button type="button" onClick={handleSendCode} disabled={timer > 0 || loading} className="w-full py-2 mt-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md shadow-sm disabled:bg-gray-100 disabled:text-gray-400">
            Tekrar Kod Gönder
        </button>
    </form>
  );

  return (
    <AuthLayout title={step === 'details' ? 'Kayıt Ol' : 'E-posta Doğrulama'}>
        {step === 'details' ? renderDetailsForm() : renderVerificationForm()}
        <p className="mt-8 text-center text-sm text-gray-600">
            {step === 'details' ? "Zaten hesabın var mı? " : "Yanlış bilgi mi girdin? "}
            <Link to="/login" className={`font-medium text-${mainBlue} hover:text-${hoverBlue}`}>
                {step === 'details' ? 'Giriş Yap' : 'Giriş Sayfasına Dön'}
            </Link>
        </p>
    </AuthLayout>
  );
};

export default RegisterPage;
