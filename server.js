const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// SQL Server Bağlantı Konfigürasyonu (hazal\sqlexpress)
const dbConfig = {
    server: 'hazal\\sqlexpress',
    database: 'SheWayDB',
    options: {
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true
    },
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: '1905' // SSMS'e girerken yazdığın şifre
        }
    }
};

// Veritabanı Havuzunu Başlatma
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('✅ SQL Server (hazal\\sqlexpress) veritabanına başarıyla bağlanıldı!');
        return pool;
    })
    .catch(err => {
        console.error('❌ Veritabanı bağlantı hatası:', err);
        process.exit(1);
    });

// =============================================================
// API ENDPOINT'LERİ (Doğru Kullanım: app.get / app.post)
// =============================================================

// 1. Kullanıcı Acil Durum Kişilerini Getir
app.get('/api/contacts/:kullaniciId', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('KullaniciID', sql.Int, req.params.kullaniciId)
            .query('SELECT * FROM Acil_Durum_Kisileri WHERE KullaniciID = @KullaniciID');

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Yeni Acil Durum Kişisi Ekle
app.post('/api/contacts', async (req, res) => {
    try {
        const { kullaniciId, yakinlikVeyaIsim, telefon } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('KullaniciID', sql.Int, kullaniciId)
            .input('Isim', sql.NVarChar, yakinlikVeyaIsim)
            .input('Telefon', sql.NVarChar, telefon)
            .query('INSERT INTO Acil_Durum_Kisileri (KullaniciID, YakinlikVeyaIsim, Telefon) VALUES (@KullaniciID, @Isim, @Telefon)');

        res.json({ success: true, message: 'Acil durum kişisi başarıyla kaydedildi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Topluluk Tehlike Bildirimi Kaydet
app.post('/api/dangers', async (req, res) => {
    try {
        const { kullaniciId, tehlikeTuru, enlem, boylam } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('KullaniciID', sql.Int, kullaniciId)
            .input('Turu', sql.NVarChar, tehlikeTuru)
            .input('Enlem', sql.Decimal(10, 8), enlem)
            .input('Boylam', sql.Decimal(11, 8), boylam)
            .query('INSERT INTO Tehlike_Bildirimleri (KullaniciID, TehlikeTuru, Enlem, Boylam) VALUES (@KullaniciID, @Turu, @Enlem, @Boylam)');

        res.json({ success: true, message: 'Tehlike bildirimi haritaya işlendi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sunucuyu Çalıştır
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SheWay Backend Sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});