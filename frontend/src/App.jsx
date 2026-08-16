import React, { useState } from 'react';
import './index.css';
import Customers from './pages/Customers';
import Vehicles from './pages/Vehicles';
import Rentals from './pages/Rentals';
import Dashboard from './pages/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('artauto_active_tab') || 'dashboard';
  });

  const [selectedCustomerForRental, setSelectedCustomerForRental] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('artauto_active_tab', tab);
  };

  const handleStartContractFromCustomer = (customer) => {
    setSelectedCustomerForRental(customer);
    handleTabChange('rentals');
  };

  return (
    <div className="app-container">
      {/* Sol Menü (Modern Slate Navy Sidebar) */}
      <aside className="sidebar">
        <div>
          {/* Marka / Logo Header */}
          <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '2rem' }}>
            <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '12px', width: '100%', display: 'flex', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <img src="/art_auto_logo.png" alt="ART AUTO" style={{ maxHeight: '42px', width: 'auto', display: 'block' }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: '0.2rem', paddingLeft: '0.2rem' }}>
              OTO KİRALAMA PANELİ
            </div>
          </div>

          <div className="nav-section-title">Ana Menü</div>
          
          <nav>
            <div 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
              onClick={() => handleTabChange('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`} 
              onClick={() => handleTabChange('customers')}
            >
              <span className="nav-icon">👥</span>
              <span>Müşteriler</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'vehicles' ? 'active' : ''}`} 
              onClick={() => handleTabChange('vehicles')}
            >
              <span className="nav-icon">🚗</span>
              <span>Araç Filosu</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'rentals' ? 'active' : ''}`} 
              onClick={() => handleTabChange('rentals')}
            >
              <span className="nav-icon">📄</span>
              <span>Sözleşmeler</span>
            </div>
          </nav>
        </div>

        {/* Alt Bilgi */}
        <div style={{ padding: '0.8rem', borderTop: '1px solid #1e293b', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
          <strong style={{ color: '#94a3b8' }}>ART AUTO v2.0</strong><br/>
          Batman / Sidar ARİTÜRK
        </div>
      </aside>

      {/* Ana İçerik Alanı */}
      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">
              {activeTab === 'dashboard' && 'Genel Bakış & İstatistikler'}
              {activeTab === 'customers' && 'Müşteri Yönetimi & Kayıtlar'}
              {activeTab === 'vehicles' && 'Araç Filo Yönetimi'}
              {activeTab === 'rentals' && 'Sözleşmeler ve Dijital Arşiv'}
            </h1>
          </div>
        </header>

        {/* Seçili sekmeye göre bileşeni göster */}
        {activeTab === 'customers' && <Customers onStartContract={handleStartContractFromCustomer} />}
        {activeTab === 'vehicles' && <Vehicles />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'rentals' && <Rentals preSelectedCustomer={selectedCustomerForRental} clearPreSelected={() => setSelectedCustomerForRental(null)} />}
      </main>
    </div>
  );
}

export default App;
