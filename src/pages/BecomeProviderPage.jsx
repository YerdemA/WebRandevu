// src/pages/BecomeProviderPage.jsx

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const BecomeProviderPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { userProfile } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const expiryRef = useRef(null);
    const cvcRef = useRef(null);

    const [formData, setFormData] = useState({
        businessName: '', serviceDescription: '', address: '',
        availableDays: { Pazartesi: false, Salı: false, Çarşamba: false, Perşembe: false, Cuma: false, Cumartesi: false, Pazar: false },
        startTime: '09:00', endTime: '18:00',
        subscriptionPlan: 'monthly', cardName: '', cardNumber: '', expiryDate: '', cvc: '',
    });
    
    const [services, setServices] = useState([]);
    const [newService, setNewService] = useState({ name: '', duration: '30', price: '' });

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleNewServiceChange = (e) => setNewService(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleDayChange = (day) => setFormData(prev => ({ ...prev, availableDays: { ...prev.availableDays, [day]: !prev.availableDays[day] }}));
    
    const addService = () => {
        if (!newService.name || !newService.price) {
            showNotification('Hizmet adı ve ücreti zorunludur.', 'error'); return;
        }
        setServices([...services, { ...newService, price: parseInt(newService.price), duration: parseInt(newService.duration) }]);
        setNewService({ name: '', duration: '30', price: '' });
    };

    const deleteService = (indexToDelete) => setServices(services.filter((_, index) => index !== indexToDelete));

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        if (!formData.businessName || !formData.address) {
            showNotification('İşletme adı ve adresi zorunludur.', 'error'); return;
        }
        if (services.length === 0) {
            showNotification('Devam etmek için en az bir hizmet eklemelisiniz.', 'error'); return;
        }
        setStep(2);
    };
    
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (formData.cardNumber.replace(/\s/g, '').length !== 16 || formData.expiryDate.length !== 5 || formData.cvc.length !== 3) {
            showNotification('Lütfen geçerli kart bilgileri girin.', 'error'); return;
        }
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            await updateDoc(userDocRef, {
                role: 'Hizmet Veren Adayı',
                businessProfile: {
                    name: formData.businessName, description: formData.serviceDescription,
                    address: formData.address, services: services,
                    availability: { days: formData.availableDays, hours: { start: formData.startTime, end: formData.endTime }},
                    badgeStatus: 'pending_approval'
                },
                subscription: { plan: formData.subscriptionPlan, startDate: new Date() }
            });
            showNotification('Başvurunuz başarıyla alındı! Onay için en kısa sürede incelenecektir.', 'success');
            setTimeout(() => navigate('/profilim'), 2500);
        } catch (error) {
            showNotification('Başvuru gönderilirken bir hata oluştu.', 'error');
            setLoading(false);
        }
    };
    
    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        if (value.length <= 19) {
          setFormData(prev => ({ ...prev, cardNumber: value }));
          if (value.replace(/\s/g, '').length === 16) expiryRef.current.focus();
        }
    };

    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
        if (value.length <= 5) {
          setFormData(prev => ({ ...prev, expiryDate: value }));
          if (value.length === 5) cvcRef.current.focus();
        }
    };

  return (
    <div className="container mx-auto mt-28 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Hizmet Veren Rozeti Nedir?</h1>
            <p className="mt-4 text-gray-600">Hizmet Veren Rozeti, WebRandevu platformunda işletmenizi listeleyerek binlerce potansiyel müşteriye ulaşmanızı sağlayan özel bir üyelik sistemidir. Bu rozet sayesinde randevu takviminizi oluşturabilir, müşterilerinizden online ve güvenli bir şekilde ödeme alabilir ve işletmenizi kolayca yönetebilirsiniz.</p>
            <div className="mt-6 border-t pt-6"><h2 className="text-xl font-bold text-gray-700">Abonelik Planları</h2><div className="mt-4 space-y-4"><div className="bg-sky-50 p-4 rounded-lg border border-sky-200"><h3 className="font-bold text-sky-800">Aylık Plan</h3><p className="text-gray-600">Esnek başlangıç için ideal.</p><p className="text-2xl font-bold text-sky-600 mt-2">99₺ <span className="text-sm font-normal">/ ay</span></p></div><div className="bg-green-50 p-4 rounded-lg border border-green-200"><h3 className="font-bold text-green-800">Yıllık Plan (2 Ay Ücretsiz!)</h3><p className="text-gray-600">Tasarruf etmek isteyenler için en iyi seçenek.</p><p className="text-2xl font-bold text-green-600 mt-2">999₺ <span className="text-sm font-normal">/ yıl</span></p></div></div></div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
            {step === 1 && (
                <form onSubmit={handleDetailsSubmit}>
                    <h2 className="text-2xl font-bold mb-6">İşletme Bilgileri</h2>
                    <div className="space-y-4">
                        <input name="businessName" value={formData.businessName} onChange={handleInputChange} placeholder="İşletme Adı" required className="w-full p-2 border rounded"/>
                        <textarea name="serviceDescription" value={formData.serviceDescription} onChange={handleInputChange} placeholder="Hizmet Açıklaması (Örn: Modern saç kesimi, psikolojik danışmanlık...)" className="w-full p-2 border rounded h-24"/>
                        <input name="address" value={formData.address} onChange={handleInputChange} placeholder="İşletme Adresi" required className="w-full p-2 border rounded"/>
                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-2">Hizmetler (En az 1 tane ekleyin)</h3>
                            <div className="space-y-2 mb-2">
                                {services.map((service, index) => (
                                    <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                        <span>{service.name} ({service.duration}dk) - {service.price}₺</span>
                                        <button type="button" onClick={() => deleteService(index)} className="text-red-500 font-bold">&times;</button>
                                    </div>
                                ))}
                            </div>
                             <div className="flex gap-2 items-center">
                                <input value={newService.name} onChange={handleNewServiceChange} name="name" placeholder="Hizmet Adı" className="flex-grow p-2 border rounded"/>
                                <input type="number" value={newService.price} onChange={handleNewServiceChange} name="price" placeholder="Fiyat" className="w-20 p-2 border rounded"/>
                                <select value={newService.duration} onChange={handleNewServiceChange} name="duration" className="p-2 border rounded bg-white">
                                    <option value="15">15 dk</option><option value="30">30 dk</option><option value="45">45 dk</option><option value="60">60 dk</option>
                                </select>
                                <button type="button" onClick={addService} className="p-2 bg-sky-500 text-white rounded font-bold">+</button>
                            </div>
                        </div>
                        <div><label className="font-medium">Müsait Günler</label><div className="grid grid-cols-4 gap-2 mt-2">{Object.keys(formData.availableDays).map(day => (<button type="button" key={day} onClick={() => handleDayChange(day)} className={`p-2 rounded text-sm ${formData.availableDays[day] ? 'bg-sky-500 text-white' : 'bg-gray-200'}`}>{day}</button>))}</div></div>
                         <div><label className="font-medium">Çalışma Saatleri</label><div className="grid grid-cols-2 gap-4 mt-2"><input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full p-2 border rounded" /><input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full p-2 border rounded" /></div></div>
                    </div>
                    <button type="submit" className="w-full mt-6 py-3 bg-sky-500 text-white font-bold rounded hover:bg-sky-600">Devam Et</button>
                </form>
            )}
            {step === 2 && (
                 <form onSubmit={handleFinalSubmit}>
                    <h2 className="text-2xl font-bold mb-6">Ödeme Bilgileri</h2>
                    <div className="space-y-4">
                        <select name="subscriptionPlan" value={formData.subscriptionPlan} onChange={handleInputChange} className="w-full p-3 border rounded bg-white"><option value="monthly">Aylık Plan - 99₺</option><option value="yearly">Yıllık Plan - 999₺</option></select>
                        <input name="cardName" onChange={handleInputChange} placeholder="Kart Üzerindeki İsim" className="w-full p-3 border rounded" required />
                        <input name="cardNumber" value={formData.cardNumber} onChange={handleCardNumberChange} placeholder="Kart Numarası" className="w-full p-3 border rounded" required />
                        <div className="grid grid-cols-2 gap-4"><input ref={expiryRef} name="expiryDate" value={formData.expiryDate} onChange={handleExpiryChange} placeholder="Son Kul. Tar. (AA/YY)" className="w-full p-3 border rounded" required /><input ref={cvcRef} name="cvc" type="password" value={formData.cvc} onChange={handleInputChange} placeholder="CVC" className="w-full p-3 border rounded" required maxLength="3" /></div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full mt-6 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-600 disabled:bg-gray-400">{loading ? "İşleniyor..." : "Ödemeyi Tamamla ve Başvur"}</button>
                    <button type="button" onClick={() => setStep(1)} className="w-full mt-2 py-2 text-gray-600">Geri Dön</button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default BecomeProviderPage;
