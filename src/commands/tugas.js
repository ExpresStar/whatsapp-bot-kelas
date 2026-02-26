const database = require('../database/Database');
const helpers = require('../utils/helpers');
const logger = require('../utils/logger');
const config = require('../../config/config');

const tugasCommands = {
    // Tambah tugas baru
    async tambahTugas(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        
        // Parse args: mapel | deskripsi | deadline
        const fullText = args.join(' ');
        const parts = helpers.parsePipeArgs(fullText);
        
        if (parts.length < 3) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Salah*\n\n` +
                      `Gunakan format:\n` +
                      `\`${config.prefix}tambah_tugas Mapel | Deskripsi Tugas | DD-MM-YYYY\`\n\n` +
                      `*Contoh:*\n` +
                      `\`${config.prefix}tambah_tugas Matematika | Hal 25-30 nomor 1-10 | 30-12-2024\``,
                mentions: [sender]
            }, { quoted: message });
        }

        const [mapel, deskripsi, deadlineStr] = parts;
        const deadline = helpers.parseDate(deadlineStr);

        if (!deadline) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Tanggal Salah*\n\n` +
                      `Gunakan format: DD-MM-YYYY atau DD/MM/YYYY\n` +
                      `Contoh: 30-12-2024 atau 30/12/2024`,
                mentions: [sender]
            }, { quoted: message });
        }

        // Check if deadline is in the past
        if (helpers.getDaysRemaining(deadline) < 0) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Deadline Tidak Valid*\n\n` +
                      `Deadline tidak boleh di masa lalu!`,
                mentions: [sender]
            }, { quoted: message });
        }

        try {
            const tugas = await database.addTugas({
                groupId,
                mapel: helpers.capitalize(mapel.trim()),
                deskripsi: deskripsi.trim(),
                deadline,
                createdBy: sender
            });

            const daysRemaining = helpers.getDaysRemaining(deadline);
            const deadlineText = helpers.formatRelativeTime(deadline);

            let response = `✅ *Tugas Berhasil Ditambahkan!*\n\n`;
            response += `📚 *Mapel:* ${tugas.mapel}\n`;
            response += `📝 *Deskripsi:* ${tugas.deskripsi}\n`;
            response += `📅 *Deadline:* ${helpers.formatDate(deadline)} (${deadlineText})\n`;
            response += `⏰ *Sisa Waktu:* ${daysRemaining} hari\n`;
            response += `🆔 *ID:* ${tugas.id}\n\n`;
            response += `Semangat mengerjakan! 💪`;

            await sock.sendMessage(groupId, {
                text: response,
                mentions: [sender]
            }, { quoted: message });

            logger.info(`Tugas ditambahkan: ${tugas.mapel} oleh ${sender}`);

        } catch (error) {
            logger.error('Error adding tugas:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // List semua tugas
    async listTugas(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        try {
            const tugasList = await database.getTugas(groupId);

            if (tugasList.length === 0) {
                return await sock.sendMessage(groupId, {
                    text: `📚 *Daftar Tugas*\n\n` +
                          `Yeay! Tidak ada tugas saat ini. 🎉\n\n` +
                          `Gunakan \`${config.prefix}tambah_tugas\` untuk menambahkan tugas.`,
                    mentions: [sender]
                }, { quoted: message });
            }

            // Sort by deadline (closest first)
            const sortedTugas = tugasList.sort((a, b) => 
                new Date(a.deadline) - new Date(b.deadline)
            );

            let response = `📚 *Daftar Tugas*\n`;
            response += `Total: ${sortedTugas.length} tugas\n\n`;

            sortedTugas.forEach((tugas, index) => {
                const daysRemaining = helpers.getDaysRemaining(tugas.deadline);
                const deadlineText = helpers.formatRelativeTime(tugas.deadline);
                const statusEmoji = daysRemaining < 0 ? '🔴' : daysRemaining <= 1 ? '🟡' : '🟢';
                
                response += `${statusEmoji} *${index + 1}. ${tugas.mapel}*\n`;
                response += `   📝 ${helpers.truncate(tugas.deskripsi, 50)}\n`;
                response += `   📅 ${helpers.formatDate(tugas.deadline)} (${deadlineText})\n`;
                response += `   ⏰ ${daysRemaining} hari lagi\n\n`;
            });

            response += `\n🟢 = Aman | 🟡 = Mendesak | 🔴 = Lewat\n`;
            response += `Gunakan \`${config.prefix}hapus_tugas <nomor>\` untuk menghapus.`;

            await sock.sendMessage(groupId, {
                text: response,
                mentions: [sender]
            }, { quoted: message });

        } catch (error) {
            logger.error('Error listing tugas:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Hapus tugas
    async hapusTugas(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        if (args.length === 0) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Salah*\n\n` +
                      `Gunakan: \`${config.prefix}hapus_tugas <nomor>\`\n` +
                      `Contoh: \`${config.prefix}hapus_tugas 1\`\n\n` +
                      `Lihat nomor dengan \`${config.prefix}list_tugas\``,
                mentions: [sender]
            }, { quoted: message });
        }

        const nomor = parseInt(args[0]);
        if (isNaN(nomor) || nomor < 1) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Nomor Tidak Valid*\n\n` +
                      `Masukkan nomor tugas yang valid.`,
                mentions: [sender]
            }, { quoted: message });
        }

        try {
            const tugasList = await database.getTugas(groupId);
            
            if (nomor > tugasList.length) {
                return await sock.sendMessage(groupId, {
                    text: `❌ *Tugas Tidak Ditemukan*\n\n` +
                          `Nomor tugas ${nomor} tidak ada.\n` +
                          `Total tugas: ${tugasList.length}\n\n` +
                          `Cek dengan \`${config.prefix}list_tugas\``,
                    mentions: [sender]
                }, { quoted: message });
            }

            // Sort by deadline to match list order
            const sortedTugas = tugasList.sort((a, b) => 
                new Date(a.deadline) - new Date(b.deadline)
            );

            const tugasToDelete = sortedTugas[nomor - 1];
            const deleted = await database.deleteTugas(tugasToDelete.id, groupId);

            if (deleted) {
                await sock.sendMessage(groupId, {
                    text: `✅ *Tugas Dihapus*\n\n` +
                          `📚 *Mapel:* ${deleted.mapel}\n` +
                          `📝 *Deskripsi:* ${deleted.deskripsi}\n\n` +
                          `Tugas berhasil dihapus! 🗑️`,
                    mentions: [sender]
                }, { quoted: message });

                logger.info(`Tugas dihapus: ${deleted.mapel} oleh ${sender}`);
            } else {
                await sock.sendMessage(groupId, {
                    text: `❌ *Gagal Menghapus*\n\n` +
                          `Tugas tidak ditemukan atau sudah dihapus.`,
                    mentions: [sender]
                }, { quoted: message });
            }

        } catch (error) {
            logger.error('Error deleting tugas:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Tampilkan deadline terdekat
    async deadline(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        try {
            const tugasList = await database.getTugas(groupId);
            
            // Filter tugas yang belum lewat dan sort by deadline
            const upcomingTugas = tugasList
                .filter(t => helpers.getDaysRemaining(t.deadline) >= 0)
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

            if (upcomingTugas.length === 0) {
                return await sock.sendMessage(groupId, {
                    text: `📅 *Deadline Tugas*\n\n` +
                          `Tidak ada deadline yang mendesak. 🎉\n\n` +
                          `Gunakan \`${config.prefix}list_tugas\` untuk melihat semua tugas.`,
                    mentions: [sender]
                }, { quoted: message });
            }

            const nearest = upcomingTugas[0];
            const daysRemaining = helpers.getDaysRemaining(nearest.deadline);
            const deadlineText = helpers.formatRelativeTime(nearest.deadline);

            let response = `⏰ *Deadline Terdekat*\n\n`;
            response += `📚 *Mapel:* ${nearest.mapel}\n`;
            response += `📝 *Deskripsi:* ${nearest.deskripsi}\n`;
            response += `📅 *Deadline:* ${helpers.formatDate(nearest.deadline)}\n`;
            response += `⏳ *Sisa Waktu:* ${daysRemaining} hari (${deadlineText})\n\n`;

            if (daysRemaining === 0) {
                response += `🔴 *HARI INI DEADLINE!* 🔴\n`;
                response += `Semangat mengerjakan! 💪🔥`;
            } else if (daysRemaining === 1) {
                response += `🟡 *BESOK DEADLINE!* 🟡\n`;
                response += `Jangan lupa dikerjakan ya! 📚`;
            } else {
                response += `🟢 Masih ada waktu, tapi jangan menunda! 😉`;
            }

            // Show next 2 deadlines if available
            if (upcomingTugas.length > 1) {
                response += `\n\n*Deadline Berikutnya:*\n`;
                for (let i = 1; i < Math.min(3, upcomingTugas.length); i++) {
                    const tugas = upcomingTugas[i];
                    const days = helpers.getDaysRemaining(tugas.deadline);
                    response += `${i + 1}. ${tugas.mapel} - ${days} hari lagi\n`;
                }
            }

            await sock.sendMessage(groupId, {
                text: response,
                mentions: [sender]
            }, { quoted: message });

        } catch (error) {
            logger.error('Error showing deadline:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    },

    // Edit tugas
    async editTugas(sock, message, args) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        if (args.length < 2) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Salah*\n\n` +
                      `Gunakan: \`${config.prefix}edit_tugas <nomor> | field | nilai_baru\`\n` +
                      `Contoh: \`${config.prefix}edit_tugas 1 | deskripsi | Hal 30-35\`\n` +
                      `Field: mapel, deskripsi, deadline`,
                mentions: [sender]
            }, { quoted: message });
        }

        const fullText = args.join(' ');
        const parts = helpers.parsePipeArgs(fullText);

        if (parts.length < 3) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Format Salah*\n\n` +
                      `Gunakan format dengan pemisah | (pipe)`,
                mentions: [sender]
            }, { quoted: message });
        }

        const [nomorStr, field, value] = parts;
        const nomor = parseInt(nomorStr);

        if (isNaN(nomor) || nomor < 1) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Nomor Tidak Valid*`,
                mentions: [sender]
            }, { quoted: message });
        }

        const validFields = ['mapel', 'deskripsi', 'deadline'];
        if (!validFields.includes(field.toLowerCase())) {
            return await sock.sendMessage(groupId, {
                text: `❌ *Field Tidak Valid*\n\n` +
                      `Field yang tersedia: ${validFields.join(', ')}`,
                mentions: [sender]
            }, { quoted: message });
        }

        try {
            const tugasList = await database.getTugas(groupId);
            
            if (nomor > tugasList.length) {
                return await sock.sendMessage(groupId, {
                    text: `❌ *Tugas Tidak Ditemukan*`,
                    mentions: [sender]
                }, { quoted: message });
            }

            const sortedTugas = tugasList.sort((a, b) => 
                new Date(a.deadline) - new Date(b.deadline)
            );

            const tugasToEdit = sortedTugas[nomor - 1];
            const updateData = {};

            if (field.toLowerCase() === 'deadline') {
                const newDeadline = helpers.parseDate(value);
                if (!newDeadline) {
                    return await sock.sendMessage(groupId, {
                        text: `❌ *Format Tanggal Salah*\n\n` +
                              `Gunakan: DD-MM-YYYY atau DD/MM/YYYY`,
                        mentions: [sender]
                    }, { quoted: message });
                }
                updateData.deadline = newDeadline;
            } else {
                updateData[field.toLowerCase()] = value.trim();
            }

            const updated = await database.updateTugas(tugasToEdit.id, updateData);

            if (updated) {
                await sock.sendMessage(groupId, {
                    text: `✅ *Tugas Diperbarui*\n\n` +
                          `📚 *Mapel:* ${updated.mapel}\n` +
                          `📝 *Deskripsi:* ${updated.deskripsi}\n` +
                          `📅 *Deadline:* ${helpers.formatDate(updated.deadline)}\n\n` +
                          `Tugas berhasil diupdate! ✨`,
                    mentions: [sender]
                }, { quoted: message });

                logger.info(`Tugas diupdate: ${updated.mapel} oleh ${sender}`);
            }

        } catch (error) {
            logger.error('Error editing tugas:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    }
};

module.exports = tugasCommands;
