# 🚀 Panduan Deploy WhatsApp Bot Kelas

## Daftar Isi
1. [Deploy ke VPS](#deploy-ke-vps)
2. [Deploy dengan Docker](#deploy-dengan-docker)
3. [Deploy ke Railway](#deploy-ke-railway)
4. [Tips & Troubleshooting](#tips--troubleshooting)

---

## Deploy ke VPS

### Rekomendasi VPS
- **DigitalOcean**: $5-10/bulan
- **Vultr**: $5/bulan
- **AWS Lightsail**: $5/bulan
- **Linode**: $5/bulan

### Spesifikasi Minimum
- RAM: 1GB
- CPU: 1 Core
- Storage: 20GB SSD
- OS: Ubuntu 20.04/22.04 LTS

### Langkah-langkah

#### 1. Setup VPS Baru

```bash
# SSH ke VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nano htop

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verifikasi instalasi
node -v  # v18.x.x
npm -v   # 9.x.x

# Install PM2
npm install -g pm2
```

#### 2. Setup Project

```bash
# Buat user baru (opsional tapi direkomendasikan)
adduser botuser
usermod -aG sudo botuser
su - botuser

# Clone project (atau upload via SCP)
cd ~
git clone https://github.com/username/whatsapp-bot-kelas.git
# atau jika upload manual:
# mkdir whatsapp-bot-kelas && cd whatsapp-bot-kelas

# Masuk ke folder project
cd whatsapp-bot-kelas

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env
```

#### 3. Konfigurasi Environment

Edit `.env`:

```env
# Database (gunakan JSON untuk simplicity)
DB_MODE=json

# Admin number (ganti dengan nomor kamu)
ADMIN_NUMBERS=6281234567890

# API Keys (isi jika ingin fitur AI & Cuaca)
GEMINI_API_KEY=your_api_key
WEATHER_API_KEY=your_api_key

# Timezone
TIMEZONE=Asia/Jakarta
```

#### 4. Scan QR Code

**Metode 1: Pairing Code (Rekomendasi)**

Ubah kode di `src/index.js` untuk menggunakan pairing code:

```javascript
// Tambahkan ini di connection.update handler
if (connection === 'open') {
    // Request pairing code
    const code = await this.sock.requestPairingCode('YOUR_PHONE_NUMBER');
    console.log('Pairing Code:', code);
}
```

**Metode 2: Local Session Transfer**

```bash
# 1. Jalankan bot di laptop lokal dulu
# 2. Setelah QR discan dan bot running, copy folder session

# Di laptop (Windows PowerShell/CMD)
scp -r session/ root@your-vps-ip:~/whatsapp-bot-kelas/

# Atau gunakan FileZilla untuk transfer via SFTP
```

**Metode 3: Terminal QR (VPS dengan GUI)**

Jika VPS punya GUI desktop:
```bash
# Install desktop environment (contoh: XFCE)
apt install xfce4 xfce4-goodies tightvncserver

# Setup VNC dan akses via VNC viewer
# Buka terminal di VNC dan jalankan bot
npm start
```

#### 5. Jalankan dengan PM2

```bash
# Start bot
pm2 start src/index.js --name "bot-kelas"

# Save config
pm2 save
pm2 startup systemd

# Cek status
pm2 status
pm2 logs bot-kelas --lines 50

# Monitor real-time
pm2 monit
```

#### 6. Setup Auto-restart

```bash
# PM2 sudah auto-restart by default
# Tambahkan watch untuk auto-restart saat file berubah
pm2 start src/index.js --name "bot-kelas" --watch --ignore-watch="node_modules logs data session"
```

---

## Deploy dengan Docker

### Dockerfile

```dockerfile
FROM node:18-alpine

# Install dependencies untuk Baileys
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directories
RUN mkdir -p session data logs

# Expose (jika perlu, biasanya tidak perlu untuk WhatsApp bot)
# EXPOSE 3000

# Run bot
CMD ["node", "src/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  bot:
    build: .
    container_name: whatsapp-bot-kelas
    restart: unless-stopped
    volumes:
      - ./session:/app/session
      - ./data:/app/data
      - ./logs:/app/logs
      - ./.env:/app/.env:ro
    environment:
      - NODE_ENV=production
    # Untuk debugging
    # stdin_open: true
    # tty: true
```

### Commands

```bash
# Build image
docker-compose build

# Run container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart
```

---

## Deploy ke Railway

⚠️ **Catatan Penting**: Railway memiliki ephemeral filesystem, jadi session akan hilang saat redeploy. Gunakan dengan pertimbangan.

### Langkah-langkah

1. **Fork repository** ke GitHub kamu

2. **Login Railway** dan create new project

3. **Deploy from GitHub repo**

4. **Add Environment Variables** di Railway dashboard:
   - `DB_MODE=json`
   - `ADMIN_NUMBERS=6281234567890`
   - `GEMINI_API_KEY=xxx`
   - dll

5. **Add Volume** (untuk persist session):
   - Go to project → Add → Volume
   - Mount path: `/app/session`

6. **Deploy**

### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node src/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Tips & Troubleshooting

### Session Management

**Backup Session:**
```bash
# Backup session folder
tar -czvf session-backup-$(date +%Y%m%d).tar.gz session/

# Restore
rm -rf session/
tar -xzvf session-backup-20240101.tar.gz
```

**Session Expired:**
```bash
# Hapus session dan scan ulang
rm -rf session/
pm2 restart bot-kelas
```

### Log Management

```bash
# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10

# View logs
pm2 logs bot-kelas
pm2 logs bot-kelas --lines 100
pm2 logs bot-kelas --timestamp

# Clear logs
pm2 flush
```

### Monitoring

```bash
# Install pm2 monitoring dashboard
pm2 plus

# Atau gunakan htop
htop

# Check memory usage
free -h

# Check disk usage
df -h
```

### Security

```bash
# Setup firewall
ufw allow ssh
ufw allow 22
ufw enable

# Update packages regularly
apt update && apt upgrade -y

# Monitor failed login attempts
fail2ban-client status
```

### Performance Optimization

```bash
# Limit Node.js memory (jika RAM terbatas)
pm2 start src/index.js --name "bot-kelas" --node-args="--max-old-space-size=512"

# Enable cluster mode (jika CPU > 1 core)
pm2 start src/index.js -i max
```

### Common Issues

**Issue: QR Code tidak muncul di VPS**
- Solusi: Gunakan pairing code atau transfer session dari local

**Issue: Bot disconnect setelah beberapa jam**
- Solusi: PM2 sudah auto-restart, cek logs untuk detail error

**Issue: Memory leak**
- Solusi: Restart periodik dengan cron
```bash
# Edit crontab
crontab -e

# Tambahkan (restart setiap 6 jam)
0 */6 * * * pm2 restart bot-kelas
```

**Issue: Database JSON corrupt**
- Solusi: Backup otomatis dengan cron
```bash
# Backup setiap hari jam 00:00
0 0 * * * cp -r ~/whatsapp-bot-kelas/data ~/backups/data-$(date +\%Y\%m\%d)
```

---

## Checklist Production

- [ ] Environment variables sudah di-set
- [ ] Admin numbers sudah benar
- [ ] Session sudah tersimpan
- [ ] PM2 running dan auto-start enabled
- [ ] Log rotation configured
- [ ] Backup schedule configured
- [ ] Firewall enabled
- [ ] Monitoring setup (PM2 Plus atau lainnya)

---

**Selamat deploy!** 🚀
