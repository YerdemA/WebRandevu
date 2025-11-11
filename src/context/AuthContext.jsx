// src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tüm kimlik doğrulama ve profil çekme işlemini tek bir useEffect içinde yönetiyoruz.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Kullanıcı giriş yapmışsa, profil dinleyicisini hemen başlat.
        // setLoading(false) burada ÇAĞIRMIYORUZ.
        const unsubProfile = onSnapshot(
          doc(db, "users", user.uid),
          (doc) => {
            // Profil verisi geldiğinde state'leri güncelle.
            setCurrentUser(user);
            setUserProfile(doc.exists() ? doc.data() : null);
            // ANCAK ŞİMDİ, tüm veriler geldiğinde yüklemenin bittiğini söyle.
            setLoading(false);
          },
          (error) => {
            // Firestore hatası durumunda bile yüklemeyi bitir.
            console.error("Firestore profil dinleme hatası:", error);
            setCurrentUser(user);
            setUserProfile(null);
            setLoading(false);
          }
        );
        // Bu, iç dinleyiciyi (profil) temizler.
        return () => unsubProfile();
      } else {
        // Kullanıcı giriş yapmamışsa, her şeyi sıfırla ve yüklemeyi bitir.
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Bu, ana dinleyiciyi (auth) temizler.
    return () => unsubscribe();
  }, []); // Bu useEffect sadece bileşen ilk yüklendiğinde bir kez çalışır.

  const value = {
    currentUser,
    userProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
