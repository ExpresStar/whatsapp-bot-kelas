const config = require('../../config/config');
const helpers = require('../utils/helpers');
const logger = require('../utils/logger');

class AuthMiddleware {
    // Cek apakah pesan dari grup
    isGroup(message) {
        return message.key.remoteJid.endsWith('@g.us');
    }

    // Cek apakah grup diizinkan
    isAllowedGroup(groupId) {
        return helpers.isAllowedGroup(groupId);
    }

    // Cek apakah user adalah admin bot
    isBotAdmin(userId) {
        return helpers.isAdmin(userId);
    }

    // Cek apakah user adalah admin grup
    async isGroupAdmin(sock, groupId, userId) {
        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            const participant = groupMetadata.participants.find(p => p.id === userId);
            
            return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        } catch (error) {
            logger.error('Error checking group admin:', error.message);
            return false;
        }
    }

    // Middleware: Hanya untuk grup
    async requireGroup(sock, message, next) {
        if (!this.isGroup(message)) {
            await sock.sendMessage(message.key.remoteJid, {
                text: config.messages.groupOnly
            }, { quoted: message });
            return false;
        }
        return await next();
    }

    // Middleware: Grup diizinkan
    async requireAllowedGroup(sock, message, next) {
        const groupId = message.key.remoteJid;
        
        if (!this.isAllowedGroup(groupId)) {
            logger.warn(`Unauthorized group access attempt: ${groupId}`);
            return false; // Silent fail untuk grup tidak diizinkan
        }
        return await next();
    }

    // Middleware: Hanya admin bot
    async requireBotAdmin(sock, message, next) {
        const sender = message.key.participant || message.key.remoteJid;
        
        if (!this.isBotAdmin(sender)) {
            await sock.sendMessage(message.key.remoteJid, {
                text: config.messages.adminOnly,
                mentions: [sender]
            }, { quoted: message });
            return false;
        }
        return await next();
    }

    // Middleware: Hanya admin grup
    async requireGroupAdmin(sock, message, next) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        
        if (!this.isGroup(message)) {
            await sock.sendMessage(message.key.remoteJid, {
                text: config.messages.groupOnly
            }, { quoted: message });
            return false;
        }

        const isAdmin = await this.isGroupAdmin(sock, groupId, sender);
        
        if (!isAdmin) {
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ *Khusus Admin Grup*\n\nCommand ini hanya bisa digunakan oleh admin grup.',
                mentions: [sender]
            }, { quoted: message });
            return false;
        }
        return await next();
    }

    // Middleware: Admin bot atau admin grup
    async requireAnyAdmin(sock, message, next) {
        const groupId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        
        const isBotAdmin = this.isBotAdmin(sender);
        const isGroupAdmin = await this.isGroupAdmin(sock, groupId, sender);
        
        if (!isBotAdmin && !isGroupAdmin) {
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ *Khusus Admin*\n\nCommand ini hanya bisa digunakan oleh admin.',
                mentions: [sender]
            }, { quoted: message });
            return false;
        }
        return await next();
    }

    // Get user info
    async getUserInfo(sock, groupId, userId) {
        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            const participant = groupMetadata.participants.find(p => p.id === userId);
            
            return {
                id: userId,
                isBotAdmin: this.isBotAdmin(userId),
                isGroupAdmin: participant?.admin === 'admin' || participant?.admin === 'superadmin',
                isSuperAdmin: participant?.admin === 'superadmin'
            };
        } catch (error) {
            logger.error('Error getting user info:', error.message);
            return {
                id: userId,
                isBotAdmin: this.isBotAdmin(userId),
                isGroupAdmin: false,
                isSuperAdmin: false
            };
        }
    }

    // Get group info
    async getGroupInfo(sock, groupId) {
        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            
            return {
                id: groupId,
                name: groupMetadata.subject,
                description: groupMetadata.desc,
                participants: groupMetadata.participants.length,
                admins: groupMetadata.participants.filter(p => p.admin).length,
                isAllowed: this.isAllowedGroup(groupId)
            };
        } catch (error) {
            logger.error('Error getting group info:', error.message);
            return null;
        }
    }
}

module.exports = new AuthMiddleware();
