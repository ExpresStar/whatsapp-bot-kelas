const database = require('../database/Database');
const helpers = require('../utils/helpers');
const logger = require('../utils/logger');
const config = require('../../config/config');

// Data default jadwal (bisa dikustomisasi)
const defaultJadwal = {
    senin: [
        { mapel: 'UPACARA', jam: '07:30 - 08:05' },
        { mapel: 'FISIKA', jam: '08:05 - 09:50' },
        { mapel: 'ISTIRAHAT', jam: '09:50 - 10:30' },
        { mapel: 'BAHASA INGGRIS LANJUTAN', jam: '10:30 - 11:40' },
        { mapel: 'KIMIA', jam: '11:40 - 12:50' },
        { mapel: 'ISTIRAHAT/SHOLAT', jam: '11:50 - 13:00' },
        { mapel: 'KIMIA', jam: '13:00 - 14:10' },
        { mapel: 'BAHASA INDONESIA', jam: '14:10 - 15:20' }
    ],
    selasa: [
        { mapel: 'PJOK', jam: '07:30 - 09:15' },
        { mapel: 'PAI', jam: '09:15 - 09:50' },
        { mapel: 'ISTIRAHAT', jam: '09:50 - 10:30' },
        { mapel: 'MTK LANJUTAN', jam: '10:30 - 12:50' },
        { mapel: 'ISTIRAHAT', jam: '11:50 - 13:00' },
        { mapel: 'BIOLOGI', jam: '13:00 - 14:10' },
        { mapel: 'SEJARAH', jam: '14:10 - 15:20' }
    ],
    rabu: [
        { mapel: 'BAHASA INGGRIS', jam: '07:30 - 09:15' },
        { mapel: 'MTK PEMINATAN', jam: '09:15 - 09:50' },
        { mapel: 'ISTIRAHAT', jam: '09:50 - 10:30' },
        { mapel: 'MTK PEMINATAN', jam: '10:30 - 11:05' },
        { mapel: 'SENI BUDAYA', jam: '11:05 - 11:50' },
        { mapel: 'ISTIRAHAT', jam: '11:50 - 13:00' },
        { mapel: 'PKN', jam: '13:00 - 14:10' },
        { mapel: 'BIOLOGI', jam: '14:10 - 15:20' }
    ],
    kamis: [
        { mapel: 'SENAM', jam: '07:15 - 07:30' },
        { mapel: 'MTK LANJUTAN', jam: '07:30 - 08:40' },
        { mapel: 'MTK PEMINATAN', jam: '08:40 - 09:50' },
        { mapel: 'ISTIRAHAT', jam: '09:50 - 10:30' },
        { mapel: 'BAHASA INDONESIA', jam: '10:30 - 11:40' },
        { mapel: 'KIMIA', jam: '11:40 - 11:50' },
        { mapel: 'ISTIRAHAT/SHOLAT', jam: '11:50 - 13:00' },
        { mapel: 'KIMIA', jam: '13:00 - 13:35' },
        { mapel: 'BAHASA INGGRIS LANJUTAN', jam: '13:35 - 15:20' }
    ],
    jumat: [
        { mapel: 'KEAGAMAAN', jam: '07:15 - 08:00' },
        { mapel: 'PAI', jam: '08:00 - 09:10' },
        { mapel: 'BIOLOGI', jam: '09:10 - 09:45' },
        { mapel: 'ISTIRAHAT', jam: '09:45 - 10:00' },
        { mapel: 'FISIKA', jam: '10:00 - 11:10' },
    ],
};

// Data guru (bisa dikustomisasi)
const dataGuru = {
    'fisika': { nama: 'Buk Dina', kontak: '081275219190' },
    'kimia': { nama: 'Buk Sri', kontak: '081275592945' },
    'bahasa indonesia': { nama: 'Buk Ayu', kontak: '081270603006' },
    'sejarah': { nama: 'Buk Nofianti', kontak: '082385507156' },
    'penjas': { nama: 'Buk Tri Ayunita', kontak: '082216129962' },
    'pkn': { nama: 'Buk Risma', kontak: '081387754520' },
    'biologi': { nama: 'Buk Nelly', kontak: '085264692058' },
    'bahasa inggris lanjutan': { nama: 'Buk Marlia', kontak: '081266709191' },
    'seni budaya': { nama: 'Pak Panca', kontak: '081363749622' },
    
};

const infoCommands = {
    // Tampilkan jadwal pelajaran
    async jadwal(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        try {
            // Get custom jadwal from database or use default
            let jadwalData = await database.getJadwal(groupId);
            if (!jadwalData) {
                jadwalData = { ...defaultJadwal, groupId };
            }

            const hariIni = helpers.getHariIni();
            const hariTerpilih = args[0]?.toLowerCase() || hariIni;
            const hariList = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

            if (!hariList.includes(hariTerpilih)) {
                return await sock.sendMessage(groupId, {
                    text: `❌ *Hari Tidak Valid*\n\n` +
                          `Gunakan: senin, selasa, rabu, kamis, jumat, sabtu\n\n` +
                          `Contoh: \`${config.prefix}jadwal senin\``,
                    mentions: [sender]
                }, { quoted: message });
            }

            if (hariTerpilih === 'minggu') {
                return await sock.sendMessage(groupId, {
                    text: `📅 *Jadwal Hari Minggu*\n\n` +
                          `Hari ini libur! 🎉\n` +
                          `Nikmati waktu istirahatmu! 😊`,
                    mentions: [sender]
                }, { quoted: message });
            }

            const jadwalHari = jadwalData[hariTerpilih] || [];
            
            if (jadwalHari.length === 0) {
                return await sock.sendMessage(groupId, {
                    text: `📅 *Jadwal ${helpers.capitalize(hariTerpilih)}*\n\n` +
                          `Tidak ada jadwal untuk hari ini.`,
                    mentions: [sender]
                }, { quoted: message });
            }

            const isHariIni = hariTerpilih === hariIni;
            const headerEmoji = isHariIni ? '📅' : '📆';
            
            let response = `${headerEmoji} *Jadwal Pelajaran*\n`;
            response += `Hari: *${helpers.capitalize(hariTerpilih)}*\n`;
            if (isHariIni) response += `*(Hari Ini)*\n`;
            response += `\n`;

            jadwalHari.forEach((item, index) => {
                const isIstirahat = item.mapel.toLowerCase().includes('istirahat') || 
                                   item.mapel.toLowerCase().includes('upacara');
                const emoji = isIstirahat ? '☕' : '📚';
                response += `${emoji} *${index + 1}. ${item.mapel}*\n`;
                response += `   🕐 ${item.jam}\n`;
            });

            response += `\n💡 Ketik \`${config.prefix}jadwal <hari>\` untuk hari lain`;

            await sock.sendMessage(groupId, {
                text: response,
                mentions: [sender]
            }, { quoted: message });

        } catch (error) {
            logger.error('Error showing jadwal:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Tampilkan pengumuman
    async pengumuman(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        try {
            const pengumumanList = await database.getPengumuman(groupId);

            if (pengumumanList.length === 0) {
                return await sock.sendMessage(groupId, {
                    text: `📢 *Pengumuman*\n\n` +
                          `Tidak ada pengumuman saat ini.\n\n` +
                          `Admin dapat menambahkan dengan \`${config.prefix}tambah_pengumuman\``,
                    mentions: [sender]
                }, { quoted: message });
            }

            // Show latest 5 announcements
            const latest = pengumumanList.slice(0, 5);

            let response = `📢 *Pengumuman Terbaru*\n\n`;

            latest.forEach((p, index) => {
                const date = helpers.formatDate(p.createdAt);
                response += `*${index + 1}. ${p.judul}*\n`;
                response += `📝 ${p.isi}\n`;
                response += `📅 ${date}\n`;
                response += `👤 Oleh: @${p.createdBy.split('@')[0]}\n\n`;
            });

            if (pengumumanList.length > 5) {
                response += `...dan ${pengumumanList.length - 5} pengumuman lainnya.\n`;
            }

            const mentions = latest.map(p => p.createdBy);

            await sock.sendMessage(groupId, {
                text: response,
                mentions: [...mentions, sender]
            }, { quoted: message });

        } catch (error) {
            logger.error('Error showing pengumuman:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Tambah pengumuman (admin only)
    async tambahPengumuman(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        const fullText = args.join(' ');
        const parts = helpers.parsePipeArgs(fullText);

        if (parts.length < 2) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Salah*\n\n` +
                      `Gunakan: \`${config.prefix}tambah_pengumuman Judul | Isi Pengumuman\`\n\n` +
                      `Contoh: \`${config.prefix}tambah_pengumuman Ujian Semester | Ujian akan dilaksanakan tanggal 15-20 Desember\``,
                mentions: [sender]
            }, { quoted: message });
        }

        const [judul, isi] = parts;

        try {
            const pengumuman = await database.addPengumuman({
                groupId,
                judul: judul.trim(),
                isi: isi.trim(),
                createdBy: sender
            });

            await sock.sendMessage(groupId, {
                text: `📢 *Pengumuman Ditambahkan!*\n\n` +
                      `*${pengumuman.judul}*\n\n` +
                      `${pengumuman.isi}\n\n` +
                      `📅 ${helpers.formatDate(pengumuman.createdAt)}\n` +
                      `👤 Oleh: @${sender.split('@')[0]}`,
                mentions: [sender]
            }, { quoted: message });

            logger.info(`Pengumuman ditambahkan: ${pengumuman.judul} oleh ${sender}`);

        } catch (error) {
            logger.error('Error adding pengumuman:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Info guru
    async guru(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        if (args.length === 0) {
            // Show all teachers
            let response = `👨‍🏫 *Daftar Guru*\n\n`;
            
            Object.entries(dataGuru).forEach(([mapel, info]) => {
                response += `📚 *${helpers.capitalize(mapel)}*\n`;
                response += `   👤 ${info.nama}\n`;
                response += `   📱 ${info.kontak}\n\n`;
            });

            response += `\n💡 Ketik \`${config.prefix}guru <mapel>\` untuk detail`;

            return await sock.sendMessage(groupId, {
                text: response,
                mentions: [sender]
            }, { quoted: message });
        }

        const mapelCari = args.join(' ').toLowerCase();
        const guru = dataGuru[mapelCari];

        if (!guru) {
            // Try fuzzy search
            const similar = Object.keys(dataGuru).filter(m => 
                m.includes(mapelCari) || mapelCari.includes(m)
            );

            let response = `❌ *Guru Tidak Ditemukan*\n\n`;
            response += `Mapel "${args.join(' ')}" tidak ditemukan.\n\n`;
            
            if (similar.length > 0) {
                response += `Maksud kamu: ${similar.map(s => helpers.capitalize(s)).join(', ')}?\n\n`;
            }
            
            response += `Ketik \`${config.prefix}guru\` untuk lihat semua guru.`;

            return await sock.sendMessage(groupId, {
                text: response,
                mentions: [sender]
            }, { quoted: message });
        }

        let response = `👨‍🏫 *Info Guru*\n\n`;
        response += `📚 *Mapel:* ${helpers.capitalize(mapelCari)}\n`;
        response += `👤 *Nama:* ${guru.nama}\n`;
        response += `📱 *Kontak:* ${guru.kontak}\n\n`;
        response += `💬 WhatsApp: https://wa.me/${guru.kontak.replace(/^0/, '62')}`;

        await sock.sendMessage(groupId, {
            text: response,
            mentions: [sender]
        }, { quoted: message });
    },

    // Kontak kelas
    async kontakKelas(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        try {
            // Get group metadata
            const groupMetadata = await sock.groupMetadata(groupId);
            const participants = groupMetadata.participants;

            let response = `👥 *Kontak Kelas*\n\n`;
            response += `📱 *Nama Grup:* ${groupMetadata.subject}\n`;
            response += `👤 *Total Anggota:* ${participants.length}\n`;
            response += `👑 *Admin:* ${participants.filter(p => p.admin).length}\n\n`;

            // List admins
            const admins = participants.filter(p => p.admin);
            if (admins.length > 0) {
                response += `*Admin Grup:*\n`;
                admins.forEach((admin, index) => {
                    const emoji = admin.admin === 'superadmin' ? '👑' : '👤';
                    response += `${emoji} @${admin.id.split('@')[0]}\n`;
                });
                response += `\n`;
            }

            response += `*Link Grup:*\n`;
            response += `Invite link tersedia di info grup\n\n`;
            
            response += `💡 Gunakan \`${config.prefix}random_anggota\` untuk memilih anggota acak`;

            const mentions = participants.map(p => p.id);

            await sock.sendMessage(groupId, {
                text: response,
                mentions: [...mentions, sender]
            }, { quoted: message });

        } catch (error) {
            logger.error('Error showing kontak kelas:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Set jadwal (admin only)
    async setJadwal(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        // This is a simplified version - in production, you'd want a more sophisticated way to set schedules
        await sock.sendMessage(groupId, {
            text: `⚙️ *Set Jadwal*\n\n` +
                  `Untuk mengubah jadwal, silakan edit file:\n` +
                  `\`src/commands/info.js\`\n\n` +
                  `Atau hubungi developer bot.`,
            mentions: [sender]
        }, { quoted: message });
    }
};

module.exports = infoCommands;
