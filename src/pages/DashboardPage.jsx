// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

const ProviderCard = ({ provider }) => {
    const business = provider.businessProfile;
    if (!business || !business.services || business.services.length === 0) return null;

    const prices = business.services.map(s => parseInt(s.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = minPrice === maxPrice ? `${minPrice} ₺` : `${minPrice} - ${maxPrice} ₺`;

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex flex-col">
            <div className="relative">
                <img src={`https://placehold.co/600x400/0ea5e9/ffffff?text=${encodeURIComponent(business.name)}`} alt={business.name} className="w-full h-48 object-cover"/>
                {provider.averageRating > 0 && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span>{provider.averageRating.toFixed(1)}</span>
                    </div>
                )}
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold font-poppins text-gray-800">{business.name}</h3>
                <p className="text-sm text-gray-500 mt-1 truncate">{business.address}</p>
                <p className="mt-4 text-gray-700 flex-grow h-20 overflow-hidden text-ellipsis">{business.description}</p>
                <div className="mt-4 flex justify-between items-center">
                    <p className="text-lg font-bold text-sky-600">{priceRange}</p>
                    <Link to={`/isletme/${provider.id}`} className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors">Randevu Al</Link>
                </div>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const { userProfile } = useAuth();
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'Hizmet Veren'), where('businessProfile.badgeStatus', '==', 'approved'));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const providersData = [];
            for (const doc of querySnapshot.docs) {
                const providerData = { id: doc.id, ...doc.data() };
                const reviewsQuery = query(collection(db, 'reviews'), where('providerId', '==', providerData.id));
                const reviewsSnapshot = await getDocs(reviewsQuery);
                let totalRating = 0;
                let reviewCount = 0;
                reviewsSnapshot.forEach(reviewDoc => {
                    totalRating += reviewDoc.data().rating;
                    reviewCount++;
                });
                providerData.averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
                providersData.push(providerData);
            }
            // En yüksek puanlıları en üste sırala
            providersData.sort((a, b) => b.averageRating - a.averageRating);
            setProviders(providersData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) { return <div className="text-center mt-40">İşletmeler yükleniyor...</div>; }
  
    return (
        <div className="container mx-auto mt-28 p-4">
            <div className="mb-8"><h1 className="text-4xl font-bold text-gray-800 font-poppins">İşletmeleri Keşfet</h1><p className="mt-2 text-lg text-gray-600">{userProfile ? `Hoş geldin, ${userProfile.firstName}! ` : ''}Randevu almak için aşağıdaki işletmeleri inceleyebilirsin.</p></div>
            {providers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {providers.map(provider => (<ProviderCard key={provider.id} provider={provider} />))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow"><h3 className="text-xl font-semibold">Henüz Hizmet Veren Yok</h3><p className="text-gray-500 mt-2">Platformumuza yakında yeni işletmeler eklenecektir!</p></div>
            )}
        </div>
    );
};

export default DashboardPage;
