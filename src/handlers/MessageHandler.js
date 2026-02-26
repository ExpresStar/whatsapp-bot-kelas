const config = require('../../config/config');
const helpers = require('../utils/helpers');
const logger = require('../utils/logger');
const CommandHandler = require('./CommandHandler');

class MessageHandler {
    constructor() {
        this.messageQueue = [];
        this.processing = false;
        this.stats = {
            messagesReceived: 0,
            commandsExecuted: 0,
            errors: 0
        };
    }

    // Main message handler
    async handle(sock, message) {
        try {
            // Update stats
            this.stats.messagesReceived++;

            // Ignore status messages
            if (message.key.fromMe) return;
            if (message.message?.protocolMessage) return;

            // Get message text
            const text = this.getMessageText(message);
            if (!text) return;

            // Parse command
            const parsed = helpers.parseCommand(text);
            if (!parsed) return;

            const { command, args } = parsed;

            // Execute command
            const executed = await CommandHandler.execute(sock, message, command, args);
            
            if (executed) {
                this.stats.commandsExecuted++;
            } else {
                // Command not found - optional: suggest similar commands
                await this.handleUnknownCommand(sock, message, command);
            }

        } catch (error) {
            this.stats.errors++;
            logger.error('Error handling message:', error.message);
        }
    }

    // Extract message text
    getMessageText(message) {
        const msg = message.message;
        if (!msg) return null;

        // Extended text (quoted, etc)
        if (msg.extendedTextMessage?.text) {
            return msg.extendedTextMessage.text;
        }

        // Regular conversation
        if (msg.conversation) {
            return msg.conversation;
        }

        // Image caption
        if (msg.imageMessage?.caption) {
            return msg.imageMessage.caption;
        }

        // Video caption
        if (msg.videoMessage?.caption) {
            return msg.videoMessage.caption;
        }

        // Buttons response
        if (msg.buttonsResponseMessage?.selectedButtonId) {
            return msg.buttonsResponseMessage.selectedButtonId;
        }

        // List response
        if (msg.listResponseMessage?.singleSelectReply?.selectedRowId) {
            return msg.listResponseMessage.singleSelectReply.selectedRowId;
        }

        return null;
    }

    // Handle unknown command
    async handleUnknownCommand(sock, message, command) {
        // Don't respond to very short commands (likely typos)
        if (command.length < 2) return;

        // Find similar commands
        const commands = CommandHandler.getAllCommands();
        const similar = commands.filter(cmd => {
            const name = cmd.name.toLowerCase();
            // Check if command is substring of any command name
            return name.includes(command.toLowerCase()) || 
                   command.toLowerCase().includes(name);
        }).slice(0, 3);

        if (similar.length > 0) {
            const suggestions = similar.map(cmd => `${config.prefix}${cmd.name}`).join(', ');
            await sock.sendMessage(message.key.remoteJid, {
                text: `❓ Command tidak ditemukan.\n\nMaksud kamu: ${suggestions}?\n\nKetik \`${config.prefix}menu\` untuk lihat semua command.`,
                mentions: [message.key.participant || message.key.remoteJid]
            }, { quoted: message });
        }
    }

    // Handle group participant updates
    async handleGroupParticipantUpdate(sock, update) {
        const { id, participants, action } = update;
        
        try {
            switch (action) {
                case 'add':
                    // Welcome new members
                    for (const participant of participants) {
                        await this.sendWelcomeMessage(sock, id, participant);
                    }
                    break;
                    
                case 'remove':
                    // Goodbye message
                    for (const participant of participants) {
                        await this.sendGoodbyeMessage(sock, id, participant);
                    }
                    break;
                    
                case 'promote':
                    logger.info(`User promoted to admin in ${id}: ${participants.join(', ')}`);
                    break;
                    
                case 'demote':
                    logger.info(`User demoted from admin in ${id}: ${participants.join(', ')}`);
                    break;
            }
        } catch (error) {
            logger.error('Error handling group participant update:', error.message);
        }
    }

    // Send welcome message
    async sendWelcomeMessage(sock, groupId, participant) {
        try {
            const welcomeText = `👋 *Selamat Datang!*\n\n` +
                `Halo @${participant.split('@')[0]}!\n\n` +
                `Selamat datang di grup kelas! 🎓\n\n` +
                `Gunakan \`${config.prefix}menu\` untuk melihat fitur yang tersedia.\n` +
                `Jangan lupa perkenalkan diri ya! 😊`;

            await sock.sendMessage(groupId, {
                text: welcomeText,
                mentions: [participant]
            });
        } catch (error) {
            logger.error('Error sending welcome message:', error.message);
        }
    }

    // Send goodbye message
    async sendGoodbyeMessage(sock, groupId, participant) {
        try {
            const goodbyeText = `👋 *Sampai Jumpa*\n\n` +
                `@${participant.split('@')[0]} telah meninggalkan grup.\n` +
                `Semoga sukses selalu! 🌟`;

            await sock.sendMessage(groupId, {
                text: goodbyeText,
                mentions: [participant]
            });
        } catch (error) {
            logger.error('Error sending goodbye message:', error.message);
        }
    }

    // Get stats
    getStats() {
        return {
            ...this.stats,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }

    // Reset stats
    resetStats() {
        this.stats = {
            messagesReceived: 0,
            commandsExecuted: 0,
            errors: 0
        };
    }
}

module.exports = new MessageHandler();
