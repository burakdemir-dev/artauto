import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalCustomers: 0, totalVehicles: 0, activeRentals: 0 });
  const [activeContracts, setActiveContracts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [custRes, vehRes, rentRes] = await Promise.all([
          fetch('/api/customers/search?q='),
          fetch('/api/vehicles'),
          fetch('/api/rentals')
        ]);
        
        const customers = await custRes.json();
        const vehicles = await vehRes.json();
        const rentals = await rentRes.json();

        setStats({
          totalCustomers: Array.isArray(customers) ? customers.length : 0,
          totalVehicles: Array.isArray(vehicles) ? vehicles.length : 0,
          activeRentals: Array.isArray(rentals) ? rentals.length : 0
        });

        if (Array.isArray(rentals)) {
          setActiveContracts(rentals.slice(0, 5));
        }
      } catch (error) {
        console.error("Dashboard verisi çekilemedi", error);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* İstatistik Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          icon="👥" 
          title="Kayıtlı Müşteriler" 
          value={stats.totalCustomers} 
          bgColor="#eff6ff" 
          accentColor="#2563eb" 
        />
        <StatCard 
          icon="🚗" 
          title="Filodaki Araçlar" 
          value={stats.totalVehicles} 
          bgColor="#ecfdf5" 
          accentColor="#059669" 
        />
        <StatCard 
          icon="📄" 
          title="Toplam Sözleşmeler" 
          value={stats.activeRentals} 
          bgColor="#fffbe6" 
          accentColor="#d97706" 
        />
      </div>

      {/* Son Kiralamalar Tablosu */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.25rem', margin: 0, fontWeight: '700' }}>Son Kiralama Hareketleri</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Sistemde oluşturulan en son sözleşmeler</p>
          </div>
        </div>

        {activeContracts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>Henüz kiralama hareketi yok.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '0.8rem 1rem' }}>Müşteri</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Plaka / Araç</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Çıkış Tarihi</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Dönüş Tarihi</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {activeContracts.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--primary-color)' }}>{r.customer_name}</td>
                    <td style={{ padding: '1rem', fontWeight: '700' }}>{r.vehicle_plate} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.85rem' }}>({r.vehicle_brand})</span></td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{r.rent_date || '-'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{r.return_date || '-'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <span style={{ background: '#d1fae5', color: '#047857', padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                        ● Aktif Sözleşme
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

const StatCard = ({ icon, title, value, bgColor, accentColor }) => (
  <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.5rem' }}>
    <div style={{
      width: '54px', height: '54px', borderRadius: '14px', background: bgColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
      flexShrink: 0, boxShadow: `0 4px 12px ${bgColor}`
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{title}</h3>
      <span style={{ fontSize: '2.2rem', fontWeight: '800', color: accentColor, letterSpacing: '-0.5px' }}>{value}</span>
    </div>
  </div>
);

export default Dashboard;
