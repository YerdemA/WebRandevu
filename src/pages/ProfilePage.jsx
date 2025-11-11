// src/pages/ProfilePage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { useNotification } from '../context/NotificationContext';

// --- YARDIMCI BİLEŞENLER ---

const TabContent = ({ children, isActive }) => (
    isActive ? <div className="mt-8">{children}</div> : null
);

const StaticStarRating = ({ rating, size = 'w-5 h-5' }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
            <svg key={index} className={`${size} ${rating > index ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

// HİZMET VEREN KULLANICILAR İÇİN YÖNETİM PANELİ
const ProviderDashboard = ({ userProfile, currentUser }) => {
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState('services');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [services, setServices] = useState(userProfile.businessProfile?.services || []);
    const [newService, setNewService] = useState({ name: '', duration: '30', price: '' });
    const [businessDetails, setBusinessDetails] = useState({ name: userProfile.businessProfile?.name || '', description: userProfile.businessProfile?.description || '', address: userProfile.businessProfile?.address || '' });
    const [personalDetails, setPersonalDetails] = useState({ firstName: userProfile.firstName || '', lastName: userProfile.lastName || '' });
    const [passwordFields, setPasswordFields] = useState({ newPassword: '', confirmPassword: '' });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [blockedDays, setBlockedDays] = useState(userProfile.businessProfile?.blockedDays || []);
    const monthNames = useMemo(() => ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"], []);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        const reviewsQuery = query(collection(db, 'reviews'), where('providerId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
            const reviewsData = [];
            let totalRating = 0;
            snapshot.forEach(doc => {
                reviewsData.push({ id: doc.id, ...doc.data() });
                totalRating += doc.data().rating;
            });
            setReviews(reviewsData);
            if (snapshot.size > 0) {
                setAverageRating(totalRating / snapshot.size);
            }
        });
        return () => unsubscribe();
    }, [currentUser.uid]);

    const handleBusinessDetailsChange = (e) => setBusinessDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handlePersonalDetailsChange = (e) => setPersonalDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleNewServiceChange = (e) => setNewService(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handlePasswordChange = (e) => setPasswordFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
    
    const handleSaveBusinessDetails = async () => {
        if (!businessDetails.name || !businessDetails.description || !businessDetails.address) { showNotification("Tüm işletme bilgileri zorunludur.", "error"); return; }
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                'businessProfile.name': businessDetails.name, 'businessProfile.description': businessDetails.description, 'businessProfile.address': businessDetails.address
            });
            showNotification('İşletme bilgileri güncellendi.', 'success');
        } catch (error) { showNotification('Bilgiler güncellenirken bir hata oluştu.', 'error'); } 
        finally { setIsSubmitting(false); }
    };

    const handleSavePersonalDetails = async () => {
        if (!personalDetails.firstName || !personalDetails.lastName) { showNotification("Ad ve soyad zorunludur.", "error"); return; }
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { firstName: personalDetails.firstName, lastName: personalDetails.lastName });
            showNotification('Kişisel bilgileriniz güncellendi.', 'success');
        } catch (error) { showNotification('Bilgiler güncellenirken bir hata oluştu.', 'error'); } 
        finally { setIsSubmitting(false); }
    };

    const handleUpdatePassword = async () => {
        if (passwordFields.newPassword !== passwordFields.confirmPassword) { showNotification('Şifreler eşleşmiyor.', 'error'); return; }
        if (passwordFields.newPassword.length < 6) { showNotification('Yeni şifre en az 6 karakter olmalıdır.', 'error'); return; }
        setIsSubmitting(true);
        try {
            await updatePassword(auth.currentUser, passwordFields.newPassword);
            showNotification('Şifreniz başarıyla güncellendi.', 'success');
            setPasswordFields({ newPassword: '', confirmPassword: '' });
        } catch (error) { showNotification('Şifre güncellenemedi. Bu işlem için yeniden giriş yapmanız gerekebilir.', 'error'); } 
        finally { setIsSubmitting(false); }
    };
    
    const addService = async () => {
        if (!newService.name || !newService.price) { showNotification('Hizmet adı ve ücreti zorunludur.', 'error'); return; }
        setIsSubmitting(true);
        const updatedServices = [...services, { ...newService, price: parseInt(newService.price), duration: parseInt(newService.duration) }];
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { 'businessProfile.services': updatedServices });
            setServices(updatedServices);
            setNewService({ name: '', duration: '30', price: '' });
            showNotification('Yeni hizmet başarıyla eklendi.', 'success');
        } catch (error) { showNotification('Hizmet eklenirken bir hata oluştu.', 'error'); } 
        finally { setIsSubmitting(false); }
    };

    const deleteService = async (indexToDelete) => {
        const updatedServices = services.filter((_, index) => index !== indexToDelete);
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { 'businessProfile.services': updatedServices });
            setServices(updatedServices);
            showNotification('Hizmet başarıyla silindi.', 'success');
        } catch (error) { showNotification('Hizmet silinirken bir hata oluştu.', 'error'); } 
        finally { setIsSubmitting(false); }
    };

    const toggleDayOff = async (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
        const isBlocked = blockedDays.includes(dateStr);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { 'businessProfile.blockedDays': isBlocked ? arrayRemove(dateStr) : arrayUnion(dateStr) });
            setBlockedDays(prev => isBlocked ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
        } catch (error) { showNotification('Takvim güncellenirken bir hata oluştu.', 'error'); }
    };
    
    const renderManagementCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-12"></div>);
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = date.toDateString();
            const isPast = date < new Date().setHours(0,0,0,0);
            const isBlocked = blockedDays.includes(dateStr);
            days.push(<button key={i} disabled={isPast} onClick={() => toggleDayOff(i)} className={`p-2 h-12 text-center rounded-lg transition-colors text-sm ${isPast ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : isBlocked ? 'bg-red-500 text-white font-bold hover:bg-red-600' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>{i}</button>);
        }
        return (
            <div>
                <div className="flex justify-between items-center mb-4"><button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&lt;</button><h3 className="font-bold text-lg">{monthNames[month]} {year}</h3><button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&gt;</button></div>
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-500 mb-2">{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => <div key={day}>{day}</div>)}</div>
                <div className="grid grid-cols-7 gap-2">{days}</div>
                <div className="flex justify-center gap-4 mt-4 text-xs"><span className="flex items-center gap-2"><div className="w-3 h-3 bg-green-100 rounded-full border border-gray-300"></div>Müsait</span><span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div>Kapalı</span></div>
            </div>
        );
    };
    
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center flex-wrap gap-4"><h1 className="text-3xl font-bold flex items-center gap-3">{businessDetails.name} <span className="text-yellow-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></span></h1>{averageRating > 0 && (<div className="flex items-center gap-1 text-yellow-500 font-bold"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> {averageRating.toFixed(1)}</div>)}</div>
            <p className="text-gray-500 mt-1">İşletme Yönetim Paneli</p>
            <div className="border-b mt-6"><nav className="-mb-px flex space-x-8 overflow-x-auto"><button onClick={() => setActiveTab('services')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'services' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Hizmetlerim</button><button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>İşletme Bilgileri</button><button onClick={() => setActiveTab('calendar')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'calendar' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Müsaitlik Takvimi</button><button onClick={() => setActiveTab('personal')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'personal' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Kişisel Bilgiler</button><button onClick={() => setActiveTab('reviews')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Yorumlar ({reviews.length})</button></nav></div>
            <TabContent isActive={activeTab === 'services'}><div className="space-y-3 mb-6">{services.length > 0 ? services.map((service, index) => (<div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"><div><p className="font-semibold">{service.name}</p><p className="text-sm text-gray-500">{service.duration} Dakika - {service.price} ₺</p></div><button onClick={() => deleteService(index)} disabled={isSubmitting} className="text-red-500 hover:text-red-700 text-2xl">&times;</button></div>)) : (<p className="text-gray-500">Henüz hiç hizmet eklemediniz.</p>)}</div><div className="bg-gray-100 p-4 rounded-lg"><h3 className="font-bold mb-2">Yeni Hizmet Ekle</h3><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><input name="name" value={newService.name} onChange={handleNewServiceChange} placeholder="Hizmet Adı (Örn: Saç Kesim)" className="md:col-span-2 w-full p-2 border rounded"/><input name="price" type="number" value={newService.price} onChange={handleNewServiceChange} placeholder="Ücret (₺)" className="w-full p-2 border rounded"/><select name="duration" value={newService.duration} onChange={handleNewServiceChange} className="w-full p-2 border rounded bg-white"><option value="15">15 Dakika</option><option value="30">30 Dakika</option><option value="45">45 Dakika</option><option value="60">60 Dakika</option><option value="90">90 Dakika</option></select></div><button onClick={addService} disabled={isSubmitting} className="w-full md:w-auto mt-4 py-2 px-6 bg-sky-500 text-white font-bold rounded hover:bg-sky-600 disabled:bg-sky-300">{isSubmitting ? 'Ekleniyor...' : 'Hizmet Ekle'}</button></div></TabContent>
            <TabContent isActive={activeTab === 'details'}><div className="space-y-4 max-w-lg"><div><label className="text-sm font-medium text-gray-700">İşletme Adı</label><input name="name" value={businessDetails.name} onChange={handleBusinessDetailsChange} required className="mt-1 w-full p-2 border rounded" /></div><div><label className="text-sm font-medium text-gray-700">İşletme Açıklaması</label><textarea name="description" value={businessDetails.description} onChange={handleBusinessDetailsChange} required className="mt-1 w-full p-2 border rounded h-24" /></div><div><label className="text-sm font-medium text-gray-700">İşletme Adresi</label><input name="address" value={businessDetails.address} onChange={handleBusinessDetailsChange} required className="mt-1 w-full p-2 border rounded" /></div><button onClick={handleSaveBusinessDetails} disabled={isSubmitting} className="px-6 py-2 bg-sky-500 text-white font-bold rounded hover:bg-sky-600">Bilgileri Güncelle</button></div></TabContent>
            <TabContent isActive={activeTab === 'calendar'}>{renderManagementCalendar()}</TabContent>
            <TabContent isActive={activeTab === 'personal'}><div className="space-y-6 max-w-lg"><div><h3 className="text-lg font-semibold text-gray-800">Ad Soyad Bilgileri</h3><div className="grid grid-cols-2 gap-4 mt-2"><input name="firstName" value={personalDetails.firstName} onChange={handlePersonalDetailsChange} className="w-full p-2 border rounded"/><input name="lastName" value={personalDetails.lastName} onChange={handlePersonalDetailsChange} className="w-full p-2 border rounded"/></div><button onClick={handleSavePersonalDetails} disabled={isSubmitting} className="mt-2 px-6 py-2 bg-sky-500 text-white font-bold rounded hover:bg-sky-600">{isSubmitting ? "Kaydediliyor...":"Bilgileri Güncelle"}</button></div><div className="border-t pt-6"><h3 className="text-lg font-semibold text-gray-800">Şifre Değiştir</h3><div className="space-y-4 mt-2"><div><label className="text-sm font-medium text-gray-700">Yeni Şifre</label><input name="newPassword" type="password" value={passwordFields.newPassword} onChange={handlePasswordChange} className="mt-1 w-full p-2 border rounded"/></div><div><label className="text-sm font-medium text-gray-700">Yeni Şifre (Tekrar)</label><input name="confirmPassword" type="password" value={passwordFields.confirmPassword} onChange={handlePasswordChange} className="mt-1 w-full p-2 border rounded"/></div></div><button onClick={handleUpdatePassword} disabled={isSubmitting} className="mt-4 px-6 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-800">{isSubmitting ? "Güncelleniyor...":"Şifreyi Güncelle"}</button></div></div></TabContent>
            <TabContent isActive={activeTab === 'reviews'}>
                <div className="space-y-6">
                    {reviews.length > 0 ? reviews.map(review => (
                        <div key={review.id} className="border-b pb-4">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-gray-800">{review.clientName}</p>
                                <div className="flex items-center gap-2">
                                    <StaticStarRating rating={review.rating} />
                                    <span className="text-xs text-gray-400">{review.createdAt?.toDate().toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>
                            {review.comment && <p className="text-gray-600 mt-2 italic">"{review.comment}"</p>}
                        </div>
                    )) : (<p className="text-gray-500">Henüz işletmeniz için yorum yapılmamış.</p>)}
                </div>
            </TabContent>
        </div>
    );
};

const UserProfileView = ({ userProfile, currentUser }) => {
    const { showNotification } = useNotification();
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [details, setDetails] = useState({ firstName: userProfile.firstName || '', lastName: userProfile.lastName || '' });
    const [passwordFields, setPasswordFields] = useState({ newPassword: '', confirmPassword: '' });

    const handleDetailsChange = (e) => setDetails(prev => ({...prev, [e.target.name]: e.target.value}));
    const handlePasswordChange = (e) => setPasswordFields(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        if (!details.firstName || !details.lastName) {
            showNotification("Ad ve soyad boş bırakılamaz.", "error"); return;
        }
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                firstName: details.firstName, lastName: details.lastName
            });
            showNotification('Bilgileriniz başarıyla güncellendi.', 'success');
            setIsEditing(false);
        } catch (error) { showNotification('Güncelleme sırasında bir hata oluştu.', 'error'); } 
        finally { setIsSubmitting(false); }
    };

    const handleUpdatePassword = async () => {
        if (passwordFields.newPassword !== passwordFields.confirmPassword) {
            showNotification('Şifreler eşleşmiyor.', 'error'); return;
        }
        if (passwordFields.newPassword.length < 6) {
            showNotification('Yeni şifre en az 6 karakter olmalıdır.', 'error'); return;
        }
        setIsSubmitting(true);
        try {
            await updatePassword(auth.currentUser, passwordFields.newPassword);
            showNotification('Şifreniz başarıyla güncellendi.', 'success');
            setPasswordFields({ newPassword: '', confirmPassword: '' });
        } catch (error) { showNotification('Şifre güncellenemedi. Bu işlem için yeniden giriş yapmanız gerekebilir.', 'error'); } 
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
            {!isEditing ? (
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-6"><div className="w-24 h-24 rounded-full bg-sky-100 flex items-center justify-center text-4xl text-sky-500 font-bold">{userProfile.firstName.charAt(0)}</div><div><h1 className="text-3xl font-bold">{userProfile.firstName} {userProfile.lastName}</h1><p className="text-gray-500 mt-1">{userProfile.email}</p><span className="mt-2 inline-block bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{userProfile.role}</span></div></div>
                    <button onClick={() => setIsEditing(true)} className="text-sm text-sky-600 hover:text-sky-800 font-medium">Düzenle</button>
                </div>
            ) : (
                <div>
                    <h2 className="text-2xl font-bold mb-6">Profili Düzenle</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium text-gray-700">Ad</label><input name="firstName" value={details.firstName} onChange={handleDetailsChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/></div>
                            <div><label className="text-sm font-medium text-gray-700">Soyad</label><input name="lastName" value={details.lastName} onChange={handleDetailsChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/></div>
                        </div>
                        <div><label className="text-sm font-medium text-gray-700">E-posta</label><input value={userProfile.email} disabled className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"/></div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6"><button onClick={() => setIsEditing(false)} className="px-5 py-2 bg-gray-200 rounded-md hover:bg-gray-300">İptal</button><button onClick={handleSave} disabled={isSubmitting} className="px-5 py-2 bg-sky-500 text-white font-bold rounded-md hover:bg-sky-600">{isSubmitting ? "Kaydediliyor..." : "Bilgileri Kaydet"}</button></div>
                    <div className="border-t my-6 pt-6"><h3 className="text-lg font-semibold text-gray-800">Şifre Değiştir</h3><div className="space-y-4 mt-4"><div><label className="text-sm font-medium text-gray-700">Yeni Şifre</label><input name="newPassword" type="password" value={passwordFields.newPassword} onChange={handlePasswordChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/></div><div><label className="text-sm font-medium text-gray-700">Yeni Şifre (Tekrar)</label><input name="confirmPassword" type="password" value={passwordFields.confirmPassword} onChange={handlePasswordChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/></div></div><div className="flex justify-end mt-4"><button onClick={handleUpdatePassword} disabled={isSubmitting} className="px-5 py-2 bg-gray-700 text-white font-bold rounded-md hover:bg-gray-800">{isSubmitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}</button></div></div>
                </div>
            )}
            <div className="border-t my-6"></div>
            <div>
                {userProfile.role === 'Hizmet Alan' && (<Link to="/hizmet-veren-ol" className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 px-4 rounded-lg transition w-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>Hizmet Veren Ol</Link>)}
                {userProfile.role === 'Hizmet Veren Adayı' && (<div className="text-center p-4 bg-yellow-50 rounded-lg"><p className="font-bold text-yellow-700">Başvurunuz İnceleniyor</p><p className="text-sm text-gray-600 mt-1">Onaylandığında size bildireceğiz.</p></div>)}
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const { userProfile, loading, currentUser } = useAuth();
  
    if (loading) return <div className="text-center mt-40">Profil bilgileri yükleniyor...</div>;
    if (!userProfile) return <div className="text-center mt-40">Kullanıcı profili bulunamadı.</div>;

    if (userProfile.role === 'Hizmet Veren') {
        return <div className="container mx-auto mt-28 p-4"><ProviderDashboard userProfile={userProfile} currentUser={currentUser} /></div>;
    }
  
    return <div className="container mx-auto mt-28 p-4"><UserProfileView userProfile={userProfile} currentUser={currentUser} /></div>;
};
  
export default ProfilePage;
