// src/layouts/AuthLayout.jsx

import React from 'react';

// İkonları ve metinleri bir arada tutan bir dizi
const features = [
  { text: "Hatırlatıcı Bildirimler", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> },
  { text: "Kolay Rezervasyon", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
  { text: "Esnek İptal Opsiyonu", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> },
  // "Güvenli Ödeme" için kredi kartı ikonu
  { text: "Güvenli Ödeme", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /> },
  { text: "Kolay Yönetim Paneli", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
];

const AuthLayout = ({ children, title }) => {
  const mainBlue = "bg-sky-500";
  const lightBlue = "bg-sky-600/50";
  const iconColor = "text-sky-200";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-28 sm:pt-20">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 bg-white shadow-2xl rounded-2xl overflow-hidden">
        
        <div className={`hidden lg:flex flex-col justify-center p-12 ${mainBlue} text-white rounded-2xl m-4`}>
          <h2 className="text-3xl font-bold mb-8 text-white">Platform Özellikleri</h2>
          <div className="space-y-4">
             {features.map((feature, index) => (
                <div key={index} className={`flex items-center gap-4 ${lightBlue} p-4 rounded-lg`}>
                   <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${iconColor} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {feature.icon}
                   </svg>
                   <span>{feature.text}</span>
                </div>
             ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-md">
                <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">{title}</h2>
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
