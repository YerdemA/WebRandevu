// src/pages/BusinessDetailPage.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

// Yıldızları göstermek için bir bileşen
const StaticStarRating = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
                <svg key={index} className={`w-5 h-5 ${ratingValue <= rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        })}
        {rating > 0 && <span className="text-gray-600 font-bold ml-2">{rating.toFixed(1)}</span>}
    </div>
);

const BusinessDetailPage = () => {
    const { providerId } = useParams();
    const { userProfile } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dailySchedule, setDailySchedule] = useState({});
    
    // Yorumlar için yeni state'ler
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    // Akış State'leri
    const [step, setStep] = useState('date_selection');
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [maxDuration, setMaxDuration] = useState(0);
    const [selectedServices, setSelectedServices] = useState([]);
    const [totalDuration, setTotalDuration] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [isBooking, setIsBooking] = useState(false);
    const [cardInfo, setCardInfo] = useState({ name: '', number: '', expiry: '', cvc: '' });

    const expiryRef = useRef(null);
    const cvcRef = useRef(null);
    const monthNames = useMemo(() => ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"], []);
    
    useEffect(() => {
        if (!providerId) return;

        // İşletme bilgilerini dinle
        const providerDocRef = doc(db, 'users', providerId);
        const unsubscribeProvider = onSnapshot(providerDocRef, (doc) => {
            if (doc.exists()) setProvider({ id: doc.id, ...doc.data() });
            setLoading(false);
        });

        // Onaylanmış randevuları dinle
        const appointmentsQuery = query(collection(db, "appointments"), where("providerId", "==", providerId), where("status", "==", "confirmed"));
        const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
            const schedule = {};
            snapshot.docs.forEach(doc => {
                const appt = doc.data();
                if (appt.appointmentDate?.toDate && appt.appointmentEndDate?.toDate) {
                    const dateStr = appt.appointmentDate.toDate().toDateString();
                    if (!schedule[dateStr]) schedule[dateStr] = [];
                    schedule[dateStr].push({ start: appt.appointmentDate.toDate(), end: appt.appointmentEndDate.toDate() });
                }
            });
            setDailySchedule(schedule);
        });

        // Yorumları ve puanları dinle
        const reviewsQuery = query(collection(db, 'reviews'), where('providerId', '==', providerId), orderBy('createdAt', 'desc'));
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            const reviewsData = [];
            let totalRating = 0;
            snapshot.docs.forEach(doc => {
                reviewsData.push({ id: doc.id, ...doc.data() });
                totalRating += doc.data().rating;
            });
            setReviews(reviewsData);
            if(snapshot.size > 0) {
                setAverageRating(totalRating / snapshot.size);
            }
        });
        
        return () => { unsubscribeProvider(); unsubscribeAppointments(); unsubscribeReviews(); };
    }, [providerId]);
    
    const getDayStatus = useCallback((date) => {
        if (!provider?.businessProfile) return 'loading';
        const dayStr = date.toDateString();
        const dayOfWeek = (date.getDay() + 6) % 7;
        const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        const isWorkingDay = provider.businessProfile.availability.days[dayNames[dayOfWeek]];
        const isBlockedManually = provider.businessProfile.blockedDays?.includes(dayStr);
        
        if (date < new Date().setHours(0,0,0,0) || !isWorkingDay || isBlockedManually) return 'black';

        const daySchedule = dailySchedule[dayStr] || [];
        const { start, end } = provider.businessProfile.availability.hours;
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        let dayStart = new Date(date); dayStart.setHours(startH, startM, 0, 0);
        let dayEnd = new Date(date); dayEnd.setHours(endH, endM, 0, 0);
        
        let totalBookedMs = daySchedule.reduce((acc, curr) => acc + (curr.end.getTime() - curr.start.getTime()), 0);
        let totalWorkMs = dayEnd.getTime() - dayStart.getTime();
        
        if (totalBookedMs >= totalWorkMs) return 'red';

        const minServiceDuration = Math.min(...(provider.businessProfile.services || [{duration: Infinity}]).map(s => parseInt(s.duration)));
        if (totalWorkMs - totalBookedMs < minServiceDuration * 60000) return 'red';

        return 'green';
    }, [provider, dailySchedule]);

    const handleDateClick = (date) => {
        setSelectedDate(date);
        const slots = generateAvailableStartTimes(date);
        setAvailableTimes(slots);
        setStep(slots.length > 0 ? 'time_selection' : 'date_selection');
        if (slots.length === 0) showNotification("Bu tarih için uygun bir başlangıç saati bulunamadı.", "warning");
        setSelectedTime(null);
        setSelectedServices([]);
    };
    
    const generateAvailableStartTimes = (date) => {
        if (!provider) return [];
        const slots = [];
        const daySchedule = dailySchedule[date.toDateString()] || [];
        const { start, end } = provider.businessProfile.availability.hours;
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        let currentTime = new Date(date); currentTime.setHours(startH, startM, 0, 0);
        let endTime = new Date(date); endTime.setHours(endH, endM, 0, 0);
        const now = new Date();

        while (currentTime < endTime) {
            const isOverlapping = daySchedule.some(booked => currentTime >= booked.start && currentTime < booked.end);
            const isPast = currentTime < now;
            if (!isOverlapping && !isPast) {
                slots.push(new Date(currentTime));
            }
            currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
        return slots;
    };

    const handleTimeClick = (time) => {
        setSelectedTime(time);
        const remaining = calculateRemainingTime(time);
        setMaxDuration(remaining);
        setStep('service_selection');
        setSelectedServices([]);
    };

    const handleServiceSelection = (service) => {
        setSelectedServices(prev => {
            const isSelected = prev.some(s => s.name === service.name);
            if (isSelected) {
                return prev.filter(s => s.name !== service.name);
            } else {
                const newTotalDuration = totalDuration + parseInt(service.duration);
                if(newTotalDuration > maxDuration){
                    showNotification("Seçilen hizmetler bu zaman aralığına sığmıyor.", "error");
                    return prev;
                }
                return [...prev, service];
            }
        });
    };
    
    const handleConfirmBooking = async () => {
        if (!cardInfo.name || cardInfo.number.replace(/\s/g, '').length !== 16 || cardInfo.expiry.length !== 5 || cardInfo.cvc.length !== 3) {
            showNotification('Lütfen geçerli kart bilgileri girin.', 'error'); return;
        }
        setIsBooking(true);
        try {
            const appointmentEnd = new Date(selectedTime.getTime() + totalDuration * 60000);
            const completionCode = Math.floor(100000 + Math.random() * 900000).toString(); // Kod üretimi
            
            await addDoc(collection(db, 'appointments'), {
                providerId: provider.id, providerName: provider.businessProfile.name,
                clientId: userProfile.uid, clientName: `${userProfile.firstName} ${userProfile.lastName}`,
                appointmentDate: selectedTime, appointmentEndDate: appointmentEnd,
                services: selectedServices, totalDuration, totalPrice, status: 'confirmed',
                completionCode: completionCode, // Kodu kaydet
                createdAt: serverTimestamp()
            });
            showNotification('Randevunuz başarıyla oluşturuldu!', 'success');
            setTimeout(() => navigate('/randevularim'), 1500);
        } catch(error) {
            showNotification('Randevu oluşturulurken bir hata oluştu.', 'error');
        } finally {
            setIsBooking(false);
            setStep('date_selection');
        }
    };
    
    const calculateRemainingTime = (startTime) => {
        const daySchedule = dailySchedule[startTime.toDateString()] || [];
        const nextAppointment = daySchedule.filter(appt => appt.start > startTime).sort((a,b) => a.start - b.start)[0];
        const dayEnd = new Date(startTime);
        const [endH, endM] = provider.businessProfile.availability.hours.end.split(':').map(Number);
        dayEnd.setHours(endH, endM, 0, 0);
        const limit = nextAppointment ? nextAppointment.start : dayEnd;
        return (limit.getTime() - startTime.getTime()) / 60000;
    };
    
    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        if (value.length <= 19) { setCardInfo(prev => ({ ...prev, number: value })); if (value.replace(/\s/g, '').length === 16) expiryRef.current.focus(); }
    };

    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
        if (value.length <= 5) { setCardInfo(prev => ({ ...prev, expiry: value })); if (value.length === 5) cvcRef.current.focus(); }
    };
    
    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} />);
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const status = getDayStatus(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            days.push( <button key={i} disabled={status !== 'green'} onClick={() => handleDateClick(date)} className={`p-2 h-12 text-center rounded-lg transition-colors text-sm ${ status === 'green' ? 'bg-green-100 text-green-800 hover:bg-green-300 cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed' } ${ isSelected ? '!bg-sky-500 !text-white font-bold' : '' } ${ status === 'red' ? '!bg-red-100 !text-red-700 cursor-not-allowed' : '' } ${ status === 'black' ? '!bg-gray-800 !text-gray-500 cursor-not-allowed' : '' }`}> {i} </button> );
        }
        return ( <div className="bg-white p-6 rounded-lg shadow-md"> <div className="flex justify-between items-center mb-4"><button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&lt;</button><h3 className="font-bold text-lg">{monthNames[month]} {year}</h3><button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&gt;</button></div> <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-500 mb-2">{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => <div key={day}>{day}</div>)}</div> <div className="grid grid-cols-7 gap-2">{days}</div><div className="flex justify-around gap-4 mt-4 text-xs"><span className="flex items-center gap-2"><div className="w-3 h-3 bg-green-100 rounded-full"></div>Müsait</span><span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 rounded-full"></div>Dolu</span><span className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-800 rounded-full"></div>Kapalı</span></div></div> );
    };
    
    if (loading) return <div className="text-center mt-40">Yükleniyor...</div>;
    if (!provider?.businessProfile?.services) return <div className="text-center mt-40">Bu işletme henüz hizmet eklememiş.</div>;
    
    return (
        <div className="container mx-auto mt-28 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <div className="flex justify-between items-start">
                            <h1 className="text-4xl font-bold font-poppins">{provider.businessProfile.name}</h1>
                            {averageRating > 0 && <StaticStarRating rating={averageRating} />}
                        </div>
                        <p className="mt-6 text-gray-700">{provider.businessProfile.description}</p>
                    </div>
                    {step === 'time_selection' && (
                        <div className="bg-white p-8 rounded-lg shadow-md"><h2 className="text-2xl font-bold">Bir Başlangıç Saati Seçin</h2><p className='text-gray-500 mb-4'>Seçtiğiniz saat, randevunuzun başlangıcı olacaktır.</p><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">{availableTimes.map(time => (<button key={time.toISOString()} onClick={() => handleTimeClick(time)} className="bg-sky-500 text-white p-3 rounded-lg hover:bg-sky-600 transition">{time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</button>))}</div></div>
                    )}
                    {(step === 'service_selection' || step === 'payment') && (
                        <div className="bg-white p-8 rounded-lg shadow-md"><h2 className="text-2xl font-bold mb-4">Hizmet Seçimi</h2><p className='text-gray-500 mb-4'>Seçtiğiniz saate sığabilecek hizmetler aşağıda listelenmiştir. Kalan süre: <span className="font-bold">{maxDuration - totalDuration} dakika</span>.</p><div className="space-y-3">{provider.businessProfile.services.map((service, index) => (<div key={index} onClick={() => parseInt(service.duration) <= maxDuration && handleServiceSelection(service)} className={`flex justify-between items-center p-4 rounded-lg transition ${parseInt(service.duration) > maxDuration ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : (selectedServices.some(s => s.name === service.name) ? 'bg-sky-100 border-sky-500 border-2 cursor-pointer' : 'bg-gray-50 hover:bg-gray-100 cursor-pointer')}`}><div><p className="font-semibold">{service.name}</p><p className="text-sm text-gray-500">{service.duration} Dakika</p></div><p className="font-bold">{service.price} ₺</p></div>))}</div>{step==='service_selection' && <button onClick={() => setStep('payment')} disabled={selectedServices.length === 0} className="w-full mt-6 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-600 disabled:bg-gray-300">Ödemeye Geç</button>}</div>
                    )}
                    {step === 'payment' && (
                        <div className="bg-white p-8 rounded-lg shadow-md"><h2 className="text-2xl font-bold mb-4">Ödeme Bilgileri</h2><div className='space-y-3 mb-4'><input onChange={(e) => setCardInfo(p=>({...p, name: e.target.value}))} value={cardInfo.name} placeholder="Kart Üzerindeki İsim" className="w-full p-2 border rounded" /><input onChange={handleCardNumberChange} value={cardInfo.number} placeholder="Kart Numarası" className="w-full p-2 border rounded" /><div className="grid grid-cols-2 gap-4"><input ref={expiryRef} onChange={handleExpiryChange} value={cardInfo.expiry} placeholder="AA/YY" className="w-full p-2 border rounded" /><input ref={cvcRef} onChange={(e) => e.target.value.length <= 3 && setCardInfo(p=>({...p, cvc:e.target.value}))} value={cardInfo.cvc} type="password" placeholder="CVC" className="w-full p-2 border rounded" maxLength="3" /></div></div><button onClick={handleConfirmBooking} disabled={isBooking} className="w-full mt-2 py-3 bg-sky-500 text-white font-bold rounded hover:bg-sky-600 disabled:bg-sky-300">{isBooking ? "İşleniyor..." : `Onayla ve ${totalPrice} ₺ Öde`}</button></div>
                    )}
                    
                    {/* Yorumlar Bölümü */}
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Müşteri Yorumları ({reviews.length})</h2>
                        <div className="space-y-6">
                            {reviews.length > 0 ? reviews.map(review => (
                                <div key={review.id} className="border-b pb-4">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{review.clientName}</p>
                                        <StaticStarRating rating={review.rating} />
                                    </div>
                                    <p className="text-gray-600 mt-2">{review.comment}</p>
                                    <p className="text-xs text-gray-400 mt-2">{review.createdAt?.toDate().toLocaleDateString('tr-TR')}</p>
                                </div>
                            )) : (
                                <p>Bu işletme için henüz yorum yapılmamış.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="sticky top-28 space-y-8">
                     {step !== 'date_selection' && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-bold mb-4">Randevu Özeti</h3>
                            {selectedTime && (<><p className="flex justify-between text-sm"><span>Tarih:</span> <strong>{selectedTime.toLocaleDateString('tr-TR')}</strong></p><p className="flex justify-between text-sm"><span>Saat:</span> <strong>{selectedTime.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</strong></p></>)}
                            <div className="border-t my-2"></div>
                            {selectedServices.length > 0 ? (<div className="space-y-2 text-sm">{selectedServices.map(s => <p key={s.name} className="flex justify-between"><span>{s.name}</span> <span>{s.price} ₺</span></p>)}<div className="border-t pt-2 mt-2"><p className="flex justify-between font-bold"><span>Toplam Süre:</span> <span>{totalDuration} dk</span></p><p className="flex justify-between font-bold text-lg"><span>Toplam Ücret:</span> <span>{totalPrice} ₺</span></p></div></div>) : <p className="text-sm text-gray-500">Lütfen hizmet seçin.</p>}
                        </div>
                    )}
                    {renderCalendar()}
                </div>
            </div>
        </div>
    );
};
export default BusinessDetailPage;

