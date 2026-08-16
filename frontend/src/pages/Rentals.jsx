import React, { useState, useEffect } from 'react';

const Rentals = ({ preSelectedCustomer, clearPreSelected }) => {
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRental, setViewingRental] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0]; // Resmi evrak inceleme modalı için

  // Form State
  const [formData, setFormData] = useState({
    customer_id: '', vehicle_id: '', 
    rent_date: '', departure_time: '', return_date: '', return_time: '',
    departure_km: '', return_km: '', departure_range: '', return_range: '',
    daily_price: '', total_days: '',
    has_ruhsat: false, has_kriko: false, has_stepne: false, has_trafik_cantasi: false, has_teyp: false, has_flash_bellek: false,
    payment_date: '', amount: '', due_date: '', promissory_note_no: '', guarantor_name: '', guarantor_tc: '', guarantor_address: ''
  });

  const fetchInitialData = async () => {
    try {
      const [rentalsRes, customersRes, vehiclesRes] = await Promise.all([
        fetch('/api/rentals'),
        fetch('/api/customers/search?q='),
        fetch('/api/vehicles')
      ]);
      const rData = await rentalsRes.json();
      const cData = await customersRes.json();
      const vData = await vehiclesRes.json();
      setRentals(Array.isArray(rData) ? rData : []);
      setCustomers(Array.isArray(cData) ? cData : []);
      setVehicles(Array.isArray(vData) ? vData.filter(v => v.status === 'Boşta') : []);
    } catch (error) {
      console.error("Veriler çekilemedi:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (preSelectedCustomer) {
      setIsModalOpen(true);
      setFormData(prev => ({ ...prev, customer_id: preSelectedCustomer.id }));
    }
  }, [preSelectedCustomer]);

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'guarantor_tc') {
      finalValue = finalValue.replace(/\D/g, '').slice(0, 11);
    }

    const updated = { ...formData, [name]: finalValue };

    // Otomatik gün sayısı hesaplama
    if (updated.rent_date && updated.return_date) {
      const d1 = new Date(updated.rent_date);
      const d2 = new Date(updated.return_date);
      const diffDays = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      updated.total_days = diffDays > 0 ? diffDays : 1;
    }

    setFormData(updated);
  };

  const handleSaveRental = async (e) => {
    e.preventDefault();

    if (formData.rent_date && formData.rent_date < todayStr) {
      alert("Hata: Araç çıkış tarihi geçmiş bir tarih olamaz!");
      return;
    }

    if (formData.return_date && formData.return_date < (formData.rent_date || todayStr)) {
      alert("Hata: Araç dönüş tarihi, çıkış tarihinden veya bugünden daha eski bir tarih olamaz!");
      return;
    }

    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        alert("Sözleşme başarıyla oluşturuldu ve arşive kaydedildi!");
        setIsModalOpen(false);
        if (clearPreSelected) clearPreSelected();
        fetchInitialData();
      } else {
        alert("Hata: " + result.error);
      }
    } catch (error) {
      alert("Bağlantı hatası");
    }
  };

  const handleDeleteRental = async (id) => {
    if (!window.confirm("Bu sözleşmeyi silmek istediğinize emin misiniz? Araç tekrar 'Boşta' durumuna geçecektir.")) return;
    try {
      await fetch(`/api/rentals/${id}`, { method: 'DELETE' });
      fetchInitialData();
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  const handlePrint = (rental) => {
    setViewingRental(rental);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // İsim ayırma yardımcıları (Ad / Soyad)
  const getFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(' ');
  };

  const getLastName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return '';
    return parts[parts.length - 1];
  };

  const filteredRentals = rentals.filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
      (r.vehicle_plate && r.vehicle_plate.toLowerCase().includes(q)) ||
      (r.customer_tc && r.customer_tc.includes(q)) ||
      (r.id && r.id.toString().includes(q))
    );
  });

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '600px' }}>
      
      {/* Sadece Ekranda Görünen Kısım (Yazdırırken Gizlenir) */}
      <div className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Sözleşmeler ve Dijital Arşiv</h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tüm resmi kiralama sözleşmeleri ve senet evrakları veritabanında güvenle saklanır.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Yeni Sözleşme Oluştur</button>
        </div>

        {/* Arama Kutusu */}
        <div style={{ marginTop: '1.5rem' }}>
          <input 
            type="text" 
            placeholder="Müşteri Adı, T.C., Plaka veya Sözleşme No ile evraklarda ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '0.9rem 1.2rem', fontSize: '1rem',
              borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none'
            }}
          />
        </div>

        {/* Sözleşme Listesi */}
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRentals.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              {searchTerm ? `"${searchTerm}" aramasına uygun sözleşme bulunamadı.` : 'Henüz oluşturulmuş kiralama sözleşmesi yok.'}
            </p>
          )}
          {filteredRentals.map(r => (
            <div key={r.id} style={{
              background: 'rgba(255,255,255,0.7)', padding: '1.2rem', borderRadius: '12px',
              border: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                  <span style={{ background: '#1e40af', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    SÖZLEŞME #{r.id}
                  </span>
                  <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>{r.customer_name}</h3>
                </div>
                <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Plaka: <strong>{r.vehicle_plate}</strong> ({r.vehicle_brand}) | Çıkış: {r.rent_date || '-'} | Dönüş: {r.return_date || '-'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setViewingRental(r)}
                  style={{
                    padding: '0.6rem 1rem', background: '#eff6ff', border: '1px solid #bfdbfe',
                    color: '#1d4ed8', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem'
                  }}
                >
                  📄 Evrakı Gör / PDF
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => handlePrint(r)}
                  style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                >
                  🖨️ Yazdır (A4)
                </button>
                <button 
                  onClick={() => handleDeleteRental(r.id)}
                  style={{
                    padding: '0.6rem 0.8rem', background: '#fee2e2', border: '1px solid #fecaca',
                    color: '#dc2626', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem'
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* YENİ SÖZLEŞME MODALI (NO-PRINT) */}
      {isModalOpen && (
        <div className="no-print" style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(5px)',
          borderRadius: '16px', padding: '2rem', zIndex: 10, overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>Yeni Kira Sözleşmesi Oluştur</h2>
            <button onClick={() => setIsModalOpen(false)} style={{background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--danger-color)'}}>✕</button>
          </div>
          
          <form onSubmit={handleSaveRental} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>Müşteri (Kiracı) Seç *</label>
                <select name="customer_id" required value={formData.customer_id} onChange={handleInputChange} style={inputStyle}>
                  <option value="">Seçiniz...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.tc_no || 'TC Yok'})</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>Araç Seç (Boşta Olanlar) *</label>
                <select name="vehicle_id" required value={formData.vehicle_id} onChange={handleInputChange} style={inputStyle}>
                  <option value="">Seçiniz...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.brand_model}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div><label style={labelStyle}>Çıkış Tarihi</label><input type="date" name="rent_date" min={todayStr} value={formData.rent_date} onChange={handleInputChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Saat</label><input type="time" name="departure_time" value={formData.departure_time} onChange={handleInputChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Dönüş Tarihi</label><input type="date" name="return_date" min={formData.rent_date || todayStr} value={formData.return_date} onChange={handleInputChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Saat</label><input type="time" name="return_time" value={formData.return_time} onChange={handleInputChange} style={inputStyle} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
              <div><label style={labelStyle}>Çıkış KM</label><input type="number" name="departure_km" value={formData.departure_km} onChange={handleInputChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Dönüş KM</label><input type="number" name="return_km" value={formData.return_km} onChange={handleInputChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Çıkış Menzil (Km)</label><input type="number" name="departure_range" value={formData.departure_range} onChange={handleInputChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Günlük Ücret (TL)</label><input type="number" name="daily_price" value={formData.daily_price} onChange={handleInputChange} style={inputStyle} /></div>
            </div>

            <h4 style={{marginTop: '0.8rem', borderBottom: '1px solid #ddd', paddingBottom: '0.3rem', margin: 0}}>Araç Teslim Ekipmanları</h4>
            <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
              <label style={checkLabelStyle}><input type="checkbox" name="has_ruhsat" checked={formData.has_ruhsat} onChange={handleInputChange}/> Ruhsat</label>
              <label style={checkLabelStyle}><input type="checkbox" name="has_kriko" checked={formData.has_kriko} onChange={handleInputChange}/> Kriko Takımı</label>
              <label style={checkLabelStyle}><input type="checkbox" name="has_stepne" checked={formData.has_stepne} onChange={handleInputChange}/> Stepne</label>
              <label style={checkLabelStyle}><input type="checkbox" name="has_trafik_cantasi" checked={formData.has_trafik_cantasi} onChange={handleInputChange}/> Trafik Çantası</label>
              <label style={checkLabelStyle}><input type="checkbox" name="has_teyp" checked={formData.has_teyp} onChange={handleInputChange}/> Teyp</label>
              <label style={checkLabelStyle}><input type="checkbox" name="has_flash_bellek" checked={formData.has_flash_bellek} onChange={handleInputChange}/> Flash Bellek</label>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.9rem', marginTop: '1rem', fontSize: '1.1rem' }}>
              💾 Sözleşmeyi Oluştur ve Kaydet
            </button>
          </form>
        </div>
      )}

      {/* MATBU FİZİKSEL EVRAK GÖRÜNÜMÜ VE PRİNT MODALI */}
      {viewingRental && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: '850px', maxHeight: '98vh',
            borderRadius: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            
            {/* Üst Toolbar (Yazdırırken Gizlenir) */}
            <div className="no-print" style={{
              padding: '0.8rem 1.5rem', background: '#0f172a', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, zIndex: 30
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                RESMİ KİRA SÖZLEŞMESİ VE SENET EVRAKI (#ART-{viewingRental.id})
              </span>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button 
                  onClick={() => window.print()} 
                  style={{ padding: '0.5rem 1.2rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🖨️ Yazdır (A4) / PDF Kaydet
                </button>
                <button 
                  onClick={() => setViewingRental(null)} 
                  style={{ padding: '0.5rem 1rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  ✕ Kapat
                </button>
              </div>
            </div>

            {/* RESMİ MATBU EVRAK ÇIKTISI (BİREBİR MATBU EVRAK TASARIMI) */}
            <div className="print-only-container" style={{ padding: '12px 20px', color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '10.5px', background: '#fff', boxSizing: 'border-box' }}>
              
              {/* HEADER (SİDAR ARİTÜRK / ART AUTO) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textTransform: 'uppercase' }}>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#1d4ed8', letterSpacing: '-0.5px' }}>ART AUTO</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', color: '#1e293b' }}>OTO KİRALAMA</div>
                    <div style={{ color: '#eab308', fontSize: '12px' }}>★★★</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '10px', lineHeight: '1.3' }}>
                  <strong style={{ fontSize: '13px' }}>Sidar ARİTÜRK</strong><br/>
                  Tel: 0542 287 10 71<br/>
                  Tel: 0534 604 68 95<br/>
                  <span style={{ fontSize: '9px' }}>Belde Mah. Sosin Cad. Demircioğlu Apt. Altı No:10/D Merkez/BATMAN</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>KİRA SÖZLEŞMESİ</h2>
                  <div style={{ marginTop: '5px', fontSize: '11px' }}>
                    <strong>TARİH:</strong> {viewingRental.rent_date || '......../......../20........'}
                  </div>
                </div>
              </div>

              {/* ANA İKİ KOLONLU TABLO (BİREBİR HİZALAMA) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '10px', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    {/* SOL KOLON: FATURA, KİRACI, EHLİYET VE MADDELER */}
                    <td style={{ width: '50%', borderRight: '1.5px solid #000', verticalAlign: 'top', padding: '5px', boxSizing: 'border-box' }}>
                      <div style={{ marginBottom: '5px' }}>
                        <strong>Fatura Adresi :</strong> {viewingRental.customer_address || '...............................................................................................'}
                      </div>
                      
                      <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginBottom: '5px' }}>
                        <strong style={{ fontSize: '11px', textDecoration: 'underline' }}>KİRACI</strong><br/>
                        <strong>Adı Soyadı :</strong> {viewingRental.customer_name}<br/>
                        <strong>T.C. No :</strong> {viewingRental.customer_tc || '......................................................................................'}<br/>
                        <strong>Adres :</strong> {viewingRental.customer_address || '......................................................................................'}
                      </div>

                      <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginBottom: '5px' }}>
                        <strong>Bulunacak Adres :</strong> .......................................................................................
                      </div>

                      <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginBottom: '5px' }}>
                        <strong>Gsm :</strong> {viewingRental.customer_phone || '................................................'}<br/>
                        <strong>Gsm :</strong> ................................................................
                      </div>

                      {/* Ehliyet Tablosu */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '4px', fontSize: '9.5px' }}>
                        <tbody>
                          <tr>
                            <td style={innerTd}><strong>Ehliyet No:</strong> {viewingRental.license_no}</td>
                            <td style={innerTd}><strong>Verildiği Tarih:</strong> {viewingRental.license_issue_date}</td>
                          </tr>
                          <tr>
                            <td style={innerTd}><strong>Verildiği Yer:</strong> {viewingRental.license_issue_place}</td>
                            <td style={innerTd}><strong>Bitiş Tarihi:</strong> {viewingRental.license_expiry_date}</td>
                          </tr>
                          <tr>
                            <td style={innerTd}><strong>Doğum Yeri/Tarihi:</strong> {viewingRental.birth_place_and_date}</td>
                            <td style={innerTd}><strong>Uyruğu:</strong> {viewingRental.nationality || 'T.C.'}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* SÖZLEŞME MADDELERİ */}
                      <div style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', marginTop: '5px', lineHeight: '1.2' }}>
                        <p style={{ margin: '0 0 2px 0' }}>* Araç motor arızası kiraya gittikten 30 dk. sonra arıza tespit edildiği takdirde masraf müşteriye aittir.</p>
                        <p style={{ margin: '0 0 2px 0' }}>* Araç kirada iken hiçbir şekilde suç unsuru mal, evrak ve yasa dışı hizmet yapamaz. Yapıldığı takdirde ara. sözleşmesinde ismi geçen kişiye dava açılacaktır.</p>
                        <p style={{ margin: '0 0 2px 0' }}>* Araç kaza halinde aracın hiçbir sorumluluğu kabul edilmemektedir. Yapılacak tüm masraflar adı geçen kiracıya aittir.</p>
                        <p style={{ margin: '0 0 2px 0' }}>* Tüm araçlarımız hiçbir şekilde herhangi bir sigorta teminatı altında değildir.</p>
                        <p style={{ margin: '0 0 2px 0' }}>* Araç kaza halinde ölüm, sakatlık v.b. maddi ve manevi hasar, tedavi giderleri tarafımıza ait değildir. Kiracıya aittir.</p>
                        <p style={{ margin: '0 0 2px 0' }}>* Araç 18 yaş üstü ehliyeti olup ve akli dengesi yerinde olan vatandaşlara kiraya verilmektedir. Bunun üzerine kişinin ailesi veya yakını bizden hiçbir şekilde hak talep edemez.</p>
                        <p style={{ margin: '0 0 2px 0' }}>* Araç kiracı dışında herhangi biri tarafından kullanılamaz. Kullanıldığı takdirde herhangi bir sorumluluk kabul edilmez ve sorumlusu kiracıdır.</p>
                        <p style={{ margin: '0 0 2px 0' }}>* Araç kaza ve bozulması halinde sanayide kaldığı süreçte kira bedeli gün bazında kiracıdan alınır.</p>
                        <p style={{ margin: '0 0 2px 0' }}>* Araç yıpranma ücretleri yukarıda belirtilen şekildedir.</p>
                        <p style={{ margin: '0 0 2px 0' }}>* Araç kiraya çıktıktan sonra olabilecek hiçbir sorumluluk altında değiliz. Olabilecek tüm sorun ve giderler kiracıya aittir.</p>
                        <strong style={{ display: 'block', marginTop: '2px', fontSize: '8.5px' }}>NOT: ARAÇLARIMIZ KASKOSUZDUR.</strong>
                      </div>

                      {/* KİRACI İMZA KUTUSU */}
                      <div style={{ border: '1px solid #000', padding: '4px', marginTop: '5px', fontSize: '9px' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '8px' }}>Sözleşme gereği tüm maddeleri okudum ve kabul ediyorum. Aksi takdirde tarafıma açılacak suçlamaları kabul ediyorum.</p>
                        <strong>Adı, Soyadı :</strong> {viewingRental.customer_name}<br/>
                        <strong>İmza :</strong>
                      </div>
                    </td>

                    {/* SAĞ KOLON: KEFİL, ARAÇ, HASAR ŞEMASI (ORİJİNAL BASILI MATBU RESMİ), EKİPMANLAR */}
                    <td style={{ width: '50%', verticalAlign: 'top', padding: '5px', boxSizing: 'border-box' }}>
                      <div style={{ borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '3px' }}>
                        <strong style={{ fontSize: '10.5px', textDecoration: 'underline' }}>KEFİLİN</strong><br/>
                        <strong>Adı, Soyadı :</strong> {viewingRental.guarantor_name || '.....................................................................'}<br/>
                        <strong>T.C. No :</strong> {viewingRental.guarantor_tc || '.....................................................................'}<br/>
                        <strong>Kefilin İmzası :</strong>
                      </div>

                      <div style={{ marginBottom: '3px' }}>
                        <strong>Araç Sahibi :</strong> {viewingRental.vehicle_owner || '................................................'}<br/>
                        <strong>Araç Plakası :</strong> <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{viewingRental.vehicle_plate}</span> ({viewingRental.vehicle_brand})
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9.5px', marginBottom: '3px' }}>
                        <tbody>
                          <tr>
                            <td style={innerTd}><strong>Kiralandığı Tarih:</strong> {viewingRental.rent_date}</td>
                            <td style={innerTd}><strong>Saat:</strong> {viewingRental.departure_time}</td>
                          </tr>
                          <tr>
                            <td style={innerTd}><strong>Dönüş Tarihi:</strong> {viewingRental.return_date}</td>
                            <td style={innerTd}><strong>Saat:</strong> {viewingRental.return_time}</td>
                          </tr>
                          <tr>
                            <td style={innerTd}><strong>Çıkış Km:</strong> {viewingRental.departure_km}</td>
                            <td style={innerTd}><strong>Dönüş Km:</strong> {viewingRental.return_km}</td>
                          </tr>
                          <tr>
                            <td style={innerTd}><strong>Çıkış Menzil:</strong> {viewingRental.departure_range} Km.</td>
                            <td style={innerTd}><strong>Dönüş Menzil:</strong> {viewingRental.return_range} Km.</td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11px', marginBottom: '3px' }}>
                        ({viewingRental.total_days ? viewingRental.total_days : '...'}) Günlük {viewingRental.daily_price ? `${Number(viewingRental.daily_price).toLocaleString('tr-TR')} TL` : '.................. TL'}
                      </div>

                      {/* MATBU ARAÇ HASAR VE YIPRANMA KUTUSU (BİREBİR ORİJİNAL MATBU TARAMA RESMİ İLE) */}
                      <div style={{ border: '1px solid #000', padding: '3px', fontSize: '8px', marginBottom: '3px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'stretch' }}>
                          
                          {/* ORİJİNAL KAĞITTAKİ %100 GERÇEK TARANMIŞ ARAÇ HASAR ŞEMASI RESMİ */}
                          <div style={{ width: '145px', textAlign: 'center', flexShrink: 0 }}>
                            <img 
                              src="/car_diagram.png" 
                              alt="Orijinal Araç Hasar Şeması" 
                              style={{ width: '140px', height: 'auto', display: 'block', margin: '0 auto', mixBlendMode: 'multiply' }} 
                            />
                          </div>

                          {/* YIPRANMA ÜCRETLERİ VE MADDELER KUTUSU */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ background: '#1e3a8a', color: '#fff', textAlign: 'center', fontWeight: 'bold', padding: '2px', fontSize: '8.5px' }}>
                              ARABA YIPRANMA ÜCRETLERİDİR
                            </div>
                            
                            <div style={{ fontSize: '7.5px', lineHeight: '1.35', margin: '2px 0' }}>
                              <strong>1 - Kaput</strong> : 60.000 TL<br/>
                              <strong>2 - Çamurluk</strong> : 30.000 TL<br/>
                              <strong>3 - Tavan</strong> : 100.000 TL<br/>
                              <strong>4 - Kapı</strong> : 50.000 TL<br/>
                              <strong>5 - Bagaj</strong> : 50.000 TL
                            </div>

                            <div style={{ background: '#1e3a8a', color: '#fff', textAlign: 'center', fontWeight: 'bold', padding: '2px', fontSize: '7.5px' }}>
                              Araba Bozulması Müşteriye Aittir.
                            </div>
                          </div>

                        </div>

                        <div style={{ fontSize: '7px', textAlign: 'center', marginTop: '2px', borderTop: '1px solid #000', paddingTop: '2px' }}>
                          <strong>Araç Günlük Kota 250 Km.'dir.</strong> Km. Aşım Ücreti Günlük Kira Bazında 1 Km. Başına 12.00 TL'dir
                        </div>
                      </div>

                      {/* EKİPMAN CHECKBOX TABLOSU */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9.5px', marginBottom: '3px' }}>
                        <tbody>
                          <tr><td style={innerTd}>Ruhsat</td><td style={{ ...innerTd, width: '25px', textAlign: 'center' }}>{viewingRental.has_ruhsat ? '✓' : ''}</td></tr>
                          <tr><td style={innerTd}>Kriko Takımı</td><td style={{ ...innerTd, width: '25px', textAlign: 'center' }}>{viewingRental.has_kriko ? '✓' : ''}</td></tr>
                          <tr><td style={innerTd}>Stepne</td><td style={{ ...innerTd, width: '25px', textAlign: 'center' }}>{viewingRental.has_stepne ? '✓' : ''}</td></tr>
                          <tr><td style={innerTd}>Trafik Çantası</td><td style={{ ...innerTd, width: '25px', textAlign: 'center' }}>{viewingRental.has_trafik_cantasi ? '✓' : ''}</td></tr>
                          <tr><td style={innerTd}>Teyp</td><td style={{ ...innerTd, width: '25px', textAlign: 'center' }}>{viewingRental.has_teyp ? '✓' : ''}</td></tr>
                          <tr><td style={innerTd}>Flash Bellek</td><td style={{ ...innerTd, width: '25px', textAlign: 'center' }}>{viewingRental.has_flash_bellek ? '✓' : ''}</td></tr>
                        </tbody>
                      </table>

                      <div style={{ background: '#000', color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: '8.5px', padding: '2px', marginBottom: '3px' }}>
                        ARAÇLARIMIZ KASKOLU DEĞİLDİR.
                      </div>

                      {/* TESLİM EDEN / ALAN İMZA */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9px' }}>
                        <tbody>
                          <tr>
                            <td style={{ ...innerTd, width: '50%' }}>
                              <strong>Aracı Teslim Eden</strong><br/>
                              <strong>Ad:</strong> ........................................<br/>
                              <strong>Soyad:</strong> ........................................<br/>
                              <strong>İmza:</strong>
                            </td>
                            <td style={{ ...innerTd, width: '50%' }}>
                              <strong>Aracı Teslim Alan</strong><br/>
                              <strong>Ad:</strong> {getFirstName(viewingRental.customer_name)}<br/>
                              <strong>Soyad:</strong> {getLastName(viewingRental.customer_name)}<br/>
                              <strong>İmza:</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ALT BÖLÜM: ORİJİNAL FİZİKSEL MATBU SENET (TAMAMEN MANUEL ELLE DOLDURMA ALANI) */}
              <div style={{ border: '2px solid #000', marginTop: '6px', padding: '5px', fontSize: '9.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '5px', fontWeight: 'bold', fontSize: '9px' }}>
                  <span>ÖDEME TARİHİ : ......../......../20........</span>
                  <span>MEBLAĞ : ................................</span>
                  <span>VADE : ................................</span>
                  <span>SENET NO : ................................</span>
                </div>

                <div style={{ lineHeight: '1.6', fontSize: '9px' }}>
                  İş bu emre muharrer senedim .................................................... mukabilinde ......../......../20........ tarihinde<br/>
                  Sayın : ............................................................................ veyahut emruhavale ........................................................<br/>
                  yukarıda yazılı yalnız .................................................... TL. ........................................ krş. ödeyeceği ........................<br/>
                  bedeli malen ahzolunmuştur. İş bu bono vadesinde ödenmediği takdirde müteakip bonoların da muaccoliyeti kesbedeceğini, ihtilaf vukuunda ................................. Mahkemelerinin selahiyetini şimdiden kabul eyler ............
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px' }}>
                  <div style={{ width: '55%' }}>
                    <strong>BORÇLU :</strong><br/>
                    <strong>Adı, Soyadı :</strong> ....................................................<br/>
                    <strong>Adresi :</strong> ........................................................................................................<br/><br/>
                    <strong>Kefil :</strong> ....................................................<br/>
                    <strong>Adres :</strong> ........................................................................................................
                  </div>

                  <div style={{ width: '40%', textAlign: 'right' }}>
                    <strong>Keşide Yeri :</strong> ............................<br/>
                    <strong>Tarih :</strong> ......../......../20........<br/><br/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span><strong>İmza</strong></span>
                      <span><strong>Kefil İmza</strong></span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

const innerTd = { border: '1px solid #000', padding: '2px 4px', verticalAlign: 'top' };
const inputStyle = { padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', width: '100%', fontSize: '0.9rem' };
const labelStyle = { fontSize: '0.8rem', color: 'var(--text-muted)' };
const checkLabelStyle = { fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' };

export default Rentals;
