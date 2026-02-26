# 📚 Daftar Lengkap Command WhatsApp Bot Kelas

## Legend
- 👤 = Admin only
- 👥 = Group only
- 🌐 = Works everywhere

---

## 📚 Sistem Tugas

### `!tambah_tugas` 👤👥
Menambahkan tugas baru ke daftar tugas kelas.

**Format:**
```
!tambah_tugas Mapel | Deskripsi | DD-MM-YYYY
```

**Contoh:**
```
!tambah_tugas Matematika | Hal 25-30 nomor 1-10 | 30-12-2024
!tambah_tugas Bahasa Inggris | Essay 500 kata tentang environment | 15-01-2025
```

**Alias:** `!addtugas`, `!tambahtugas`

---

### `!list_tugas` 👥
Menampilkan semua tugas yang tersimpan, diurutkan berdasarkan deadline.

**Format:**
```
!list_tugas
```

**Output:**
- 🟢 = Aman (>3 hari)
- 🟡 = Mendesak (1-3 hari)
- 🔴 = Lewat deadline

**Alias:** `!tugas`, `!daftartugas`, `!lihattugas`

---

### `!hapus_tugas` 👤👥
Menghapus tugas berdasarkan nomor urutan dari list.

**Format:**
```
!hapus_tugas <nomor>
```

**Contoh:**
```
!hapus_tugas 1
!hapus_tugas 3
```

**Catatan:** Lihat nomor tugas dengan `!list_tugas`

**Alias:** `!deletetugas`, `!hapustugas`

---

### `!deadline` 👥
Menampilkan tugas dengan deadline terdekat.

**Format:**
```
!deadline
```

**Fitur:**
- Menampilkan tugas paling mendesak
- Hitung mundur hari
- Warning khusus untuk H-1 dan H-0

**Alias:** `!deadlineterdekat`, `!tugasmendesak`

---

### `!edit_tugas` 👤👥
Mengedit tugas yang sudah ada.

**Format:**
```
!edit_tugas <nomor> | <field> | <nilai_baru>
```

**Field yang bisa diedit:**
- `mapel` - Nama mata pelajaran
- `deskripsi` - Deskripsi tugas
- `deadline` - Tanggal deadline (format: DD-MM-YYYY)

**Contoh:**
```
!edit_tugas 1 | deskripsi | Hal 30-35 nomor 5-15
!edit_tugas 2 | deadline | 20-12-2024
!edit_tugas 1 | mapel | Matematika Lanjut
```

**Alias:** `!edittugas`, `!updatetugas`

---

## 📅 Informasi Kelas

### `!jadwal` 👥
Menampilkan jadwal pelajaran.

**Format:**
```
!jadwal [hari]
```

**Contoh:**
```
!jadwal          # Jadwal hari ini
!jadwal senin    # Jadwal hari Senin
!jadwal jumat    # Jadwal hari Jumat
```

**Alias:** `!schedule`, `!pelajaran`

---

### `!pengumuman` 👥
Menampilkan daftar pengumuman terbaru.

**Format:**
```
!pengumuman
```

**Fitur:**
- Menampilkan 5 pengumuman terbaru
- Urutan: terbaru ke terlama
- Menampilkan penulis dan tanggal

**Alias:** `!announcement`, `!info`

---

### `!tambah_pengumuman` 👤👥
Menambahkan pengumuman baru.

**Format:**
```
!tambah_pengumuman Judul | Isi Pengumuman
```

**Contoh:**
```
!tambah_pengumuman Ujian Semester | Ujian akan dilaksanakan tanggal 15-20 Desember. Jangan lupa belajar!
```

**Alias:** `!addpengumuman`

---

### `!guru` 👥
Menampilkan informasi guru.

**Format:**
```
!guru [mapel]
```

**Contoh:**
```
!guru              # Semua guru
!guru matematika   # Info guru matematika
!guru ipa          # Info guru IPA
```

**Output:**
- Nama guru
- Nomor kontak
- Link WhatsApp

**Alias:** `!teacher`, `!dataguru`

---

### `!kontak_kelas` 👥
Menampilkan informasi grup dan anggota kelas.

**Format:**
```
!kontak_kelas
```

**Output:**
- Nama grup
- Total anggota
- Daftar admin
- Link grup (jika tersedia)

**Alias:** `!kontak`, `!anggotakelas`

---

## 🤖 AI Assistant

### `!jawab` 🌐
Tanya jawab dengan AI (Gemini/OpenAI).

**Format:**
```
!jawab <pertanyaan>
```

**Contoh:**
```
!jawab Apa itu fotosintesis?
!jawab Jelaskan teorema Pythagoras
!jawab Bagaimana cara menghitung luas lingkaran?
```

**Catatan:** Memerlukan API key Gemini atau OpenAI

**Alias:** `!ask`, `!tanya`, `!ai`

---

### `!ringkas` 🌐
Meringkas teks panjang menjadi 2-3 kalimat.

**Format:**
```
!ringkas <teks>
```

**Contoh:**
```
!ringkas Fotosintesis adalah proses biokimia yang dilakukan oleh tumbuhan untuk mengubah energi cahaya matahari menjadi energi kimia...
```

**Catatan:**
- Minimal 50 karakter
- Maksimal 2000 karakter

**Alias:** `!summarize`, `!summary`

---

### `!arti` 🌐
Mencari arti/definisi kata (kamus).

**Format:**
```
!arti <kata>
```

**Contoh:**
```
!arti revolusi
!arti fotosintesis
!arti globalisasi
```

**Catatan:** Memerlukan API key untuk hasil optimal

**Alias:** `!kamus`, `!definisi`, `!dictionary`

---

## 🛠️ Utilitas

### `!cuaca` 🌐
Mengecek cuaca di kota tertentu.

**Format:**
```
!cuaca <nama_kota>
```

**Contoh:**
```
!cuaca Jakarta
!cuaca Surabaya
!cuaca Bandung
!cuaca Yogyakarta
```

**Output:**
- Kondisi cuaca
- Suhu (aktual & feels like)
- Kelembaban
- Kecepatan angin
- Visibilitas

**Catatan:** Memerlukan WEATHER_API_KEY

**Alias:** `!weather`

---

### `!tanggal` 🌐
Menampilkan informasi tanggal dan waktu lengkap.

**Format:**
```
!tanggal
```

**Output:**
- Tanggal hari ini
- Waktu saat ini
- Hari ke-X dalam setahun
- Progress tahun (bar)
- Hari libur terdekat

**Alias:** `!date`, `!waktu`, `!jam`

---

### `!motivasi` 🌐
Menampilkan quote motivasi random.

**Format:**
```
!motivasi
```

**Alias:** `!quote`, `!inspirasi`

---

### `!random_anggota` 👥
Memilih anggota grup secara acak.

**Format:**
```
!random_anggota [jumlah]
```

**Contoh:**
```
!random_anggota       # Pilih 1 orang
!random_anggota 3     # Pilih 3 orang
!random_anggota 5     # Pilih 5 orang
```

**Batasan:**
- Maksimal 10 orang
- Tidak memilih bot atau pengirim

**Alias:** `!random`, `!pick`, `!acak`

---

### `!ping` 🌐
Mengecek status dan latency bot.

**Format:**
```
!ping
```

**Output:**
- Latency (ms)
- Uptime
- Memory usage
- Server time

**Catatan:** Tidak memiliki cooldown

**Alias:** `!status`, `!cek`

---

### `!info` 🌐
Menampilkan informasi tentang bot.

**Format:**
```
!info
```

**Output:**
- Nama bot
- Versi
- Platform
- Database yang digunakan
- Status koneksi

**Alias:** `!about`, `!botinfo`

---

### `!menu` 🌐
Menampilkan menu bantuan dan daftar command.

**Format:**
```
!menu           # Semua command
!menu <command> # Detail command tertentu
```

**Contoh:**
```
!menu
!menu tambah_tugas
!menu cuaca
```

**Catatan:** Tidak memiliki cooldown

**Alias:** `!help`, `!bantuan`, `!start`

---

## 👤 Admin Commands

### `!cek_reminder` 👤👥
Memeriksa deadline tugas secara manual.

**Format:**
```
!cek_reminder
```

**Catatan:** Biasanya digunakan untuk testing reminder

---

## 📝 Tips Penggunaan

### 1. Format Pesan dengan Pipe `|`
Command yang memerlukan beberapa field menggunakan pemisah `|` (pipe):
- `!tambah_tugas`
- `!edit_tugas`
- `!tambah_pengumuman`

### 2. Anti-Spam
- Cooldown 3 detik antar command (kecuali `!menu`, `!ping`)
- Spam berlebihan bisa menyebabkan block sementara

### 3. Format Tanggal
Gunakan format: `DD-MM-YYYY` atau `DD/MM/YYYY`
- ✅ `30-12-2024`
- ✅ `30/12/2024`
- ❌ `12-30-2024` (format US tidak didukung)

### 4. Shortcut
Gunakan alias untuk mengetik lebih cepat:
- `!tugas` = `!list_tugas`
- `!tanya` = `!jawab`
- `!random` = `!random_anggota`

---

## 🆘 Troubleshooting Command

### "Command tidak ditemukan"
- Cek ejaan command
- Pastikan menggunakan prefix `!`
- Coba gunakan alias

### "Format salah"
- Periksa pemisah `|` (pipe)
- Pastikan semua field diisi
- Cek format tanggal

### "Akses ditolak"
- Command mungkin khusus admin
- Command mungkin hanya untuk grup
- Hubungi admin bot

### "Fitur tidak aktif"
- API key belum di-set di .env
- Hubungi admin untuk mengaktifkan fitur

---

**Terakhir diupdate:** 2024
