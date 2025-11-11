# WebRandevu - Online Randevu Sistemi

[cite_start]Bu proje, Fırat Üniversitesi Teknoloji Fakültesi Yazılım Mühendisliği Bölümü [cite: 4, 5, 6] [cite_start]bünyesinde, "YMH212 - Yazılım Gereksinimleri ve Analizi" dersi [cite: 7] kapsamında geliştirilmiş web tabanlı bir online randevu sistemi projesidir.

## 🎯 Projenin Amacı

[cite_start]Projenin temel amacı; berber, psikolog, özel ders öğretmeni veya pansiyon işletmecisi gibi randevu ile çalışan hizmet sağlayıcıları [cite: 19] ile bu hizmetlerden faydalanmak isteyen kullanıcıları tek bir dijital platformda buluşturmaktır.

[cite_start]Sistem, randevu sürecindeki iletişim problemlerini, zamanlama çakışmalarını ve yönetim zorluklarını [cite: 20] [cite_start]ortadan kaldırarak, hem hizmet verenler hem de hizmet alanlar için verimli, şeffaf ve kullanıcı dostu [cite: 19] bir çözüm sunar.

## ✨ Temel Özellikler

* [cite_start]**Rol Bazlı Erişim:** Sistemde "Hizmet Alan", "Hizmet Veren" ve "Admin" olmak üzere üç farklı kullanıcı rolü bulunmaktadır[cite: 251, 726].
* [cite_start]**Dinamik Takvim:** Hizmet verenler kendi çalışma saatlerini ve müsait olmadıkları günleri (tatil vb.) yönetebilir[cite: 462, 745].
* [cite_start]**Hizmet Yönetimi:** Hizmet verenler, sundukları hizmetleri, sürelerini ve fiyatlarını dinamik olarak ekleyip düzenleyebilir[cite: 32, 743].
* **Akıllı Randevu Akışı:** Kullanıcı bir tarih seçtiğinde, sistem o güne ait müsait saatleri listeler. [cite_start]Bir saat seçildiğinde, kalan boşluğa sığabilecek hizmetler dinamik olarak gösterilir[cite: 751, 752, 753].
* [cite_start]**Puanlama ve Değerlendirme:** Hizmet alanlar, tamamlanan randevular sonrası hizmet verenlere 1-10 arası puan verebilir ve yorum yapabilir[cite: 38, 472].
* [cite_start]**Güvenli Randevu Tamamlama:** Randevular, hizmet verenin müşteriden aldığı 6 haneli bir kod ile güvenli bir şekilde tamamlanır[cite: 755, 760].

## 🚀 Kullanılan Teknolojiler

[cite_start]Projenin geliştirilmesinde (Bölüm 4 ve 5'te belirtildiği üzere [cite: 681-765]) modern web teknolojileri kullanılmıştır:

* [cite_start]**Frontend:** React.js [cite: 118, 712]
* [cite_start]**Backend (BaaS):** Google Firebase [cite: 683, 718]
    * [cite_start]**Kimlik Doğrulama:** Firebase Authentication [cite: 719, 736]
    * [cite_start]**Veritabanı:** Firestore (NoSQL Veritabanı) [cite: 720]
* [cite_start]**UI (Arayüz):** Tailwind CSS [cite: 714]
* [cite_start]**Durum Yönetimi (State Management):** React Context API [cite: 715]
* [cite_start]**Versiyon Kontrolü:** Git & GitHub [cite: 122]

<img width="1901" height="861" alt="Ekran görüntüsü 2025-11-11 191823" src="https://github.com/user-attachments/assets/6bf6df74-b1b3-4654-96cf-1069645468f2" />
<img width="1901" height="869" alt="Ekran görüntüsü 2025-11-11 191757" src="https://github.com/user-attachments/assets/e226886b-51a4-4491-bf5b-f80ae96fd4e1" />
<img width="1919" height="868" alt="Ekran görüntüsü 2025-11-11 191726" src="https://github.com/user-attachments/assets/5c11deee-6224-4fa6-8422-898c9f09740a" />
