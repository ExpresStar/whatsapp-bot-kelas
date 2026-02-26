const axios = require('axios');
const moment = require('moment-timezone');
const config = require('../../config/config');
const helpers = require('../utils/helpers');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

const utilCommands = {
    // Info cuaca
    async cuaca(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        if (args.length === 0) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Salah*\n\n` +
                      `Gunakan: \`${config.prefix}cuaca <nama kota>\`\n\n` +
                      `Contoh:\n` +
                      `\`${config.prefix}cuaca Jakarta\`\n` +
                      `\`${config.prefix}cuaca Surabaya\`\n` +
                      `\`${config.prefix}cuaca Bandung\``,
                mentions: [sender]
            }, { quoted: message });
        }

        const kota = args.join(' ');

        if (!config.weatherApiKey) {
            return await sock.sendMessage(groupId, {
                text: `⚠️ *Fitur Cuaca Belum Aktif*\n\n` +
                      `Silakan tambahkan WEATHER_API_KEY di file .env\n` +
                      `Dapatkan API key gratis di: https://openweathermap.org/api`,
                mentions: [sender]
            }, { quoted: message });
        }

        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(kota)},ID&appid=${config.weatherApiKey}&units=metric&lang=id`
            );

            const data = response.data;
            const weather = data.weather[0];
            const main = data.main;
            const wind = data.wind;

            // Weather emoji mapping
            const weatherEmojis = {
                'Clear': '☀️',
                'Clouds': '☁️',
                'Rain': '🌧️',
                'Drizzle': '🌦️',
                'Thunderstorm': '⛈️',
                'Snow': '❄️',
                'Mist': '🌫️',
                'Fog': '🌫️',
                'Haze': '🌫️'
            };

            const emoji = weatherEmojis[weather.main] || '🌡️';

            let result = `${emoji} *Cuaca di ${data.name}*\n\n`;
            result += `*Kondisi:* ${weather.description}\n`;
            result += `🌡️ *Suhu:* ${Math.round(main.temp)}°C\n`;
            result += `🌡️ *Terasa seperti:* ${Math.round(main.feels_like)}°C\n`;
            result += `💧 *Kelembaban:* ${main.humidity}%\n`;
            result += `💨 *Angin:* ${wind.speed} m/s\n`;
            result += `👁️ *Visibilitas:* ${(data.visibility / 1000).toFixed(1)} km\n`;
            result += `📊 *Tekanan:* ${main.pressure} hPa\n\n`;
            result += `🕐 *Update:* ${moment().tz(config.timezone).format('HH:mm')}`;

            await sock.sendMessage(groupId, {
                text: result,
                mentions: [sender]
            }, { quoted: message });

        } catch (error) {
            if (error.response?.status === 404) {
                await sock.sendMessage(groupId, {
                    text: `❌ *Kota Tidak Ditemukan*\n\n` +
                          `Kota "${kota}" tidak ditemukan.\n` +
                          `Pastikan ejaan nama kota sudah benar.`,
                    mentions: [sender]
                }, { quoted: message });
            } else {
                logger.error('Error fetching weather:', error.message);
                await sock.sendMessage(groupId, {
                    text: `❌ *Gagal Mengambil Data Cuaca*\n\n` +
                          `Silakan coba lagi nanti.`,
                    mentions: [sender]
                }, { quoted: message });
            }
        }
    },

    // Info tanggal dan waktu
    async tanggal(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        const now = moment().tz(config.timezone);
        
        // Hari libur nasional (contoh - bisa diperbarui)
        const hariLibur = [
            { tanggal: '01-01', nama: 'Tahun Baru' },
            { tanggal: '01-05', nama: 'Hari Buruh' },
            { tanggal: '17-08', nama: 'Hari Kemerdekaan RI' },
            { tanggal: '25-12', nama: 'Hari Natal' }
        ];

        const bulanIndo = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        const hariIndo = [
            'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
        ];

        let result = `📅 *Informasi Waktu*\n\n`;
        result += `*Tanggal:* ${hariIndo[now.day()]}, ${now.date()} ${bulanIndo[now.month()]} ${now.year()}\n`;
        result += `🕐 *Waktu:* ${now.format('HH:mm:ss')}\n`;
        result += `📆 *Format ISO:* ${now.format('YYYY-MM-DD')}\n`;
        result += `📊 *Hari ke-* ${now.dayOfYear()} *dalam setahun*\n`;
        result += `📊 *Minggu ke-* ${now.week()} *dalam setahun*\n\n`;

        // Cek hari libur mendatang
        const todayStr = now.format('DD-MM');
        const liburHariIni = hariLibur.find(l => l.tanggal === todayStr);
        
        if (liburHariIni) {
            result += `🎉 *Hari Ini:* ${liburHariIni.nama}\n\n`;
        }

        // Hitung mundur hari libur berikutnya
        const liburMendatang = hariLibur
            .map(l => {
                const liburDate = moment(`${now.year()}-${l.tanggal}`, 'YYYY-DD-MM');
                if (liburDate.isBefore(now, 'day')) {
                    liburDate.add(1, 'year');
                }
                return { ...l, date: liburDate };
            })
            .sort((a, b) => a.date.diff(b.date));

        if (liburMendatang.length > 0) {
            const nextLibur = liburMendatang[0];
            const daysUntil = nextLibur.date.diff(now, 'days');
            result += `🎊 *Hari Libur Berikutnya:*\n`;
            result += `${nextLibur.nama} (${nextLibur.date.format('DD MMMM YYYY')})\n`;
            result += `⏰ ${daysUntil} hari lagi\n\n`;
        }

        // Informasi tambahan
        const startOfYear = moment().tz(config.timezone).startOf('year');
        const endOfYear = moment().tz(config.timezone).endOf('year');
        const daysPassed = now.diff(startOfYear, 'days');
        const daysRemaining = endOfYear.diff(now, 'days');
        const progressPercent = ((daysPassed / 365) * 100).toFixed(1);

        result += `📈 *Progress Tahun ${now.year()}:*\n`;
        result += `${daysPassed} hari berlalu, ${daysRemaining} hari tersisa\n`;
        result += `[${'█'.repeat(Math.floor(progressPercent / 5))}${'░'.repeat(20 - Math.floor(progressPercent / 5))}] ${progressPercent}%`;

        await sock.sendMessage(groupId, {
            text: result,
            mentions: [sender]
        }, { quoted: message });
    },

    // Quote motivasi
    async motivasi(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        const quotes = helpers.getMotivasiQuotes();
        const randomQuote = helpers.randomPick(quotes);

        const result = `💭 *Motivasi Hari Ini*\n\n` +
                      `"${randomQuote}"\n\n` +
                      `Semangat! 💪✨`;

        await sock.sendMessage(groupId, {
            text: result,
            mentions: [sender]
        }, { quoted: message });
    },

    // Random anggota grup
    async randomAnggota(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        if (!auth.isGroup(message)) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Hanya untuk Grup*\n\n` +
                      `Command ini hanya bisa digunakan di grup.`,
                mentions: [sender]
            }, { quoted: message });
        }

        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            const participants = groupMetadata.participants
                .filter(p => !p.id.includes('bot') && p.id !== sender); // Exclude bot and sender

            if (participants.length === 0) {
                return await sock.sendMessage(groupId, {
                    text: `❌ *Tidak Cukup Anggota*\n\n` +
                          `Butuh minimal 2 anggota untuk random pick.`,
                    mentions: [sender]
                }, { quoted: message });
            }

            const jumlah = parseInt(args[0]) || 1;
            
            if (jumlah > participants.length) {
                return await sock.sendMessage(groupId, {
                    text: `❌ *Anggota Tidak Cukup*\n\n` +
                          `Hanya ada ${participants.length} anggota yang bisa dipilih.`,
                    mentions: [sender]
                }, { quoted: message });
            }

            if (jumlah > 10) {
                return await sock.sendMessage(groupId, {
                    text: `❌ *Terlalu Banyak*\n\n` +
                          `Maksimal 10 anggota dalam satu random pick.`,
                    mentions: [sender]
                }, { quoted: message });
            }

            // Shuffle and pick
            const shuffled = helpers.shuffle(participants);
            const terpilih = shuffled.slice(0, jumlah);

            let result = `🎲 *Random Anggota*\n\n`;
            
            if (jumlah === 1) {
                result += `🎯 *Terpilih:*\n`;
                result += `@${terpilih[0].id.split('@')[0]}\n\n`;
                result += `Selamat! 🎉`;
            } else {
                result += `🎯 *${jumlah} Anggota Terpilih:*\n\n`;
                terpilih.forEach((p, index) => {
                    result += `${index + 1}. @${p.id.split('@')[0]}\n`;
                });
                result += `\nSelamat untuk kalian! 🎉`;
            }

            const mentions = terpilih.map(p => p.id);

            await sock.sendMessage(groupId, {
                text: result,
                mentions: [...mentions, sender]
            }, { quoted: message });

        } catch (error) {
            logger.error('Error in random anggota:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Ping/cek bot
    async ping(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        const startTime = Date.now();
        
        // Send a message and measure response time
        const sent = await sock.sendMessage(groupId, {
            text: '🏓 *Pong!*',
            mentions: [sender]
        }, { quoted: message });

        const endTime = Date.now();
        const latency = endTime - startTime;

        // Edit the message with stats
        const uptime = helpers.formatDuration(Math.floor(process.uptime()));
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        await sock.sendMessage(groupId, {
            edit: sent.key,
            text: `🏓 *Pong!*\n\n` +
                  `⏱️ *Latency:* ${latency}ms\n` +
                  `⏰ *Uptime:* ${uptime}\n` +
                  `💾 *Memory:* ${memory} MB\n` +
                  `📅 *Server Time:* ${moment().tz(config.timezone).format('HH:mm:ss')}\n\n` +
                  `Bot aktif dan berjalan normal! ✅`,
            mentions: [sender]
        });
    },

    // Info bot
    async info(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        const uptime = helpers.formatDuration(Math.floor(process.uptime()));
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        let result = `🤖 *${config.botName}*\n\n`;
        result += `*Versi:* 1.0.0\n`;
        result += `*Platform:* Node.js\n`;
        result += `*Library:* Baileys\n`;
        result += `*Database:* ${config.dbMode === 'mongodb' ? 'MongoDB' : 'JSON'}\n\n`;
        result += `*Status:* ✅ Online\n`;
        result += `⏰ *Uptime:* ${uptime}\n`;
        result += `💾 *Memory:* ${memory} MB\n`;
        result += `🌐 *Timezone:* ${config.timezone}\n\n`;
        result += `*Fitur Utama:*\n`;
        result += `• Manajemen Tugas\n`;
        result += `• Jadwal Pelajaran\n`;
        result += `• Pengumuman\n`;
        result += `• AI Assistant\n`;
        result += `• Cuaca & Utilitas\n\n`;
        result += `📅 ${moment().tz(config.timezone).format('DD MMMM YYYY')}`;

        await sock.sendMessage(groupId, {
            text: result,
            mentions: [sender]
        }, { quoted: message });
    },

    // Menu/Help
    async menu(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        const CommandHandler = require('../handlers/CommandHandler');
        const helpText = CommandHandler.getHelpText(args[0]);

        await sock.sendMessage(groupId, {
            text: helpText,
            mentions: [sender]
        }, { quoted: message });
    }
};

module.exports = utilCommands;
