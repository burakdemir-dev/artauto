import React, { useState, useEffect } from 'react';

const Customers = ({ onStartContract }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal (Form) State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null); // Düzenlenen müşteri ID'si

  const emptyForm = {
    full_name: '', tc_no: '', phone1: '', phone2: '',
    birth_place_and_date: '', nationality: 'T.C.',
    address: '', billing_address: '', current_address: '',
    license_no: '', license_issue_place: '', license_issue_date: '', license_expiry_date: ''
  };

  const [formData, setFormData] = useState(emptyForm);

  const todayStr = new Date().toISOString().split('T')[0];

  // Müşterileri çekme/arama fonksiyonu
  const fetchCustomers = async (term = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Arama hatası:", error);
      setCustomers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers('');
  }, []);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 300);
    return () => clearTimeout(delayTimer);
  }, [searchTerm]);

  const handleOpenAddModal = () => {
    setEditingCustomerId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomerId(cust.id);
    setFormData({
      full_name: cust.full_name || '',
      tc_no: cust.tc_no || '',
      phone1: cust.phone1 || '',
      phone2: cust.phone2 || '',
      birth_place_and_date: cust.birth_place_and_date || '',
      nationality: cust.nationality || 'T.C.',
      address: cust.address || '',
      billing_address: cust.billing_address || '',
      current_address: cust.current_address || '',
      license_no: cust.license_no || '',
      license_issue_place: cust.license_issue_place || '',
      license_issue_date: cust.license_issue_date || '',
      license_expiry_date: cust.license_expiry_date || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`"${name}" isimli müşteriyi silmek istediğinize emin misiniz?`)) return;
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      fetchCustomers(searchTerm);
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    if (['tc_no', 'phone1', 'phone2', 'license_no'].includes(name)) {
      value = value.replace(/\D/g, ''); 
    }

    if (name === 'tc_no' && value.length > 11) value = value.slice(0, 11);
    if ((name === 'phone1' || name === 'phone2') && value.length > 11) value = value.slice(0, 11);
    if (name === 'license_no' && value.length > 10) value = value.slice(0, 10);

    setFormData({ ...formData, [name]: value });
  };

  // Müşteri Kaydetme veya Güncelleme İşlemi
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      alert("Lütfen müşteri adını ve soyadını giriniz.");
      return;
    }

    if (formData.tc_no && formData.tc_no.length !== 11) {
      alert("T.C. Kimlik Numarası tam 11 haneli olmalıdır.");
      return;
    }

    if (formData.phone1 && formData.phone1.length < 10) {
      alert("Gsm 1 (Telefon) numarası en az 10 haneli olmalıdır.");
      return;
    }

    if (formData.license_expiry_date && formData.license_expiry_date < todayStr) {
      alert("Ehliyet bitiş tarihi geçmiş bir tarih seçilemez!");
      return;
    }

    try {
      const url = editingCustomerId ? `/api/customers/${editingCustomerId}` : '/api/customers';
      const method = editingCustomerId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (result.success) {
        alert(editingCustomerId ? "Müşteri bilgileri güncellendi!" : "Müşteri başarıyla kaydedildi!");
        setIsModalOpen(false);
        setEditingCustomerId(null);
        setFormData(emptyForm);
        fetchCustomers(searchTerm);
      } else {
        alert("İşlem Başarısız: " + (result.error || "Bilinmeyen bir hata oluştu."));
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      alert("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '600px', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Müşteri Arama ve Liste</h2>
        <button className="btn-primary" onClick={handleOpenAddModal} style={{ padding: '0.8rem 1.5rem' }}>
          + Yeni Müşteri Kaydı
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder="İsim, T.C. Kimlik veya Telefon Numarası ile anında ara..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%', padding: '1rem 1.5rem', fontSize: '1.1rem',
            borderRadius: '12px', border: '2px solid var(--primary-color)',
            outline: 'none', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s'
          }}
        />
        {loading && <span style={{ position: 'absolute', right: '15px', top: '15px', color: 'var(--text-muted)' }}>Aranıyor...</span>}
      </div>

      <div style={{ marginTop: '1rem' }}>
        {searchTerm !== '' && customers.length === 0 && !loading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            "{searchTerm}" için hiçbir müşteri bulunamadı. Yeni kayıt açabilirsiniz.
          </p>
        )}

        {customers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {customers.map((cust) => (
              <div key={cust.id} style={{ 
                padding: '1rem', background: 'rgba(255,255,255,0.6)', 
                borderRadius: '8px', border: '1px solid var(--surface-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 0.2rem 0', color: 'var(--primary-color)' }}>{cust.full_name}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    TC: {cust.tc_no || '-'} | Tel: {cust.phone1 || '-'} | Ehliyet: {cust.license_no || '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '0.5rem 1rem' }}
                    onClick={() => onStartContract && onStartContract(cust)}
                  >
                    Sözleşme Başlat (Kirala)
                  </button>
                  <button 
                    style={{ 
                      padding: '0.5rem 1rem', background: '#eff6ff', 
                      border: '1px solid #bfdbfe', color: '#1d4ed8', 
                      borderRadius: '8px', cursor: 'pointer', fontWeight: '600' 
                    }}
                    onClick={() => handleOpenEditModal(cust)}
                  >
                    Düzenle
                  </button>
                  <button 
                    style={{ 
                      padding: '0.5rem 1rem', background: '#fee2e2', 
                      border: '1px solid #fecaca', color: '#dc2626', 
                      borderRadius: '8px', cursor: 'pointer', fontWeight: '600' 
                    }}
                    onClick={() => handleDeleteCustomer(cust.id, cust.full_name)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* YENİ MÜŞTERİ EKLEME / DÜZENLEME MODALI */}
      {isModalOpen && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(5px)',
          borderRadius: '16px', padding: '2rem', zIndex: 10,
          display: 'flex', flexDirection: 'column', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>
              {editingCustomerId ? 'Müşteri Bilgilerini Düzenle' : 'Yeni Müşteri Oluştur'}
            </h2>
            <button onClick={() => setIsModalOpen(false)} style={{
              background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--danger-color)'
            }}>✕</button>
          </div>
          
          <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginTop: '1rem' }}>Kişisel Bilgiler</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Adı Soyadı *</label>
                <input type="text" name="full_name" placeholder="Adı Soyadı" required value={formData.full_name} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>T.C. Kimlik No</label>
                <input type="text" name="tc_no" maxLength={11} placeholder="T.C. Kimlik No" value={formData.tc_no} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Doğum Yeri ve Tarihi</label>
                <input type="text" name="birth_place_and_date" placeholder="Doğum Yeri ve Tarihi" value={formData.birth_place_and_date} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Uyruğu</label>
                <input type="text" name="nationality" placeholder="Uyruğu" value={formData.nationality} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>

            <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginTop: '1rem' }}>İletişim Bilgileri</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Gsm 1 *</label>
                <input type="text" name="phone1" maxLength={11} placeholder="Gsm 1" required value={formData.phone1} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Gsm 2</label>
                <input type="text" name="phone2" maxLength={11} placeholder="Gsm 2" value={formData.phone2} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Adres</label>
                <textarea name="address" placeholder="Adres" value={formData.address} onChange={handleInputChange} style={inputStyle} rows="2" />
              </div>
            </div>

            <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginTop: '1rem' }}>Ehliyet Bilgileri</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Ehliyet No</label>
                <input type="text" name="license_no" maxLength={10} placeholder="Ehliyet No" value={formData.license_no} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Verildiği Yer</label>
                <input type="text" name="license_issue_place" placeholder="Verildiği Yer" value={formData.license_issue_place} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Verildiği Tarih</label>
                <input type="date" name="license_issue_date" max={todayStr} value={formData.license_issue_date} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Bitiş Tarihi</label>
                <input type="date" name="license_expiry_date" min={todayStr} value={formData.license_expiry_date} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.8rem 1.5rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
              <button type="submit" className="btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
                {editingCustomerId ? 'Müşteriyi Güncelle' : 'Müşteriyi Kaydet'}
              </button>
            </div>
          </form>

        </div>
      )}
    </div>
  );
};

const labelStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' };

const inputStyle = {
  padding: '0.7rem 1rem',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  outline: 'none',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  width: '100%'
};

export default Customers;
