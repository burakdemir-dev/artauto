const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite veritabanı dosyasının oluşturulacağı yol (database.sqlite adında bir dosya oluşacak)
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanına bağlanırken hata oluştu:', err.message);
    } else {
        console.log('SQLite veritabanına başarıyla bağlanıldı.');
    }
});

// Tabloları oluşturma fonksiyonu
const createTables = () => {
    // 1. MÜŞTERİLER TABLOSU
    // Müşterinin kalıcı kişisel ve ehliyet bilgilerini burada tutuyoruz.
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        tc_no TEXT UNIQUE,
        birth_place_and_date TEXT,
        nationality TEXT,
        address TEXT,
        billing_address TEXT,
        current_address TEXT,
        phone1 TEXT,
        phone2 TEXT,
        license_no TEXT,
        license_issue_place TEXT,
        license_issue_date TEXT,
        license_expiry_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. ARAÇLAR TABLOSU
    // Filodaki araçları burada tutuyoruz.
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate TEXT UNIQUE NOT NULL,
        brand_model TEXT,
        owner TEXT,
        status TEXT DEFAULT 'Boşta' -- Seçenekler: Boşta, Kirada, Bakımda
    )`);

    // 3. KİRALAMALAR (SÖZLEŞMELER) TABLOSU
    // Belgedeki çıkış-dönüş tarihleri, araç teslim ekipmanları ve 'Senet' kısımlarını burada tutuyoruz.
    db.run(`CREATE TABLE IF NOT EXISTS rentals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        vehicle_id INTEGER,
        
        -- Tarih ve Saatler
        rent_date TEXT,
        departure_time TEXT,
        return_date TEXT,
        return_time TEXT,
        
        -- Km ve Menzil
        departure_km INTEGER,
        return_km INTEGER,
        departure_range INTEGER,
        return_range INTEGER,
        
        -- Ücret
        daily_price REAL,
        total_days INTEGER,
        
        -- Araç Teslim Ekipmanları (0: Yok, 1: Var)
        has_ruhsat INTEGER DEFAULT 0,
        has_kriko INTEGER DEFAULT 0,
        has_stepne INTEGER DEFAULT 0,
        has_trafik_cantasi INTEGER DEFAULT 0,
        has_teyp INTEGER DEFAULT 0,
        has_flash_bellek INTEGER DEFAULT 0,
        
        -- Senet / Ödeme Kısmı
        payment_date TEXT,
        amount REAL,
        due_date TEXT, -- Vade
        promissory_note_no TEXT, -- Senet No
        guarantor_name TEXT, -- Kefil Adı Soyadı
        guarantor_tc TEXT, -- Kefil TC
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Tabloları birbirine bağlıyoruz (İlişkisel Veritabanı Mantığı)
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
    )`);
};

// Veritabanı bağlantısı açıldığında tabloları kur (serialize, işlemlerin sırayla yapılmasını sağlar)
db.serialize(() => {
    createTables();
});

module.exports = db;
