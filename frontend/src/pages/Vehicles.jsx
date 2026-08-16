import React, { useState, useEffect } from 'react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ plate: '', brand_model: '', owner: '', status: 'Boşta' });

  // Araçları backend'den çek
  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      setVehicles(data);
    } catch (error) {
      console.error("Araçlar yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Yeni Araç Kaydet
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        setIsModalOpen(false);
        setFormData({ plate: '', brand_model: '', owner: '', status: 'Boşta' });
        fetchVehicles();
      } else {
        alert("Hata: " + result.error);
      }
    } catch (error) {
      alert("Bağlantı hatası");
    }
  };

  // Tek Tuşla Araç Durumu Güncelle (Boşta, Bakımda, Kirada)
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/vehicles/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        fetchVehicles(); // Listeyi anında yenile
      } else {
        alert("Durum güncellenemedi: " + result.error);
      }
    } catch (error) {
      console.error("Durum güncelleme hatası:", error);
    }
  };

  // Aracı Sil
  const handleDelete = async (id) => {
    if (!window.confirm("Bu aracı filodan silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      fetchVehicles();
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  // Duruma göre etiket rengi belirleme
  const getStatusStyle = (status) => {
    if (status === 'Kirada') return { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
    if (status === 'Bakımda') return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
    return { background: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0' }; // Boşta
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '600px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Araç Filosu</h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Araç durumlarını (Boşta, Kirada, Bakımda) tek tuşla değiştirebilirsiniz.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Yeni Araç Ekle</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem', marginTop: '1rem' }}>
        {vehicles.length === 0 && <p style={{color: 'var(--text-muted)'}}>Henüz sisteme araç eklenmemiş.</p>}
        {vehicles.map(v => (
          <div key={v.id} style={{
            background: 'rgba(255,255,255,0.7)', padding: '1.5rem', borderRadius: '12px',
            border: '1px solid var(--surface-border)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary-color)' }}>{v.plate}</h3>
                <button onClick={() => handleDelete(v.id)} title="Aracı Sil" style={{
                  background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626',
                  borderRadius: '6px', cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '0.85rem'
                }}>Sil</button>
              </div>

              <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-main)', fontWeight: '600' }}>{v.brand_model}</p>
              <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', color: '#64748b' }}>Ruhsat Sahibi: {v.owner || '-'}</p>
              
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700',
                  ...getStatusStyle(v.status)
                }}>
                  ● {v.status}
                </span>
              </div>
            </div>

            {/* TEK TUŞLA DURUM DEĞİŞTİRME BUTONLARI */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.8rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>
                Hızlı Durum Değiştir:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button 
                  onClick={() => handleUpdateStatus(v.id, 'Boşta')}
                  style={{
                    flex: 1, padding: '0.45rem', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                    background: v.status === 'Boşta' ? '#10b981' : '#f1f5f9',
                    color: v.status === 'Boşta' ? '#fff' : '#475569',
                    border: v.status === 'Boşta' ? 'none' : '1px solid #cbd5e1'
                  }}
                >
                  ✓ Boşta Yap
                </button>

                <button 
                  onClick={() => handleUpdateStatus(v.id, 'Bakımda')}
                  style={{
                    flex: 1, padding: '0.45rem', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                    background: v.status === 'Bakımda' ? '#ef4444' : '#f1f5f9',
                    color: v.status === 'Bakımda' ? '#fff' : '#475569',
                    border: v.status === 'Bakımda' ? 'none' : '1px solid #cbd5e1'
                  }}
                >
                  🛠️ Bakıma Al
                </button>

                <button 
                  onClick={() => handleUpdateStatus(v.id, 'Kirada')}
                  style={{
                    flex: 1, padding: '0.45rem', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                    background: v.status === 'Kirada' ? '#f59e0b' : '#f1f5f9',
                    color: v.status === 'Kirada' ? '#fff' : '#475569',
                    border: v.status === 'Kirada' ? 'none' : '1px solid #cbd5e1'
                  }}
                >
                  🔑 Kirada Yap
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(5px)',
          borderRadius: '16px', padding: '2rem', zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>Yeni Araç Ekle</h2>
            <button onClick={() => setIsModalOpen(false)} style={{background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--danger-color)'}}>✕</button>
          </div>
          
          <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" name="plate" placeholder="Plaka (Örn: 34 ABC 123) *" required value={formData.plate} onChange={handleInputChange} style={inputStyle} />
            <input type="text" name="brand_model" placeholder="Marka & Model (Örn: Renault Megane)" required value={formData.brand_model} onChange={handleInputChange} style={inputStyle} />
            <input type="text" name="owner" placeholder="Araç Sahibi (Ruhsat Sahibi)" value={formData.owner} onChange={handleInputChange} style={inputStyle} />
            
            <select name="status" value={formData.status} onChange={handleInputChange} style={inputStyle}>
              <option value="Boşta">Boşta (Kiralanabilir)</option>
              <option value="Bakımda">Bakımda</option>
              <option value="Kirada">Kirada</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0.8rem 2rem' }}>Kaydet</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1',
  outline: 'none', fontSize: '0.95rem', fontFamily: 'inherit', width: '100%'
};

export default Vehicles;
