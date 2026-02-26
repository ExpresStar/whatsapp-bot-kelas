# 🤖 WhatsApp Bot Kelas SMA

Bot WhatsApp untuk manajemen kelas SMA dengan fitur lengkap: sistem tugas, jadwal pelajaran, pengumuman, AI assistant, dan utilitas harian.

## ✨ Fitur Utama

### 📚 Sistem Tugas
- `!tambah_tugas` - Tambah tugas baru (admin)
- `!list_tugas` - Lihat semua tugas
- `!hapus_tugas` - Hapus tugas (admin)
- `!deadline` - Lihat deadline terdekat
- `!edit_tugas` - Edit tugas yang sudah ada (admin)
- **Auto reminder H-1 deadline**

### 📅 Informasi Kelas
- `!jadwal` - Jadwal pelajaran
- `!pengumuman` - Pengumuman terbaru
- `!tambah_pengumuman` - Tambah pengumuman (admin)
- `!guru` - Info guru dan kontak
- `!kontak_kelas` - Info anggota kelas

### 🤖 AI Assistant
- `!jawab` - Tanya jawab dengan AI (Gemini/OpenAI)
- `!ringkas` - Ringkas teks panjang
- `!arti` - Kamus/Definisi kata

### 🛠️ Utilitas
- `!cuaca` - Cek cuaca kota
- `!tanggal` - Info tanggal & waktu
- `!motivasi` - Quote motivasi
- `!random_anggota` - Pilih anggota acak
- `!ping` - Cek status bot
- `!menu` - Bantuan command

## 📁 Struktur Folder

```
whatsapp-bot-kelas/
├── config/
│   └── config.js           # Konfigurasi bot
├── src/
│   ├── commands/           # Command handlers
│   │   ├── tugas.js       # Sistem tugas
│   │   ├── info.js        # Info kelas
│   │   ├── ai.js          # AI assistant
│   │   └── utils.js       # Utilitas
│   ├── handlers/          # Message & command handlers
│   │   ├── CommandHandler.js
│   │   └── MessageHandler.js
│   ├── middleware/        # Middleware
│   │   ├── auth.js        # Autentikasi admin
│   │   └── cooldown.js    # Anti-spam
│   ├── database/          # Database layer
│   │   └── Database.js    # JSON/MongoDB
│   ├── services/          # Services
│   │   └── ReminderService.js  # Auto reminder
│   ├── utils/             # Utilities
│   │   ├── helpers.js     # Helper functions
│   │   └── logger.js      # Logging
│   └── index.js           # Entry point
├── data/                  # Data storage (JSON mode)
├── logs/                  # Log files
├── session/               # WhatsApp session
├── .env.example          # Contoh environment
├── package.json
└── README.md
```

## 🚀 Cara Menjalankan di Laptop

### 1. Persyaratan

- **Node.js** v18 atau lebih baru
- **npm** atau **yarn**
- **WhatsApp** di handphone

### 2. Instalasi

```bash
# Clone atau download project
cd whatsapp-bot-kelas

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit file .env sesuai kebutuhan
nano .env  # atau gunakan text editor lain
```

### 3. Konfigurasi .env

```env
# Mode Database: 'json' atau 'mongodb'
DB_MODE=json

# MongoDB URI (opsional, jika pakai MongoDB)
MONGODB_URI=

# API Keys (opsional, untuk fitur AI & Cuaca)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
WEATHER_API_KEY=your_openweather_api_key

# Admin Numbers
ADMIN_NUMBERS=6281234567890,6289876543210

# Group yang diizinkan (kosongkan untuk semua grup)
ALLOWED_GROUPS=
```

**Mendapatkan API Keys:**
- **Gemini API**: https://makersuite.google.com/app/apikey
- **OpenAI API**: https://platform.openai.com/api-keys
- **OpenWeather API**: https://openweathermap.org/api (gratis)

### 4. Menjalankan Bot

```bash
# Mode development (auto-restart)
npm run dev

# Mode production
npm start
```

### 5. Scan QR Code

Saat pertama kali menjalankan:
1. QR code akan muncul di terminal
2. Buka WhatsApp di handphone
3. Menuju **Linked Devices** → **Link a Device**
4. Scan QR code yang muncul
5. Bot siap digunakan! 🎉

## 📱 Cara Menggunakan

### Command Dasar

```
!menu              # Lihat semua command
!help tambah_tugas # Lihat detail command
!ping              # Cek status bot
```

### Manajemen Tugas

```
# Tambah tugas (admin only)
!tambah_tugas Matematika | Hal 25-30 nomor 1-10 | 30-12-2024

# Lihat semua tugas
!list_tugas

# Hapus tugas nomor 1 (admin only)
!hapus_tugas 1

# Cek deadline terdekat
!deadline
```

### AI Assistant

```
# Tanya jawab
!jawab Apa itu fotosintesis?

# Ringkas teks
!ringkas [paste teks panjang]

# Cari arti kata
!arti revolusi
```

### Utilitas

```
# Cek cuaca
!cuaca Jakarta

# Info tanggal
!tanggal

# Quote motivasi
!motivasi

# Random anggota
!random_anggota
```

## 🌐 Cara Deploy (Opsional)

### Deploy ke VPS/Cloud Server

#### 1. Siapkan VPS (DigitalOcean, AWS, Vultr, dll)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 untuk process manager
sudo npm install -g pm2

# Clone project
git clone <your-repo-url>
cd whatsapp-bot-kelas

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env
```

#### 2. Jalankan dengan PM2

```bash
# Start bot dengan PM2
pm2 start src/index.js --name "bot-kelas"

# Save PM2 config
pm2 save
pm2 startup

# Monitor
pm2 logs bot-kelas
pm2 status

# Restart jika diperlukan
pm2 restart bot-kelas
```

#### 3. Scan QR di VPS

Karena VPS tidak punya GUI, gunakan salah satu cara:

**Cara 1: Pairing Code**
```bash
# Edit src/index.js, ubah auth method ke pairing code
# Lihat dokumentasi Baileys untuk pairing code
```

**Cara 2: Local-to-VPS Transfer**
```bash
# 1. Jalankan bot di laptop dulu
# 2. Copy folder session/ ke VPS
scp -r session/ user@vps-ip:~/whatsapp-bot-kelas/

# 3. Jalankan di VPS, session sudah tersimpan
pm2 start bot-kelas
```

### Deploy ke Railway/Render/Heroku

⚠️ **Catatan**: WhatsApp Bot memerlukan session yang persisten. Platform seperti Heroku dengan ephemeral filesystem tidak cocok untuk production.

**Rekomendasi**: Gunakan VPS dengan storage persistent.

### Deploy dengan Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

CMD ["node", "src/index.js"]
```

```bash
# Build dan run
docker build -t bot-kelas .
docker run -d --name bot-kelas -v $(pwd)/session:/app/session -v $(pwd)/data:/app/data bot-kelas
```

## ⚙️ Konfigurasi Lanjutan

### Mengubah Jadwal Pelajaran

Edit file `src/commands/info.js`, cari `defaultJadwal`:

```javascript
const defaultJadwal = {
    senin: [
        { mapel: 'Matematika', jam: '07:00 - 08:30' },
        // ... tambahkan sesuai jadwal kelas
    ],
    // ... hari lainnya
};
```

### Mengubah Data Guru

Edit file `src/commands/info.js`, cari `dataGuru`:

```javascript
const dataGuru = {
    'matematika': { nama: 'Pak Budi', kontak: '081234567890' },
    // ... tambahkan guru lain
};
```

### Menambah Command Baru

1. Buat function di file command yang sesuai (atau buat file baru)
2. Register di `src/index.js` dalam method `registerCommands()`:

```javascript
CommandHandler.register('command_baru', handlerFunction, {
    description: 'Deskripsi command',
    usage: '!command_baru <arg>',
    category: 'Kategori',
    aliases: ['alias1', 'alias2'],
    adminOnly: false,
    groupOnly: true
});
```

## 🔒 Keamanan

### Admin Only Commands
Command dengan `adminOnly: true` hanya bisa digunakan oleh:
- Nomor yang terdaftar di `ADMIN_NUMBERS` di .env
- Admin grup WhatsApp

### Anti Spam
- Cooldown 3 detik antar command (bisa diubah di .env)
- Whitelist command tertentu (help, menu, ping)

### Group Restriction
- Set `ALLOWED_GROUPS` di .env untuk membatasi grup yang bisa menggunakan bot

## 📊 Monitoring

### Log Files
Log tersimpan di folder `logs/` dengan format `YYYY-MM-DD.log`

### PM2 Monitoring
```bash
pm2 logs bot-kelas        # Lihat logs
pm2 monit                 # Dashboard monitoring
pm2 status                # Status semua apps
```

## 🐛 Troubleshooting

### QR Code tidak muncul
```bash
# Pastikan terminal support QR code
# Coba resize terminal lebih besar
# Gunakan terminal lain (rekomendasi: Windows Terminal, iTerm2)
```

### Session expired
```bash
# Hapus folder session dan scan ulang
rm -rf session/
npm start
```

### Database error
```bash
# Jika MongoDB error, bot otomatis fallback ke JSON
# Atau ubah DB_MODE=json di .env
```

### Module not found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Kontribusi

Silakan fork dan submit pull request untuk:
- Menambah fitur baru
- Memperbaiki bug
- Meningkatkan dokumentasi

## 📄 Lisensi

MIT License - Bebas digunakan dan dimodifikasi.

## 💬 Dukungan

Jika ada masalah atau pertanyaan:
1. Cek bagian Troubleshooting
2. Buat issue di repository
3. Hubungi admin bot

---

**Selamat menggunakan!** 🎓✨
