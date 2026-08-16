const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database'); // Az önce yazdığımız veritabanı dosyası

const app = express();
const PORT = 3000;

// Güvenlik ve JSON veri işleme ayarları
app.use(cors());
app.use(express.json());

// Statik React dosyalarını sun
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// API 1: Saniyelik Müşteri Arama (Arama Motoru / Tüm Liste)
app.get('/api/customers/search', (req, res) => {
    const searchQuery = req.query.q; // Frontend'den gelen arama kelimesi
    
    if (!searchQuery || searchQuery.trim() === '') {
        // Arama kutusu boşsa son eklenen 50 müşteriyi döndür
        return db.all("SELECT * FROM customers ORDER BY id DESC LIMIT 50", [], (err, rows) => {
            if (err) res.status(500).json({ error: err.message });
            else res.json(rows || []);
        });
    }

    // İsme, TC'ye veya Telefona göre arama yapan SQL sorgusu
    const sql = `
        SELECT * FROM customers 
        WHERE full_name LIKE ? OR tc_no LIKE ? OR phone1 LIKE ? OR phone2 LIKE ?
        ORDER BY id DESC
        LIMIT 20
    `;
    const params = Array(4).fill(`%${searchQuery}%`); // '%kelime%' mantığı ile içinde geçenleri bulur

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Arama hatası:', err.message);
            res.status(500).json({ error: 'Arama sırasında bir hata oluştu.' });
        } else {
            res.json(rows || []); // Bulunan müşterileri frontend'e gönder
        }
    });
});

// API 2: Yeni Müşteri Kaydetme
app.post('/api/customers', (req, res) => {
    const data = req.body;
    const sql = `
        INSERT INTO customers (
            full_name, tc_no, birth_place_and_date, nationality, 
            address, billing_address, current_address, 
            phone1, phone2, 
            license_no, license_issue_place, license_issue_date, license_expiry_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.full_name, 
        (data.tc_no && data.tc_no.trim() !== '') ? data.tc_no.trim() : null, 
        data.birth_place_and_date, data.nationality,
        data.address, data.billing_address, data.current_address,
        data.phone1, data.phone2,
        data.license_no, data.license_issue_place, data.license_issue_date, data.license_expiry_date
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Kayıt hatası:', err.message);
            res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Bu T.C. Kimlik No ile kayıtlı başka bir müşteri zaten var!' : err.message });
        } else {
            res.json({ success: true, id: this.lastID, message: 'Müşteri başarıyla kaydedildi!' });
        }
    });
});

// API 3: Müşteri Silme
app.delete('/api/customers/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM customers WHERE id = ?", id, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// API 3.5: Müşteri Güncelleme (Düzenleme)
app.put('/api/customers/:id', (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const sql = `
        UPDATE customers SET
            full_name = ?, 
            tc_no = ?, 
            birth_place_and_date = ?, 
            nationality = ?, 
            address = ?, 
            billing_address = ?, 
            current_address = ?, 
            phone1 = ?, 
            phone2 = ?, 
            license_no = ?, 
            license_issue_place = ?, 
            license_issue_date = ?, 
            license_expiry_date = ?
        WHERE id = ?
    `;
    const params = [
        data.full_name, 
        (data.tc_no && data.tc_no.trim() !== '') ? data.tc_no.trim() : null, 
        data.birth_place_and_date, data.nationality,
        data.address, data.billing_address, data.current_address,
        data.phone1, data.phone2,
        data.license_no, data.license_issue_place, data.license_issue_date, data.license_expiry_date,
        id
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Güncelleme hatası:', err.message);
            res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Bu T.C. Kimlik No başka bir müşteriye ait!' : err.message });
        } else {
            res.json({ success: true, message: 'Müşteri başarıyla güncellendi!' });
        }
    });
});

// --- ARAÇ YÖNETİMİ (FİLO) API UÇ NOKTALARI ---

// Araçları Listele
app.get('/api/vehicles', (req, res) => {
    db.all("SELECT * FROM vehicles ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Yeni Araç Ekle
app.post('/api/vehicles', (req, res) => {
    const { plate, brand_model, owner, status } = req.body;
    const sql = `INSERT INTO vehicles (plate, brand_model, owner, status) VALUES (?, ?, ?, ?)`;
    db.run(sql, [plate, brand_model, owner, status || 'Boşta'], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ success: true, id: this.lastID });
        }
    });
});

// Araç Sil
app.delete('/api/vehicles/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM vehicles WHERE id = ?", id, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Araç Durumu Güncelle (Boşta, Bakımda, Kirada)
app.patch('/api/vehicles/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    db.run("UPDATE vehicles SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ success: true, message: `Araç durumu '${status}' olarak güncellendi.` });
        }
    });
});

// --- SÖZLEŞMELER (KİRALAMALAR) API UÇ NOKTALARI ---

// Sözleşmeleri (Tüm kiralamaları ve ilişkili müşteri/araç bilgilerini) Listele
app.get('/api/rentals', (req, res) => {
    const sql = `
        SELECT 
            r.*, 
            c.full_name as customer_name, c.tc_no as customer_tc, c.phone1 as customer_phone, c.address as customer_address, c.license_no, c.license_issue_place, c.license_issue_date, c.license_expiry_date,
            v.plate as vehicle_plate, v.brand_model as vehicle_brand, v.owner as vehicle_owner
        FROM rentals r
        JOIN customers c ON r.customer_id = c.id
        JOIN vehicles v ON r.vehicle_id = v.id
        ORDER BY r.id DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

// Yeni Sözleşme / Kiralama Oluştur
app.post('/api/rentals', (req, res) => {
    const data = req.body;
    const sql = `
        INSERT INTO rentals (
            customer_id, vehicle_id, 
            rent_date, departure_time, return_date, return_time,
            departure_km, return_km, departure_range, return_range,
            daily_price, total_days,
            has_ruhsat, has_kriko, has_stepne, has_trafik_cantasi, has_teyp, has_flash_bellek,
            payment_date, amount, due_date, promissory_note_no, guarantor_name, guarantor_tc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.customer_id, data.vehicle_id,
        data.rent_date, data.departure_time, data.return_date, data.return_time,
        data.departure_km, data.return_km, data.departure_range, data.return_range,
        data.daily_price, data.total_days,
        data.has_ruhsat ? 1 : 0, data.has_kriko ? 1 : 0, data.has_stepne ? 1 : 0, data.has_trafik_cantasi ? 1 : 0, data.has_teyp ? 1 : 0, data.has_flash_bellek ? 1 : 0,
        data.payment_date, data.amount, data.due_date, data.promissory_note_no, data.guarantor_name, data.guarantor_tc
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            // Araç kiralandığında durumunu 'Kirada' olarak güncelle
            db.run("UPDATE vehicles SET status = 'Kirada' WHERE id = ?", [data.vehicle_id], (updateErr) => {
                if (updateErr) console.error("Araç durumu güncellenemedi:", updateErr.message);
            });
            res.json({ success: true, id: this.lastID });
        }
    });
});

// Sözleşme Sil / İptal Et (Aracı tekrar Boşta durumuna getirir)
app.delete('/api/rentals/:id', (req, res) => {
    const id = req.params.id;
    // Önce sözleşmedeki araç ID'sini bulup aracı Boşta yapıyoruz
    db.get("SELECT vehicle_id FROM rentals WHERE id = ?", [id], (err, row) => {
        if (row && row.vehicle_id) {
            db.run("UPDATE vehicles SET status = 'Boşta' WHERE id = ?", [row.vehicle_id]);
        }
        db.run("DELETE FROM rentals WHERE id = ?", [id], (deleteErr) => {
            if (deleteErr) res.status(400).json({ error: deleteErr.message });
            else res.json({ success: true });
        });
    });
});

// React yönlendirmeleri için (API olmayan tüm istekleri index.html'e yönlendir)
// Hata almamak için Express 5.x uyumlu regex
app.get(/^.*$/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Arka plan (Backend) sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});
