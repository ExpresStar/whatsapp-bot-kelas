const database = require('../database/Database');
const helpers = require('../utils/helpers');
const logger = require('../utils/logger');
const config = require('../../config/config');

class ReminderService {
    constructor() {
        this.interval = null;
        this.isRunning = false;
        this.checkIntervalMs = config.reminderCheckInterval * 60 * 1000; // Convert to ms
    }

    // Start the reminder service
    start(sock) {
        if (this.isRunning) {
            logger.warn('Reminder service already running');
            return;
        }

        logger.info('Starting reminder service...');
        this.isRunning = true;

        // Run immediately on start
        this.checkDeadlines(sock);

        // Set up interval
        this.interval = setInterval(() => {
            this.checkDeadlines(sock);
        }, this.checkIntervalMs);

        logger.info(`Reminder service started (checking every ${config.reminderCheckInterval} minutes)`);
    }

    // Stop the reminder service
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        logger.info('Reminder service stopped');
    }

    // Check all deadlines and send reminders
    async checkDeadlines(sock) {
        try {
            logger.debug('Checking deadlines...');
            
            const allTugas = await database.getTugas();
            const now = new Date();
            const reminderWindow = 24 * 60 * 60 * 1000; // 24 hours in ms

            for (const tugas of allTugas) {
                const deadline = new Date(tugas.deadline);
                const timeUntilDeadline = deadline - now;
                const daysUntil = helpers.getDaysRemaining(deadline);

                // Skip if already reminded or deadline passed
                if (tugas.reminded || timeUntilDeadline < 0) {
                    continue;
                }

                // Check if deadline is within 24 hours (H-1)
                if (timeUntilDeadline <= reminderWindow && timeUntilDeadline > 0) {
                    await this.sendReminder(sock, tugas, daysUntil);
                }
            }
        } catch (error) {
            logger.error('Error checking deadlines:', error.message);
        }
    }

    // Send reminder for a specific task
    async sendReminder(sock, tugas, daysUntil) {
        try {
            const groupId = tugas.groupId;
            
            // Format reminder message
            let reminderText = `⏰ *PENGINGAT DEADLINE* ⏰\n\n`;
            reminderText += `🚨 *Tugas mendesak!*\n\n`;
            reminderText += `📚 *Mapel:* ${tugas.mapel}\n`;
            reminderText += `📝 *Deskripsi:* ${tugas.deskripsi}\n`;
            reminderText += `📅 *Deadline:* ${helpers.formatDate(tugas.deadline)}\n`;
            reminderText += `⏰ *Sisa Waktu:* ${daysUntil === 0 ? 'HARI INI!' : daysUntil + ' hari'}\n\n`;
            
            if (daysUntil === 0) {
                reminderText += `🔴 *HARI INI DEADLINE!* 🔴\n`;
                reminderText += `Jangan lupa kumpulkan tugasnya! 💪🔥\n\n`;
            } else if (daysUntil === 1) {
                reminderText += `🟡 *BESOK DEADLINE!* 🟡\n`;
                reminderText += `Segera selesaikan tugasmu! 📚\n\n`;
            }

            reminderText += `Semangat mengerjakan! 💪✨`;

            // Send reminder to group
            await sock.sendMessage(groupId, {
                text: reminderText
            });

            // Mark as reminded
            await database.updateTugas(tugas.id, { reminded: true });

            logger.info(`Reminder sent for tugas: ${tugas.mapel} in group ${groupId}`);

        } catch (error) {
            logger.error(`Error sending reminder for tugas ${tugas.id}:`, error.message);
        }
    }

    // Manual trigger reminder check (for admin)
    async manualCheck(sock, message) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;

        try {
            await sock.sendMessage(groupId, {
                text: `⏰ *Memeriksa deadline...*`,
                mentions: [sender]
            }, { quoted: message });

            await this.checkDeadlines(sock);

            await sock.sendMessage(groupId, {
                text: `✅ *Pemeriksaan selesai*\n\n` +
                      `Reminder telah diproses.`,
                mentions: [sender]
            }, { quoted: message });

        } catch (error) {
            logger.error('Error in manual reminder check:', error.message);
            await sock.sendMessage(groupId, {
                text: config.messages.error,
                mentions: [sender]
            }, { quoted: message });
        }
    }

    // Get upcoming deadlines for a group
    async getUpcomingDeadlines(groupId, days = 7) {
        try {
            const tugasList = await database.getTugas(groupId);
            const now = new Date();
            const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

            return tugasList.filter(tugas => {
                const deadline = new Date(tugas.deadline);
                return deadline >= now && deadline <= futureDate;
            }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        } catch (error) {
            logger.error('Error getting upcoming deadlines:', error.message);
            return [];
        }
    }

    // Send daily summary (can be called by cron job)
    async sendDailySummary(sock, groupId) {
        try {
            const upcoming = await this.getUpcomingDeadlines(groupId, 7);

            if (upcoming.length === 0) {
                return; // No upcoming deadlines
            }

            let summaryText = `📋 *RINGKASAN TUGAS MINGGU INI*\n\n`;
            summaryText += `Halo semuanya! Berikut tugas-tugas yang akan datang:\n\n`;

            upcoming.forEach((tugas, index) => {
                const daysUntil = helpers.getDaysRemaining(tugas.deadline);
                const emoji = daysUntil <= 1 ? '🔴' : daysUntil <= 3 ? '🟡' : '🟢';
                
                summaryText += `${emoji} *${index + 1}. ${tugas.mapel}*\n`;
                summaryText += `   📝 ${helpers.truncate(tugas.deskripsi, 40)}\n`;
                summaryText += `   📅 ${helpers.formatDate(tugas.deadline)} (${daysUntil} hari lagi)\n\n`;
            });

            summaryText += `Jangan lupa kerjakan tugasnya tepat waktu! 💪📚`;

            await sock.sendMessage(groupId, { text: summaryText });
            
            logger.info(`Daily summary sent to group ${groupId}`);

        } catch (error) {
            logger.error('Error sending daily summary:', error.message);
        }
    }

    // Get service status
    getStatus() {
        return {
            isRunning: this.isRunning,
            checkInterval: config.reminderCheckInterval,
            checkIntervalMs: this.checkIntervalMs,
            nextCheck: this.isRunning ? new Date(Date.now() + this.checkIntervalMs) : null
        };
    }
}

module.exports = new ReminderService();
