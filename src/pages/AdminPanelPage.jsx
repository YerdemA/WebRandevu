// src/pages/AdminPanelPage.jsx

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useNotification } from '../context/NotificationContext';

const AdminPanelPage = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state'leri
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'Hizmet Veren Adayı'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const applicantsData = [];
      querySnapshot.forEach((doc) => {
        applicantsData.push({ id: doc.id, ...doc.data() });
      });
      setApplicants(applicantsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (userId) => {
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        role: 'Hizmet Veren',
        'businessProfile.badgeStatus': 'approved'
      });
      showNotification('Kullanıcı başarıyla onaylandı!', 'success');
    } catch (error) {
      console.error("Onaylama hatası:", error);
      showNotification('Onaylama sırasında bir hata oluştu.', 'error');
    }
  };

  const openRejectModal = (user) => {
    setSelectedUser(user);
    setIsRejectModalOpen(true);
  };
  
  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      showNotification('Lütfen bir ret sebebi girin.', 'warning');
      return;
    }
    const userDocRef = doc(db, 'users', selectedUser.id);
    try {
        const batch = writeBatch(db);
        batch.update(userDocRef, {
            role: 'Hizmet Alan',
            'businessProfile.badgeStatus': 'rejected',
            'businessProfile.rejectionReason': rejectionReason
        });
        await batch.commit();
        showNotification('Kullanıcı başvurusu reddedildi.', 'success');
        setIsRejectModalOpen(false);
        setRejectionReason('');
        setSelectedUser(null);
    } catch (error) {
       console.error("Reddetme hatası:", error);
       showNotification('Reddetme sırasında bir hata oluştu.', 'error');
    }
  };

  if (loading) {
    return <div className="text-center mt-40">Başvurular yükleniyor...</div>;
  }

  // Detay Modalı için Yardımcı Component
  const DetailRow = ({ label, value }) => (
    <div className="border-b py-2">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
    </div>
  );

  return (
    <>
      <div className="container mx-auto mt-28 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800">Admin Paneli</h1>
          <p className="mt-2 text-gray-600">Onay Bekleyen Hizmet Veren Başvuruları</p>
          
          <div className="mt-6 space-y-4">
            {applicants.length > 0 ? (
              applicants.map(user => (
                <div key={user.id} className="border p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="font-bold text-lg">{user.businessProfile?.name}</p>
                    <p>{user.firstName} {user.lastName} ({user.email})</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openDetailsModal(user)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Detaylar</button>
                    <button onClick={() => handleApprove(user.id)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Onayla</button>
                    <button onClick={() => openRejectModal(user)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Reddet</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Onay bekleyen yeni başvuru bulunmuyor.</p>
            )}
          </div>
        </div>
      </div>

      {/* Detay Modalı */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">Başvuru Detayları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Kişisel Bilgiler */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-sky-700">Kişisel Bilgiler</h3>
                    <DetailRow label="Ad Soyad" value={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                    <DetailRow label="E-posta" value={selectedUser.email} />
                </div>
                {/* İşletme Bilgileri */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-sky-700">İşletme Bilgileri</h3>
                    <DetailRow label="İşletme Adı" value={selectedUser.businessProfile.name} />
                    <DetailRow label="Seans Ücreti" value={`${selectedUser.businessProfile.sessionFee} ₺`} />
                    <DetailRow label="Seans Süresi" value={`${selectedUser.businessProfile.sessionDuration} Dakika`} />
                    <DetailRow label="Çalışma Saatleri" value={`${selectedUser.businessProfile.availability.hours.start} - ${selectedUser.businessProfile.availability.hours.end}`} />
                </div>
                <div className="md:col-span-2">
                    <DetailRow label="Hizmet Açıklaması" value={selectedUser.businessProfile.description} />
                </div>
                <div className="md:col-span-2">
                    <DetailRow label="Adres" value={selectedUser.businessProfile.address} />
                </div>
                 <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Müsait Günler</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(selectedUser.businessProfile.availability.days)
                            .filter(([day, isAvailable]) => isAvailable)
                            .map(([day]) => (
                                <span key={day} className="bg-sky-100 text-sky-800 px-2 py-1 text-sm rounded-full">{day}</span>
                            ))
                        }
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setIsDetailsModalOpen(false)} className="px-5 py-2 bg-gray-200 rounded hover:bg-gray-300">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Ret Sebebi Modalı */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Başvuruyu Reddet</h2>
            <p className='mb-2'><strong>Kullanıcı:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Lütfen ret sebebini buraya yazın..."
              className="w-full p-2 border rounded h-28"
            />
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">İptal</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-500 text-white rounded">Reddi Onayla</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanelPage;
