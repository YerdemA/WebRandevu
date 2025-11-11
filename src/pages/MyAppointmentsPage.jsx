// src/pages/MyAppointmentsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const AppointmentStatusBadge = ({ status }) => {
    const statusStyles = { confirmed: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', cancelled_by_client: 'bg-red-100 text-red-800', cancelled_by_provider: 'bg-yellow-100 text-yellow-800' };
    const statusText = { confirmed: 'Onaylandı', completed: 'Tamamlandı', cancelled_by_client: 'İptal Edildi (Müşteri)', cancelled_by_provider: 'İptal Edildi (İşletme)' };
    return (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>{statusText[status] || 'Bilinmiyor'}</span>);
};

const StarRating = ({ rating, setRating, hoverRating, setHoverRating }) => {
    return (
        <div className="flex justify-center my-4">
            {[...Array(5)].map((star, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={index}
                        className={ratingValue <= (hoverRating || rating) ? "text-yellow-400" : "text-gray-300"}
                        onClick={() => setRating(ratingValue)}
                        onMouseEnter={() => setHoverRating(ratingValue)}
                        onMouseLeave={() => setHoverRating(0)}
                    >
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </button>
                );
            })}
        </div>
    );
};

const MyAppointmentsPage = () => {
    const { userProfile, currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State'leri
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [enteredCode, setEnteredCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Review State'leri
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (!userProfile) return;
        const roleField = userProfile.role === 'Hizmet Veren' ? 'providerId' : 'clientId';
        const q = query(collection(db, "appointments"), where(roleField, "==", currentUser.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), appointmentDate: doc.data().appointmentDate.toDate() })).sort((a, b) => b.appointmentDate - a.appointmentDate);
            setAppointments(appointmentsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userProfile, currentUser]);

    const openCancelModal = (appointment) => { setSelectedAppointment(appointment); setIsCancelModalOpen(true); };
    const openCompleteModal = (appointment) => { setSelectedAppointment(appointment); setIsCompleteModalOpen(true); };
    const openReviewModal = (appointment) => { setSelectedAppointment(appointment); setRating(0); setComment(''); setIsReviewModalOpen(true); };

    const handleCancelAppointment = async () => { /* ... (Mevcut kod aynı) ... */ };
    const handleCompleteAppointment = async () => { /* ... (Mevcut kod aynı) ... */ };

    const handleReviewSubmit = async () => {
        if (rating === 0) {
            showNotification('Lütfen 1-5 arası bir puan verin.', 'error'); return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'reviews'), {
                providerId: selectedAppointment.providerId,
                clientId: selectedAppointment.clientId,
                clientName: selectedAppointment.clientName,
                appointmentId: selectedAppointment.id,
                rating: rating,
                comment: comment,
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'appointments', selectedAppointment.id), {
                isReviewed: true
            });
            showNotification('Değerlendirmeniz için teşekkür ederiz!', 'success');
        } catch(error) {
            console.error("Yorum gönderme hatası:", error);
            showNotification('Yorum gönderilirken bir hata oluştu.', 'error');
        } finally {
            setIsReviewModalOpen(false);
            setIsSubmitting(false);
        }
    };
    
    const isCancelable = (appointmentDate) => (appointmentDate.getTime() - new Date().getTime()) > (12 * 60 * 60 * 1000);
    const isCompletable = (appointmentDate) => new Date() > appointmentDate;

    if (loading) return <div className="text-center mt-40">Randevularınız yükleniyor...</div>;

    return (
        <>
            <div className="container mx-auto mt-28 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-gray-800">Randevularım</h1>
                    <div className="mt-6 flow-root"><div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8"><div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead><tr><th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">{userProfile.role === 'Hizmet Veren' ? 'Müşteri' : 'İşletme'}</th><th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tarih</th><th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Durum</th><th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0 text-right">İşlem / Bilgi</th></tr></thead>
                            <tbody className="divide-y divide-gray-200">
                                {appointments.map((app) => (
                                    <tr key={app.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{userProfile.role === 'Hizmet Veren' ? app.clientName : app.providerName}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{app.appointmentDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><AppointmentStatusBadge status={app.status} /></td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                            <div className="flex gap-4 justify-end items-center">
                                                {app.status === 'completed' && userProfile.role === 'Hizmet Alan' && !app.isReviewed && (<button onClick={() => openReviewModal(app)} className="font-semibold text-sky-600 hover:text-sky-800">Değerlendir</button>)}
                                                {app.status === 'confirmed' && isCancelable(app.appointmentDate) && (<button onClick={() => openCancelModal(app)} className="text-red-600 hover:text-red-900">İptal Et</button>)}
                                                {app.status === 'confirmed' && userProfile.role === 'Hizmet Veren' && isCompletable(app.appointmentDate) && (<button onClick={() => openCompleteModal(app)} className="text-green-600 hover:text-green-900">Tamamla</button>)}
                                                {app.status === 'confirmed' && userProfile.role === 'Hizmet Alan' && isCompletable(app.appointmentDate) && (<div className='text-center'><p className='text-xs text-gray-500'>Tamamlama Kodu</p><p className='font-mono text-lg tracking-widest bg-gray-100 p-1 rounded'>{app.completionCode}</p></div>)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {appointments.length === 0 && (<tr><td colSpan="4" className="text-center text-gray-500 py-8">Henüz bir randevunuz bulunmuyor.</td></tr>)}
                            </tbody>
                        </table>
                    </div></div></div>
                </div>
            </div>
            
            {/* İptal Modalı */}
            {isCancelModalOpen && <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg"><h2 className="text-xl font-bold mb-4">Randevuyu İptal Et</h2><div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md mb-6"><p className="font-bold">Önemli Bilgilendirme</p><p className="text-sm mt-1">Bu işlem geri alınamaz. 12 saat kuralına uygun iptallerde, ödediğiniz ücretin **%90'ı** iade edilecektir.</p></div><div className="flex justify-end gap-4"><button onClick={() => setIsCancelModalOpen(false)} className="px-5 py-2 bg-gray-200 rounded hover:bg-gray-300">Vazgeç</button><button onClick={handleCancelAppointment} disabled={isSubmitting} className="px-5 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600">{isSubmitting ? 'İptal Ediliyor...' : 'Evet, İptal Et'}</button></div></div></div>}
            
            {/* Tamamlama Modalı */}
            {isCompleteModalOpen && <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm"><h2 className="text-xl font-bold mb-4">Randevuyu Tamamla</h2><p className='text-sm text-gray-600 mb-4'>Müşteriden aldığınız 6 haneli tamamlama kodunu girin.</p><div><label htmlFor="completion_code" className='sr-only'>Tamamlama Kodu</label><input id="completion_code" value={enteredCode} onChange={(e) => setEnteredCode(e.target.value)} maxLength="6" className="w-full text-center text-2xl tracking-[.5em] p-2 border rounded-md" /></div><div className="flex justify-end gap-4 mt-6"><button onClick={() => setIsCompleteModalOpen(false)} className="px-5 py-2 bg-gray-200 rounded hover:bg-gray-300">İptal</button><button onClick={handleCompleteAppointment} disabled={isSubmitting} className="px-5 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-600">{isSubmitting ? 'Onaylanıyor...': 'Onayla'}</button></div></div></div>}
        
            {/* Değerlendirme Modalı */}
            {isReviewModalOpen && <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg"><h2 className="text-xl font-bold mb-2">Deneyiminizi Değerlendirin</h2><p className='text-sm text-gray-600 mb-4'><strong>{selectedAppointment.providerName}</strong> ile olan deneyiminizi puanlayın.</p><StarRating rating={rating} setRating={setRating} hoverRating={hoverRating} setHoverRating={setHoverRating}/><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Yorumunuzu buraya yazın (isteğe bağlı)..." className="w-full p-2 border rounded h-24 mt-2" /> <div className="flex justify-end gap-4 mt-6"><button onClick={() => setIsReviewModalOpen(false)} className="px-5 py-2 bg-gray-200 rounded hover:bg-gray-300">İptal</button><button onClick={handleReviewSubmit} disabled={isSubmitting} className="px-5 py-2 bg-sky-500 text-white font-bold rounded hover:bg-sky-600">{isSubmitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}</button></div></div></div>}
        </>
    );
};
export default MyAppointmentsPage;
